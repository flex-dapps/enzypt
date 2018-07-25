/**
  * Start enzypt.io server
  */

const server = require('./server.js')
server.connectAndStart(process.env.MONGODB_URL)
