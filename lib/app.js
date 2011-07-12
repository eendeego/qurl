(function() {
  var amqp, app, express, io, querystring, redis, services, socket, sys, util;
  sys = require('sys');
  express = require('express');
  io = require('socket.io');
  querystring = require('querystring');
  util = require('util');
  amqp = require('./modules/amqp/main');
  redis = require('./modules/redis/main');
  app = module.exports = express.createServer();
  process.on('uncaughtException', function(err) {
    return console.log("Caught exception: " + err.message + "\n" + err.stack);
  });
  app.configure(function() {
    app.set('views', __dirname + '/../views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(__dirname + '/../public'));
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
  services = {
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
    return res.render('index', {
      title: 'Qurl',
      services: services,
      service: '-'
    });
  });
  app.get('/:service/publisher', function(req, res) {
    var service;
    service = req.params.service;
    return res.render("s/" + service + "/publisher", {
      title: "Qurl - " + services[service].name + " - Publisher",
      services: services,
      service: service
    });
  });
  app.get('/:service/subscriber', function(req, res) {
    var service;
    service = req.params.service;
    return res.render("s/" + service + "/subscriber", {
      title: "Qurl - " + services[service].name + " - Subscriber",
      services: services,
      service: service
    });
  });
  socket = io.listen(app);
  socket.on('connection', function(client) {
    var endpoint;
    endpoint = null;
    client.on('message', function(message) {
      if (message.type === 'configure') {
        endpoint = new services[message.service].module[message.endpoint]();
        endpoint.configure(message.configuration);
        return endpoint.connect(client);
      } else if (message.type === 'message') {
        return endpoint.publish(message.data);
      } else if (message.type === 'disconnect') {
        return endpoint.disconnect();
      }
    });
    return client.on('disconnect', function() {
      return endpoint.disconnect();
    });
  });
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port);
}).call(this);
