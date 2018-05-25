const jsonParser = require('body-parser').json()

class BuyerController {

  static bind (app) {
    app.post('/buy', jsonParser, this.postBuy)
  }

  static postBuy (req, res, next) {
    // grab the body
    // verify whether this was a valid purchase (through Etherscan or something)
  }

}

module.exports = BuyerController