 

$(document).ready(function () {
    var resetlink = "http://localhost:2401/gibber.html";
   // var resetlink = "http://livewriting.eecs.umich.edu:2401/gibber.html";
   /// var resetlink = "http://livewriting.eecs.umich.edu/gibber.html";
    var demolink = resetlink + "?aid=OKDMWHgkDCdAmA";

    function cursorAct(cm){
        console.log("cursorAct : " + cm.getSelection());
    }
    
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true, 
        
    });
    
    editor.setSize("100%", "60%");
    
    var writeModeFunc = function(){
         $('#initial-message').bPopup({
            modalClose: false,
            opacity: 0.7,
            positionStyle: 'absolute',
            escClose :false
        });
        $("#post").show(); // show the button if write mode 
    };
    
    var readModeFunc = function(){
        $("#post").hide(); // hide the button if read mode 
    //    $("#reset").text("New");
    };
    
     $(".about").button().css({ width: '150px', margin:'5px'}).click(function(){
        var windowObjectReference = window.open(demolink,"win1");
    });
    
    editor.livewritingtextarea = $.fn.livewritingtextarea;
    editor.livewritingtextarea("create", "codemirror", {name: "Sang's first run in Gibber",   writeMode:writeModeFunc, readMode:readModeFunc});
    

    $("#start").button().css({ width: '150px', margin:'5px'}).click(function(){
        $('#initial-message').bPopup().close();
        editor.livewritingtextarea("reset");
        editor.focus();
    });
    
    $("#new").button().css({ width: '150px', margin:'5px'}).click(function(){
        window.open(resetlink, '_self');
    });

    var client = new ZeroClipboard($("#copytoclipboard"));
    client.on( "aftercopy", function( event ) {
        alert("Copied text to clipboard: " + event.data["text/plain"] );
    } );

    $("#copytoclipboard").button().css({width:'250px', margine:'5px'});
    
    $("#play").button().css({ width: '150px', margin:'5px'}).click(function(){
        var windowObjectReference = window.open(articlelink,"win2");
    });
    $("#close").button().css({ width: '150px', margin:'5px'}).click(function(){
        $('#post-complete-message').bPopup().close();
    });
    
    $("#post").button().css({ width: '150px', margin:'5px'}).click(function(){
         $('#post-message').bPopup({
            modalClose: false,
            opacity: 0.7,
            positionStyle: 'absolute',
            escClose :false
        });
        
        editor.livewritingtextarea("post","/post",function(state, aid){
           $('#post-message').bPopup().close();
            articlelink = resetlink+"?aid="+aid;
            $('#post-complete-message').bPopup({
                modalClose: false,
                opacity: 0.7,
                positionStyle: 'absolute',
                escClose :false
            });  
            $("#post-link").text(articlelink);    

            ZeroClipboard.setData( "text/plain", articlelink);
        });
    });
    
    var evalSelection = function(option){
        var selectedCode = editor.getSelection();
        
        if (selectedCode == ''){
            //alert('no selection');
            selectedCode = editor.getLine(editor.getCursor().line);
        }
        if (option.delay){
            try {
                Gibber.Clock.codeToExecute.push({code:selectedCode});
            } catch (e) {
                 
            }
        }
        else{
            try {
                eval(selectedCode);
            } catch (e) {
                
            }
        }
    }
    
    var evalAndStoreNow = function(){
        var option = {"type":"eval", delay:false};
        if(editor.lw_writemode)editor.livewritingtextarea("userinput",option);
        evalSelection(option);
    }
    
    var evalAndStoreAtNM = function(){
        var option = {"type":"eval", delay:true};
        if(editor.lw_writemode)livewritingtextarea("userinput",option);
        evalSelection(option);
    }
    
    var clearAndStore = function(){
        if(editor.lw_writemode)editor.livewritingtextarea("userinput",{"type":"clear"});
        eval("Gibber.clear();");
    }
    
    editor.livewritingtextarea("register", evalSelection);
    
    editor.setOption("extraKeys", {
      "Ctrl-Enter": evalAndStoreNow,
      "Shift-Ctrl-Enter": evalAndStoreAtNM,
      "Ctrl-.": clearAndStore
    });
    
    
   /* editor.on("cursorActivity", cursorAct);
    editor.on("keypress", keyPressFunc);
    editor.on("change", cutFunc);
    */
    
    Gibber.init();

 /*  Gibber.init()

    a = EDrums('x*ox*xo-')
    a.snare.snappy = 1

    a.fx.add( Reverb() )

    b = TorusKnot({ scale:2 }).spin(.001)

    c = Dots()
    c.scale = Master.Out
*/
});
