if (!global.WIDGETS) {
  WIDGETS = {};
  var isTest = true;
}
(function(){
  const WIDGET_ID = "widbat_ch";  
  Bangle.on('charging',function(charging) {
    if(charging) Bangle.buzz();
    Bangle.drawWidgets(); // re-layout widgets
    g.flip();
  });
  var batteryInterval = Bangle.isLCDOn() ? setInterval(()=>WIDGETS[WIDGET_ID].draw(), 60000) : undefined;
  Bangle.on('lcdPower', function(on) {
    if (on) {
      WIDGETS[WIDGET_ID].draw();
      // refresh once a minute if LCD on
      if (!batteryInterval)
        batteryInterval = setInterval(()=>WIDGETS[WIDGET_ID].draw(), 60000);
    } else {
      if (batteryInterval) {
        clearInterval(batteryInterval);
        batteryInterval = undefined;
      }
    }
  });
  WIDGETS[WIDGET_ID]={
    area:"tr",
    width:40,
    draw:function() {
      var s = 39;
      var x = this.x, y = this.y;
      g.reset();
      g.setColor(g.theme.fg).fillRect(x,y+2,x+s-4,y+21).clearRect(x+2,y+4,x+s-6,y+19).fillRect(x+s-3,y+10,x+s,y+14);
      g.setColor("#0f0");
      var bat = E.getBattery();
      //bat = 10;
      /*
      if (bat < 40) {
        var c = bat - 15;
        g.setColor(1 - c / 25.0, c / 25.0, 0);
      }
      */
      if (bat < 30) {
        g.setColor("#f80");
      }
      if (bat < 15) {
        g.setColor("#f00");
      }
      if (Bangle.isCharging()) {
        g.setColor("#44f")
      }
      g.fillRect(x+4,y+6,x+4+bat*(s-12)/100,y+17);
    }
  };
})()
if (global.isTest) {
  Bangle.drawWidgets();
}
