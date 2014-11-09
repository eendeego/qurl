var util = require('util');
var path = require('path');

var express        = require('express');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var errorhandler   = require('errorhandler')
var socket_io      = require('socket.io');

var amqp      = require('./lib/services/amqp/main');
var redis     = require('./lib/services/redis/main');

process.on('uncaughtException', function(err) {
  return console.log("Caught exception: " + err.message + "\n" + err.stack);
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

var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(methodOverride());

app.set('views', __dirname + '/views');
app.locals.basedir = path.join(__dirname, 'views');

app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.use(errorhandler({
  dumpExceptions: true,
  showStack: true
}));

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

var server = app.listen(3000, function () {
  console.log("Express server (%d) listening on port %d",
              process.pid,
              server.address().port);
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

