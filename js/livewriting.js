

/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global define */
(function ($) {
    "use strict";
   
    
    $.fn.extend({
        lwtextarea: function (options) {
            var defaults = {
                name:"Default live writing textarea",
                startTime: null,
                stateMouseDown: false,
                getCursorPosition: function() {
                    var el = this;
                    var pos = 0;
                    if('selectionStart' in el) {
                        pos = el.selectionStart;
                    } else if('selection' in document) {
                        el.focus();
                        var Sel = document.selection.createRange();
                        var SelLength = document.selection.createRange().text.length;
                        Sel.moveStart('character', -el.value.length);
                        pos = Sel.text.length - SelLength;
                    }
                    return pos;
                },
                keyPressFunc: function (ev) {
                    /*
                    record keyCode, timestamp, cursor caret position. 
                    */
                    var keycode = (ev.keyCode ? ev.keyCode : ev.which),
                        timestamp = (new Date()).getTime(); 
                   //     str = String.fromCharCode(ev.which);
                   // console.log("key pressed:" + str + ","+ ev.which + " time:" + timestamp);
                    console.log("key pressed:" +keycode + " time:" + timestamp);
                },
                mouseUpFunc: function (ev) {
                    var timestamp = (new Date()).getTime();
                    //var startPos = object.selectionStart;
                    //var endPos = object.selectionEnd;
                  //  this.stateMouseDown = false;
                    console.log("mouse pressed at " + this.getCursorPosition() + " "  + " time:" + timestamp);
                }, 
                cutFunc: function(ev){
                    var timestamp = (new Date()).getTime();
                    //var startPos = object.selectionStart;
                    //var endPos = object.selectionEnd;
                    console.log("cut event"  + " time:" + timestamp);
                }, 
                pasteFunc: function(ev){
                    var timestamp = (new Date()).getTime();
                    //var startPos = object.selectionStart;
                    //var endPos = object.selectionEnd;
                    console.log("paste event"  + " time:" + timestamp);
                }
            },
                settings =  $.extend(defaults, options);
            //Iterate over the current set of matched elements
            return this.each(function (index) {
                var it = $(this)[index];
                it.name  = settings.name;
                settings.startTime = (new Date()).getTime();
                console.log("starting time:" + settings.startTime);
                it.onkeypress = settings.keyPressFunc;
                it.onmouseup = settings.mouseUpFunc;
                it.onpaste = settings.pasteFunc;
                it.oncut = settings.cutFunc;
                //code to be inserted here
                it.getCursorPosition = settings.getCursorPosition
                return it;
            });
        }
    });
}(jQuery));
