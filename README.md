# SimpleChat

Built with:

  - <strong>Server side:</strong> Node.js, Socket.io, Express, Redis
  - <strong>Client side:</strong> HTML5 Boilerplate, Bootstrap, AngularJS  and jQuery

This is just a <strong>proof of concept</strong> of what could be done with these technologies.

Fork of http://github.com/tegioz/chat.git


### Requires

  - Node.js
  - NPM (Node Package Manager)
  - Redis

### Get the code

    git clone https://github.com/cynthia-sg/chat_angular.git

### Run

Fetch dependencies:

    npm install

Launch Redis:
    
    redis-server

Launch chat server:
    
    (don't forget to launch Redis before!)

    node chatServer.js

Now open this URL in your browser:

    http://localhost:8888/

and you're done ;)

### Broadcast API

Send messages to all connected users:

    Content-Type: application/json
    POST /api/broadcast/

    {"msg": "Hello!"}
