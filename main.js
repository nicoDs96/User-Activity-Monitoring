let alert = '<div class="alert alert-warning" role="alert">'+
  'Seems like if your device/browser do not support accelerometer. Try to change device/browser.'+
  '</div>';

var activityTopic = ""; //pattern sensor/{client id}/position
var sensorPubTopic = ""; //pattern sensor/{client id}/accelerometer
var clientUniqueId = "";
$(document).ready(async function() {
  try {
    // Create Sensor
    let sensor = new Accelerometer({frequency:1});
    sensor.onerror = event => console.log(event.error.name, event.error.message);
    let filter = new LowPassFilterData(sensor, 0.3);
    
    // allow user to start stop monitoring
    $('#stop').click( () =>{sensor.stop()} );
    $('#start').click( () =>{sensor.start()} );
    
    // Paho configuration
    let location = {hostname:"127.0.0.1", port:"16396", awsClientID: "client"};
    client = new Paho.MQTT.Client(location.hostname, Number(location.port),"/wss", location.awsClientID);
    
    // Init parameters
    var clientUniqueId = await getUniqueId();
    var activityTopic = `sensor/${clientUniqueId}/position`; 
    var sensorPubTopic = `sensor/${clientUniqueId}/accelerometer`;

    // set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({onSuccess:onConnect});


    // TODO: 3. update view with classification info (onmessage callback)
    
    sensor.onreading = () => {
        //console.log("Acceleration along X-axis: " + sensor.x);
        $('#x').text(sensor.x);
        //console.log("Acceleration along Y-axis: " + sensor.y);
        $('#y').text(sensor.y);
        //console.log("Acceleration along Z-axis: " + sensor.z);
        $('#z').text(sensor.z);

        filter.update(sensor); // Pass latest values through filter.
        $('#x_filt').text(filter.x);
        $('#y_filt').text(filter.y);
        $('#z_filt').text(filter.z);
        $('#x-f').text(sensor.x-filter.x);
        $('#y-f').text(sensor.y-filter.y);
        $('#z-f').text(sensor.z-filter.z);
        //console.log(`Isolated gravity (${filter.x}, ${filter.y}, ${filter.z})`);
        
        //Create a message
        let msgText = JSON.stringify({clientId:clientUniqueId,x:sensor.x,y:sensor.y,z:sensor.z});
        message = new Paho.MQTT.Message( msgText );
        message.destinationName = sensorPubTopic;
        //Send it with paho
        //client.send(message);
        
        //TODO: 4. display data graphically

      
    }
  

    } catch(error) {
        console.log('Error creating sensor:')
        console.log(error);
        $('body').append($.parseHTML(alert));
        setTimeout( ()=>{$().alert('close')}, 2000 );
        //Fallback, do something else etc.
    }

  
});

// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  client.subscribe(activityTopic);
  
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

async function getUniqueId(){

  const msgUint8 = new TextEncoder().encode(new Date().toLocaleString()+Math.random().toString());                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  return hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

}

class LowPassFilterData {
  constructor(reading, bias) {
    Object.assign(this, { x: reading.x, y: reading.y, z: reading.z });
    this.bias = bias;
  }

  update(reading) {
    this.x = this.x * this.bias + reading.x * (1 - this.bias);
    this.y = this.y * this.bias + reading.y * (1 - this.bias);
    this.z = this.z * this.bias + reading.z * (1 - this.bias);
  }
};


              
