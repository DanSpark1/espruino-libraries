var SERIAL_DATA = ""

var ESP = function(SSID, PSWD, UDP_HOST, UDP_PORT, SERIAL) {
  this.SSID = SSID;
  this.PSWD = PSWD;
  this.UDP_HOST = UDP_HOST;
  this.UDP_PORT = UDP_PORT
  this.SERIAL = SERIAL;


  var buf = "";
  SERIAL.on('data', function(d) {
    buf += d;
    if (buf.indexOf("+IPD") != -1) {
        var message = buf.split("+IPD")[1];
        message = message.split(":")[1];
        console.log(message);
        buf = "";
        this.emit('msg', message);
    }
  })
};

//wifi connection
ESP.prototype.connect = function() {
  return new Promise((resolve, reject) => {
    ESP.cmd("AT+CWJAP=\"" + this.SSID + "\",\"" + this.PSWD + "\"").then(d => {
      console.log("Connected");
      resolve("Connected");
    });
  });
};



//connection via UDP
ESP.prototype.udp_start = function(socket) {
  return new Promise((resolve, reject) => {
    ESP.cmd("AT+CWMODE=3").then(d => {
      console.log("CWMODE=3");
      return ESP.cmd("AT+CIPMUX=1")
    }).then(d => {
      console.log("CIPMUX=1");
      return ESP.cmd("AT+CIPSTART=" + socket + ",\"UDP\",\"" + this.UDP_HOST + "\"," + this.UDP_PORT + "," + this.UDP_PORT + ",0")
    }).then(d => {
      console.log("UDP Connected");
      resolve("UDP Connected");
    });
  });
};

var counter = 1;

//recursive function to send messages correctly
//until the counter is equal to the number of arguments of the "send" prototype, all arguments except the socket will be sent
function send(arr, socket) {
  if (counter < arr.length) {
    var message = arr[counter];
    //sends only a string
    if (typeof message != "string")
      message = message.toString();

    ESP.cmd("AT+CIPSEND=" + socket + "," + message.length + "").then(d => {
      ESP.cmd(message).then(d => {
        counter++
        send(arr, socket);
      });
    });
  } else
    counter = 1;
};

//prototype for sending messages over UDP Protocol
//it is necessary to pass the active socket (1-4) and any number of messages, they will be sent in order
ESP.prototype.send = function(socket) {
  msg = arguments;

  send(msg, socket);
};

ESP.prototype._On = function() {
  this.emit('msg', "NU BLYAT");
}

//setup
exports.setup = function(SSID, PSWD, UDP_HOST, UDP_PORT, SERIAL) {

  ESP.at = at = require('AT').connect(SERIAL);

  //the cmd function sends the ESP8266 command and waits for the " OK " response"
  ESP.cmd = function(command) {
    return new Promise((resolve, reject) => {

      var str = "";

      SERIAL.on('data', (dt) => {
        str += dt;
        if (str.indexOf("OK") != -1 || str.indexOf("ALREADY CONNECTED") != -1) {
          str = "";
          resolve("OK");
        }
      });

      SERIAL.println(command);
    });
  };

  return new ESP(SSID, PSWD, UDP_HOST, UDP_PORT, SERIAL)
};
