const sellerController = require('./seller')
const buyerController = require('./buyer')

class Routes {
  static bind (app) {
    sellerController.bind(app)
    buyerController.bind(app)
  }
}

module.exports = Routes