const appId = "valueclock";
// timeout used to update every minute
var drawTimeout;

var lastGPS = null;
var gpsTimer = null;
function getGpsAltitude() {
  queueDraw(5000);
  var gps = Bangle.getGPSFix();
  if (gps && gps.satellites != undefined) {
    setStatus("" + gps.satellites);
  }
  if (setGpsAltitude(gps)) {
    return ""+ require('locale').distance(parseInt(gps.alt));
  }
  return "--";
}

function startGpsAltitude() {
  if (gpsTimer) {
    clearTimeout(gpsTimer);
  }
  gpsTimer = null;
  Bangle.setGPSPower(true, appId);
}

function stopGpsAltitude() {
  gpsTimer = setTimeout(()=> {
    Bangle.setGPSPower(false, appId);
    gpsTimer = null;
  }, 30000);
  queueClear();
}

function getSpeed() {
  queueDraw(5000);
  var gps = Bangle.getGPSFix();
  if (gps && gps.satellites != undefined) {
    setStatus("" + gps.satellites);
  }
  setGpsAltitude(gps);
  if (gps && gps.fix) {
    return parseInt(gps.speed);
    //require('locale').speed(parseInt(gps.speed));
  }
  return "--";
}

function startSpeed() {
  //Bangle.setGPSPower(true, appId);
  startGpsAltitude();
}

function stopSpeed() {
  //Bangle.setGPSPower(false, appId);
  //queueClear();
  stopGpsAltitude();
}

function getSteps() {
  queueDraw(60000);
  return "" + Bangle.getHealthStatus("day").steps + "";
}

function startSteps() {
  Bangle.on('step', function(up) {
    redraw();
  });
}

function stopSteps() {
  Bangle.removeAllListeners('HRM');
  queueClear();
}

function getSeconds() {
  queueDraw(1000);
  return ":" + new Date().getSeconds();
}

function startSeconds() {
}

function stopSeconds() {
  queueClear();
}

var hrm = null;
function getHeartRate() {
  queueDraw(60000);
  clearStatus();
  if (hrm) {
    if (hrm.confidence < 80) {
      setStatus("!");
    }  
    return "" + hrm.bpm;
  }
  setStatus("?");
  return "--";  
}

function startHeartRate() {
  Bangle.setHRMPower(true, appId);
  Bangle.on('HRM',function(h) {
    hrm = h;
    redraw();
  });
}

function stopHeartRate() {
  Bangle.setHRMPower(false, appId);
  Bangle.removeAllListeners('HRM');
  queueClear();
}

var pressure = null;
var isCalibrating = null;
const calId = appId + "Calibrate";
function getAltitude() {
  queueDraw(10000);
  Bangle.getPressure().then(d => {
    var isNew = !pressure;
    pressure = d;
    if (isNew) {
      redraw();
    }
  });
  clearStatus();
  if (isCalibrating == null) {
    if (!altShift) {
      setStatus("!");
    } else if (Date.now() - altShift.created > 3600000) {
      setStatus("!", "#00ff00");
    }
  }
  else {
    setStatus("?");
  }
  if (pressure) {
    var alt = pressure.altitude;
    if (altShift) {
      alt += altShift.shift;
    }
    return require('locale').distance(parseInt(alt)); 
  }
  return "--m";
}

function calibrateAltitude() {
  if (isCalibrating) {
    return;
  }
  console.log("Start Calibrating");
  isCalibrating = setTimeout(() => {
    stopCalibrating(false);
  }, 600000);
  var calibrate = function() {
    stopCalibrating(true);
    Bangle.getPressure().then(d => {
      altShift = {
        created: Date.now(),
        shift: lastGPS.alt - d.altitude
      };
      redraw();
      saveSettings();
    });
  };
  if (lastGPS || Date.now() - lastGPS.created < 30000) {
    calibrate();
  }
  else {
    Bangle.setGPSPower(true, calId);
    Bangle.on("GPS", gps => {
      if (setGpsAltitude(gps)) {
        calibrate();
      }
    });  
  }    
}

function stopCalibrating(success) {
  console.log("Done Calibrating: " + success);
  Bangle.setGPSPower(false, calId);
  Bangle.removeAllListeners("GPS");
  isCalibrating = null;
  redraw();
}
            
function setGpsAltitude(gps) {
  if (gps && gps.alt) {
    lastGPS = gps.clone();
    lastGPS.created = Date.now();
    return true;
  }
  return false;
}

var altShift = null;
function startAltitude() {
  Bangle.setBarometerPower(true, appId);
  if (!altShift || Date.now() - altShift.created > 3600000) {
    calibrateAltitude();
  }
  redraw();
}

function stopAltitude() {
  pressure = null;
  Bangle.setBarometerPower(false, appId);
  Bangle.removeAllListeners('pressure');
  queueClear();
}

function touchAltitude() {
  if (!altShift || Date.now() - altShift.created > 1800000) {
    calibrateAltitude();
  }
}

var basePressure = null;
function getAltitudeDiff() {
  queueDraw(1000);
  Bangle.getPressure().then(d => {
    var isNew = !pressure;
    pressure = d;
    if (isNew) {
      redraw();
    }
  });
  if (pressure) {
    if (!basePressure) {
      basePressure = pressure;
    }
    return  require('locale').distance(parseInt(pressure.altitude-basePressure.altitude));   
  }
  return "--m";
}

function startAltitudeDiff() {
  Bangle.setBarometerPower(true, appId);
  redraw();
}

function stopAltitudeDiff() {
  stopAltitude();
}

function touchAltitudeDiff() {
  if (pressure) {
    basePressure = pressure;
  }
  redraw();
}

function getTemp() {
  queueDraw(60000);
  Bangle.getPressure().then(d => {
    var isNew = !pressure;
    pressure = d;
    if (isNew) {
      redraw();
    }
  });
  if (pressure) {
    return require('locale').temp(parseInt(pressure.temperature)); 
  }
  return "--°C";
}

function startTemp() {
  Bangle.setBarometerPower(true, appId);
  redraw();
}

function stopTemp() {
  stopAltitude();
}

function getBattery() {
  queueDraw(60000);
  return E.getBattery() + "%";
}

function startBattery() {
}

function stopBattery() {
}

function touchBattery(xy) {
  console.log(xy);
}

function getDate() {
  queueDraw(60000);
  var date = new Date();
  var d=new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  var yearStart = new Date(d.getFullYear(),0,1);
  var week =  Math.ceil((((d - yearStart) / 86400000) + 1)/7);  
  setStatus(require("locale").dow(date, 1));
  return date.getDate() + ". w" + week + "";
}

function startDate() {
}

function stopDate() {
}

function getAlarm() {
  queueDraw(60000);
  var Sched = require("sched");
  var alarms = Sched.getAlarms();
  //console.log(alarms);
  var now = new Date();
  var currentTime = (now.getHours()*3600000)+(now.getMinutes()*60000)+(now.getSeconds()*1000);  
  var next = alarms.filter(a=>a.on).sort((a,b)=>Sched.getTimeToAlarm(a)-Sched.getTimeToAlarm(b));
  //console.log(next);
  if (next.length == 0) {
    return "-:-";
  }
  var time = Sched.getTimeToAlarm(next[0]);
  if (time > 3600000) {
    return Sched.formatTime(time).replace(":", "h");
  }
  time = parseInt(time / 1000);
  var min = parseInt(time / 60);
  if (time > 300) {
    return min + "min";
  }
  queueClear();
  queueDraw(1000);
  if (time > 60) {
    return min +  ":" + ("0" + (time - min * 60)).substr(-2);
  }
  return time + "s";}

function startAlarm() {
  //require("sched").reload();
}

function stopAlarm() {
}

var mag = null;
function getCompass() {
  queueDraw(1000);
  clearStatus();
  mag = Bangle.getCompass();
  if (mag && !isNaN(mag.heading)) {
    setStatus(parseInt(mag.heading) + "°");
    switch (parseInt((mag.heading + 22.5) / 45)) {
      case 0:
        return "N";
      case 1:
        return "NE";
      case 2:
        return "E";
      case 3:
        return "SE";
      case 4:
        return "S";
      case 5:
        return "SW";
      case 6:
        return "W";
      case 7:
        return "NW";
      default:
        return parseInt(mag.heading) + "°";
    }
    //return "" + parseInt(mag.heading) + "°";
  }
  return "--°";  
}

function startCompass() {
  Bangle.setCompassPower(true, appId);
  /*
  Bangle.on('mag',function(m) {
    mag = m;
    redraw();
  });
  */
}

function stopCompass() {
  Bangle.setCompassPower(false, appId);
  Bangle.removeAllListeners('mag');
  queueClear();
}

var MESSAGES = [];
function getMusic() {
  queueDraw(60000);
  if (MESSAGES == null) {
    return "error";
  }
  if (!Array.isArray(MESSAGES)) MESSAGES=[]; 
  clearStatus();
  var music = "--";
  for (var i in MESSAGES) {
    var msg = MESSAGES[i];
    if (msg.id == "music") {
      music = msg.track;
      setStatus(msg.artist.substring(0, 10));
      console.log(msg);
      break;
    }
  }
  //console.log(MESSAGES);
  return music;
}

function startMusic() {
  try {
  MESSAGES = require("Storage").readJSON("messages.json",1)||[];
  }
  catch (e) {
    console.log(e);
    MESSAGES = null;
  }
}

function stopMusic() {
}

function getMessage() {
  queueDraw(60000);
  if (MESSAGES == null) {
    return "error";
  }
  if (!Array.isArray(MESSAGES)) MESSAGES=[]; 
  clearStatus();
  for (var i in MESSAGES) {
    var msg = MESSAGES[i];
    if (msg.src && msg.title && msg.new) {
      console.log(msg);
      setStatus(msg.src.substring(0, 10));
      return msg.title;
    }
  }
  //console.log(MESSAGES);
  return "--";
}

function startMessage() {
  startMusic();
}

function stopMessage() {
}

function touchMessage() {
  if (!Array.isArray(MESSAGES)) MESSAGES=[]; 
  for (var i in MESSAGES) {
    var msg = MESSAGES[i];
    if (msg.src && msg.title && msg.new) {
      msg.new = false;
      require("Storage")
        .writeJSON("messages.json",MESSAGES);
      redraw();
      return;
    }
  }
}

var status = null;//{text:"test",fg:"#00ff00", bg:"#ff0000"};
function setStatus(text, fg, bg) {
  status = {
    text: text,
    fg: fg,
    bg: bg
  };
  //redraw();
}

function clearStatus() {
  status = null;
  //redraw();
}

// schedule a draw for the next minute
function queueDraw(duration) {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    redraw();
  }, duration - (Date.now() % duration));
}

function queueClear() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = undefined;
}  

var values = ["Date", "Seconds", "Alarm", "Steps", "HeartRate", "Compass", "Altitude", "AltitudeDiff", "Temp", "GpsAltitude", "Speed", "Battery", "Music", "Message"];
var valueIndex = 0;

function draw(index) {
  var x = g.getWidth()/2;
  var y = 3 * g.getHeight()/5;
  var dateHeight = g.getHeight() / 3.1;
  var valueHeight = g.getHeight() / 5.6;
  var statusHeight = g.getHeight() / 7.7;
  var statusBottom = g.getHeight() - 24;

  g.reset();
  //clear status
  g.clearRect(0, statusBottom - statusHeight, g.getWidth(), statusBottom);
  // work out locale-friendly date/time
  var date = new Date();
  var timeStr = require("locale").time(date,1);
  var valueStr = this["get" + values[index]]();
  // draw time
  g.setFontAlign(0,1);
  g.setFont("Vector", dateHeight);
  if (g.setFontLato) {
    g.setFontLato();
    dateHeight = 60;
  }
  g.clearRect(0,y-dateHeight,g.getWidth(),y);
  g.drawString(timeStr,x,y);
  // draw value
  if (valueStr.length < 8) {
    g.setFontAlign(0,-1).setFont("Vector",valueHeight);
    g.clearRect(0,y,g.getWidth(),y+valueHeight);
    g.drawString(valueStr,x,y);
  }
  else {
    g.setFontAlign(0,-1).setFont("Vector",24);
    if (g.setFontLatoSmall) {
      g.setFontLatoSmall();
    }
    g.clearRect(0,y,g.getWidth(),y+valueHeight);
    g.setFontAlign(-1,-1);
    g.drawString(valueStr,30,y);
  }

  g.reset();
  if (status && status.bg) {
    g.setBgColor(status.bg);
  }
  if (status) {
    if (status.fg) {
      g.setColor(status.fg);
    }
    g.setFontAlign(1,1).setFont("Vector", statusHeight);
    if (g.setFontLatoSmall) {
      g.setFontLatoSmall();
    }
    g.drawString(status.text, g.getWidth()-statusHeight / 4, statusBottom);
  }
  
  g.reset();
  var img = this[values[valueIndex] + "Icon"];
  if (img) {
    g.drawImage(img, 0, y);
  }
}

function redraw() {
  draw(valueIndex);
}

function handleNext(cb) {
  if (cb != 0) {
    clearStatus();
    this["stop" + values[valueIndex]]();
    if (cb < 0) {
      valueIndex--;
      valueIndex = valueIndex < 0 ? values.length - 1: valueIndex;
    }
    else {
      valueIndex++;
      valueIndex = valueIndex >= values.length ? 0: valueIndex;
    }
    this["start" + values[valueIndex]]();
    redraw();
  }
  saveSettings();
}

const settingsFileName = "valueclock.json";
function loadSettings() {
  var settings = 
      require("Storage").readJSON(settingsFileName);
  //console.log(settings);
  valueIndex = settings.valueIndex;
  lastGPS = settings.lastGPS;
  altShift = settings.altShift;
}

function saveSettings() {
  var settings = {
    valueIndex: valueIndex,
    lastGPS: lastGPS,
    altShift: altShift
  };
  console.log("Write settings:" + 
          require("Storage").writeJSON(settingsFileName, settings));
}

try {
  require("f_lato").add(Graphics);
  require("f_latosmall").add(Graphics);
}
catch (e) {
  console.log(e);
}

loadSettings();

// Clear the screen once, at startup
g.clear();

this["start" + values[valueIndex]]();


// Stop updates when LCD is off, restart when on
Bangle.on('lcdPower',on=>{
  if (on) {
    console.log("start");
    this["start" + values[valueIndex]]();
    draw(valueIndex); // draw immediately, queue redraw
  } else { // stop draw timer
    console.log("stop");
    this["stop" + values[valueIndex]]();
  }
});
// Show launcher when middle button pressed
Bangle.setUI("clock", cb => {
  handleNext(cb);
});
Bangle.on("swipe", cb => {
  handleNext(-cb);
});
Bangle.on("touch", (btn, xy) => {
  if (this["touch" + values[valueIndex]]) {
    this["touch" + values[valueIndex]](xy);
  }
});
Bangle.on("kill", saveSettings);
// Load widgets
Bangle.loadWidgets();
Bangle.drawWidgets();

var HeartRateIcon = atob("GRmBAAAAAAAAAAAAAAB4PAD+P4DB8GDAcBhgEAwgAAIQAAEIAACGAADDAABgwABgYAAwGAAwBgAwAYAwAGAwABxwAAdwAADgAAAgAAAAAAAAAAA=");
var BatteryIcon = atob("GRmBAAAAAAAAAAAAAAAAAAAAAAAAAAD//8H///DAAAxv8Ae3+AP7/AG9/gDe/wBvf4A/v8AewAAMf//8D//8AAAAAAAAAAAAAAAAAAAAAAAAAAA=");
var StepsIcon = atob("GBiBAAAAAAAAAAAAwAAB4AAB4AA4wAD+AAHPAAEPgAAfgAAe+AA8+AA8AAAeAAAOAA/nAA/DAAAHAAAGAAAGAAAMAAAEAAAAAAAAAA==");
var AltitudeIcon = atob("GRmBAAAAAAAAAAAwAAA4AAA2AAARgwAYw8AYMyAIDZgMB4YMAYGEAGBAAAAAAAAAAAAAAAAAP//+AAAAAAAAB///wAAAAAAAAAAAAAAAAAAAAAA=");
var GpsAltitudeIcon = atob("GRmBAAAAAAAAAAAAAwAAAwAAAQDgAAB4AgBmAwAxgwAQaAAIHwAEB4ACAcABAGAAwBgAIAYAGAGABgBgAYAYAHAcAB/4AAHwAAAAAAAAAAAAAAA=");
var TempIcon = atob("GRmBAAAAAAAAAAAfAAAcwAAMIAAEGAACDAABBgAAmwAATYAAJsAAE2AACbAABNgAAmwAAzMAAzmAAb5AAN8gAGcwABgYAAY4AAH4AAAAAAAAAAA=");
var SpeedIcon = atob("GRmBAAAAAAAAAAA/wABweABgDgBggYBgAkAgAzAwAwgQAwYIAwMEgw2CAADBAABgwAAgYAAwGwCYDAAYA4AYAP/4AAAAAAAAAAAAAAAAAAAAAAA=");
var CompassIcon = atob("GRmBAAAAAAAAAAAAAAAHwAAP+AAcRwAcccAMOGAMPhgEHwQGH8MDH/GBj/jAxgxgYYwwEEQQDDYYAw4YAcccAHEcAA/4AAHwAAAAAAAAAAAAAAA=");
var AlarmIcon = atob("GRmBAAAAAAAAAAAHAAADgAABwAAD8AADjgADAYABgMABgDAAwBgAYAwAMAYAGAMADAGABgDAAwBgAYAwAcAYAP/+AAHAAADgAABwAAAAAAAAAAA=");
var AltitudeDiffIcon = atob("GRmBAAAAAAAAAAAAAAAAD4AAB8AAAwAAAYAAAMAAD+AABgAAAwAAAYAAD8AAB+AAAgAAAQAAAIAAD8AAB+AAAwAAAYAAAMAAAAAAAAAAAAAAAAA=");
var MusicIcon = atob("GRmBAAAAAAAAAAAAAAAAHAAA/wAD4IADAMABB+AA/xAAeAgAIAQAEAIACAEABACAAgPAAQPgD4MQDMGIBiDMAxA8APgAADgAAAAAAAAAAAAAAAA=");
var MessageIcon = atob("GRmBAAAAAAAAAAAAAAP//4P//+HAAHDwAHhOAOQhgOIQccEIHcCEA4BCAAAhAAAQgAAIQAAEIAACEAABDAABh///wAAAAAAAAAAAAAAAAAAAAAA=");

var oldGB = global.GB;
function myGB(event) {
  console.log(event);
  oldGB(event);
  startMusic();
  redraw();
}
global.GB = myGB;

// draw immediately at first, queue update
redraw();

/*
require("Storage").write("valueclock.info",{
  "id":"valueclock",
  "name":"Value Clock",
  "type":"clock",
  "src":"valueclock.app.js",
  "icon":"valueclock.img"
});
*/
