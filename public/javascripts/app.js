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

  function App() {
    var this.socket = null;
  }

  App.prototype.appendMessage = function appendMessage(message) {
    $('#output').append(layoutMessage(message)).each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  App.prototype.appendEvent = function appendEvent(event) {
    $('#output').append("<div class='event " + event.type +"'>" + event.message + "</div>").each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  App.prototype.appendMessage = function sendMessage() {
    this.socket.emit('message', { data: $('#qurl').serializeJSON() });
  }

  // FIXME Replace 'http://localhost' with proper url from the navigation object
  // FIXME Move socket.io initialization to its own function

  App.prototype.publish = function publish() {
    var self = this;

    //alert('socket!?: ' + this.socket);
    if (this.socket === null) {
      this.socket = io.connect('http://localhost');

      this.socket.on('connect', function () {
        appendEvent({ type: 'connect', message: 'Connect' });
        var configuration = $('#qurl').serializeJSON();
        self.socket.emit('configure',
                         { service       : configuration.service,
                           endpoint      : configuration.endpoint,
                           configuration : configuration });
        self.sendMessage();
      });

      this.socket.on('message', function(message) {
        if(message.type == 'message') {
          self.appendMessage(message);
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

    if (this.socket !== null) {
      this.unsubscribe();
    }

    this.socket = io.connect('http://localhost');
    this.socket.on('connect', function() {
      appendEvent({ type: 'connect', message: 'Connect' });
      var configuration = $('#qurl').serializeJSON();
      self.socket.emit('configure',
                       { service       : configuration.service,
                         endpoint      : configuration.endpoint,
                         configuration : configuration });
    });

    this.socket.on('message', function(message) {
      self.appendMessage(message);
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
})(typeof exports === 'undefined' ? this['qurl'] = {} : exports);
