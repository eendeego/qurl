(function() {
  var DEFAULT_HOST, DEFAULT_PORT, createRedisClient, redis, redisPublisher, redisSubscriber, util;

  redis = require("redis");

  util = require("util");

  DEFAULT_HOST = 'localhost';

  DEFAULT_PORT = 6379;

  createRedisClient = function(server) {
    var host, port;
    if (server.length > 0 && server.charAt(0) === '/') {
      return redis.createClient(server);
    } else {
      if (server.indexOf(':') !== -1) {
        host = server.substring(0, server.indexOf(':'));
        port = parseInt(server.substring(server.indexOf(':')), 10);
      } else {
        host = server;
        port = DEFAULT_PORT;
      }
      return redis.createClient(port, host);
    }
  };

  redisPublisher = function() {
    var config, redis_client, self;
    self = this;
    redis_client = null;
    config = {
      server: DEFAULT_HOST
    };
    self.configure = function(configuration) {
      return config.server = configuration.server;
    };
    self.connect = function(client) {
      return redis_client = createRedisClient(config.server);
    };
    self.disconnect = function() {
      redis_client.end();
      return redis_client = null;
    };
    self.publish = function(data) {
      return redis_client.publish(data.channel, data.message);
    };
    return self;
  };

  redisSubscriber = function() {
    var config, redis_client, self;
    self = this;
    redis_client = null;
    config = {
      server: DEFAULT_HOST,
      channels: null,
      patterns: null
    };
    self.configure = function(configuration) {
      if (redis_client !== null) disconnect();
      config.server = configuration.server;
      config.channels = configuration.channels;
      return config.patterns = configuration.patterns;
    };
    self.connect = function(client) {
      redis_client = createRedisClient(config.server);
      redis_client.on("message", function(channel, message) {
        return client.emit("message", {
          payload: message,
          channel: channel
        });
      });
      redis_client.on("pmessage", function(pattern, channel, message) {
        return client.send("message", {
          payload: message,
          channel: channel,
          pattern: pattern
        });
      });
      if (config.channels.trim() !== '') {
        console.log("subscribing: " + config.channels);
        redis_client.subscribe(config.channels.trim().split(" +"));
      }
      if (config.patterns.trim() !== '') {
        console.log("psubscribing: " + (util.inspect(config.patterns)));
        return redis_client.psubscribe(config.patterns.trim().split(" +"));
      }
    };
    self.disconnect = function() {
      if (redis_client !== null) {
        redis_client.end();
        return redis_client = null;
      }
    };
    return self;
  };

  module.exports = {
    publisher: redisPublisher,
    subscriber: redisSubscriber
  };

}).call(this);
