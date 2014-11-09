var util  = require('util');
var redis = require('redis');

var DEFAULT_HOST = 'localhost';
var DEFAULT_PORT = 6379;

function createRedisClient(server) {
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
    console.log('redis.createClient(%d, "%s")', port, host);
    return redis.createClient(port, host);
  }
}

function RedisPublisher() {
  this.redisClient = null;
  this.config = {
    server: DEFAULT_HOST
  };
}

RedisPublisher.prototype.configure = function redisPubConfigure(configuration) {
  this.config.server = configuration.server;
};

RedisPublisher.prototype.connect = function redisPubConnect(client) {
  console.log('redisPubConnect!');
  this.redisClient = createRedisClient(this.config.server);
};

RedisPublisher.prototype.disconnect = function redisPubDisconnect() {
  this.redisClient.end();
  this.redisClient = null;
};

RedisPublisher.prototype.publish = function redisPubPublish(data) {
  console.log('Publish: %j', data);
  this.redisClient.publish(data.channel, data.message);
};

function RedisSubscriber() {
  this.redisClient = null;
  this.config = {
    server: DEFAULT_HOST,
    channels: null,
    patterns: null
  };
}

RedisSubscriber.prototype.configure = function redisSubConfigure(configuration) {
  if (this.redisClient !== null) {
    this.disconnect();
  }
  this.config.server   = configuration.server;
  this.config.channels = configuration.channels;
  this.config.patterns = configuration.patterns;
};

RedisSubscriber.prototype.connect = function(client) {
  this.redisClient = createRedisClient(this.config.server);
  this.redisClient.on('message', function(channel, message) {
    client.emit('message', {
      payload: message,
      channel: channel
    });
  });

  this.redisClient.on('pmessage', function(pattern, channel, message) {
    client.send('message', {
      payload: message,
      channel: channel,
      pattern: pattern
    });
  });

  if (this.config.channels.trim() !== '') {
    console.log('subscribing: ' + this.config.channels);
    this.redisClient.subscribe(this.config.channels.trim().split(' +'));
  }
  if (this.config.patterns.trim() !== '') {
    console.log('psubscribing: ' + (util.inspect(this.config.patterns)));
    this.redisClient.psubscribe(this.config.patterns.trim().split(' +'));
  }
};

RedisSubscriber.prototype.disconnect = function redisSubDisconnect() {
  if (this.redisClient !== null) {
    this.redisClient.end();
    this.redisClient = null;
  }
};

module.exports = {
  publisher: RedisPublisher,
  subscriber: RedisSubscriber
};
