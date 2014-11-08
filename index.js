var util      = require('util');
var express   = require('express');
var socket_io = require('socket.io');

var app       = express();
var http      = require('http');
var server    = http.createServer(app);

var amqp      = require('./lib/services/amqp/main');
var redis     = require('./lib/services/redis/main');

process.on('uncaughtException', function(err) {
  return console.log("Caught exception: " + err.message + "\n" + err.stack);
});

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  return app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  return app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  return app.use(express.errorHandler());
});

// TODO Implement a proper registry or... some kind of discovery mechanism
var services = {
  amqp: {
    name: 'AMQP',
    module: amqp
  },
  redis: {
    name: 'redis',
    module: redis
  }
};

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Qurl',
    services: services,
    service: '-'
  });
});

app.get('/:service/publisher', function(req, res) {
  var service = req.params.service;

  res.render("s/" + service + "/publisher", {
    title: "Qurl - " + services[service].name + " - Publisher",
    services: services,
    service: service
  });
});

app.get('/:service/subscriber', function(req, res) {
  var service = req.params.service;
  res.render("s/" + service + "/subscriber", {
    title: "Qurl - " + services[service].name + " - Subscriber",
    services: services,
    service: service
  });
});

var io = socket_io.listen(server);

io.sockets.on('connection', function(socket) {
  var endpoint = null;

  socket.on('configure', function(message) {
    endpoint = new services[message.service].module[message.endpoint]();
    endpoint.configure(message.configuration);
    endpoint.connect(socket);
  });

  socket.on('message', function(message) {
    endpoint.publish(message.data);
  });

  return socket.on('disconnect', function(message) {
    endpoint.disconnect();
  });
});

server.listen(3000);

console.log("Express server listening on port %d", server.address().port);
