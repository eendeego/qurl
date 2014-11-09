(function (exports) {
  exports.layoutMessage = function layoutMessage(message) {
    var result = [
      '<div class="message"><div class="meta">',
      '<div class="channel" title="Channel">', message.channel, '</div>'
    ];

    if (message.pattern) {
      result.push('<div class="pattern" title="Pattern">', message.pattern, '</div>');
    }
    result.push('</div>',
                '<div class="payload">', message.payload, '</div>',
                '</div>');

    return result.join('');
  };
})(typeof exports === 'undefined' ? this['redis'] = {} : exports);
