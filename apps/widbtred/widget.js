WIDGETS["widbtred"]={area:"tr",width:19,draw:function() {
  g.reset();
  g.clearRect(this.x, this.y, this.x+19, this.y+24);  
  if (NRF.getSecurityStatus().connected)
    g.setColor((g.getBPP()>8) ? "#07f" : (g.theme.dark ? "#0ff" : "#00f"));
  else {
    //g.setBgColor("#f00");
    g.setColor("#f00");
    g.fillEllipse(this.x+1, this.y+1, this.x + 18, this.y + 23);
    g.setColor("#fff");
  }
  //g.drawImage(atob("CxQBBgDgFgJgR4jZMawfAcA4D4NYybEYIwTAsBwDAA=="),4+this.x,2+this.y);
 g.drawImage(atob("CxaBAAABgDgHgNgZsxtmPYPgOAcB8HsbNmMMwbA8BwDAAAA="),4+this.x,1+this.y);
 },changed:function() {
  WIDGETS["widbtred"].draw();
}};
NRF.on('connect',WIDGETS["widbtred"].changed);
NRF.on('disconnect',WIDGETS["widbtred"].changed);
