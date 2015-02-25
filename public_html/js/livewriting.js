

/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global define */
(function ($) {
    "use strict";
     
    var DEBUG = true,
        randomcolor = [ "#c0c0f0", "#f0c0c0", "#c0f0c0", "#f090f0", "#90f0f0", "#f0f090"],
        keyup_debug_color_index=0,
        keydown_debug_color_index=0,
        keypress_debug_color_index=0,
        mouseup_debug_color_index=0,
        nonTypingKey={// this keycode is from http://css-tricks.com/snippets/javascript/javascript-keycodes/
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
        isCaretMovingKey = function(keycode){
            return (keycode == nonTypingKey["LEFT_ARROW"]
                    ||keycode==nonTypingKey["RIGHT_ARROW"]
                    ||keycode==nonTypingKey["UP_ARROW"]
                    ||keycode==nonTypingKey["DOWN_ARROW"]
                    ||keycode==nonTypingKey["HOME"]
                    ||keycode==nonTypingKey["END"]
                    ||keycode==nonTypingKey["PAGE_UP"]
                    ||keycode==nonTypingKey["PAGE_DOWN"]);
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
            if (isCaretMovingKey(keycode))
                this.liveWritingJsonData[index] = {"p":"keyup", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
        //    if(DEBUG)console.log("key up:" + keycode );
            if(DEBUG){
                $("#keyup_debug").html(keycode);
                $("#start_up_debug").html(pos[0]);
                $("#end_up_debug").html(pos[1]);
                
                keyup_debug_color_index++;
                keyup_debug_color_index%=randomcolor.length;
                $("#keyup_debug").css("background-color", randomcolor[keyup_debug_color_index]);
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
            if (keycode==nonTypingKey["BACKSPACE"])
                this.liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            else if (keycode==nonTypingKey["DELETE"])
                this.liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            else if (isCaretMovingKey(keycode))
                this.liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":keycode, "s":pos[0], "e":pos[1] };
            
            if(DEBUG)console.log("key down:" + keycode );
            if(DEBUG){
                $("#keydown_debug").html(keycode);
                $("#start_down_debug").html(pos[0]);
                $("#end_down_debug").html(pos[1]);
                
                keydown_debug_color_index++;
                keydown_debug_color_index%=randomcolor.length;
                $("#keydown_debug").css("background-color", randomcolor[keydown_debug_color_index]);
            }   
        },
        keyPressFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position. 
            */
           
            var timestamp = (new Date()).getTime() - this.startTime,
                pos = this.getCursorPosition(),
                charCode = String.fromCharCode(ev.charCode),
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
                index = this.liveWritingJsonData.length;
            this.liveWritingJsonData[index] = {"p":"keypress", "t":timestamp, "k":keycode, "c":charCode, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("key pressed:" + charCode );
            if(DEBUG){
                $("#keypress_debug").html(keycode + "," + charCode);
                $("#start_press_debug").html(pos[0]);
                $("#end_press_debug").html(pos[1]);
                keypress_debug_color_index++;
                keypress_debug_color_index%=randomcolor.length;
                $("#keypress_debug").css("background-color", randomcolor[keypress_debug_color_index]);;            }        
        },
        mouseUpFunc = function (ev) {
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
            this.liveWritingJsonData[index] = {"p":"mouseUp", "t":timestamp, "s":pos[0], "e":pos[1]};
            if(DEBUG)console.log(this.name + " mouse pressed at (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
            
           // if(DEBUG)console.log("key pressed:" + keycode );
            if(DEBUG){
                $("#mouseup_debug").html(str);
                $("#start_mouseup_debug").html(pos[0]);
                $("#end_mouseup_debug").html(pos[1]);
                mouseup_debug_color_index++;
                mouseup_debug_color_index%=randomcolor.length;
                $("#mouseup_debug").css("background-color", randomcolor[keypress_debug_color_index]);;            } 
        }, 
        scrollFunc = function(ev){
            var timestamp = (new Date()).getTime()- this.startTime,
                index = this.liveWritingJsonData.length;
              
            if(DEBUG)console.log("scroll event :" + this.scrollTop + " time:" + timestamp);
            this.liveWritingJsonData[index] = {"p":"scroll", "t":timestamp, "h":this.scrollTop, "s":0, "e":0};
        },
        dragStartFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
                if(DEBUG)console.log("dragstart event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
            this.dragAndDrop = !this.dragAndDrop;
            this.dragStartPos = pos[0];
            this.dragEndPos = pos[1];
            
        },
        dragEndFunc =  function(ev){
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
                if(DEBUG)console.log("dragEnd event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
                this.dragAndDrop = !this.dragAndDrop;
                this.liveWritingJsonData[index] = {"p":"draganddrop", "t":timestamp, "r":str, "s":pos[0], "e":pos[1], "ds":this.dragStartPos , "de":this.dragEndPos };
        },
        dropFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
                if(DEBUG)console.log("drop event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
            if (!this.dragAndDrop)ev.preventDefault(); // disable drop from outside the textarea
            
        },
        cutFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
            this.liveWritingJsonData[index] = {"p":"cut", "t":timestamp, "r":str, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("cut event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        pasteFunc =  function(ev){
             var timestamp = (new Date()).getTime()- this.startTime,
                pos = this.getCursorPosition(),
                index = this.liveWritingJsonData.length,
                str = ev.clipboardData.getData('text/plain');
            this.liveWritingJsonData[index] = {"p":"paste", "t":timestamp, "r":str, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("paste event :" + ev.clipboardData.getData('text/plain') + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }, 
        triggerPlayFunc =  function(data, startTime, prevTime){
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
                var charvalue = event['c'];
                if (it.version <= 1){
                    charvalue = String.fromCharCode(keycode);
                }

               if (charvalue != "undefined"){ // this is actual letter input
                    
                    //IE support
                    if (document.selection) {
                        it.focus();
                        sel = document.selection.createRange();
                        sel.text = charvalue;
                    }else{
                        it.value = it.value.substring(0, selectionStart)
                            + charvalue
                            + it.value.substring(selectionEnd, it.value.length);
                    }
                    setCursorPosition(it, selectionEnd+1, selectionEnd+1);
                }
                else{
                   console.log("unreachable state occured!");
                   if(DEBUG)
                       alert("unreachable state occured!");
                }
                // put cursor at the place where you just added a letter. 

            }
            else if (event['p'] == "keyup" || event['p'] == "keydown"){
                var keycode = event['k'];

                if (keycode ==nonTypingKey["BACKSPACE"]){// backspace
                    if (it.version == 0){
                        it.value = it.value.substring(0, selectionStart)
                                    + it.value.substring(selectionEnd+1, it.value.length);                           
                        setCursorPosition(it, selectionStart, selectionStart)
                    }
                    else{
                        if ( selectionStart == selectionEnd){
                            selectionStart--;
                        }
                        it.value = it.value.substring(0, selectionStart)
                                + it.value.substring(selectionEnd, it.value.length);
                        setCursorPosition(it, selectionStart, selectionStart)
                    };
                }
                else if (keycode==nonTypingKey["DELETE"]){
                    if ( selectionStart == selectionEnd){
                        selectionEnd++;
                    }
                    it.value = it.value.substring(0, selectionStart)
                        + it.value.substring(selectionEnd, it.value.length);
                    setCursorPosition(it, selectionStart, selectionStart)
                }
                else if (isCaretMovingKey(keycode)){
                    // do nothing. 
                    setCursorPosition(it, selectionStart, selectionEnd);
                }
            }else if (event['p'] == "cut"){
                it.value = it.value.substring(0, selectionStart)
                                + it.value.substring(selectionEnd, it.value.length);
                setCursorPosition(it, selectionStart, selectionStart)
            }else if (event['p'] == "paste"){
                it.value = it.value.substring(0, selectionStart)
                                +event['r']+ it.value.substring(selectionEnd, it.value.length);
                setCursorPosition(it, selectionEnd + event['r'].length, selectionEnd + event['r'].length);
            }
            else if (event['p'] == "draganddrop"){
                it.value = it.value.substring(0, event['ds'])
                                + it.value.substring(event['de'], it.value.length);
                
                it.value = it.value.substring(0, selectionStart)
                                +event['r']+ it.value.substring(selectionStart, it.value.length);
                setCursorPosition(it, selectionStart, selectionEnd);
            }
            else if (event['p'] == "scroll"){
                it.scrollTop = event['h']
            }
            
            data.splice(0,1);
            if (data.length==0){
                if(DEBUG)console.log("done at " + currentTime);
                return;
            }
            var nextEventInterval = startTime + data[0]["t"]/it.playback -  currentTime; 
            var actualInterval = currentTime - prevTime;
            if(DEBUG)console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));
          
           if(it.selectionStart == it.selectionEnd) {
              //it.scrollTop = it.scrollHeight;
            //   var e = $.Event( "mouseup", { which: 1 } );
               // Triggers it on the body.
              // it.trigger(e);
           }
            setTimeout(function(){it.triggerPlay(data,startTime,currentTime);}, nextEventInterval);
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
                    it.onscroll = scrollFunc;
                    it.ondragstart = dragStartFunc;
                    it.ondragend = dragEndFunc;
                    it.ondrop = dropFunc;
                    it.writemode = true;
                    it.dragAndDrop = false;
                    if(settings.writeMode != null)
                        settings.writeMode();
                     $(window).onbeforeunload = function(){
                        return setting.levaeWindowMsg;
                    };
                }
            
                if(DEBUG==true)
                    $( "body" ).append("<div><table><tr><td>name</td><td>keyDown</td><td>keyPress</td><td>keyUp</td><td>mouseUp</td></tr><tr><td>keycode</td><td><div id=\"keydown_debug\"></div></td><td><div id=\"keypress_debug\"></div></td><td><div id=\"keyup_debug\"></div></td><td><div id=\"mouseup_debug\"></div></td></tr><tr><td>start</td><td><div id=\"start_down_debug\"></div></td><td><div id=\"start_press_debug\"></div></td><td><div id=\"start_up_debug\"></div></td><td><div id=\"start_mouseup_debug\"></div></td></tr><tr><td>end</td><td><div id=\"end_down_debug\"></div></td><td><div id=\"end_press_debug\"></div></td><td><div id=\"end_up_debug\"></div></td><td><div id=\"end_mouseup_debug\"></div></td></tr></table></div>");
        }, 
        postData = function(it, url, respondFunc){
            if (it.liveWritingJsonData.length==0){
                    alert(settings.noDataMsg);
                    return;
                }

                // see https://github.com/panavrin/livewriting/blob/master/json_file_format
                var data = {};
                
                data["version"] = 2;
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
                it.version = json_file["version"];
                it.playback = (json_file["playback"]?json_file["playback"]:1);
                var data=json_file["data"];
                if(DEBUG)console.log(it.name + "play response recieved in version("+it.version+")\n" + jqXHR.responseText);

                var currTime = (new Date()).getTime();
                setTimeout(function(){
                    it.triggerPlay(data,currTime,currTime);
                },data[0]['t']/it.playback);
                var startTime = currTime + data[0]['t']/it.playback;
                if(DEBUG)console.log("1start:" + startTime + " time: "+ currTime  + " interval:" + data[0]['t']/it.playback+ " currentData:",JSON.stringify(data[0]));

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
