var scjs = require('supercolliderjs');

scjs.resolveOptions().then(function(options) {

  var SCLang = scjs.sclang;
  var lang = new SCLang(options);
  lang.boot();

  var Server = scjs.scsynth;
  var s = new Server(options);
  s.boot();

  var SCapi = scapi;
  var api = new SCapi(options);
  api.connect();

});
