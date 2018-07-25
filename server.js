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

	app.server = app.listen(3000, () => {
	  console.log('Listening on 3000')
	  _callback()
	})
}

module.exports = app
