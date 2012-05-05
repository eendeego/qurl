#
# Module dependencies.
#

express     = require('express')
socket_io   = require('socket.io')
querystring = require('querystring')
util        = require('util')

amqp        = require('./services/amqp/main')
redis       = require('./services/redis/main')

app = module.exports = express.createServer()

# Exception catching
process.on 'uncaughtException', (err) ->
  console.log "Caught exception: #{err.message}\n#{err.stack}"

# Configuration

app.configure () ->
  app.set 'views', __dirname + '/../views'
  app.set 'view engine', 'jade'
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(__dirname + '/../public')

app.configure 'development', () ->
  app.use express.errorHandler({ dumpExceptions: true, showStack: true })

app.configure 'production', () ->
  app.use express.errorHandler()

services =
  amqp: { name: 'AMQP', module: amqp }
  redis: { name: 'redis', module: redis }

# Routes

app.get '/', (req, res) ->
  res.render 'index', {
    title: 'Qurl',
    services: services,
    service: '-' # FIXME Remove this from the layout
  }

app.get '/:service/publisher', (req, res) ->
  service = req.params.service
  res.render "s/#{service}/publisher", {
    title: "Qurl - #{services[service].name} - Publisher",
    services: services,
    service: service
  }

app.get '/:service/subscriber', (req, res) ->
  service = req.params.service
  res.render "s/#{service}/subscriber", {
    title: "Qurl - #{services[service].name} - Subscriber",
    services: services,
    service: service
  }

# Socket.io

io = socket_io.listen(app)

io.sockets.on 'connection', (socket) ->
  endpoint = null;

  socket.on 'configure', (message) ->
    endpoint = new services[message.service].module[message.endpoint]()
    endpoint.configure message.configuration
    endpoint.connect socket

  socket.on 'message', (message) ->
    endpoint.publish message.data

  socket.on 'disconnect', (message) ->
    endpoint.disconnect()

app.listen 3000
console.log "Express server listening on port %d", app.address().port
