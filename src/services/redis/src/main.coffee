redis = require "redis"
util  = require "util"

DEFAULT_HOST = 'localhost'
DEFAULT_PORT = 6379

createRedisClient = (server) ->
  if server.length > 0 && server.charAt(0) == '/'
    return redis.createClient server
  else
    if server.indexOf(':') != -1
      host = server.substring(0, server.indexOf(':'))
      port = parseInt(server.substring(server.indexOf(':')), 10)
    else
      host = server
      port = DEFAULT_PORT

    return redis.createClient(port, host);

redisPublisher = () ->
  self = this
  redis_client = null

  config =
    server: DEFAULT_HOST

  self.configure = (configuration) ->
    config.server = configuration.server

  self.connect = (client) ->
    redis_client = createRedisClient(config.server)

  self.disconnect = () ->
    redis_client.end()
    redis_client = null

  self.publish = (data) ->
    redis_client.publish data.channel, data.message

  self

redisSubscriber = () ->
  self = this
  redis_client = null

  config =
    server: DEFAULT_HOST
    channels: null
    patterns: null

  self.configure = (configuration) ->
    if redis_client != null
      disconnect()

    config.server   = configuration.server
    config.channels = configuration.channels
    config.patterns = configuration.patterns

  self.connect = (client) ->
    redis_client = createRedisClient(config.server)

    redis_client.on "message", (channel, message) ->
      client.emit "message", { payload: message, channel: channel }

    redis_client.on "pmessage", (pattern, channel, message) ->
      client.send "message", { payload: message, channel: channel, pattern: pattern }

    if config.channels.trim() != ''
      console.log "subscribing: #{config.channels}"
      redis_client.subscribe config.channels.trim().split(" +")

    if config.patterns.trim() != ''
      console.log "psubscribing: #{util.inspect(config.patterns)}"
      redis_client.psubscribe config.patterns.trim().split(" +")

  self.disconnect = () ->
    if redis_client != null
      redis_client.end()
      redis_client = null

  self

module.exports = 
  publisher: redisPublisher
  subscriber: redisSubscriber
