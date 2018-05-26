const jsonParser = require('body-parser').json()
const randomstring = require('randomstring')
const Etherscan = require('../services/etherscan')
const config = require('../config')
const web3 = require('../services/web3')

class BuyerController {

  static bind (app) {
    app.get('/:urlSlug', this.getBuy)
    app.post('/rand', jsonParser, this.postRand)
    app.post('/msg', jsonParser, this.postMsg)
    app.post('/buy', jsonParser, this.postBuy)
  }

  static async getBuy (req, res, next) {
    if (!req.params.urlSlug) return res.status(400).send()
    const doc = await req.db.collection('sales').findOne({
      urlSlug: req.params.urlSlug
    }, {
      metaFileHash: 1,
      _id: 0
    })
    res.send(doc.metaFileHash)
  }

  static async postRand (req, res, next) {
    const { publicKey } = req.body
    if (!publicKey || !web3.utils.isAddress(publicKey)) return res.status(400).send()
    const lowerCasePublicKey = publicKey.toLowerCase()
    const randomString = randomstring.generate(16)
    await req.db.collection('auth').findOneAndUpdate({
      publicKey: lowerCasePublicKey
    }, {
      $set: {
        randomString: randomString
      }
    }, {
      upsert: true 
    })
    res.send(randomString)
  }

  static async postMsg (req, res, next) {
    const { publicKey, signedMessage, urlSlug } = req.body
    if (!publicKey || !signedMessage) return res.status(400).send()
    const lowerCasePublicKey = publicKey.toLowerCase()
    const doc = await req.db.collection('auth').findOne({ publicKey: lowerCasePublicKey })
    const messageToRecover = config.MESSAGE_TO_SIGN.replace('%', lowerCasePublicKey).replace('%', doc.randomString)
    const recoveredKey = await web3.eth.accounts.recover(messageToRecover, signedMessage, false)
    if (recoveredKey.toLowerCase() === publicKey.toLowerCase()) {
      const randomHex = web3.utils.randomHex(32).toUpperCase()
      req.db.collection('purchases').insertOne({
        fromAddress: recoveredKey,
        purchaseRef: randomHex,
        urlSlug: urlSlug
      }, () => {
        res.send(randomHex)
      })
    } else {
      res.status(418).send()
    }
  }

  static postBuy (req, res, next) {
    const { txHash } = req.body
    if (!txHash) return res.status(400).send()
    Etherscan.pollStatus(txHash, async (e, successful) => {
      if (e || !successful) return res.status(418).send()
      const receipt = await web3.eth.getTransaction(txHash)
      if (!receipt || !receipt.input || !receipt.from) return res.status(418).send()
      const fromAddress = receipt.from.toLowerCase()
      const inputData = receipt.input.toUpperCase()
      const purchaseDoc = await req.db.collection('purchases').findOneAndUpdate({
        fromAddress: fromAddress,
        purchaseRef: inputData
      }, {
        $set: {
          paid: true
        }
      })
      if (!purchaseDoc || !purchaseDoc.value) return res.status(418).send()
      const fileDoc = await req.db.collection('sales').findOne({
        urlSlug: purchaseDoc.value.urlSlug
      })
      if (!fileDoc) return res.status(418).send()
      res.send(fileDoc.zipFileHash)
    })
  }


}

module.exports = BuyerController