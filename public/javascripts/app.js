(function (exports) {
  // Comment on http://api.jquery.com/serializeArray/
  (function($) {
    $.fn.serializeJSON = function() {
      var json = {};
      jQuery.map($(this).serializeArray(), function(n, i) {
        json[n['name']] = n['value'];
      });
      return json;
    };
  })(jQuery);

  function byId(id) {
    return document.getElementById(id);
  }

  function App() {
    this.socket = null;
  }

  App.prototype.appendMessage = function appendMessage(service, message) {
    $('#output').append(window[service].layoutMessage(message)).each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  App.prototype.appendEvent = function appendEvent(event) {
    $('#output').append("<div class='event " + event.type +"'>" + event.message + "</div>").each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  App.prototype.sendMessage = function sendMessage() {
    this.socket.emit('message', { data: $('#qurl-publisher').serializeJSON() });
  }

  // FIXME Replace 'http://localhost' with proper url from the navigation object
  // FIXME Move socket.io initialization to its own function

  App.prototype.publish = function publish() {
    var self = this;
    var configuration;

    //alert('socket!?: ' + this.socket);
    if (this.socket === null) {
      this.socket = io.connect('http://localhost');

      this.socket.on('connect', function () {
        self.appendEvent({ type: 'connect', message: 'Connect' });
        configuration = $('#qurl-publisher').serializeJSON();
        self.socket.emit('configure',
                         { service       : configuration.service,
                           endpoint      : configuration.endpoint,
                           configuration : configuration });
        self.sendMessage();
      });

      this.socket.on('message', function(message) {
        if(message.type == 'message') {
          self.appendMessage(configuration.service, message);
        }
      });

      this.socket.on('disconnect', function() {
        self.appendEvent({ type: 'disconnect', message: 'Disconnect' });
      });
    } else {
      this.sendMessage();
    }
  };

  App.prototype.subscribe = function subscribe() {
    var self = this;
    var configuration;

    if (this.socket !== null) {
      this.unsubscribe();
    }

    this.socket = io.connect('http://localhost');
    this.socket.on('connect', function() {
      self.appendEvent({ type: 'connect', message: 'Connect' });
      configuration = $('#qurl-subscriber').serializeJSON();
      self.socket.emit('configure',
                       { service       : configuration.service,
                         endpoint      : configuration.endpoint,
                         configuration : configuration });
    });

    this.socket.on('message', function(message) {
      self.appendMessage(configuration.service, message);
    });

    this.socket.on('disconnect', function() {
      self.appendEvent({ type: 'disconnect', message: 'Disconnect' });
    });
  };

  App.prototype.unsubscribe = function unsubscribe() {
    if (this.socket === null) {
      appendEvent({
        type    : 'disconnect',
        message : 'Disconnect, socket is null.'
      });
      return;
    }

    this.socket.send({ type: 'disconnect' });

    this.socket.disconnect();
    this.socket = null;
  }

  // This will change a lot soon.
  // But for now... just to have things running:
  exports.app = new App();
})(typeof exports === 'undefined' ? this['qurl'] = {} : exports);
