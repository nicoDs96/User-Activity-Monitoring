
var count = 1;
var topic = "sensor/test";
var client;

function testPhao(){

    let location = {hostname:"127.0.0.1", port:"16396", awsClientID: "client"};
    client = new Paho.MQTT.Client(location.hostname, Number(location.port),"/wss", location.awsClientID);

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({onSuccess:onConnect});

    

    

}

// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    client.subscribe(topic);
    
    setInterval(()=>{
        
        message = new Paho.MQTT.Message("Hello "+count.toString() );
        message.destinationName = topic;
        client.send(message);
        count += 1;

    },5000);
    
  }
  

  // called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:"+responseObject.errorMessage);
    }
}

// called when a message arrives
function onMessageArrived(message) {
    console.log("onMessageArrived:"+message.payloadString);
}

$(document).ready(function() {
    testPhao();
});


