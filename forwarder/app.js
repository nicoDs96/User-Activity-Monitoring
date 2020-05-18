var express = require('express');
var mqtt = require('mqtt');
var cors = require('cors')

var app = express();

// Create a client instance
var client = mqtt.connect('mqtt://127.0.0.1:8883')

client.on('connect',  () => {
    console.log("Connected");

    client.subscribe(`sensor/+/activity`, (err) => {
      if (!err) {
        console.log("Subscribed to: sensor/+/activity")
      }
    })
  });
var clientsActivity = new Map();

client.on('message', function (topic, message) {
    // message is Buffer
    let clientId = topic.split("/")[1];
    message = JSON.parse(message.toString());
    clientsActivity.set(clientId, message.activity.toString());
    console.log(message.toString());
  });
// connect the client

app.use(express.json()); // for parsing application/json
app.use(cors());

app.get('/test', function (req, res) {
    res.send('Hello World!');
});

app.get('/state/:clientId', function (req, res) {
    if( clientsActivity.has( req.params.clientId) ){
        message = {
            activity: clientsActivity.get(req.params.clientId)
        }
        res.type('application/json');
        res.status(200);
        res.send(JSON.stringify(message));
    }
    else{
        res.status(404).send();
    }
    
});

app.post('/readings', function (req, res) {
    try {
        console.log(req.body);
        
        //msgText= JSON.parse(req.body);
        msgText = req.body;
        topic = `sensor/${msgText.clientId.toString()}/accelerometer`;
        
        client.publish(topic, JSON.stringify( req.body ));
        
        res.type('application/json');
        res.status(200);
        res.send();
    }
    catch (e) {
        console.error("Error : " + e);
        res.status(500).send("500 - Internal Error");
    }

});


//THIS MUST BE THE LAST ROUTE
app.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});


// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("onConnect");

}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
    }
}
    
// called when a message arrives
function onMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
}