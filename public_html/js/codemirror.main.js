 

$(document).ready(function () {
    function cursorAct(cm){
        console.log("cursorAct : " + cm.getSelection());
    }
    
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true, 
        
    });
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
    var choice = document.location.search &&
           decodeURIComponent(document.location.search.slice(1));
    
    if (choice) {
        input.value = choice;
        editor.setOption("theme", choice);
    }
    
    var evalSelection = function(){
        var selectedCode = editor.getSelection();
        eval(selectedCode);
    }
    
    var evalAndStore = function(){
        editor.livewritingtextarea("userinput",{"type":"eval"});
        evalSelection();
    }
    
    var clearAndStore = function(){
        editor.livewritingtextarea("userinput",{"type":"clear"});
        eval("Gibber.clear();");
    }
    
    editor.livewritingtextarea("register", evalSelection);
    
    editor.setOption("extraKeys", {
      "Ctrl-Enter": evalAndStore,
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
