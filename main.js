let alert = '<div class="alert alert-warning" role="alert">'+
  'Seems like if your device/browser do not support accelerometer. Try to change device/browser.'+
  '</div>';

var activityTopic = ""; //pattern sensor/{client id}/activity
var sensorPubTopic = ""; //pattern sensor/{client id}/accelerometer
var clientUniqueId = "";


$(document).ready(async function() {
  
  try {
    // Create Sensor
    let sensor = new Accelerometer({frequency:1});
    sensor.onerror = event => console.log(event.error.name, event.error.message);
    let filter = new LowPassFilterData(sensor, 0.3);
    
    // allow user to start stop monitoring
    $('#stop').click( () =>{sensor.stop();});
    $('#start').click( () =>{sensor.start()});
    $('#clean').click( () =>{$('#acc-mod').empty();});
    
    try{ // Paho configuration
      
      let location = {hostname:"192.168.1.63", port:"16396", awsClientID: "client"};
      client = new Paho.MQTT.Client(location.hostname, Number(location.port),"/wss", location.awsClientID);
      
      // Init parameters
      var clientUniqueId = await getUniqueId();
      var activityTopic = `sensor/${clientUniqueId}/activity`; 
      var sensorPubTopic = `sensor/${clientUniqueId}/accelerometer`;

      // set callback handlers
      client.onConnectionLost = onConnectionLost;
      client.onMessageArrived = onMessageArrived;
      var con_options={
        useSSL: true,
        userName : "prova",
        password : "prova",
        onSuccess: onConnect,
        
      }
      client.connect(con_options);

    }catch(error){
      console.log('Error initializing paho:')
      console.log(error);
    }
    

    // TODO: 3. update view with classification info (onmessage callback)
    
    sensor.onreading = () => {
        

      /*
      READ AND FILER SENSORS
      */
      // Pass latest values through filter.
      filter.update(sensor);
      //isolate lin acc 
      lin_acc_x = sensor.x-filter.x;
      lin_acc_y = sensor.y-filter.y;
      lin_acc_z = sensor.z-filter.z;
      lin_acc_mod = Math.sqrt( Math.pow(lin_acc_x,2) + Math.pow(lin_acc_y,2) + Math.pow(lin_acc_z,2) ); //compute linear acc module

      /*
      DISPLAY DATA ON HTML PAGE
      */
      $('#x').text(sensor.x);
      $('#y').text(sensor.y);
      $('#z').text(sensor.z);
      //gravity
      $('#x_filt').text(filter.x);
      $('#y_filt').text(filter.y);
      $('#z_filt').text(filter.z);
      // Isolated linear acceleration
      $('#acc-mod').text(`Linear Acceleration Module: ${lin_acc_mod}`);
      $('#x-f').text(lin_acc_x);
      $('#y-f').text(lin_acc_y);
      $('#z-f').text(lin_acc_z);

      /* 
      SEND THE DATA
      */
      msgText= {
        clientId:clientUniqueId,
        x:sensor.x,
        y:sensor.y,
        z:sensor.z,
        lin_acc_x:lin_acc_x,
        lin_acc_y:lin_acc_y,
        lin_acc_z:lin_acc_z,
        acc_mod:lin_acc_mod
      }
      //Create a message
      let msgText = JSON.stringify(msgText);
      message = new Paho.MQTT.Message( msgText );
      message.destinationName = sensorPubTopic;
      //Send it with paho
      client.send(message);
      
    }//onreading end

  } catch(error) {
      console.log('Error creating sensor:')
      console.log(error);
      $('body').append($.parseHTML(alert));
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
  let classification_value = JSON.parse(message.payloadString); 
  $('#activity').text(classification_value.activity.toString());
}

//called on initializaiton to get a unique id and retrive only classification associated to my id
async function getUniqueId(){

  const msgUint8 = new TextEncoder().encode(new Date().toLocaleString()+Math.random().toString());                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  return hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

}

//called when sensor.onreading
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
