    /*
   (c) Copyright 2014-2015  Sang Won Lee sangwonlee717@gmail.com
   All rights reserved.
*/

/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global define */
(function ($) {
    "use strict";

    var DEBUG = false,
        INSTANTPLAYBACK = false,
        randomcolor = [ "#c0c0f0", "#f0c0c0", "#c0f0c0", "#f090f0", "#90f0f0", "#f0f090"],
        keyup_debug_color_index=0,
        keydown_debug_color_index=0,
        keypress_debug_color_index=0,
        mouseup_debug_color_index=0,
        double_click_debug_color_index=0,
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
        getCursorTextAreaPosition = function () {
            var el = this,
                pos = {};
            if (typeof el.selectionStart == "number" &&
                typeof el.selectionEnd == "number") {
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
        keyUpTextareaFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position.
            */
            //ev.trigger();
            var timestamp = (new Date()).getTime() - this.lw_startTime,
                keycode = getChar(ev),
                index = this.lw_liveWritingJsonData.length;


            if (keycode==nonTypingKey["BACKSPACE"]|| keycode==nonTypingKey["DELETE"]){

                var prevKeyDown = index-1;
                if (this.lw_liveWritingJsonData[prevKeyDown]["p"] == "keydown" && this.lw_liveWritingJsonData[prevKeyDown]["k"] == keycode){
                    this.lw_liveWritingJsonData[prevKeyDown]["s"] = ev.srcElement.selectionStart; // this is needed for double click selection which eat-up extra space.
                    this.lw_liveWritingJsonData[prevKeyDown]["keyup_fixed"] = true
                }
                this.lw_liveWritingJsonData[index-1]["s"] = ev.srcElement.selectionStart; // this is needed for double click selection which eat-up extra space.
            }

            if(DEBUG){
                $("#keyup_debug").html(keycode);
                $("#start_up_debug").html(ev.srcElement.selectionStart);
                $("#end_up_debug").html(ev.srcElement.selectionEnd);

                keyup_debug_color_index++;
                keyup_debug_color_index%=randomcolor.length;
                $("#keyup_debug").css("background-color", randomcolor[keyup_debug_color_index]);
            }
        },
        dblclickTextareaFunc = function(ev){
            var timestamp = (new Date()).getTime() - this.lw_startTime,
            pos = this.lw_getCursorTextAreaPosition(),
            keycode = (ev.keyCode ? ev.keyCode : ev.which),
            index = this.lw_liveWritingJsonData.length;

            if(DEBUG){
                $("#double_click_debug").html(keycode);
                $("#start_double_click_debug").html(pos[0]);
                $("#end_double_click_debug").html(pos[1]);

                double_click_debug_color_index++;
                double_click_debug_color_index%=randomcolor.length;
                $("#double_click_debug").css("background-color", randomcolor[double_click_debug_color_index]);
            }
        },
        keyDownTextareaFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position.
            */
        //    ev.preventDefault();
            var timestamp = (new Date()).getTime() - this.lw_startTime,
                it = this,
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
                index = this.lw_liveWritingJsonData.length,
                siStart = 0,
                siEnd=0;
            it.lw_keyDownState = true;

            if (typeof(ev.srcElement.selectionStart) != "undefined" && typeof(ev.srcElement.selectionEnd) != "undefined" ){
                siStart = ev.srcElement.selectionStart;
                siEnd = ev.srcElement.selectionEnd;
            }
            else{
                pos = this.lw_getCursorTextAreaPosition();
                siStart = pos[0];
                siEnd = pos[1]
            }

            if (ev.metaKey === true || ev.ctrlKey === true) {
                if (keycode === 89) {
                    //fire your custom redo logic
                        this.lw_REDO_TRIGGER = true;
                }
                else if (keycode === 90) {
                 //special case (CTRL-SHIFT-Z) does a redo (on a mac for example)
                    if (ev.shiftKey === true) {
                    //fire your custom redo logic
                        this.lw_REDO_TRIGGER = true;
                    }
                    else {
                    //fire your custom undo logic
                        this.lw_UNDO_TRIGGER = true;
                    }
                }
                else if (keycode ===65) { // this is select All command.
                    this.lw_liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":nonTypingKey["UP_ARROW"], "s":0, "e":this.value.length };
                }
                if(DEBUG) console.log ("undo:" + this.lw_UNDO_TRIGGER + ", redo:" + this.lw_REDO_TRIGGER);
                this.lw_mostRecentValue = this.value;
                return;
            }
            it.lw_prevSelectionStart = siStart;
            it.lw_prevSelectionEnd = siEnd;

            if (keycode==nonTypingKey["BACKSPACE"]|| keycode==nonTypingKey["DELETE"]){
                this.lw_liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":keycode, "s":siStart, "e":siEnd };
                if(DEBUG)console.log("key down:" +  JSON.stringify(this.lw_liveWritingJsonData[index]) ) ;
            }
            else if (isCaretMovingKey(keycode)){ // for caret moving key, we want to know the position of the cursor after the event occurs.
                var that=this;
                setTimeout(function(){// this is because cursor position is not yet updated.
                    var pos_temp = that.lw_getCursorTextAreaPosition();
                    that.lw_liveWritingJsonData[index] = {"p":"keydown", "t":timestamp, "k":keycode, "s":pos_temp[0], "e":pos_temp[1] };
                    if(DEBUG)console.log("key down:" +  JSON.stringify(that.lw_liveWritingJsonData[index]) ) ;

                },0);
            }
            else{
                if(DEBUG)console.log("key down: (not logged) - (" +  ev.srcElement.selectionStart + "," + ev.srcElement.selectionEnd + ")") ;
            }
            if(DEBUG)console.log("key down:" + keycode );
            if(DEBUG){
                $("#keydown_debug").html(keycode);
                $("#start_down_debug").html(siStart);
                $("#end_down_debug").html(siEnd);

                keydown_debug_color_index++;
                keydown_debug_color_index%=randomcolor.length;
                $("#keydown_debug").css("background-color", randomcolor[keydown_debug_color_index]);
            }

        },
        keyPressTextareaFunc= function (ev) {
            /*
            record keyCode, timestamp, cursor caret position.
            */

            var timestamp = (new Date()).getTime() - this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                charCode = String.fromCharCode(ev.charCode),
                keycode = (ev.keyCode ? ev.keyCode : ev.which),
                index = this.lw_liveWritingJsonData.length;
            if(keycode == 13) charCode = "\n";
             if (ev.metaKey === true || ev.ctrlKey === true)
            // undo/redo/select all are taken care of at keyDownTextareaFunc
                return
            // I am not sure why carrige return would not work for string concatenation.
            // for example "1" + "\r" + "2" gives me "12" instead of "1\r2"
            this.lw_liveWritingJsonData[index] = {"p":"keypress", "t":timestamp, "k":keycode, "c":charCode, "s":pos[0], "e":pos[1] };
            if(DEBUG)console.log("key pressed :" + JSON.stringify(this.lw_liveWritingJsonData[index]) );
            if(DEBUG){
                $("#keypress_debug").html(keycode + "," + charCode);
                $("#start_press_debug").html(pos[0]);
                $("#end_press_debug").html(pos[1]);
                keypress_debug_color_index++;
                keypress_debug_color_index%=randomcolor.length;
                $("#keypress_debug").css("background-color", randomcolor[keypress_debug_color_index]);;            }
        },
        mouseUpTextareaFunc = function (ev) {
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                index = this.lw_liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
            this.lw_liveWritingJsonData[index] = {"p":"mouseUp", "t":timestamp, "s":pos[0], "e":pos[1]};
            if(DEBUG)console.log("mouseup: " + JSON.stringify(this.lw_liveWritingJsonData[index]));

            if(DEBUG){
                $("#mouseup_debug").html(str);
                $("#start_mouseup_debug").html(pos[0]);
                $("#end_mouseup_debug").html(pos[1]);
                mouseup_debug_color_index++;
                mouseup_debug_color_index%=randomcolor.length;
                $("#mouseup_debug").css("background-color", randomcolor[mouseup_debug_color_index]);;            }
        },
        scrollTextareaFunc = function(ev){
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                index = this.lw_liveWritingJsonData.length;

            if(DEBUG)console.log("scroll event :" + this.scrollTop + " time:" + timestamp);
            this.lw_liveWritingJsonData[index] = {"p":"scroll", "t":timestamp, "h":this.scrollTop, "s":0, "e":0};
        },
        dropStartTextareaFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                index = this.lw_liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
            if(DEBUG)console.log("dragstart event (" + this.lw_dragAndDrop + "):" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
            this.lw_dragAndDrop = !this.lw_dragAndDrop;
            this.lw_dragStartPos = pos[0];
            this.lw_dragEndPos = pos[1];

        },
        dropEndTextareaFunc =  function(ev){
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                index = this.lw_liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
                if(DEBUG)console.log("dragEnd event (" + this.lw_dragAndDrop + "):" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
                this.lw_dragAndDrop = !this.lw_dragAndDrop;
                this.lw_liveWritingJsonData[index] = {"p":"draganddrop", "t":timestamp, "r":str, "s":pos[0], "e":pos[1], "ds":this.lw_dragStartPos , "de":this.lw_dragEndPos };
        },
        dropTextareaFunc= function(ev){
            ev.preventDefault(); // disable drop from outside the textarea
            alert("LiveWritingAPI: Drag and drop in the textarea is disabled by the livewriting api.")
        },
        cutTextareaFunc= function(ev){
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                index = this.lw_liveWritingJsonData.length,
                str = this.value.substr(pos[0], pos[1] - pos[0]);
            this.lw_liveWritingJsonData[index] = {"p":"cut", "t":timestamp, "r":str, "s":pos[0], "e":pos[1] };
            this.lw_CUT_TRIGGER = true;
            if(DEBUG)this.lw_liveWritingJsonData[index]["v"] = this.value;
            if(DEBUG)console.log("cut event :" + str + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        },
        pasteTextareaFunc =  function(ev){
             var timestamp = (new Date()).getTime()- this.lw_startTime,
                pos = this.lw_getCursorTextAreaPosition(),
                index = this.lw_liveWritingJsonData.length,
                str = ev.clipboardData.getData('text/plain');
            this.lw_liveWritingJsonData[index] = {"p":"paste", "t":timestamp, "r":str, "s":pos[0], "e":pos[1] };
            this.lw_PASTE_TRIGGER = true;
            if(DEBUG)this.lw_liveWritingJsonData[index]["v"] = this.value;
            if(DEBUG)console.log("paste event :" + ev.clipboardData.getData('text/plain') + " (" + pos[0] + ":" + pos[1] + ")"  + " time:" + timestamp);
        }
        ,
        userinputTextareaFunc = function(userinput_number,options){
            var it = this; // this should be editor
            var timestamp = (new Date()).getTime()-it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            it.lw_liveWritingJsonData[index] = {"p":"i", "t":timestamp, "n": userinput_number, "d":options};
        },
        inputTextareaFunc = function(ev){
            var timestamp = (new Date()).getTime()- this.lw_startTime,
                index = this.lw_liveWritingJsonData.length,
                siStart = 0,
                siEnd = 0;

            if(DEBUG) console.log("inputTextareaFunc : s - " + ev.srcElement.selectionStart + " e - " + ev.srcElement.selectionEnd);

            if (typeof(ev.srcElement.selectionStart) != "undefined" && typeof(ev.srcElement.selectionEnd) != "undefined" ){
                siStart = ev.srcElement.selectionStart;
                siEnd = ev.srcElement.selectionEnd;
            }
            else{
                pos = this.lw_getCursorTextAreaPosition();
                siStart = pos[0];
                siEnd = pos[1]
            }
            var currentValue = this.value;

            // this logic is based on the assumption that the undo/redo event is either addition or deletion.
            // if there is a compositie undo/redo event that contains both deletion and additoin, this will not work.

            if (this.lw_UNDO_TRIGGER || this.lw_REDO_TRIGGER || this.lw_keyDownState == false){
                if (DEBUG&& !this.lw_keyDownState) console.log("lw_keyDownState is false.");
                var startIndex = 0,
                    endIndex = 1;
                if(DEBUG) console.log("loop start");
                while( typeof(currentValue[startIndex]) != "undfined" && currentValue[startIndex] == this.lw_mostRecentValue[startIndex] &&startIndex < currentValue.length&&startIndex < currentValue.length ){
                    startIndex++;
                }
                while(currentValue[currentValue.length - endIndex] == this.lw_mostRecentValue[this.lw_mostRecentValue.length - endIndex]
                    && this.lw_mostRecentValue.length - endIndex>startIndex&& currentValue.length - endIndex>startIndex){
                    endIndex++;
                }
                if(DEBUG) console.log("loop end");
                endIndex--;
                if ( this.lw_mostRecentValue.length - endIndex < startIndex){
                    if(DEBUG) alert ("this cannot be happen, unless it exactly the same.");
                }
                var str = currentValue.substring(startIndex, currentValue.length - endIndex);
                this.lw_liveWritingJsonData[index] = {"p":"input", "t":timestamp, "r":str, "ps":startIndex , "pe":this.lw_mostRecentValue.length - endIndex, "cs": siStart, "ce":siEnd};
                if(DEBUG)this.lw_liveWritingJsonData[index]["v"] = currentValue;
                if(DEBUG)this.lw_liveWritingJsonData[index]["pv"] = this.lw_mostRecentValue;
                if(DEBUG)console.log("input2 :" + JSON.stringify(this.lw_liveWritingJsonData[index]) );

            }
            else if (this.lw_PASTE_TRIGGER){
                // see if the last newline char is removed.
                if ( this.lw_liveWritingJsonData[index-1]["p"] == "paste")
                {
                    if (this.lw_liveWritingJsonData[index-1]["r"].length + this.lw_mostRecentValue.length
                        == currentValue.length+1
                        && this.lw_mostRecentValue[this.lw_mostRecentValue.length-1] == "\n")
                    {
                        this.lw_liveWritingJsonData[index-1]["n"] = true;
                    }
                }
                else{
                    if (DEBUG) alert("LiveWritingAPI: lw_PASTE_TRIGGER is true but the most recent trigger is not paste")
                }
            }
            else if (this.lw_CUT_TRIGGER){
                if ( this.lw_liveWritingJsonData[index-1]["p"] == "cut")
                {
                    // see if the cut function also removed the last newline character in the previous line.
                    if (this.lw_liveWritingJsonData[index-1]["s"] != siStart)
                    {
                        this.lw_liveWritingJsonData[index-1]["s"] = siStart;
                    }
                }
                else{
                    if (DEBUG) alert("LiveWritingAPI: lw_PASTE_TRIGGER is true but the most recent trigger is not paste for some reason. :( ")
                }
            }

            this.lw_UNDO_TRIGGER = false;
            this.lw_REDO_TRIGGER = false;
            this.lw_PASTE_TRIGGER = false;
            this.lw_CUT_TRIGGER = false;
            this.lw_keyDownState = false;

            this.lw_mostRecentValue = currentValue;
        },
        // the following function is for codemirror only.
        changeCodeMirrorFunc = function(cm, changeObject){
            var it = cm.getDoc().getEditor();
            var timestamp = (new Date()).getTime()- it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            delete changeObject.removed; // to reduce data
            it.lw_liveWritingJsonData[index] = {"p":"c", "t":timestamp, "d":changeObject};
            it.lw_justAdded = true;
            if(DEBUG)console.log("change event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        },
        changeAceFunc = function(event, editor){
            var it = editor;
            var timestamp = (new Date()).getTime()- it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            if (event.action == "remove") delete event.lines; // to reduce data
            it.lw_liveWritingJsonData[index] = {"p":"c", "t":timestamp, "d":event};
            if(DEBUG)console.log("change event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        },
        viewPortchangeCodeMirrorFunc= function(cm,from,to){// this is only for codemirror /
            var it = cm.getDoc().getEditor();
            var timestamp = (new Date()).getTime()- it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            var scrollinfo = cm.getScrollInfo();
            it.lw_liveWritingJsonData[index] = {"p":"s", "t":timestamp, "f":scrollinfo.left, "to":scrollinfo.top};
            if(DEBUG)console.log("viewPortChange event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        }
        ,scrollLeftAceFunc = function(editor, number){
            var it = editor;
            var timestamp = (new Date()).getTime()- it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            it.lw_liveWritingJsonData[index] = {"p":"s", "t":timestamp, "n":number, "y":"left"};
            if(DEBUG)console.log("viewPortChange event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        }
        ,scrollTopAceFunc = function(editor, number){
            var it = editor;
            var timestamp = (new Date()).getTime()- it.lw_startTime,
                index = it.lw_liveWritingJsonData.length;
            it.lw_liveWritingJsonData[index] = {"p":"s", "t":timestamp, "n":number, "y":"top"};
            if(DEBUG)console.log("viewPortChange event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        },
        cursorAceFunc = function(event, editor){
          var it = editor;
          var timestamp = (new Date()).getTime()- it.lw_startTime,
              index = it.lw_liveWritingJsonData.length;
          it.lw_liveWritingJsonData[index] = {"p":"u", "t":timestamp, "d":editor.session.selection.getRange(), "b": editor.session.selection.isBackwards() + 0};
          if(DEBUG)console.log("change event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        },
        // the following function is for codemirror only.
        cursorCodeMirrorFunc = function(cm){

            var it = cm.getDoc().getEditor();
            if ( it.lw_justAdded ) {
                it.lw_justAdded = false; // no need to store this since change record will guide us where to put cursor.
                return;
            }
            var fromPos = cm.getDoc().getCursor("from"),
                toPos = cm.getDoc().getCursor("to");
            var timestamp = (new Date()).getTime()- it.lw_startTime ,
                index = it.lw_liveWritingJsonData.length;
            it.lw_liveWritingJsonData[index] = {"p":"u", "t":timestamp, "s":fromPos, "e":toPos};

            if(DEBUG)console.log("cursor event :" +JSON.stringify(it.lw_liveWritingJsonData[index])  + " time:" + timestamp);
        },
        triggerPlayCodeMirrorFunc = function(data, startTime, prevTime){
            var it = this;
            var currentTime = (new Date()).getTime(),
                event = data[0];
            it.getDoc().getEditor().focus();
            if(DEBUG) console.log(JSON.stringify(event));
            if (event['p'] == "c"){ // change in content
                var inputData    = event['d'];
                var startLine = inputData['from']['line'],
                    startCh = inputData['from']['ch'],
                    endLine = inputData['from']['line'],
                    endCh = inputData['from']['ch'],
                    text = inputData['text'].join('\n'),
                    inputType = inputData['origin '];
                it.getDoc().setSelection(inputData['from'], inputData['to'], {scroll:true});
                it.getDoc().replaceSelection(text);

            }
            else if (event['p'] == "u"){ // cursor change
                it.getDoc().setSelection(event['s'], event['e'], {scroll:true});
            }
            else if (event['p'] == "i"){ //  user input
                var number = (event['n'] ? event['n'] : 0)
                // TODO : run error handling (in case it is not registered. )
                it.userInputRespond[number](event['d']);
            }
            else if (event['p'] == "s"){ // scroll
                it.scrollTo(event["f"], event["to"]);
            }
            data.splice(0,1);
            if (data.length==0){
                if(DEBUG)console.log("done at " + currentTime);
                if ( it.lw_finaltext != it.getValue())
                {

                    console.log("There is discrepancy. Do something");
                    if(DEBUG) alert("LiveWritingAPI: There is discrepancy. Do something" + it.finaltext +":"+ it.getValue());
                }
                return;
            }
            // scheduling part
            var nextEventInterval = startTime + data[0]["t"]/it.lw_playback -  currentTime;
            var actualInterval = currentTime - prevTime;
            if(DEBUG)console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));

            if (INSTANTPLAYBACK) nextEventInterval =0;
            setTimeout(function(){it.lw_triggerPlay(data,startTime,currentTime);}, nextEventInterval);
        },
        triggerPlayAceFunc =  function(data, startTime, prevTime){
          var it = this;
          var currentTime = (new Date()).getTime(),
              event = data[0];
          it.focus();
          if(DEBUG) console.log(JSON.stringify(event));
          if (event['p'] == "c"){ // change in content

              var inputData    = event['d'];
              var startLine = inputData['start']['row'],
                  startCh = inputData['start']['column'],
                  endLine = inputData['end']['row'],
                  endCh = inputData['end']['column'];

              if (inputData.action == "insert"){ // change in content
                var textLines = inputData['lines'].join('\n');
                //it.moveCursorTo(startLine,startCh); // IDEA: PROBABLY you don't need this cuz cursor should be already there.
                it.insert(textLines);
              }else if (inputData.action == "remove"){ // change in content
                //var range = new it.lw_ace_Range(startLine, startCh,endLine, endCh );
                it.session.doc.remove(inputData);
              }
              else{
                if(DEBUG)alert("ace editor has another type of action other than \"remove\" and \"insert\": " + inputData.action);
              }

          }
          else if (event['p'] == "u"){ // cursor change
              it.session.selection.setSelectionRange(event['d'], Boolean(event['b']));
          }
          else if (event['p'] == "i"){ //  user input
              var number = (event['n'] ? event['n'] : 0)
              // TODO : run error handling (in case it is not registered. )
              it.userInputRespond[number](event['d']);
          }
          else if (event['p'] == "s"){ // scroll
              if (event["y"] == "left"){
                it.session.setScrollLeft(event["n"]);
              }else if (event["y"] == "top")
              {
                it.session.setScrollTop(event["n"]);
              }
              else{
                if(DEBUG) alert("unknown scorll type for ace editor: " +event["y"] )
              }
          }
          data.splice(0,1);
          if (data.length==0){
              if(DEBUG)console.log("done at " + currentTime);
              if ( it.lw_type == "codemirror")
              {
                  if ( it.lw_finaltext != it.getValue())
                  {

                      console.log("There is discrepancy. Do something");
                      if(DEBUG) alert("LiveWritingAPI: There is discrepancy. Do something" + it.finaltext +":"+ it.getValue());
                  }
              }
              return;
          }
          // scheduling part
          var nextEventInterval = startTime + data[0]["t"]/it.lw_playback -  currentTime;
          var actualInterval = currentTime - prevTime;
          if(DEBUG)console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));


          if (INSTANTPLAYBACK) nextEventInterval =0;
          setTimeout(function(){it.lw_triggerPlay(data,startTime,currentTime);}, nextEventInterval);
        }
        ,triggerPlayTextareaFunc =  function(data, startTime, prevTime){
            var it = this;
            var currentTime = (new Date()).getTime(),
                event = data[0];

            // do somethign here!
            var selectionStart =event['s'];
            var selectionEnd = event['e'];
            if (DEBUG && selectionStart > selectionEnd)
                alert("LiveWritingAPI: selectionStart > selectionEnd("+ selectionStart + "," + selectionEnd + ")");

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
                 //   console.log("keycode:" + keycode + " charvalue:" + charvalue);
                    //IE support
                    if(keycode == 13) charvalue = "\n"; // only happens for the stuff befroe version 2

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
                if ( it.version <= 1) {
                   if (keycode ==nonTypingKey["BACKSPACE"]  ){// backspace
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

                }
                // put cursor at the place where you just added a letter.

            }
            else if ( event['p'] == "keydown"){
                var keycode = event['k'];
                if (keycode ==nonTypingKey["BACKSPACE"]){// backspace

                    if ( selectionStart == selectionEnd){
                        selectionStart--;
                    }

                    it.value = it.value.substring(0, selectionStart)
                            + it.value.substring(selectionEnd, it.value.length);
                    setCursorPosition(it, selectionStart, selectionStart)

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

            }
            else if (event['p'] == "input"){
                //{"p":"input", "t":timestamp, "r":str, "s":startIndex , "e":this.lw_mostRecentValue.length - endIndex, "cs": siStart, "ce":siEnd, "v":currentValue};
                selectionStart = event['ps'];
                selectionEnd = event['pe'];
                var prevV = it.value;
                var str = event['r'];
                it.value = it.value.substring(0, selectionStart)
                        + str + it.value.substring(selectionEnd);
                setCursorPosition(it, event['cs'], event['ce']);

                if (DEBUG && it.value.localeCompare(event['v']) !=0 )
                    console.log("DIFFERENT REPLAY");

            }
            else if (event['p']=="snapshot"){
                it.value = event['v'];
            }
            else if (event['p'] == "cut"){
                var prevV = it.value
                it.value = it.value.substring(0, selectionStart)
                                + it.value.substring(selectionEnd, it.value.length);
                setCursorPosition(it, selectionStart, selectionStart)
                if (DEBUG && prevV.localeCompare(event['v']) !=0 )
                    console.log("DIFFERENT REPLAY");
            }else if (event['p'] == "paste"){
                var prevV = it.value
                it.value = it.value.substring(0, selectionStart)
                                +event['r']+ it.value.substring(selectionEnd, it.value.length);
                setCursorPosition(it, selectionEnd + event['r'].length, selectionEnd + event['r'].length);
                if (event["n"]){
                    if (DEBUG&& it.value[it.value.length-1] != "\n"){
                        alert("LiveWritingAPI: new line char cannot be removed in paste event. ");
                    }
                    it.value = it.value.substring(0,it.value.length-1);
                }
                if (DEBUG && prevV.localeCompare(event['v']) !=0 )
                    console.log("DIFFERENT REPLAY");
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
            else if (event['p'] == "userinput" || event['p'] == "i"){
                it.userInputRespond[event['n']](event['d']);
            }
            else if (event['p'] == "mouseUp")
            {
                setCursorPosition(it, selectionStart, selectionEnd);
            }

            data.splice(0,1);
            if (data.length==0){
                if(DEBUG)console.log("done at " + currentTime);
                if (it.version >=3 && it.finaltext != it.value){
                    console.log("There is discrepancy. Do something");
                    if(DEBUG) alert("LiveWritingAPI: There is discrepancy. Do something" + it.finaltext +":"+ it.value);
                }
                return;
            }
            var nextEventInterval = startTime + data[0]["t"]/it.lw_playback -  currentTime;
            var actualInterval = currentTime - prevTime;
            if(DEBUG)console.log("start:" + startTime + " time: "+ currentTime+ " interval:" + nextEventInterval + " actualInterval:" + actualInterval+ " currentData:",JSON.stringify(data[0]));

           if(it.selectionStart == it.selectionEnd) {
              //it.scrollTop = it.scrollHeight;
            //   var e = $.Event( "mouseup", { which: 1 } );
               // Triggers it on the body.
              // it.trigger(e);
           }
            if (INSTANTPLAYBACK) nextEventInterval =0;
            setTimeout(function(){it.lw_triggerPlay(data,startTime,currentTime);}, nextEventInterval);
//              setTimeout(function(){self.triggerPlay(data,startTime);}, 1000);
        },
        createNavBar = function(it, type){
          if(DEBUG)console.log("create Navigation Bar");
          /*
          TODO : only codemirror is tested.
          */
          if ( type == "codemirror"){
            $('.CodeMirror').after("<div class = 'livewriting_navbar'></div>");
            var navbar = $('.livewriting_navbar');
            navbar.append("<div class = 'livewriting_slider'></div>");
            var slider  =   $('.livewriting_slider').slider();
            navbar.css("position", "relative");
            navbar.css("bottom", "100px");
            navbar.css("width", "80%");
            navbar.css("left", "10%");

          }
        },
        createLiveWritingTextArea= function(it, type, options, initialValue){
                var defaults = {
                    name: "Default live writing textarea",
                    startTime: null,
                    stateMouseDown: false,
                    writeMode: null,
                    readMode:null,
                    noDataMsg:"I know you feel in vain but do not have anything to store yet. ",
                    leaveWindowMsg:'You haven\'t finished your post yet. Do you want to leave without finishing?'
                };
                it.lw_settings =  $.extend(defaults, options);
                //Iterate over the current set of matched elements
                it.lw_type = type;
                it.lw_startTime = (new Date()).getTime();
                if(DEBUG)console.log("starting time:" + it.lw_startTime);
                if(type == "codemirror")
                    it.lw_triggerPlay = triggerPlayCodeMirrorFunc;
                else if (type == "textarea")
                    it.lw_triggerPlay = triggerPlayTextareaFunc;
                else if (type == "ace"){
                    it.lw_triggerPlay = triggerPlayAceFunc;
                    it.lw_ace_Range = ace.require("ace/range").Range;
                }

                it.lw_liveWritingJsonData = [];
                it.lw_initialText = initialValue;
                it.lw_mostRecentValue = initialValue;
                it.lw_prevSelectionStart = 0;
                it.lw_prevSelectionEnd = 0;
                it.lw_keyDownState = false;
                it.lw_UNDO_TRIGGER = false;
                it.lw_REDO_TRIGGER = false;
                it.lw_PASTE_TRIGGER = false;
                it.lw_CUT_TRIGGER = false;
                //code to be inserted here
                it.lw_getCursorTextAreaPosition = getCursorTextAreaPosition;
                it.userInputRespond = {};
                var aid = getUrlVar('aid');
                if (aid){ // read mode
                    if (it.lw_type == "codemirror"){
                        if (it.options.placeholder){
                           it.setOption("placeholder","");
                        }
                    }
                  //  createNavBar(it, type );
                    playbackbyAid(it, aid);
                    it.lw_writemode = false;
                    if(it.lw_settings.readMode != null)
                        it.lw_settings.readMode();
                    // TODO handle user input?
                    //preventDefault ?
                    //http://forums.devshed.com/javascript-development-115/stop-key-input-textarea-566329.html
                }
                else
                {
                    it.lw_writemode = true;

                    if ( type == "textarea"){
                        it.onkeyup = keyUpTextareaFunc;
                        it.onkeypress = keyPressTextareaFunc;
                        it.onkeydown = keyDownTextareaFunc
                        it.onmouseup = mouseUpTextareaFunc;
                        it.onpaste = pasteTextareaFunc;
                        it.oncut = cutTextareaFunc;
                        it.onscroll = scrollTextareaFunc;
                        //it.ondragstart = dropStartTextareaFunc;
                        //it.ondragend = dropEndTextareaFunc;
                        it.ondrop = dropTextareaFunc;
                        it.ondblclick = dblclickTextareaFunc;
                        it.oninput = inputTextareaFunc;
                    }
                    else if (type == "codemirror"){
                        it.on("change", changeCodeMirrorFunc);
                        it.on("cursorActivity", cursorCodeMirrorFunc);
                        it.on("scroll", viewPortchangeCodeMirrorFunc)
                    }
                    else if (type == "ace"){
                      it.on("change", changeAceFunc);
                      it.on("changeCursor", cursorAceFunc);
                      it.on("changeSelection", cursorAceFunc);
                      it.session.on("changeScrollLeft", function(number){
                        scrollLeftAceFunc(it,number); // this is needed to pass the editor instance. by deafult it has edit session.
                      });
                      it.session.on("changeScrollTop", function(number){
                        scrollTopAceFunc(it,number); /// this is needed to pass the editor instance.by deafult it has edit session.
                      });
                    }

                    it.onUserInput = userinputTextareaFunc;
                    it.lw_writemode = true;
                    it.lw_dragAndDrop = false;
                    if(it.lw_settings.writeMode != null)
                        it.lw_settings.writeMode();
                    $(window).onbeforeunload = function(){
                        return setting.levaeWindowMsg;
                    };

                }

                if(DEBUG==true && it.lw_type=="textarea")
                    $( "body" ).append("<div><table><tr><td>name</td><td>keyDown</td><td>keyPress</td><td>keyUp</td><td>mouseUp</td><td>double click</td></tr><tr><td>keycode</td><td><div id=\"keydown_debug\"></div></td><td><div id=\"keypress_debug\"></div></td><td><div id=\"keyup_debug\"></div></td><td><div id=\"mouseup_debug\"></div></td><td><div id=\"double_click_debug\"></div></td></tr><tr><td>start</td><td><div id=\"start_down_debug\"></div></td><td><div id=\"start_press_debug\"></div></td><td><div id=\"start_up_debug\"></div></td><td><div id=\"start_mouseup_debug\"></div></td><td><div id=\"start_double_click_debug\"></div></td></tr><tr><td>end</td><td><div id=\"end_down_debug\"></div></td><td><div id=\"end_press_debug\"></div></td><td><div id=\"end_up_debug\"></div></td><td><div id=\"end_mouseup_debug\"></div></td><td><div id=\"end_double_click_debug\"></div></td></tr></table></div>");
        },
        getActionData = function(it){
            var data = {};

            data["version"] = 4;
            data["playback"] = 1; // playback speed
            data["editor_type"] = it.lw_type;
            data["initialtext"] = it.lw_initialText;
            data["action"] = it.lw_liveWritingJsonData;
            data["localEndtime"] = new Date().getTime();
            data["localStarttime"] = it.lw_startTime;

            if (it.lw_type == "textarea")
                data["finaltext"] = it.value;
            else if (it.lw_type == "codemirror")
                data["finaltext"] = it.getValue();
            return data;
        }
        ,postData = function(it, url, useroptions, respondFunc){
            if (it.lw_liveWritingJsonData.length==0){
                alert(it.lw_settings.noDataMsg);
                respondFunc(false);
                return;
            }

            // see https://github.com/panavrin/livewriting/blob/master/json_file_format
            var data = getActionData(it);
            data["useroptions"] = useroptions;
            // Send the request
            $.post(url, JSON.stringify(data), function(response, textStatus, jqXHR) {
                // Live Writing server should return article id (aid)
                if (respondFunc){
                    var receivedData=JSON.parse(jqXHR.responseText);
                    if (respondFunc)
                        respondFunc(true, receivedData["aid"]);
                    $(window).onbeforeunload = false;
                }

                $(window).onbeforeunload = false;

            }, "json")
            .fail(function(response, textStatus, jqXHR) {
                                var data=JSON.parse(jqXHR.responseText);

                if (respondFunc)
                    respondFunc(false,data);
            });
        },
        playbackbyAid = function(it, articleid, url){
            it.focus();
            url = (url ? url : "play")

            if(DEBUG)console.log(it.lw_settings.name);
            $.post(url, JSON.stringify({"aid":articleid}), function(response, textStatus, jqXHR) {
                var json_file=JSON.parse(jqXHR.responseText);
                it.lw_version = json_file["version"];
                it.lw_playback = (json_file["playback"]?json_file["playback"]:1);
                it.lw_type = (json_file["editor_type"]?json_file["editor_type"]:"textarea"); // for data before the version 3 it has been only used for textarea
                it.lw_finaltext = (json_file["finaltext"]?json_file["finaltext"]:null);
                it.lw_initialText = (json_file["initialtext"]?json_file["initialtext"]:null);
                it.value = it.lw_initialText;
                var data=json_file["action"];
                if (it.lw_version<=3)data = (data?data:json_file["data"]); // this is for data before version 3

                if(DEBUG)console.log(it.name + "play response recieved in version("+it.version+")\n" + jqXHR.responseText);

                var currTime = (new Date()).getTime();
                setTimeout(function(){
                    it.lw_triggerPlay(data,currTime,currTime);
                },data[0]['t']/it.lw_playback);
                var startTime = currTime + data[0]['t']/it.lw_playback;
                if(DEBUG)console.log("1start:" + startTime + " time: "+ currTime  + " interval:" + data[0]['t']/it.lw_playback+ " currentData:",JSON.stringify(data[0]));

            }, "text")
            .fail(function( jqXHR, textStatus, errorThrown) {
                alert("LiveWritingAPI: play failed: " + jqXHR.responseText );
            });
        },
        playbackbyJson = function(it,json_file){
            it.focus();
            if(DEBUG)console.log(it.lw_settings.name);
            it.lw_version = json_file["version"];
            it.lw_playback = (json_file["playback"]?json_file["playback"]:1);
            it.lw_type = (json_file["editor_type"]?json_file["editor_type"]:"textarea"); // for data before the version 3 it has been only used for textarea
            it.lw_finaltext = (json_file["finaltext"]?json_file["finaltext"]:null);
            it.lw_initialText = (json_file["initialtext"]?json_file["initialtext"]:null);
            it.value = it.lw_initialText;

            var data=json_file["action"];
            if (it.lw_version<=3)data = (data?data:json_file["data"]); // this is for data before version 3
            if(DEBUG)console.log(it.name + "play response recieved in version("+it.version+")\n" );

            var currTime = (new Date()).getTime();
            setTimeout(function(){
                it.lw_triggerPlay(data,currTime,currTime);
            },data[0]['t']/it.lw_playback);
            var startTime = currTime + data[0]['t']/it.lw_playback;
            if(DEBUG)console.log("1start:" + startTime + " time: "+ currTime  + " interval:" + data[0]['t']/it.lw_playback+ " currentData:",JSON.stringify(data[0]));

        };

    $.fn.extend({
    //    postData :function (url, respondFunc){
      //      var it = $(this)[0];
    //    },
        livewritingMessage: function (message, option1, option2, option3) {
            var it;

            if ($(this).length==1){
                it = $(this)[0];
            }
            else if ($(this) == Object){ // codemirror case I guess?
                it = this;
            }

            if (typeof(message) != "string"){
                alert("LiveWritingAPI: livewriting textarea need a string message");
                return it;
            }

            if (it == null || typeof(it) == "undfined"){
                alert("LiveWritingAPI: no object found for livewritingtexarea");
                return it;
            }

            if (message =="reset"){
                it.lw_startTime =  (new Date()).getTime();
            }
            else if (message == "create"){

                if (typeof(option2) != "object" &&typeof(option2) != "undefined" ){
                    alert("LiveWritingAPI: the 3rd argument should be the options array.");
                    return it;
                }
                if ( option1 != "textarea" && option1 != "codemirror" && option1 != "ace"){
                    alert("LiveWritingAPI: Creating live writing text area only supports either textarea, codemirror or ace editor. ");
                    return it;
                }
                if ($(this).length>1)
                {
                    alert("LiveWritingAPI: Please, have only one textarea in a page");
                    return it;
                }
                createLiveWritingTextArea(it, option1, option2, option3);

                return it;
            }
            else if (message == "post"){
                if(typeof(option1) != "string"){
                    alert("LiveWritingAPI: you have to specify url "+ option1);
                    return;
                }

                if(typeof(option3) != "function" || option3 == null){
                    alert("LiveWritingAPI: you have to specify a function that will run when server responded. \n"+ option2);
                    return;
                }

                var url = option1,
                    useroptions = option2,
                    respondFunc = option3;

                postData(it, url, useroptions, respondFunc);

            }
            else if (message == "play"){

                if (typeof(option1)!="string")
                {
                    alert("LiveWritingAPI: Unrecogniazble article id:"+option1);
                    return;
                }

                if (typeof(option2)!="string")
                {
                    alert("LiveWritingAPI: Unrecogniazble url address"+option2);
                    return;
                }

                var articleid = option1;

                if (it.lw_type == "codemirror"){
                    if (it.options.placeholder){
                        it.setOption("placeholder","");
                    }
                }

                playbackbyAid(it, articleid,option2);
            }
            else if (message == "playJson"){

                if (typeof(option1)!="string")
                {
                    alert("LiveWritingAPI: Unrecogniazble article id:"+aid);
                    return;
                }
                var data;
                try {
                    data = JSON.parse(option1);
                } catch (e) {
                    return false;
                }
                it.lw_writemode = false;
                it.onkeyup = null;
                it.onkeypress = null;
                it.onkeydown = null
                it.onmouseup = null;
                it.onpaste = null;
                it.oncut = null;
                it.onscroll = null;
                it.ondragstart = null;
                it.ondragend = null;
                it.ondrop = null;
                it.ondblclick = null;
                it.oninput = null;
                if (it.lw_type == "codemirror"){
                    if (it.options.placeholder){
                        it.setOption("placeholder","");
                    }
                }
                playbackbyJson(it, data);
                return;
            }
            else if (message == "registerEvent"){

                if (typeof(option1)!="string")
                {
                    alert("LiveWritingAPI: Unrecogniazble article id:"+aid);
                    return;
                }

            }
            else if (message == "userinput"){
// when user input event happens
// save the event
                if(typeof(option1) != "number" || option1 == null){
                    alert("LiveWritingAPI: you have to specify a index number of the user-input function (can be any number) that will run when user-input is done"+ option1);
                    return;
                }

                it.onUserInput(option1, option2);
            }
            else if (message == "register"){
                if(typeof(option2) != "function" || option2 == null){
                    alert("LiveWritingAPI: you have to specify a function that will run when user-input is done"+ option1);
                    return;
                }

                if(typeof(option1) != "number" || option1 == null){
                    alert("LiveWritingAPI: you have to specify a function that will run when user-input is done"+ option1);
                    return;
                }

                it.userInputRespond[option1] = option2;
            }
            else if (message == "returnactiondata"){

                return getActionData(it);
            }
            return;

        }
    });
}(jQuery));
