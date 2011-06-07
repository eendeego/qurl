var redis = require("redis"),
    util  = require("util");

var DEFAULT_HOST = 'localhost';
var DEFAULT_PORT = 6379;

function createRedisClient(server) {
  if(server.length > 0 && server.charAt(0) === '/') {
    return redis.createClient(server);
  } else {
    var host, port;
    if(server.indexOf(':') != -1) {
      host = server.substring(0, server.indexOf(':'));
      port = parseInt(server.substring(server.indexOf(':')), 10);
    } else {
      host = server;
      port = DEFAULT_PORT;
    }
    return redis.createClient(port, host);
  }
}

function redisPublisher() {
  var self = this;
  var redis_client = null;

  var config = {
    server: DEFAULT_HOST
  }

  self.configure = function(configuration) {
    config.server = configuration.server;
  };

  self.connect = function(client) {
    redis_client = createRedisClient(config.server);
  };

  self.disconnect = function() {
    redis_client.end();
    redis_client = null;
  };

  self.publish = function(data) {
    redis_client.publish(data.channel, data.message);
  };
}

function redisSubscriber() {
  var self = this;
  var redis_client = null;

  var config = {
    server: DEFAULT_HOST,
    channels: null,
    patterns: null
  };

  self.configure = function(configuration) {
    if(redis_client !== null) {
      disconnect();
    }

    config.server   = configuration.server;
    config.channels = configuration.channels;
    config.patterns = configuration.patterns;
  };

  self.connect = function(client) {
    redis_client = createRedisClient(config.server);

    redis_client.on("message", function (channel, message) {
      client.send({ type: "message", payload: message, channel: channel });
    });

    redis_client.on("pmessage", function (pattern, channel, message) {
      client.send({ type: "message", payload: message, channel: channel, pattern: pattern });
    });

    if(config.channels.trim() !== '') {
      console.log('subscribing: ' + config.channels);
      redis_client.subscribe(config.channels.trim().split(/ +/));
    }
    if(config.patterns.trim() !== '') {
      console.log('psubscribing: ' + util.inspect(config.patterns));
      redis_client.psubscribe(config.patterns.trim().split(/ +/));
    }
  };

  self.disconnect = function() {
    if(redis_client !== null) {
      redis_client.end();
      redis_client = null;
    }
  };
}

module.exports = { publisher: redisPublisher, subscriber: redisSubscriber }
