let alert = '<div class="alert alert-warning" role="alert">'+
  'Seems like if your device/browser do not support accelerometer. Try to change device/browser.'+
  '</div>';

var activityTopic = ""; //pattern sensor/{client id}/position
var sensorPubTopic = ""; //pattern sensor/{client id}/accelerometer
var clientUniqueId = "";

//Plot Global var
var x, y, line, line1, line2, n = 40; 
var data = new Array(n).fill(0), dataX = new Array(n).fill(0),dataY = new Array(n).fill(0), dataZ = new Array(n).fill(0);
var gravityDataX = new Array(n).fill(0), gravityDataY = new Array(n).fill(0), gravityDataZ = new Array(n).fill(0);
var linAccDataX = new Array(n).fill(0), linAccDataY = new Array(n).fill(0), linAccDataZ = new Array(n).fill(0);


$(document).ready(async function() {
  
  
  //PLOT TEST CODE
  initPlots();
  //simulate data to plot
  $('#stop').click( () =>{
    //remove plots
    d3.select("#svg_x > * ").remove();
    d3.select("#svg_y > * ").remove();
    d3.select("#svg_z > * ").remove();
  });
  $('#start').click( () =>{
    //init plot
    initPlots();
  });
  $('#clean').click( () =>{$('#acc-mod').empty();
    //remove plots
    d3.select("#svg_x > *").remove();
    d3.select("#svg_y > *").remove();
    d3.select("#svg_z > *").remove();
  });
  setInterval(()=>{
  
    dataX.push(Math.random()); dataY.push(Math.random()); dataZ.push(Math.random());
    gravityDataX.push(Math.random()); gravityDataY.push(Math.random()); gravityDataZ.push(Math.random());
    linAccDataX.push(Math.random()); linAccDataY.push(Math.random()); linAccDataZ.push(Math.random());
  },1);
  
  
  /*
  try {
    // Create Sensor
    let sensor = new Accelerometer({frequency:1});
    sensor.onerror = event => console.log(event.error.name, event.error.message);
    let filter = new LowPassFilterData(sensor, 0.3);
    
    // allow user to start stop monitoring
    $('#stop').click( () =>{
      sensor.stop();
      //remove plots
      d3.select("#svg_x > *").remove();
      d3.select("#svg_y > *").remove();
      d3.select("#svg_z > *").remove();
    });
    $('#start').click( () =>{
      sensor.start()
      //init plot
      initPlots();
    });
    $('#clean').click( () =>{
      
      $('#acc-mod').empty();
      //remove plots
      d3.select("#svg_x > *").remove();
      d3.select("#svg_y > *").remove();
      d3.select("#svg_z > *").remove();
    });
    
    try{
      // Paho configuration
      let location = {hostname:"192.168.1.47", port:"16396", awsClientID: "client"};
      client = new Paho.MQTT.Client(location.hostname, Number(location.port),"/wss", location.awsClientID);
      
      // Init parameters
      var clientUniqueId = await getUniqueId();
      var activityTopic = `sensor/${clientUniqueId}/position`; 
      var sensorPubTopic = `sensor/${clientUniqueId}/accelerometer`;

      // set callback handlers
      client.onConnectionLost = onConnectionLost;
      client.onMessageArrived = onMessageArrived;
      client.connect({onSuccess:onConnect});

    }catch(error){
      console.log('Error creating sensor:')
      console.log(error);
    }
    

    // TODO: 3. update view with classification info (onmessage callback)
    
    sensor.onreading = () => {
        //console.log("Acceleration along X-axis: " + sensor.x);
        $('#x').text(sensor.x);
        //console.log("Acceleration along Y-axis: " + sensor.y);
        $('#y').text(sensor.y);
        //console.log("Acceleration along Z-axis: " + sensor.z);
        $('#z').text(sensor.z);
        
        filter.update(sensor); // Pass latest values through filter.
        //gravity
        $('#x_filt').text(filter.x);
        $('#y_filt').text(filter.y);
        $('#z_filt').text(filter.z);
        // Isolated linear acceleration
        lin_acc_x = sensor.x-filter.x;
        lin_acc_y = sensor.y-filter.y;
        lin_acc_z = sensor.z-filter.z;
        lin_acc_mod = Math.sqrt( Math.pow(lin_acc_x,2) + Math.pow(lin_acc_y,2) + Math.pow(lin_acc_z,2) )

        $('#acc-mod').text(`Linear Acceleration Module: ${lin_acc_mod}`);

        $('#x-f').text(lin_acc_x);
        $('#y-f').text(lin_acc_y);
        $('#z-f').text(lin_acc_z);

        //UPDATE DATA TO PLOT
        dataX.push(sensor.x); dataY.push(sensor.y); dataZ.push(sensor.z);
        gravityDataX.push(filter.x); gravityDataY.push(filter.y); gravityDataZ.push(filter.z);
        linAccDataX.push(lin_acc_x); linAccDataY.push(lin_acc_y); linAccDataZ.push(lin_acc_z);
        
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
        //client.send(message);
        
        

      
    }
  

    } catch(error) {
        console.log('Error creating sensor:')
        console.log(error);
        $('body').append($.parseHTML(alert));
        setTimeout( ()=>{$().alert('close')}, 2000 );
        //Fallback, do something else etc.
    }
    */
  
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


function tick() { //animate the plots

    // Redraw the line.
    d3.select(this)
      .attr("d", line)
      .attr("transform", null);

    // Slide it to the left.
    d3.active(this)
      .attr("transform", `translate( ${x(-1)},0)`)
    .transition()
      .on("start", tick);

    // Pop the old data point off the front.
    dataX.shift();
    dataY.shift();
    dataZ.shift();
    gravityDataX.shift();
    gravityDataY.shift();
    gravityDataZ.shift();
    linAccDataX.shift();
    linAccDataY.shift();
    linAccDataZ.shift();




  }


function initPlots(){
  update_rate = 1000; //ms
  /* 
  ==========================================
  ||                                      ||
  ||            SETUP RAW PLOT            ||
  ||                                      ||
  ==========================================
  */
  // set the dimensions and margins of the graph
  var svg = d3.select("#svg_x");
  margin = {top: 10, right: 10, bottom: 10, left: 10};
  width = +svg.attr("width") ;//- margin.left - margin.right;
  height = +svg.attr("height");// - margin.top - margin.bottom;
  g = svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`);

  // set the ranges
  x = d3.scaleLinear()
    .domain([0, n - 1])
    .range([0, width]);

  y = d3.scaleLinear()
    .domain([-3, 3])
    .range([height, 0]);

  // define the 1st line
  line = d3.line()
    .x((d, i) => { return x(i); })
    .y((d, i) => { return y(d); });

  g.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  //Add x axis
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + y(0) + ")")
    .call(d3.axisBottom(x));
  
  //Add y axis
  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y));

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(dataX)
    .attr("class", "line")
    .style("stroke", "violet")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick);
    

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(dataY)
    .attr("class", "line")
    .style("stroke", "green")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick );

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(dataZ)
    .attr("class", "line")
    .style("stroke", "orange")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick);
    
  
  /* 
  ==========================================
  ||                                      ||
  ||          SETUP GRAVITY PLOT          ||
  ||                                      ||
  ==========================================
  */
  var svg = d3.select("#svg_y");
  g = svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`);
  g.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  //Add x axis
  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + y(0) + ")")
    .call(d3.axisBottom(x));
  
  //Add y axis
  g.append("g")
    .attr("class", "axis axis--y")
    .call(d3.axisLeft(y));

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(gravityDataX)
    .attr("class", "line")
    .style("stroke", "violet")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick);
    

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(gravityDataY)
    .attr("class", "line")
    .style("stroke", "green")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick);

  g.append("g")
    .attr("clip-path", "url(#clip)")
    .append("path")
    .datum(gravityDataZ)
    .attr("class", "line")
    .style("stroke", "orange")
    .transition()
    .duration(update_rate)
    .ease(d3.easeLinear)
    .on("start", tick);
  
    /* 
  ==========================================
  ||                                      ||
  ||          SETUP LIN ACC PLOT          ||
  ||                                      ||
  ==========================================
  */
 var svg = d3.select("#svg_z");
 g = svg.append("g").attr("transform", `translate( ${margin.left}, ${margin.top})`);
 g.append("defs").append("clipPath")
   .attr("id", "clip")
   .append("rect")
   .attr("width", width)
   .attr("height", height);

 //Add x axis
 g.append("g")
   .attr("class", "axis axis--x")
   .attr("transform", "translate(0," + y(0) + ")")
   .call(d3.axisBottom(x));
 
 //Add y axis
 g.append("g")
   .attr("class", "axis axis--y")
   .call(d3.axisLeft(y));

 g.append("g")
   .attr("clip-path", "url(#clip)")
   .append("path")
   .datum(linAccDataX)
   .attr("class", "line")
   .style("stroke", "violet")
   .transition()
   .duration(update_rate)
   .ease(d3.easeLinear)
   .on("start", tick);
   

 g.append("g")
   .attr("clip-path", "url(#clip)")
   .append("path")
   .datum(linAccDataY)
   .attr("class", "line")
   .style("stroke", "green")
   .transition()
   .duration(update_rate)
   .ease(d3.easeLinear)
   .on("start", tick);

 g.append("g")
   .attr("clip-path", "url(#clip)")
   .append("path")
   .datum(linAccDataZ)
   .attr("class", "line")
   .style("stroke", "orange")
   .transition()
   .duration(update_rate)
   .ease(d3.easeLinear)
   .on("start", tick);
   
}

