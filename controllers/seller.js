const randomstring = require('randomstring')
const jsonParser = require('body-parser').json()

class SellerController {
  static bind(app) {
    app.post('/sell', jsonParser, this.postSell)
  }

  static postSell(req, res, next) {
    const { zipFileHash, metaFileHash, iv, ethPrice } = req.body
    if (!zipFileHash || !metaFileHash || !iv || !ethPrice) return res.status(400).end()
    const urlSlug = randomstring.generate()
    req.db.collection('sales').insertOne(
      {
        zipFileHash,
        metaFileHash,
        iv,
        ethPrice,
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
