
// Comment on http://api.jquery.com/serializeArray/
(function($) {
  $.fn.serializeJSON=function() {
    var json = {};
    jQuery.map($(this).serializeArray(), function(n, i) {
      json[n['name']] = n['value'];
    });
    return json;
  };
})(jQuery);

var qurl = (function () {
  var socket = null;

  function appendMessage(message) {
    $('#output').append(layoutMessage(message)).each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  function appendEvent(event) {
    $('#output').append("<div class='event " + event.type +"'>" + event.message + "</div>").each(function(index) {
      //$(this).scrollIntoView();
    });
  }

  function sendMessage() {
    socket.emit('message', { data: $('#qurl').serializeJSON() });
  }

  return {
    publish : function() {
      //alert('socket!?: ' + socket);
      if(socket === null) {
        socket = io.connect('http://localhost');
        socket.on('connect', function() {
          appendEvent({ type: 'connect', message: 'Connect' });
          var configuration = $('#qurl').serializeJSON();
          socket.emit('configure',
                      { service: configuration.service,
                        endpoint: configuration.endpoint,
                        configuration: configuration });
          sendMessage();
        });
        socket.on('message', function(message) {
          if(message.type == 'message') {
            appendMessage(message);
          }
        });
        socket.on('disconnect', function() {
          appendEvent({ type: 'disconnect', message: 'Disconnect' });
        });
      } else {
        sendMessage();
      }

      return false;
    },

    subscribe : function() {
      if(socket !== null) {
        self.unsubscribe();
      }
      socket = io.connect('http://localhost');
      socket.on('connect', function() {
        appendEvent({ type: 'connect', message: 'Connect' });
        var configuration = $('#qurl').serializeJSON();
        socket.emit('configure',
                    { service: configuration.service,
                      endpoint: configuration.endpoint,
                      configuration: configuration });
      })
      socket.on('message', function(message) {
        appendMessage(message);
      })
      socket.on('disconnect', function() {
        appendEvent({ type: 'disconnect', message: 'Disconnect' });
      })

      return false;
    },

    unsubscribe : function() {
      if(socket === null) {
        appendEvent({ type: 'disconnect', message: 'Disconnect, socket is null.' });
        return;
      }

      socket.send({ type: 'disconnect' });

      socket.disconnect();
      socket = null;

      return false;
    }
  };
})();

var qurl_publish = qurl.publish;

var qurl_subscribe = qurl.subscribe;
var qurl_unsubscribe = qurl.unsubscribe;
