require('dotenv').config()
const cors = require('cors')
const mongodbSanitise = require('express-mongo-sanitize')
const app = require('express')()
const routes = require('./controllers')

const expressMongoDb = require('express-mongo-db')
app.use(expressMongoDb(process.env.MONGODB_URL))
app.use(mongodbSanitise())
app.use(cors())

routes.bind(app)

app.listen(3000, () => {
  console.log('Listening on 3000')
})