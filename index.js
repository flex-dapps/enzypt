/**
  * Start enzypt.io server
  */

require('./server.js')
connectAndStart(process.env.MONGODB_URL)