const cors = require('cors')
const app = require('express')()
const routes = require('./controllers')

const expressMongoDb = require('express-mongo-db')
app.use(expressMongoDb('mongodb://localhost/filevapour'))
app.use(cors())

routes.bind(app)

app.listen(3000, () => {
  console.log('Listening on 3000')
})