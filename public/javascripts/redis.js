function layoutMessage(message) {
  // TODO HTML Sanitizing

  var result = "<div class='message'><div class='meta'>" + 
    "<div class='channel' title='Channel'>" + message.channel + "</div>";

  if(message.pattern) {
    result += "<div class='pattern' title='Pattern'>" + message.pattern + "</div>";
  }

  result +=
    "</div>" +
    "<div class='payload'>" + message.payload + "</div>" +
    "</div>";
  return result;
}
