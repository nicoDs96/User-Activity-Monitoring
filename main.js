let alert = '<div class="alert alert-warning" role="alert">'+
  'Seems like if your device/browser do not support accelerometer. Try to change device/browser.'+
  '</div>';

var activityTopic = ""; //pattern sensor/{client id}/activity
var sensorPubTopic = ""; //pattern sensor/{client id}/accelerometer
var clientUniqueId = "";

var statusintervalId;

var myIpAddr = '21a18245.ngrok.io';//https://

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
}


$(document).ready(async function() {
  clientUniqueId = await getUniqueId()
  try {
    // Create Sensor
    let sensor = new Accelerometer({frequency:1});
    sensor.onerror = event => console.log(event.error.name, event.error.message);
    let filter = new LowPassFilterData(sensor, 0.3);
    
    // allow user to start and stop monitoring, clear the interface
    $('#stop').click( () =>{ sensor.stop(); clearInterval(statusintervalId) });
    $('#start').click( () =>{ sensor.start(); checkStatus(); }); 
    $('#clean').click( () =>{
      $('#acc-mod').empty();
      $('#x').empty();
      $('#y').empty();
      $('#z').empty();
      //gravity
      $('#x_filt').empty();
      $('#y_filt').empty();
      $('#z_filt').empty();
      // Isolated linear acceleration
      $('#x-f').empty();
      $('#y-f').empty();
      $('#z-f').empty();
    });
    
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
     //create a message
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
      APICall(url = `https://${myIpAddr}/readings`, method=1 ,data=msgText) // 1: POST, 0: GET
      .then((r)=> { console.log(r);}) // r={}
      .catch(function(e) {console.log(`error ${e}`);});
      
      //POST THE MESSAGE TO THE API
    }//onreading end

  } catch(error) {
      console.log('Error creating sensor:')
      console.log(error);
      $('body').append($.parseHTML(alert));
  }
    

});

//called on initializaiton to get a unique id and retrive only classification associated to my id
async function getUniqueId(){

  const msgUint8 = new TextEncoder().encode(new Date().toLocaleString()+Math.random().toString());                           // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);           // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
  return hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

}

async function APICall(url = '', method=0 ,data = {}) {
  var response;
    if(method == 1){
    // Default options are marked with *
     response = await fetch(url, {
      method: 'POST', 
      mode: 'cors', 
      cache: 'no-cache', 
      credentials: 'same-origin', 
      headers: {
        'Content-Type': 'application/json'
        },
      redirect: 'follow',
      referrerPolicy: 'no-referrer', 
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
  }
  if(method == 0){
    // Default options are marked with *
     response = await fetch(url, {
      method: 'GET', 
      mode: 'cors', 
      cache: 'no-cache', 
      credentials: 'same-origin', 
      headers: {
        'Content-Type': 'application/json'
        },
      redirect: 'follow',
      referrerPolicy: 'no-referrer', 
      //no body since it is a get
    });
  }
  return response.json(); // parses JSON response into native JavaScript objects
}

//check for updates every 1 second
var checkStatus = () => {

  statusintervalId = setInterval(()=>{
    APICall(url = `https://${myIpAddr}/state/${clientUniqueId}`, method=0 ,data={}) // 1: POST, 0: GET
    .then((response)=> { 

      try{ //update the status iff it is available online
        $('#activity').text(response.activity.toString());  
      }catch(error){
        console.log(error);
      }
            
    }) // r={}
    .catch(function(e) {console.log(`error ${e}`);});    
    
  },1000);
}