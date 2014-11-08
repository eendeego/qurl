(function (exports) {
  exports.layoutMessage = function layoutMessage(message) {
    return "<div class='message'>" + message.payload + "</div>";
  };
})(typeof exports === 'undefined' ? this['amqp'] = {} : exports);
