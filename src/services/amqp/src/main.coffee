sys = require 'util'
util = require 'util'
amqp = require 'amqp'

amqpPublisher = () ->
  self       = this
  connection = null
  exchange   = null
  
  config =
    host:          'localhost'
    port:          5672
    login:         'guest'
    password:      'guest'
    vhost:         '/'
    exchange_name: 'qurl-exchange'
    routing_key:   'qurl.publish.routing'
    message:       "Hello World."

  exchange_opened = false

  self.configure = (form_data) ->
    server = form_data.server
    colon_ndx = server.indexOf(':')
    if colon_ndx != -1
      config.host = server.substring(0, colon_ndx)
      config.port = parseInt(server.substring(colon_ndx), 10)
    else
      config.host = server

    config.login         = form_data.login
    config.password      = form_data.password
    config.vhost         = form_data.vhost
    config.exchange_name = form_data.exchange
    config.routing_key   = form_data.routing_key
    config.message       = form_data.message
  
  self.connect = (client) ->
    connection = amqp.createConnection(config)
    connection.addListener 'ready', () ->
      exchange_name = config.exchange_name
      console.log "Connecting to exchange #{exchange_name}"
      exchange = connection.exchange exchange_name,
        type: 'topic'
        passive: false
        durable: true
        autoDelete: false

      exchange.addListener 'open', () ->
        exchange_opened = true

  self.disconnect = () ->
    connection.end()

  self.publish = (data) ->
    if !exchange_opened
      console.log "exchange not opened yet!"
      return

    routing_key = config.routing_key;

    #console.log "Publishing: #{util.inspect(data.message)}"

    exchange.publish routing_key,
                     data.message,
                       mandatory: false
                       immediate: false
                       contentType: 'application/octet-stream'
                       # contentEncoding: null
                       # headers: {xxx: 'yyy'}
                       # deliveryMode: 1 (Non-persistent) or 2 (persistent)
                       # priority: 0-9
                       # replyTo: Usually used to name a reply queue for a request message

  self

amqpSubscriber = () ->
  self       = this
  connection = null
  exchange   = null
  queue      = null

  config =
    host:          'localhost'
    port:          5672
    login:         'guest'
    password:      'guest'
    vhost:         '/'
    exchange_name: 'qurl-exchange'
    queue_name:    'qurl-queue'
    binding_key:   '#' # Any key

  self.configure = (form_data) ->
    server = form_data.server
    colon_ndx = server.indexOf(':')
    if colon_ndx != -1
      config.host = server.substring(0, colon_ndx)
      config.port = parseInt(server.substring(colon_ndx), 10)
    else
      config.host = server

    config.login         = form_data.login
    config.password      = form_data.password
    config.vhost         = form_data.vhost
    config.exchange_name = form_data.exchange
    config.queue_name    = form_data.queue
    #config.binding_key   = c.routing_key

  self.connect = (client) ->
    connection = amqp.createConnection config

    connection.on 'ready', () ->
      console.log "connecting to queue: [#{config.queue_name}]"
      queue = connection.queue config.queue_name,
        {
          passive: false,
          durable: true,
          exclusive: false,
          autoDelete: false,
        }, (q) ->
          console.log "binding to exchange [#{config.exchange_name}] with binding key [#{config.binding_key}]"
          q.bind config.exchange_name, config.binding_key

          console.log "subscribing to queue..."
          q.subscribe (message, headers, deliveryInfo) ->
            client.send
              type: "message" 
              payload: message.data.toString()

  self.disconnect = () ->
    connection.end()

  self

module.exports =
  publisher: amqpPublisher
  subscriber: amqpSubscriber
