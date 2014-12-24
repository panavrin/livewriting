/*jslint browser: true*/
/*global $, jQuery, alert*/

var xTriggered = 0;
$(document).ready(function () {
    "use strict";
    $("#livetext").focus();
    $("#livetext").attr("spellcheck", false);
    
    $("#livetext").lwtextarea({name: "Sang's first run"});
    //console.log(lw.name + " is ready.");
    //console.log($(lw).name + " is ready2.");
    $("#postdata").button().click(function(){
        $("#livetext").postData();
    });
    
    
});