/*jslint browser: true*/
/*global $, jQuery, alert*/

var xTriggered = 0;
$(document).ready(function () {
    "use strict";
    $("#livetext").focus();
    $("#livetext").attr("spellcheck", false);
    
    /*
    make logs of 
    1. keypress
    2. mouse cursor moves
    3. select, cut, copy and paste, del
    4. 
    */
    var lw = $("#livetext").lwtextarea({name: "Sang's first run"});
    console.log(lw.get(0).name + " is ready.");
    console.log($(lw).name + " is ready2.");
});