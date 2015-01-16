

/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global define */
(function ($) {
    "use strict";
     
    var DEBUG = false,
        nonTypingKey={
        BACKSPACE:8,
        TAB:9,
        ENTER:13,
        SHIFT:16,
        CTRL:17,
        ALT:18,
        PAUSE_BREAK:19,
        CAPS_LOCK:20,
        ESCAPE: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT_ARROW: 37,
        UP_ARROW: 38,
        RIGHT_ARROW: 39,
        DOWN_ARROW: 40,
        INSERT: 45,
        DELETE: 46},
        getUrlVars =  function(){
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
        setCursorPosition = function(input, selectionStart, selectionEnd) {
            if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(selectionStart, selectionEnd);
            }
            else if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', selectionEnd);
                range.moveStart('character', selectionStart);
                range.select();
            }
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
        keyUpFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position. 
            */
           
            var timestamp = (new Date()).getTime() - this.startTime,
                pos = this.getCursorPosition(),
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
     //           keycode = getChar(ev),
                index = this.liveWritingJsonData.length;
            if (keycode==nonTypingKey["BACKSPACE"])
                this.liveWritingJsonData[index] = {"p":"keypress", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            else if (keycode==nonTypingKey["LEFT_ARROW"]
                    ||keycode==nonTypingKey["RIGHT_ARROW"]
                    ||keycode==nonTypingKey["UP_ARROW"]
                    ||keycode==nonTypingKey["DOWN_ARROW"])
                this.liveWritingJsonData[index] = {"p":"keypress", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("key up:" + keycode );
            if(DEBUG){
                $("#keyup_debug").html(keycode);
                $("#keyup_debug").effect("highlight", {}, 500);
            }
        },
        keyDownFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position. 
            */
           
            var timestamp = (new Date()).getTime() - this.startTime,
                pos = this.getCursorPosition(),
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
     //           keycode = getChar(ev),
                index = this.liveWritingJsonData.length;
         
            if(DEBUG)console.log("key down:" + keycode );
            if(DEBUG){
                $("#keydown_debug").html(keycode);
                $("#keydown_debug").effect("highlight", {}, 500);
            }   
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
            this.liveWritingJsonData[index] = {"p":"keypress", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("key pressed:" + keycode );
            if(DEBUG){
                $("#keypress_debug").html(keycode);
                $("#keypress_debug").effect("highlight", {}, 500);
            }        
        },
        mouseUpFunc = function (ev) {
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length;
            this.liveWritingJsonData[index] = {"p":"mouseUp", "t":timestamp, "s":pos[0], "e":pos[1]};
            if(DEBUG)console.log(this.name + " mouse pressed at (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        cutFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.startTime;
            //var startPos = object.selectionStart;
            //var endPos = object.selectionEnd;
            var pos = this.getCursorPosition();
            var str = this.value.substr(pos[0], pos[1] - pos[0]);
            if(DEBUG)console.log("cut event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        pasteFunc =  function(ev){
            var timestamp = (new Date()).getTime()- this.startTime;
            //var startPos = object.selectionStart;
            //var endPos = object.selectionEnd;
            var pos = this.getCursorPosition();
            if(DEBUG)console.log("paste event :" + ev.clipboardData.getData('text/plain') + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
         
        triggerPlayFunc =  function(data, startTime, prevTime,playback){
            var it = this;
            var currentTime = (new Date()).getTime(), 
                event = data[0];
                
            // do somethign here!
            var selectionStart =event['s'];
            var selectionEnd = event['e'];
            it.focus();
            // if selection is there. 
            if (selectionStart != selectionEnd){ //
                // do selection
                    // Chrome / Firefox
                    if(typeof(it.selectionStart) != "undefined") {
                        it.selectionStart = selectionStart;
                        it.selectionEnd = selectionEnd;
                    }

                    // IE
                    if (document.selection && document.selection.createRange) {
                        it.select();
                        var range = document.selection.createRange();
                        it.collapse(true);
                        it.moveEnd("character", selectionEnd);
                        it.moveStart("character", selectionStart);
                        it.select();
                    }           

            }


            // deal with selection 
           if (event['p'] == "keypress"){
                
               var keycode = event['k'];
               var myValue = String.fromCharCode(keycode);
                if (keycode ==nonTypingKey["BACKSPACE"]){// backspace
                    it.value = it.value.substring(0, selectionStart)
                            + it.value.substring(selectionEnd+1, it.value.length);                           setCursorPosition(it, selectionStart, selectionStart);
                }
                else if (keycode==nonTypingKey["LEFT_ARROW"]
                    ||keycode==nonTypingKey["RIGHT_ARROW"]
                    ||keycode==nonTypingKey["UP_ARROW"]
                    ||keycode==nonTypingKey["DOWN_ARROW"]){
                    // do nothing. 
                    setCursorPosition(it, selectionStart, selectionEnd);

                }
                else { // this is actual letter input
                    
                    //IE support
                    if (document.selection) {
                        it.focus();
                        sel = document.selection.createRange();
                        sel.text = myValue;
                    }else{
                        it.value = it.value.substring(0, selectionStart)
                            + myValue
                            + it.value.substring(selectionEnd, it.value.length);
                    }
                    setCursorPosition(it, selectionEnd+1, selectionEnd+1);
                }
                // put cursor at the place where you just added a letter. 

            }
            
            data.splice(0,1);
            if (data.length==0){
                if(DEBUG)console.log("done at " + currentTime);
                return;
            }
            var nextEventInterval = startTime + data[0]["t"]/playback -  currentTime; 
            var actualInterval = currentTime - prevTime;
            if(DEBUG)console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));
            setTimeout(function(){it.triggerPlay(data,startTime,currentTime,playback);}, nextEventInterval);
//              setTimeout(function(){self.triggerPlay(data,startTime);}, 1000);
        }, 
        createLiveWritingTextArea= function(it, options){
                var defaults = {
                    name: "Default live writing textarea",
                    startTime: null,
                    stateMouseDown: false, 
                    writeMode: null,
                    readMode:null,
                    noDataMsg:"I know you feel in vain but do not have anythign to store yet. ",
                    leaveWindowMsg:'You haven\'t finished your post yet. Do you want to leave without finishing?'
                },
                settings =  $.extend(defaults, options);
                //Iterate over the current set of matched elements

                it.name  = settings.name;
                it.startTime = settings.startTime = (new Date()).getTime();
                if(DEBUG)console.log("starting time:" + settings.startTime);

                
                it.triggerPlay = triggerPlayFunc;
                it.liveWritingJsonData = [];
              

                //code to be inserted here
                it.getCursorPosition = getCursorPosition;
                
                var aid = getUrlVar('aid');
                if (aid){ // read mode
                    
                    playbackData(it, aid);     
                    it.writemode = false;
                    if(settings.readMode != null)
                        settings.readMode();
                    // TODO handle user input? 
                    //preventDefault ?
                    //http://forums.devshed.com/javascript-development-115/stop-key-input-textarea-566329.html
                }
                else
                {
                    it.onkeyup = keyUpFunc;
                    it.onkeypress = keyPressFunc;
                    it.onkeydown = keyDownFunc
                    it.onmouseup = mouseUpFunc;
                    it.onpaste = pasteFunc;
                    it.oncut = cutFunc;
                    it.writemode = true;
                    if(settings.writeMode != null)
                        settings.writeMode();
                     $(window).onbeforeunload = function(){
                        return setting.levaeWindowMsg;
                    };
                }
            
                if(DEBUG==true)
                    $( "body" ).append("<div><table><tr><td>keyDown</td><td>keyPress</td><td>keyUp</td></tr><tr><td><div id=\"keydown_debug\"></div></td><td><div id=\"keypress_debug\"></div></td><td><div id=\"keyup_debug\"></div></td></tr></table></div>");
        }, 
        postData = function(it, url, respondFunc){
            if (it.liveWritingJsonData.length==0){
                    alert(settings.noDataMsg);
                    return;
                }

                // see https://github.com/panavrin/livewriting/blob/master/json_file_format
                var data = {};
                data["version"] = 1;
                data["playback"] = 1; // playback speed
                data["data"] = it.liveWritingJsonData;
                // Send the request
                $.post(url, JSON.stringify(data), function(response, textStatus, jqXHR) {
                    var data=JSON.parse(jqXHR.responseText);
                    if (respondFunc)
                        respondFunc(true, data["aid"]);
                    $(window).onbeforeunload = false;

                }, "text")
                .fail(function(response, textStatus, jqXHR) {
                                    var data=JSON.parse(jqXHR.responseText);

                    if (respondFunc)
                        respondFunc(false,data);
                });
        }, 
        playbackData = function(it,articleid){
            it.focus();
            if(DEBUG)console.log(it.name);
            $.post("play", JSON.stringify({"aid":articleid}), function(response, textStatus, jqXHR) {
                var json_file=JSON.parse(jqXHR.responseText);
                var version = json_file["version"];
                var playback = (json_file["playback"]?json_file["playback"]:1);
                var data=json_file["data"];
                if(DEBUG)console.log(it.name + "play response recieved in version("+version+")\n" + jqXHR.responseText);

                var currTime = (new Date()).getTime();
                setTimeout(function(){
                    it.triggerPlay(data,currTime,currTime,playback);
                },data[0]['t']/playback);
                var startTime = currTime + data[0]['t'];
                if(DEBUG)console.log("1start:" + startTime + " time: "+ currTime  + " interval:" + data[0]['t']/playback+ " currentData:",JSON.stringify(data[0]));

            }, "text")
            .fail(function( jqXHR, textStatus, errorThrown) {
                alert( "play failed: " + jqXHR.responseText );
            });
        };
        
    
    $.fn.extend({
    //    postData :function (url, respondFunc){
      //      var it = $(this)[0];
    //    },
        livewritingtextarea: function (message, option1, option2) {
            if (typeof(message) != "string"){
                alert("livewriting textarea need a string message");
                return;
            }
            var it = $(this)[0];
            
            if (it == null || typeof(it) == "undfined"){
                alert("no object found for livewritingtexarea");
            }

            if (message =="reset"){
                it.startTime =  (new Date()).getTime();
            }
            else if (message == "create"){
                
                if (typeof(option1) != "array" ||typeof(option1) != "undefined" ){
                    alert
                }
                if ($(this).length>1)
                {
                    alert("Please, have only one textarea in a page");
                }
                createLiveWritingTextArea(it, option1);
                
            }
            else if (message == "post"){
                if(typeof(option1) != "string"){
                    alert( "you have to specify url "+ option1);
                    return;
                }
                
                if(typeof(option2) != "function" || option2 == null){
                    alert( "you have to specify a function that will run when server responded. "+ option2);
                    return;
                }
                
                var url = option1,
                    respondFunc = option2;
                
                postData(it, url, respondFunc);
                
            }
            else if (message == "play"){
                
                if (typeof(option1)!="string")
                {
                    alert("Unrecogniazble article id:"+aid);
                    return;
                }
                
                var articleid = option1;
                var it = $(this)[0];
                playbackData(it, articleid);
            }
            return;
            
        }
    });
}(jQuery));
