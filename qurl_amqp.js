function amqpPublisher() {
  var self = this;

  var config = {
    host:        'localhost',
    port:        5672,
    exchange:    null,
    queue:       null,
    routing_key: '#' // Any key
  }

  self.configure = function(form_data) {
    config.host        = form_data.host;
    config.port        = parseInt(form_data.port, 10);
    config.exchange    = form_data.exchange;
    config.queue       = form_data.queue;
    config.routing_key = form_data.routing_key;
  }
}

function amqpSubscriber() {
  var self = this;

  var config = {
    host: 'localhost',
    port: 5672,
    exchange: null,
    queue: null,
    binding_key: '#' // Any key
  }

  self.configure = function(form_data) {
    config.host        = form_data.host;
    config.port        = parseInt(form_data.port, 10);
    config.exchange    = form_data.exchange;
    config.queue       = form_data.queue;
    config.binding_key = form_data.binding_key;
  }
}

module.exports = { publisher: new amqpPublisher(), subscriber: new amqpSubscriber() };
