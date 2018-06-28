const randomstring = require('randomstring')
const jsonParser = require('body-parser').json()

class SellerController {
  static bind(app) {
    app.post('/sell', jsonParser, this.postSell)
  }

  static postSell(req, res, next) {
    const { zipFileHash, metaFileHash, iv, ethPrice, ethAddress } = req.body
    if (!zipFileHash || !metaFileHash || !iv || !ethPrice || !ethAddress) return res.status(400).end()
    const urlSlug = randomstring.generate()
    req.db.collection('sales').insertOne(
      {
        zipFileHash,
        metaFileHash,
        iv,
        ethPrice,
        ethAddress.toLowerCase(),
        downloads: 0,
        urlSlug
      },
      doc => {
        res.status(201).send(urlSlug)
      }
    )
  }
}

module.exports = SellerController
