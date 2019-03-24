const jsonParser = require('body-parser').json()
const randomstring = require('randomstring')
const config = require('../config')
const web3 = require('../services/web3')

class BuyerController {
  static bind(app) {
    app.get('/:urlSlug', this.getBuy)
    app.post('/rand', jsonParser, this.postRand)
    app.post('/msg', jsonParser, this.postMsg)
    app.post('/buy', jsonParser, this.postBuy)
  }

  static async getBuy(req, res, next) {
    if (!req.params.urlSlug) return res.status(400).send()
    try {
      const doc = await req.db.collection('sales').findOne(
        {
          urlSlug: req.params.urlSlug
        },
        {
          metaFileHash: 1,
          iv: 1,
          downloads: 1,
          _id: 0
        }
      )
      if (!doc) return res.status(404).send()
      res.send(doc)
    } catch (e) {
      return res.status(404).send()
    }
  }

  static async postRand(req, res, next) {
    const { publicKey } = req.body
    if (!publicKey || !web3.utils.isAddress(publicKey))
      return res.status(400).send()
    const lowerCasePublicKey = publicKey.toLowerCase()
    const randomString = randomstring.generate(16)
    await req.db.collection('auth').findOneAndUpdate(
      {
        publicKey: lowerCasePublicKey
      },
      {
        $set: {
          randomString: randomString
        }
      },
      {
        upsert: true
      }
    )
    res.send(randomString)
  }

  static async postMsg(req, res, next) {
     const { publicKey, signedMessage, urlSlug } = req.body
     if (!publicKey || !signedMessage || !urlSlug) return res.status(400).send()
     const lowerCasePublicKey = publicKey.toLowerCase()
     const doc = await req.db
       .collection('auth')
       .findOne({ publicKey: lowerCasePublicKey })

     if (!doc) {
       return res.status(404).send()
     }

     const messageToRecover = config.MESSAGE_TO_SIGN.replace(
       '%',
       lowerCasePublicKey
     ).replace('%', doc.randomString)
     const recoveredKey = await web3.eth.accounts.recover(
       messageToRecover,
       signedMessage,
       false
     )
     if (recoveredKey.toLowerCase() === publicKey.toLowerCase()) {
       // Check if previous purchase is registered.
       const purchaseDoc = await req.db
         .collection('purchases')
         .findOne({ fromAddress: recoveredKey.toLowerCase(),
                    urlSlug: urlSlug,
                    paid: true })

       if (purchaseDoc) {
         // Get IPFS hash
         const fileDoc = await req.db
           .collection('sales')
           .findOne({ urlSlug: urlSlug })

         if (!fileDoc) {
           return res.status(500).send()
         }

         res.send({ zipFileHash: fileDoc.zipFileHash, randomHex: null })
       } else {
         const randomHex = web3.utils.randomHex(32).toUpperCase()
         req.db.collection('purchases').insertOne(
           {
             fromAddress: recoveredKey.toLowerCase(),
             purchaseRef: randomHex,
             urlSlug: urlSlug
           },
           () => {
             res.send({ zipFileHash: null, randomHex: randomHex })
           }
         )
       }
     } else {
       res.status(418).send()
     }
   }

  static async postBuy(req, res, next) {
    const { txHash } = req.body
    if (!txHash) return res.status(400).send()
    const tx = await web3.eth.getTransaction(txHash)
    if (!tx || !tx.input || !tx.from || !tx.value) return res.status(418).send()
    const toAddress = tx.to.toLowerCase()
    const fromAddress = tx.from.toLowerCase()
    const inputData = tx.input.toUpperCase()
    const ethSent = web3.utils.fromWei(tx.value, 'ether')

    const purchaseDoc = await req.db
      .collection('purchases')
      .findOne({ fromAddress: fromAddress, purchaseRef: inputData })

    if (!purchaseDoc) return res.status(418).send()

    const fileDoc = await req.db
      .collection('sales')
      .findOne({ urlSlug: purchaseDoc.urlSlug })

    if (!fileDoc) return res.status(418).send()

    if (
      ethSent < Number(fileDoc.ethPrice) ||
      (purchaseDoc.ethAddress && toAddress !== purchaseDoc.ethAddress)
    ) return res.status(418).send()

    if (!purchaseDoc.paid) {
      await req.db
        .collection('purchases')
        .findOneAndUpdate(
          { fromAddress: fromAddress, purchaseRef: inputData },
          { $set: { paid: true } }
        )
      await req.db
        .collection('sales')
        .findOneAndUpdate(
          { urlSlug: purchaseDoc.urlSlug },
          { $inc: { downloads: 1 } }
        )
    }

    res.send(fileDoc.zipFileHash)
  }
}

module.exports = BuyerController
