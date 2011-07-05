var sys = require('sys');
var amqp = require('amqp');

function amqpPublisher() {
  var self       = this;
  var connection = null;
  var exchange   = null;
  
  var config = { 
    host:          'localhost',
    port:          5672,
    login:         'guest',
    password:      'guest',
    vhost:         '/',
    exchange_name: 'qurl-exchange',
    routing_key:   'qurl.publish.routing',
    message: "Hello World."
  };

  var exchange_opened = false;

  self.configure = function(form_data) {
    var server = form_data.server;
    var colon_ndx = server.indexOf(':');
    if(colon_ndx != -1) {
      config.host = server.substring(0, colon_ndx);
      config.port = parseInt(server.substring(colon_ndx), 10);
    } else {
      config.host = server;
    }
    
    config.login         = form_data.login;    
    config.password      = form_data.password;
    config.vhost         = form_data.vhost;
    config.exchange_name = form_data.exchange;
    config.routing_key   = form_data.routing_key;
    config.message       = form_data.message;
  }
  
  self.connect = function(client) {
    connection = amqp.createConnection(config);
    connection.addListener('ready', function(){
      
      var exchange_name = config['exchange_name'] 
      console.log("Connecting to exchange " + exchange_name);
      exchange = connection.exchange( exchange_name
                                      , { type: 'topic'
                                        , passive: false
                                        , durable: true
                                        , autoDelete: false
                                        });
      exchange.addListener('open', function(){
        exchange_opened = true;
      })
    })
  };

  self.disconnect = function() {
    connection.end();
  };

  self.publish = function(data) {
    if (!exchange_opened) {
      console.log("exchange not opened yet!");
      return;
    };
    var routing_key = config['routing_key'];

    exchange.publish( routing_key
                      , data.message
                      , { mandatory: false
                        , immediate: false
                        , contentType: 'application/octet-stream'
                        //, contentEncoding: null
                        //, headers: {xxx: 'yyy'}
                        // , deliveryMode: 1 (Non-persistent) or 2 (persistent)
                        // , priority: 0-9
                        // , replyTo: Usually used to name a reply queue for a request message
                        });
  };
}

function amqpSubscriber() {
  var self       = this;
  var connection = null;
  var exchange   = null;
  var queue      = null;

  var config = { 
    host:          'localhost',
    port:          5672,
    login:         'guest',
    password:      'guest',
    vhost:         '/',
    exchange_name: 'qurl-exchange',
    queue_name:    'qurl-queue',
    binding_key:   '#' // Any key
  }

  self.configure = function(form_data) {
    var server = form_data.server;
    var colon_ndx = server.indexOf(':');
    if(colon_ndx != -1) {
      config.host = server.substring(0, colon_ndx);
      config.port = parseInt(server.substring(colon_ndx), 10);
    } else {
      config.host = server;
    }
    config.login         = form_data.login;    
    config.password      = form_data.password;
    config.vhost         = form_data.vhost;
    config.exchange_name = form_data.exchange;
    config.queue_name    = form_data.queue;
    //config.binding_key   = c.routing_key;
  }
  
  self.connect = function(client) {

    connection = amqp.createConnection(config);
    
    connection.on('ready', function () {
      console.log("connecting to queue: ["+config.queue_name+"]")
      queue = connection.queue( config.queue_name
                                  , { passive: false
                                    , durable: true
                                    , exclusive: false
                                    , autoDelete: false
                                    }
                                  , function(q) {
        console.log("binding to exchange [" + config.exchange_name + "] with binding key [" + config.binding_key + "]")
        q.bind(config.exchange_name, config.binding_key);
      
        console.log("subscribing to queue...");
        q.subscribe(function (message, headers, deliveryInfo) {
          
          client.send({ type: "message", 
                        payload: message.data.toString()});
        });
      });
    });
  };

  self.disconnect = function() {
    connection.end();
  };
  
  
  
}

//module.exports = { publisher: new amqpPublisher(), subscriber: new amqpSubscriber() };
module.exports = { publisher: amqpPublisher, subscriber: amqpSubscriber };
