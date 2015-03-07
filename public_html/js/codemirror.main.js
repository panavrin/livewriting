 

$(document).ready(function () {
    function cursorAct(cm){
        console.log("cursorAct : " + cm.getSelection());
    }
    
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true, 
        
    });
    
    editor.setSize("100%", "60%");
    
    editor.livewritingtextarea = $.fn.livewritingtextarea;
    editor.livewritingtextarea("create", "codemirror");
    
    var input = document.getElementById("select");
    var selectTheme = function () {
        var theme = input.options[input.selectedIndex].innerHTML;
        editor.setOption("theme", theme);
    }
    
    $("#select").on("change", selectTheme);
    $("#post").button().click(function(){
        editor.livewritingtextarea("post","/post",function(state, aid){
            articlelink = aid;
            alert("posted:" + articlelink);
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
        editor.livewritingtextarea("userinput",option);
        evalSelection(option);
    }
    var evalAndStoreAtNM = function(){
        var option = {"type":"eval", delay:true};
        editor.livewritingtextarea("userinput",option);
        evalSelection(option);
    }
    var clearAndStore = function(){
        editor.livewritingtextarea("userinput",{"type":"clear"});
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
