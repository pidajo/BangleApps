WIDGETS["widbtred"]={area:"tr",width:19,draw:function() {
  g.reset();
  if (NRF.getSecurityStatus().connected)
    g.setColor((g.getBPP()>8) ? "#07f" : (g.theme.dark ? "#0ff" : "#00f"));
  else {
    g.setBgColor("#f00");
    //g.setColor(g.theme.dark ? "#666" : "#999");
    g.setColor("#fff");
  }
 g.clearRect(this.x + 1, this.y, this.x+17, this.y+25);  g.drawImage(atob("CxQBBgDgFgJgR4jZMawfAcA4D4NYybEYIwTAsBwDAA=="),4+this.x,2+this.y);
},changed:function() {
  WIDGETS["widbtred"].draw();
}};
NRF.on('connect',WIDGETS["widbtred"].changed);
NRF.on('disconnect',WIDGETS["widbtred"].changed);
