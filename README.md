# qurl

qurl is a queue publisher / subscriber for queueing systems in the same spirit as [hurl](http://github.com/defunkt/hurl)

## Features

  * Publish a single message
  * Subscribe to queues - and get messages via socket.io

## Supported queuing systems

### redis, AMQP

Pub/Sub working, with subscriptions per channel(s) and/or pattern(s)

## Planned support for

### 0MQ

(Unless is AMQP enough)

### Stomp

### redis lists

## Installing (for now)

    git clone git://github.com/luismreis/qurl qurl
    cd qurl
    npm install

## Running (for now)

    node lib/app.js
