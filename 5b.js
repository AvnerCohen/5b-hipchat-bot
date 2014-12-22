/* Commands
 ==> 5b echo 123
 ==> 5b ping
 .. Now make your own.
 */

var request = require('request'),
  hipToken = process.env.HIP_TOKEN,
  hipRoomName = process.env.HIP_ROOM,
  postUrl = 'https://api.hipchat.com/v2/room/@PLACE_HOLDER@/notification?auth_token=' + hipToken,
  readMessageUrl = 'https://api.hipchat.com/v2/room/@PLACE_HOLDER@/history/latest?auth_token=' + hipToken,
  headers = {
    'Content-Type': 'application/json'
  };


var requestPayload = {
  "message": "",
  "notify": true,
  "color": "purple",
  "message_format": "html"
};

var lastMessages = {};
var MAX_MSG_LENGTH = 100;

function postMessageToRoom(room, message, callBack) {
  requestPayload['message'] = message;
  var targetUrl = postUrl.replace('@PLACE_HOLDER@', room);

  request.post({
    headers: headers,
    url: targetUrl,
    json: requestPayload
  }, function(error, response, body) {
    callBack(error);
  });
}

function listenForRoom() {
  var room = hipRoomName;

  var targetUrl = readMessageUrl.replace('@PLACE_HOLDER@', room);
  request.get({
    headers: headers,
    url: targetUrl
  }, function(error, response, body) {
    var results = JSON.parse(body);
    if(!results.items) {
      return;
    }

    if(Object.keys(lastMessages).length === 0) {
      console.log('It\'s alive!');
      results.items.forEach(function(item) {
        lastMessages[item.id] = true;
      });
    } else {
      results.items.forEach(function(item) {
        var newMessage = typeof(lastMessages[item.id]) === 'undefined';
        lastMessages[item.id] = true;
        var instruction = item.message;
        if (newMessage) { console.log('New message..'); }
        if(newMessage && instruction.indexOf('!') === 0) {
          performAction(instruction);
        }
      });
    }
    cleanUpIfNeeded();
  });

}


//Since we use this ugly LIFO queue for new message.. we clean this here to limit hash size.
function cleanUpIfNeeded() {
  if(Object.keys(lastMessages).length > MAX_MSG_LENGTH) {
    var toBeDelete = [];
    //perform cleanup
    var counter = Object.keys(lastMessages).length - MAX_MSG_LENGTH;
    Object.keys(lastMessages).forEach(function(key, value) {
      counter--;
      if(counter < 0) {
        return;
      }
      toBeDelete.push(key);
    });
    toBeDelete.forEach(function(key) {
      lastMessages[key] = null;
      delete lastMessages[key];
    });
  }
}

function performAction(instruction) {
  console.log('Request  - /' + instruction + '/');

  var moduleToExecute = instruction.replace('!', '').trim();
  var params = moduleToExecute.split(' ');
  var plugin = null;
  try {
    plugin = require('./plugins/' + params[0]);
  } catch(e) {
    console.error(e);
    postMessageToRoom(hipRoomName, 'bot saying: \'Damn! failed executing: /' + params[0] + '/', errorOnError);
    return false;
  }
  var results = plugin.run(params);
  postMessageToRoom(hipRoomName, results, errorOnError);
}

function errorOnError(err) {
  if(err) {
    console.err(err);
  }
}

setInterval(listenForRoom, 1500);