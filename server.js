require('dotenv').config()
const cors = require('cors')
const mongodbSanitise = require('express-mongo-sanitize')
const express = require('express')
const routes = require('./controllers')

const expressMongoDb = require('express-mongo-db')

app = express()
app.connectAndStart = (DB_URL, _callback = () => {}) => {
	app.use(expressMongoDb(DB_URL))
	app.use(mongodbSanitise())
	app.use(cors())

	routes.bind(app)

	app.server = app.listen(process.env.PORT, () => {
	  console.log(`Listening on ${process.env.PORT}`)
	  _callback()
	})
}

module.exports = app
