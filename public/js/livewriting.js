

/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global define */
(function ($) {
    "use strict";
    var getUrlVars =  function(){
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for(var i = 0; i < hashes.length; i++)
            {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        },
        getUrlVar =  function(name){
            return getUrlVars()[name];
        },
        getChar = function (event) {
          if (event.which == null) {
            return String.fromCharCode(event.keyCode) // IE
          } else if (event.which!=0 && event.charCode!=0) {
            return String.fromCharCode(event.which)   // the rest
          } else {
            return null // special key
          }
        },
        getCursorPosition = function () {
            var el = this,
                pos = {};
            if ('selectionStart' in el) {
                pos[0] = el.selectionStart;
                pos[1] = el.selectionEnd;
            } else if ('selection' in document) {
                // have not checked in IE browsers 
                el.focus();
                var Sel = document.selection.createRange(),
                    SelLength = document.selection.createRange().text.length;
                Sel.moveStart('character', -el.value.length);
                pos[0] = Sel.text.length - SelLength;
                pos[1] = Sel.text.length - SelLength;
            }
            return pos;
        },
        keyPressFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position. 
            */
            var timestamp = (new Date()).getTime() - this.startTime,
                pos = this.getCursorPosition(),
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
     //           keycode = getChar(ev),
                index = this.liveWritingJsonData.length;
            this.liveWritingJsonData[index] = {"type":"keypress", "timestamp":timestamp, "keycode":keycode, "startposition":pos[0], "endposition":pos[1] };
            console.log("key pressed:" + this.liveWritingJsonData[index].toString() );
        },
        mouseUpFunc = function (ev) {
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length;
            this.liveWritingJsonData[index] = {"type":"mouseUp", "timestamp":timestamp, "startposition":pos[0], "endposition":pos[1]};
            console.log(this.name + " mouse pressed at (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        cutFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.startTime;
            //var startPos = object.selectionStart;
            //var endPos = object.selectionEnd;
            var pos = this.getCursorPosition();
            var str = this.value.substr(pos[0], pos[1] - pos[0]);
            console.log("cut event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        pasteFunc =  function(ev){
            var timestamp = (new Date()).getTime()- this.startTime;
            //var startPos = object.selectionStart;
            //var endPos = object.selectionEnd;
            var pos = this.getCursorPosition();
            console.log("paste event :" + ev.clipboardData.getData('text/plain') + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        playFunc= function(it, articleid){
            it.focus();
            console.log(it.name);
            $.post("play", JSON.stringify({"aid":articleid}), function(response, textStatus, jqXHR) {
                console.log(it.name + "play response recieved:\n" + jqXHR.responseText);
                var data=JSON.parse(jqXHR.responseText);
                var currTime = (new Date()).getTime();
                setTimeout(function(){
                    it.triggerPlay(data,startTime,currTime);
                },data[0]['timestamp']);
                var startTime = currTime + data[0]['timestamp'];
                console.log("1start:" + startTime + " time: "+ currTime  + " interval:" + data[0]['timestamp']+ " currentData:",JSON.stringify(data[0]));

            }, "text")
            .fail(function( jqXHR, textStatus, errorThrown) {
                alert( "play failed: " + jqXHR.responseText );
            });
        }, 
        triggerPlayFunc =  function(data, startTime, prevTime){
            var it = this;
            var currentTime = (new Date()).getTime(), 
                event = data[0];
                
            // do somethign here!
            
            if (event['type'] == "keypress"){
                //IE support
                var selectionStart =event['startposition'];
                var selectionEnd = event['endposition'];
                var myValue = String.fromCharCode(event['keycode']);
                // IE support
               
                if ( selectionStart == it.value.length){
                    it.value = it.value + myValue;   
                }//MOZILLA and others
                else {
                     if (document.selection) {
                        it.focus();
                        sel = document.selection.createRange();
                        sel.text = myValue;
                    }else{
                        it.value = it.value.substring(0, selectionStart)
                            + myValue
                            + it.value.substring(selectionEnd, it.value.length);
                    }
                }
            }
            data.splice(0,1);
            if (data.length==0){
            console.log("done at " + currentTime);
                return;
            }
            var nextEventInterval = startTime + data[0]["timestamp"] -  currentTime; 
            var actualInterval = currentTime - prevTime;
            console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));
            setTimeout(function(){it.triggerPlay(data,startTime,currentTime);}, nextEventInterval);
//              setTimeout(function(){self.triggerPlay(data,startTime);}, 1000);
        };
    
    $.fn.extend({
        postData :function (){
            var it = $(this)[0];
            if (it.liveWritingJsonData.length==0){
                alert("I know you feel in vain but do not have anythign to store yet. ");
                return;
            }
            alert("posting!");
            // Send the request
            $.post("post", JSON.stringify(it.liveWritingJsonData), function(response, textStatus, jqXHR) {
                alert("post response recieved:" + response + ":" + jqXHR.responseText);
            }, "text")
            .fail(function() {
                alert( "post failed" );
            });
        },
        lwtextarea: function (options) {
            var defaults = {
                name: "Default live writing textarea",
                startTime: null,
                stateMouseDown: false
            },
            settings =  $.extend(defaults, options);
            //Iterate over the current set of matched elements
            var it = $(this)[0];
            
            it.name  = settings.name;
            it.startTime = settings.startTime = (new Date()).getTime();
            console.log("starting time:" + settings.startTime);
            it.onkeypress = keyPressFunc;
            it.onmouseup = mouseUpFunc;
            it.onpaste = pasteFunc;
            it.oncut = cutFunc;
         //   it.postData = postFunc;
            it.play = playFunc;
            it.triggerPlay = triggerPlayFunc;
            it.liveWritingJsonData = [];

            //code to be inserted here
            it.getCursorPosition = getCursorPosition;
            if ($(this).length>1)
            {
                alert("Please, have only one textarea in a page");
            }
            var aid = getUrlVar('aid');
            if (aid){
                it.play(it,aid);
            }
            return it;
        }
    });
}(jQuery));
