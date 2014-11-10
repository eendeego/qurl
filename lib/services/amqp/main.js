var util = require('util');
var amqp = require('amqplib');

var DEFAULT_PORT = 5672;

function AmqpPublisher() {
  this.connection  = null;
  this.connectionP = null;
  this.channel     = null;
  this.config      = {
    url        : 'amqp://localhost',
    exchange   : 'qurl-exchange',
    routingKey : 'qurl.publish.routing',
    message    : 'Hello World.',
    connectionTimeout: 3000
  };
  this.exchangeOpen = false;
}

AmqpPublisher.prototype.configure = function AmqpPubConfigure(configuration) {
  this.config.url        = configuration.url;
  this.config.exchange   = configuration.exchange;
  this.config.routingKey = configuration.routingKey;
  this.config.message    = configuration.message;

  console.log('AmqpPubConfigure!');
};

AmqpPublisher.prototype.connect = function AmqpPubConnect(client) {
  var self = this;

  this.connectionP = amqp.connect(this.config.url).
    then(function (connection) {
      console.log('AmqpPubConnect: Got connection!');
      self.connection = connection;
      return connection.createChannel()
    }).
    then(function (channel) {
      console.log('AmqpPubConnect: Got channel!');

      self.channel = channel;

      var exchange = self.config.exchange;
      console.log('AmqpPubConnect: Connecting to exchange "%s"', exchange);

      return self.channel.assertExchange(exchange, 'topic', {
        passive: false,
        durable: true,
        autoDelete: false
      });
    }).
    then(function () {
      console.log('AmqpPubConnect: Exchange open!');
      self.exchangeOpen = true;
    }).
    catch(function (wut) {
      console.log('Halp! Something failed: %s', util.inspect(wut));
    });
};

AmqpPublisher.prototype.disconnect = function AmqpPubDisconnect() {
  this.connection.close();
};

AmqpPublisher.prototype.publish = function AmqpPubPublish(data) {
  var self = this;

  if (!this.exchangeOpen) {
    console.log('AmqpPubPublish: WARN: Exchange not opened yet.');
  }

  this.connectionP = this.connectionP.then(function () {
    console.log('AmqpPubPublish: publishing.');
    self.channel.publish(self.config.exchange, self.config.routingKey,
                         new Buffer(data.message),
                         {
                           mandatory: false,
                           contentType: 'application/octet-stream'
                         });
  });
};

function AmqpSubscriber() {
  this.connection  = null;
  this.connectionP = null;
  this.channel    = null;
  this.queue      = null;
  this.config     = {
    host       : 'amqp://localhost',
    exchange   : 'qurl-exchange',
    queueName  : 'qurl-queue',
    bindingKey : '#'
  };
}

AmqpSubscriber.prototype.configure = function AmqpSubConfigure(configuration) {
  this.config.url       = configuration.url;
  this.config.exchange  = configuration.exchange;
  this.config.queueName = configuration.queue;

  console.log('AmqpSubConfigure!');
};

AmqpSubscriber.prototype.connect = function AmqpSubConnect(client) {
  var self = this;
  var exchange = this.config.exchange;
  var channel;

  console.log('AmqpSubConnect!');

  this.connectionP = amqp.connect(this.config.url).
    then(function (connection) {
      console.log('AmqpPubConnect: Got connection!');
      self.connection = connection;
      return connection.createChannel()
    }).
    then(function (newChannel) {
      console.log('AmqpPubConnect: Got channel!');

      self.channel = channel = newChannel;

      console.log('AmqpPubConnect: Connecting to exchange "%s"', exchange);

      return channel.assertExchange(exchange, 'topic', {
        passive    : false,
        durable    : true,
        autoDelete : false
      });
    }).
    then(function () {
      return channel.assertQueue(self.queueName, { exclusive: false });
    }).
    then(function (queue) {
      return channel.bindQueue(queue.queue, exchange, self.config.bindingKey).
        then(function () {
          return queue.queue;
        });
    }).
    then(function (queue) {
      console.log('binding to exchange [%s] with binding key [%s]',
                  self.config.exchange,
                  self.config.bindingKey);
      return channel.consume(queue, emitMessage, { noAck: true });
    }).
    catch(function (wut) {
      console.log('Halp! Something failed: %s', util.inspect(wut));
    });

  function emitMessage(message) {
    // TODO Send entire message
    client.emit('message', {
      payload: message.content.toString()
    });
  }
};

AmqpSubscriber.prototype.disconnect = function AmqpSubDisconnect() {
  this.connection.close();
};

module.exports = {
  publisher: AmqpPublisher,
  subscriber: AmqpSubscriber
};
