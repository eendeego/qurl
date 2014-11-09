var util = require('util');
var amqp = require('amqp');

var DEFAULT_PORT = 5672;

function parseServer(server, defaultPort) {
  var colonNdx = server.indexOf(':');
  if (colonNdx === -1) {
    return {
      host: server,
      port: defaultPort
    };
  }

  return {
    host: server.substring(0, colonNdx),
    port: parseInt(server.substring(colonNdx), 10)
  };
}

function AmqpPublisher() {
  this.connection = null;
  this.exchange   = null;
  this.config     = {
    host          : 'localhost',
    port          : 5672,
    login         : 'guest',
    password      : 'guest',
    vhost         : '/',
    exchange_name : 'qurl-exchange',
    routing_key   : 'qurl.publish.routing',
    message       : "Hello World.",
    connectionTimeout: 3000
  };
  this.exchangeOpen = false;
}

AmqpPublisher.prototype.configure = function AmqpPubConfigure(configuration) {
  var server = parseServer(configuration.server);

  this.config.server = server.host;
  this.config.port   = server.port;

  this.config.login         = configuration.login;
  this.config.password      = configuration.password;
  this.config.vhost         = configuration.vhost;
  this.config.exchange_name = configuration.exchange;
  this.config.routing_key   = configuration.routing_key;
  this.config.message       = configuration.message;

  console.log('AmqpPubConfigure!');
};

AmqpPublisher.prototype.connect = function AmqpPubConnect(client) {
  var self = this;

  this.connection = amqp.createConnection(this.config);

  // this.connection.socket.addListener('error', function error(e) {
  //   console.log("connect error: " + util.inspect(e));
  // });

  this.connection.addListener('ready', function() {
    var exchangeName = self.config.exchangeName;
    console.log("Connecting to exchange " + exchangeName);

    self.exchange = self.connection.exchange(exchangeName, {
      type: 'topic',
      passive: false,
      durable: true,
      autoDelete: false
    });

    self.exchange.addListener('open', function() {
      self.exchangeOpen = true;
    });
  });
};

AmqpPublisher.prototype.disconnect = function AmqpPubDisconnect() {
  this.connection.end();
};

AmqpPublisher.prototype.publish = function AmqpPubPublish(data) {
  if (!this.exchangeOpen) {
    console.log("exchange not opened yet!");
    return;
  }

  return exchange.publish(config.routingKey, data.message, {
    mandatory: false,
    immediate: false,
    contentType: 'application/octet-stream'
  });
};

function AmqpSubscriber() {
  this.connection = null;
  this.exchange   = null;
  this.queue      = null;
  this.config     = {
    host: 'localhost',
    port: 5672,
    login: 'guest',
    password: 'guest',
    vhost: '/',
    exchange_name: 'qurl-exchange',
    queue_name: 'qurl-queue',
    binding_key: '#'
  };
}

AmqpSubscriber.prototype.configure = function AmqpSubConfigure(configuration) {
  var server = parseServer(configuration.server);

  this.config.server = server.host;
  this.config.port   = server.port;

  this.config.login         = configuration.login;
  this.config.password      = configuration.password;
  this.config.vhost         = configuration.vhost;
  this.config.exchange_name = configuration.exchange;
  this.config.queue_name    = configuration.queue;

  console.log('AmqpSubConfigure!');
};

AmqpSubscriber.prototype.connect = function AmqpSubConnect(client) {
  console.log('AmqpSubConnect!');

  var self = this;
  this.connection = amqp.createConnection(this.config);

  // console.log('AmqpSubConnect: %s', util.inspect(this.connection));

  this.connection.on('connect', function() {
    console.log('AmqpSubConnect: Got connection!');
  });


  this.connection.on('ready', function() {
    console.log("connecting to queue: [" + self.config.queue_name + "]");

    self.queue = connection.queue(self.config.queue_name, {
      passive    : false,
      durable    : true,
      exclusive  : false,
      autoDelete : false
    }, function (q) {
      console.log("binding to exchange [" + self.config.exchange_name + "] with binding key [" + self.config.binding_key + "]");
      q.bind(self.config.exchange_name, self.config.binding_key);

      console.log("subscribing to queue...");
      q.subscribe(function(message, headers, deliveryInfo) {
        client.emit("message", {
          payload: message.data.toString()
        });
      });
    });
  });
};

AmqpSubscriber.prototype.disconnect = function AmqpSubDisconnect() {
  this.connection.end();
};

module.exports = {
  publisher: AmqpPublisher,
  subscriber: AmqpSubscriber
};
