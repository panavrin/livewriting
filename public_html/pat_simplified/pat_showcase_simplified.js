
function ScissorVoice(noteNum, numOsc, oscType, detune){
  this.output  = new ADSR();
  this.maxGain = 1 / numOsc;
  this.noteNum = noteNum;
  this.frequency = noteNum2Freq(noteNum);
  this.oscs = [];
  for (var i=0; i< numOsc; i++){
    var osc = context.createOscillator();
    osc.type = oscType;
    osc.frequency.value = this.frequency;
    osc.detune.value = -detune + i * 2 * detune / (numOsc - 1);
    osc.start(context.currentTime);
    osc.connect(this.output.node);
    this.oscs.push(osc);
  }
}

ScissorVoice.prototype.stop = function(time){
  time =  time | context.currentTime;
  var it = this;
  setTimeout(function(){
    for (var i=0; i<it.oscs.length; i++){
        it.oscs[i].disconnect();
    }
    
  }, Math.floor((time-context.currentTime)*1000));
}

ScissorVoice.prototype.detune = function(detune){
    for (var i=0; i<this.oscs.length; i++){
        //this.oscs[i].frequency.value = noteNum2Freq(noteNum);
        this.oscs[i].detune.value -= detune;
    }

}

ScissorVoice.prototype.connect = function(target){
  this.output.node.connect(target);
}   

var context = WX._ctx;
function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function noteNum2Freq(num){
    return Math.pow(2,(num-57)/12) * 440 
}

function ADSR(){
    this.node = context.createGain();
    this.node.gain.value = 0.0;
}

ADSR.prototype.noteOn= function(delay, A,D, peakLevel, sustainlevel){
    peakLevel = peakLevel || 0.3;
    sustainlevel = sustainlevel || 0.1;
    
    this.node.gain.linearRampToValueAtTime(0.0,delay + context.currentTime);
    this.node.gain.linearRampToValueAtTime(peakLevel,delay + context.currentTime + A); // Attack
    this.node.gain.linearRampToValueAtTime(sustainlevel,delay + context.currentTime + A + D);// Decay
}

ADSR.prototype.noteOff= function(delay, R, sustainlevel){
    sustainlevel = sustainlevel || 0.1;

    this.node.gain.linearRampToValueAtTime(sustainlevel,delay + context.currentTime );// Release   
    this.node.gain.linearRampToValueAtTime(0.0,delay + context.currentTime + R);// Release   
    
}

ADSR.prototype.play= function(time, A,D,S,R, peakLevel, sustainlevel){
    this.noteOn(time,A,D, peakLevel, sustainlevel); 
    this.noteOff(time+A+D+S,R, sustainlevel); 
}


function Envelope(){
    this.node = context.createGain();
    this.node.gain.value = 1.0;
}

Envelope.prototype.noteOn= function(time, A,D,S,R){
  //  this.node.gain.linearRampToValueAtTime(0.0,context.currentTime);
   
}

function Oscillator(noteNum, type){
    this.node = context.createOscillator();
  //  this.node.connect(compressor);
    this.node.frequency.value = noteNum2Freq(noteNum);
    this.node.type = this.node.SINE;
    this.playing = false;
    if ( type != null)
    {
        this.node.type = this.node[type];
    }
}

Oscillator.prototype.play = function(time){

    this.node.start(time);
    
}


Oscillator.prototype.stop = function( time){
        this.node.stop(time);
}


window.onload = function() {
    var DEBUG = false;    
    var  randomcolor = [ "#c0c0f0", "#f0c0c0", "#c0f0c0", "#f090f0", "#90f0f0", "#f0f090"],
       keyup_debug_color_index=0,
       keydown_debug_color_index=0,
       keypress_debug_color_index=0;
    
    if (!hasGetUserMedia()) {
        alert('getUserMedia() is not supported in your browser. Please visit http://caniuse.com/#feat=stream to see web browsers available for this demo.');
    }
//
    $("#hide").click(function(){
        // remove select 
        $("#micselect").hide();
    });
    // set up forked web audio context, for multiple browsers
    // window. is needed otherwise Safari explodes

    var volume = 0;
    var freqIndex;
    
    navigator.getUserMedia = (navigator.getUserMedia ||
                              navigator.webkitGetUserMedia ||
                              navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia);
    var level_original = context.createGain();
    var level_reverb = context.createGain(); 
    var convolver = context.createConvolver();
    var reverb = context.createConvolver();
    var reverb2 = context.createConvolver();
    var chatter = context.createBufferSource();
    var chatter_filterGain = context.createGain(); 
    var chatter_reverbGain = context.createGain(); 
    var sourceMic;
    var sourceBuiltInMic;

    var delay = WX.StereoDelay();
    var filter = context.createBiquadFilter();
    var noiseBurst =   WX.Noise({ output: 0.0 , type: "white"});
    var noiseBurstadsr = new ADSR();
    var noiseBurstAnalyser = context.createAnalyser();
    var noiseBurstOn = false;
    noiseBurstAnalyser.smoothingTimeConstant = 0.3;
    noiseBurstAnalyser.fftSize = 512;

    noiseBurst.to(noiseBurstadsr.node).to(noiseBurstAnalyser).to(level_original);

    var reverseGate = WX.ConVerb({ mix: 0, output:0.2});
    var filterOn = false;

    reverseGate.to(delay).to(level_original);

    //var javascriptNode = context.createScriptProcessor(2048, 1, 1);
    var compressor = context.createDynamicsCompressor();
    var masterGain = context.createGain();
    var analyser = context.createAnalyser();
     // chatter.connect(reverb);
    var noise = WX.Noise({ output: 0.25 });
    var fbank = WX.FilterBank();
    var cverb = WX.ConVerb({ mix: 0.85 });

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 512;
    
    masterGain.gain.value =1.0;
    level_reverb.gain.value = 0.0;
    level_original.gain.value = 1.0;
    
    chatter_filterGain.gain.value = 1.0;
    chatter_reverbGain.gain.value = 0.0;

    compressor.threshold.value = 10;
    compressor.ratio.value = 20;
    compressor.reduction.value = -20;
    
    filter.type = (typeof filter.type === 'string') ? 'bandpass' : 0; // LOWPASS
    filter.frequency.value = 500;

    //connection
    compressor.connect(masterGain)
    masterGain.connect(context.destination);
  //  reverb.connect(context.destination);
    //javascriptNode.connect(context.destination); // does not make any sound but needed to get time tomain/ freq domain data
   // javascriptNode.connect(compressor); // does not make any sound but needed to get time tomain/ freq domain data
    level_original.connect(compressor); // ONOFF live mic sound
    level_reverb.connect(compressor);

  //  analyser.connect(javascriptNode);
   // analyser.connect(level_original); // raw typing sound
   // analyser.connect(reverb); // 
    //analyser.connect(compressor); may not be needed. 
    convolver.connect(level_reverb);
    reverb.connect(level_reverb);
    reverb2.connect(level_reverb);
   // reverb.connect(analyser);
   // reverb2.connect(analyser);
   // analyser.connect(convolver);

    fbank.set('scale', 'mixolydian');
    fbank.set('pitch', 23);

    chatter.connect(analyser);
    chatter.to(chatter_filterGain).connect(analyser);
    chatter.to(chatter_reverbGain).connect(reverb);
 

    

    var clip1 = {
        name: 'Big Empty Church',
        url: './960-BigEmptyChurch.mp3'
        //url: '../waax/waax/sound/ir/H3000-ReverseGate.mp3'
    };
    var clip2 = {
        name: 'Reverse Gate',
        //url: '../waax/waax/sound/ir/960-BigEmptyChurch.mp3'
        url: './H3000-ReverseGate.mp3'
    };
    WX.loadClip(clip2,function(){
        reverseGate.setClip(clip2);
    });
    WX.loadClip(clip1, function() {
        cverb.setClip(clip1);
    });

    var audioSelect = document.querySelector('select#audioSource');
    var laptopMicInput;

    
    if (navigator.getUserMedia) {
        console.log('getUserMedia supported.');
        navigator.getUserMedia (
            // constraints - only audio needed for this app
            {
                audio: true               
            },

        // Success callback
            function(stream) {
                sourceBuiltInMic =  context.createMediaStreamSource(stream);
                sourceBuiltInMic.connect(analyser); // ON/OFF
                sourceBuiltInMic.connect(level_original); // ON/OFF
                sourceBuiltInMic.connect(convolver); // ON/OFF
                sourceBuiltInMic.connect(reverb); // ON/OFF
    console.log('mic one connected.');
                
            },

        // Error callback
            function(err) {
                console.log('The following gUM error occured: ' + err);
            }
        );
    } else {
        console.log('getUserMedia not supported on your browser!');
    }
 
 //https://simpl.info/getusermedia/sources/
    function gotSources(sourceInfos) {
        
 
      for (var i = 0; i !== sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement('option');
        option.value = sourceInfo.id;
        if (sourceInfo.kind === 'audio') {
          option.text = sourceInfo.label || 'microphone ' +
        (audioSelect.length);
          audioSelect.appendChild(option);
        } else {
          console.log('Some other kind of source: ', sourceInfo);
        }
      }
    }
    /*    if (typeof MediaStreamTrack === 'undefined' ||
            typeof MediaStreamTrack.getSources === 'undefined') {
          alert('This browser does not support MediaStreamTrack.\n\nTry Chrome.');
        } else {
          MediaStreamTrack.getSources(gotSources);
        }
   */
    //  convolver.buffer = context.createBuffer(2, 2048, context.sampleRate);

    var buffers = {};
    var soundmap = {'chatter':'chatter_amp.mp3', 'tick1' : 'tick1.wav', 'ir1' : 'ir1.wav', 'sus1' : 'sus_note.wav', 'piano1': 'piano_note1_f_sharp.wav', 'indo1' : 'indonesian_gong.wav', 'june_o' : 'june_o.wav', 'reversegate' :'H3000-ReverseGate.mp3'
, 'june_A' : 'june_A.mp3'
, 'june_B' : 'june_B.mp3'
, 'june_C' : 'june_C.mp3'
, 'june_D' : 'june_D.mp3'
, 'june_E' : 'june_E.mp3'
, 'june_F' : 'june_F.mp3'
, 'june_G' : 'june_G.mp3'
, 'june_A1' : 'june_A1.mp3'};
    
    loadSounds(buffers, soundmap, function(){
        convolver.buffer = buffers['june_C'];
        reverb.buffer = buffers['ir1'];
        reverb2.buffer = buffers['sus1'];
        chatter.buffer = buffers['chatter'];
    });


    var amplitudeArray =  new Uint8Array(analyser.frequencyBinCount);
    var amplitudeArray2 =  new Uint8Array(analyser.frequencyBinCount);
    var amplitudeArray3 =  new Uint8Array(noiseBurstAnalyser.frequencyBinCount);
            console.log('one ');

    
    
        console.log('two');

    
    

    // load the sound
    
//   loadSound("01-Come_Together.mp3");
//   loadSound();
   
    if(DEBUG==true)
                    $( "body" ).append("<div><table><tr><td>name</td><td>keyDown</td><td>keyPress</td><td>keyUp</td><td>mouseUp</td></tr><tr><td>keycode</td><td><div id=\"keydown_debug\"></div></td><td><div id=\"keypress_debug\"></div></td><td><div id=\"keyup_debug\"></div></td><td><div id=\"mouseup_debug\"></div></td></tr><tr><td>start</td><td><div id=\"start_down_debug\"></div></td><td><div id=\"start_press_debug\"></div></td><td><div id=\"start_up_debug\"></div></td><td><div id=\"start_mouseup_debug\"></div></td></tr><tr><td>end</td><td><div id=\"end_down_debug\"></div></td><td><div id=\"end_press_debug\"></div></td><td><div id=\"end_up_debug\"></div></td><td><div id=\"end_mouseup_debug\"></div></td></tr></table></div>");
    
/*
    javascriptNode.onaudioprocess = function(audioProcessingEvent) {
        
      //  convolver.buffer = audioProcessingEvent.inputBuffer;
        var inputBuffer = audioProcessingEvent.inputBuffer;

        // The output buffer contains the samples that will be modified and played
        var outputBuffer = convolver.buffer;
        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        // Loop through the output channels (in this case there is only one)
            var inputData = inputBuffer.getChannelData(0);
            var outputData = outputBuffer.getChannelData(channel);
            for (var sample = 0; sample < inputBuffer.length; sample++) {
                // make output equal to the same as the input
                //outputData[sample] = inputData[sample];
                // add noise to each output sample
                outputData[sample] = ((Math.random() * 2) - 1) ;         
            }
        }

    };
    */
    function getAverageVolume(array) {
        var values = 0;
        var average;
        var weightedAverageIndex = 0;
        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
            weightedAverageIndex += array[i] * i;
        }
        if ( values > 0 )weightedAverageIndex /= values;
        average = values / length;
      //  console.log("volume:" + average);
        return [average, weightedAverageIndex];
    }
    
/*****************************************************************************
/*****************************************************************************
        
        graphic part START
        
/*****************************************************************************
/*****************************************************************************/
    
    var book;
    var geoindex = 0;
    var geo = {};
    var books = [];
    var currentBook = 0;
    var strBook = [];
    var lineindex = [];

    var numCharBook = [400, 670, 376];

    var numBook = 3;
    for (var i=0; i< numBook; i++)
    {
        lineindex[i] = 0;
        geo[i] = [];
        geo[i][0] = new THREE.Geometry();
        strBook[i] = "";
   //     strBook[i] = "blocks of the streets becomes my poem.\ntrees of the road becomes my court\ndimmed lights reflecting in my eyes\npeople walking round in their disguise.\n\ni am feeling lonely in this zone.\ni feel the chill deep in my bones.\nthe crowd is isolating me.\nin paranoia i will be.\n\nthis gloomy streets are nursing me.\ndark alleys are my home to be.\nnocturnal fog becomes my air\nif i live or die.\nwould you care?";
   // var BOOK="Writing efficient WebGL code requires a certain mindset. The usual way to draw using WebGL is to set up your uniforms, buffers and shaders for each object, followed by a call to draw the object. This way of drawing works when drawing a small number of objects. To draw a large number of objects, you should minimize the amount of WebGL state changes. To start with, draw all objects using the same shader after each other, so that you don't have to change shaders between objects. For simple objects like particles, you could bundle several objects into a single buffer and edit it using JavaScript. That way you'd only have to reupload the vertex buffer instead of changing shader uniforms for every single particle.";

    }
    //geo[1] = new THREE.Geometry();
    var fontSize = 32;
    var lettersPerSide = 16;
  
    var currIndex=[0,0,0], currentLine=[1,1,1], prevJLastLine=[0,0,0];
    var scaleX = 0.7, scaleY = 1.9;
  //  var scaleX = 5, scaleY = 12;

    var rightMostPosition = 0;
    var rightMostXCoord = -10000;
    var letterPerLine = 50;
    var linePerScreen = 10;
    var offset = 1.0;
//    var offset = 8.0;
    var attributes = {
        strIndex: {type: 'f', value: [] }
    };
    
    function addLetter(code, strIndex, sizeFactor){
        var cx = code % lettersPerSide;
        var cy = Math.floor(code / lettersPerSide);
        //var localscaleX = scaleX * (1+sizeFactor);
        var localOffset = offset * (1+sizeFactor*2.0);
        var localY = currentLine[currentBook]*scaleY - (sizeFactor/4.0);
        geo[currentBook][geoindex].vertices.push(
            new THREE.Vector3( currIndex[currentBook]*scaleX, localY, 0 ),
            new THREE.Vector3( currIndex[currentBook]*scaleX+localOffset, localY, 0 ),
            new THREE.Vector3( currIndex[currentBook]*scaleX+localOffset, localY+localOffset, 0 ),
            new THREE.Vector3( currIndex[currentBook]*scaleX, localY+localOffset, 0 )
        );
   //     console.log("sizeFactor:" + sizeFactor + " added(" + (j*scaleX) + "," + (j*scaleX + offset) +" strIndex : " + strIndex + ")");
        var vcenterX = currIndex[currentBook];
        var vcenterY = (currentLine[currentBook]*scaleY*2.0+offset) / 2.0;
        for (var k=0; k<4;k++){
            attributes.strIndex.value[strIndex*4+k] = strIndex;// THREE.Vector2(6.0,12.0);
        }
        var face = new THREE.Face3(strIndex*4+0, strIndex*4+1, strIndex*4+2);
        geo[currentBook][geoindex].faces.push(face);
        face = new THREE.Face3(strIndex*4+0, strIndex*4+2, strIndex*4+3);
        geo[currentBook][geoindex].faces.push(face);
        var ox=(cx)/lettersPerSide, oy=(cy+0.05)/lettersPerSide, off=0.9/lettersPerSide;
      //  var sz = lettersPerSide*fontSize;
        geo[currentBook][geoindex].faceVertexUvs[0].push([
            new THREE.Vector2( ox, oy+off ),
            new THREE.Vector2( ox+off, oy+off ),
            new THREE.Vector2( ox+off, oy )
        ]);
        geo[currentBook][geoindex].faceVertexUvs[0].push([
            new THREE.Vector2( ox, oy+off ),
            new THREE.Vector2( ox+off, oy ),
            new THREE.Vector2( ox, oy )
        ]);

        if (code == 10 || code == 13 || currIndex[currentBook]  == letterPerLine) {
            currentLine[currentBook]--;
            prevJLastLine[currentBook] = currIndex[currentBook];
            currIndex[currentBook]=0;
        } else {
            currIndex[currentBook]++;
            if (rightMostPosition<currIndex[currentBook]){
                rightMostXCoord = currIndex[currentBook]*scaleX+offset;
                rightMostPosition = currIndex[currentBook];
            }
        }
    } // the end of addLetter

    var renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor( 0xffffff );
    document.body.appendChild(renderer.domElement);
    // FIME (Text vIsualization for Musical Expression
    //   var BOOK="H";

    var tex = getKeyTabular(fontSize,"Monospace",lettersPerSide);

    tex.flipY = false;
    tex.needsUpdate = true;

    var mat = new THREE.MeshBasicMaterial({map: tex});
    mat.transparent = true;

    var camera = new THREE.PerspectiveCamera(45,1,4,40000);
    camera.setLens(35);

    window.onresize = function() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
    window.onresize();

    var radius = 0;

    var scene = new THREE.Scene();
    camera.position.z = radius;
    scene.add(camera);

    var str = strBook[currentBook];
    var centerX = (letterPerLine) * scaleX / 2.0;
    var centerY = (-linePerScreen * scaleY )/2.0;

    for (i=0; i<str.length; i++) {
        addLetter(str.charCodeAt(i),i,0);
    }
    geo[1][geoindex] = geo[0][geoindex].clone();
    geo[2][geoindex] = geo[0][geoindex].clone();
    rightMostXCoord = (rightMostPosition+1) * scaleX;

    //  console.log("length:" + attributes.attCenter.value.length);
    /*    for (var k=0; k<attributes.attCenter.value.length;k++){
        attributes.attCenter.value[k].x -=centerX;
        attributes.attCenter.value[k].y -=centerY;
    }
    */  
    var top = new THREE.Object3D();

    var width = window.innerWidth,
        height = window.innerHeight;

    var uniforms = {
        time: {type:"f", value:0.0},
        interval : {type:"f", value:0.0},
        timeDomain : { type:"fv1", value:new Float32Array(512)},
    //        timeDomain2 : { type:"fv1", value:new Float32Array(512)},
    //    center : { type: "v2", value: new THREE.Vector2(centerX,centerY) },
        map : { type: "t", value: tex },
        rightMostXCoord : { type: "f", value: 0.0 },
        noise : {type:"f", value:0.0}
      //  xCoord : { type: "f", value: 0.0 }
    };

    uniforms.rightMostXCoord.value = rightMostXCoord;

    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms : uniforms,
        attributes : attributes,
        vertexShader : document.querySelector('#vertex0').textContent,
        fragmentShader : document.querySelector('#fragment0').textContent
    });


    shaderMaterial.transparent = true;
    shaderMaterial.depthTest = false;
    var w = 80 * 1.1;
    var n = 18;
    var r = w  * 1/Math.PI * 2;
    for (var i=0; i<numBook; i++) {
     


        books[i] = new THREE.Mesh(
            geo[i][geoindex],
            shaderMaterial
        );


        books[i].doubleSided = true;
        var a = i/n * Math.PI*4 + Math.PI/2;
        books[i].position.x = Math.cos(Math.PI*0.9+a) * r;
        books[i].position.z = Math.sin(Math.PI*0.9+a) * r;
        books[i].rotation.y = Math.PI/2 - a;
        //book.position.x -= centerX;
        books[i].position.y -= centerY;
        //book.position.z = 0;
        top.add(books[i]);
      }

      scene.add(top);

/*
    var w = 80 * 1.0;
    var r = w * 1/2 * 1/Math.PI ;
    //var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

    book = new THREE.Mesh(
        geo[geoindex],
        shaderMaterial
    //    material
    );

    book.doubleSided = true;

    var a = Math.PI/2;
    book.position.x -= centerX;
    book.position.y -= centerY;
    book.position.z = 0;
    top.add(book);

    scene.add(top);
*/

    //    camera.position.y = 40;
    camera.lookAt(scene.position);
    /*   var sp1 = WX.SP1({ ampSustain: 1.0 });

    sp1.to(WX.Master);

    sp1.onReady = function () {
        sp1.noteOn(60, 100);
    };
    sp1.loadClip({
        name: 'drums',
        url: './drums.mp3'
    });*/
    //  scene.add(geo);

        var state = 0;

    var currentBook1StartTime = 0;
    var animate = function(t) {
       
        var alpha = 0.8;
        // get the average, bincount is fftsize / 2
        analyser.getByteFrequencyData(amplitudeArray);
        analyser.getByteTimeDomainData(amplitudeArray2);

        if(noiseBurstOn){
            noiseBurstAnalyser.getByteTimeDomainData(amplitudeArray3);
            var noiseVolume = getAverageVolume(amplitudeArray3);
            uniforms.noise.value = noiseVolume[0] / 128.0 * 0.005;
            

        }

        var resultArr = getAverageVolume(amplitudeArray);
        volume = alpha * (resultArr[0]/128.0) + (1-alpha) * volume;
        freqIndex = resultArr[1];
        if(currentBook == 1){
            camera.rotation.y -= 0.00015;
            uniforms.time.value += 0.05;
            uniforms.interval.value = Math.max(Math.min(interval,1.0),0.0);
        }
        else if ( currentBook == 2){
            camera.rotation.y -= 0.00005;
            uniforms.time.value -= 0.6;

        }
        alpha = 0.85;
        uniforms.rightMostXCoord.value = rightMostXCoord;

        for (var l=0;l<512;l++){
            uniforms.timeDomain.value[l] = uniforms.timeDomain.value[l] * alpha + (1-alpha ) * (amplitudeArray2[l]/256.0-0.5); 
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate, renderer.domElement);
    };// the end of animate()
        
        
        
    animate(Date.now());
    //  document.body.appendChild(c);
    var down = false;
    var sx = 0, sy = 0;
    var toggle = true;




    var scaleModel = fbank.getScaleModel();
    //console.log(scaleModel);

   

    var oscillator_list = {}; 
        

        
    
    var interval = 1, alpha = 0.9, lastKeyTime = 0;
    var index = 30;
    var previousKeyPressTime = context.currentTime;
    var first = true;
    function equalPowerCrossfade (percent, gain1, gain2, amp1, amp2){
        var level1 = Math.cos(percent*0.5*Math.PI);
        var level2 = Math.cos((1.0-percent) * 0.5 * Math.PI);
        gain1.gain.value = level1 * amp1; 
        gain2.gain.value = level2 * amp2 ;
    }

    var keyInterval = 0;
    var keyIntervalCnt = 0;


    window.onkeydown = function(ev){
         var keycode = ev.which;
        if (keycode == 8){

            // backspace is not supported for now. j
            ev.preventDefault();
            geoindex++;
            geoindex%=2;
            geo[currentBook][geoindex] = geo[currentBook][geoindex].clone();
            books[currentBook].geometry = geo[currentBook][geoindex];
            if ( currIndex[currentBook] == 0 )
            {
                currentLine[currentBook] ++;
                currIndex[currentBook] = prevJLastLine[currentBook];
                strBook[currentBook] = strBook[currentBook].substring(0,strBook[currentBook].length-2);
            }
            else{
               currIndex[currentBook]--;
            }
            strBook[currentBook] = strBook[currentBook].substring(0,strBook[currentBook].length-1);
        }
        else if (keycode == 18){
            filterOn = !filterOn;
            console.log("filteron:" + filterOn);
            if (filterOn){
                level_reverb.disconnect(0.001);
                level_reverb.connect(filter);
                filter.connect(compressor);
            }else{
                filter.disconnect(0.001);
                level_reverb.disconnect(0.001);
                level_reverb.connect(compressor);
            }
        }
        else if (keycode == 93){
            currentBook++;
            currentBook%=3;
            geoindex = 0; 
            if (currentBook == 2){
                chatter.start(0);
                reverseGate.params.mix.set(0.0,context.currentTime,1);
                reverseGate.params.mix.set(1.0,context.currentTime + 90,1);
            }
            else if (currentBook == 1){
                var shaderMaterial = new THREE.ShaderMaterial({
                    uniforms : uniforms,
                    attributes : attributes,
                    vertexShader : document.querySelector('#vertex2').textContent,
                    fragmentShader : document.querySelector('#fragment2').textContent
                });
                shaderMaterial.transparent = true;
                shaderMaterial.depthTest = false;
                interval = 1.0;
                uniforms.time.value = 0;
                //for (var i=0; i< numBook-1; i++)
                books[1].material = shaderMaterial;            
            }
           
        }
        else if (currentBook ==2 && lineindex[currentBook] >4 && (keycode == 69 || keycode == 79)){ // either e or o
        // clear the whole writing if commnad enter pressed. 
            
            var dur = (keyInterval+0.1) / (keyIntervalCnt+0.1) / 4;
            noiseBurstadsr.play(0,dur, dur, dur, dur,1.0,0.1);

            noiseBurstOn = true;
            setTimeout(function(){
                noiseBurstOn = false;
                uniforms.noise.value = 0.0;
            }, dur * 4000)
        }   
        else if(ev.shiftKey == true && keycode == 13){
            if ( currentBook == 2){
                noiseBurstadsr.node.gain.linearRampToValueAtTime(1.0, context.currentTime );
                noiseBurstadsr.node.gain.linearRampToValueAtTime(1.0, context.currentTime +8);
                uniforms.time.value -= 0.1;
                noiseBurstOn = true;
                masterGain.gain.linearRampToValueAtTime(1.0,context.currentTime);
                masterGain.gain.linearRampToValueAtTime(1.0,context.currentTime + 5);
                masterGain.gain.linearRampToValueAtTime(0.0,context.currentTime + 8);
            }
        }
          if(DEBUG){
            $("#keydown_debug").html(keycode);
    //        $("#start_down_debug").html(pos[0]);
    //        $("#end_down_debug").html(pos[1]);

            keydown_debug_color_index++;
            keydown_debug_color_index%=randomcolor.length;
            $("#keydown_debug").css("background-color", randomcolor[keydown_debug_color_index]);
        } 
    };

    window.onkeyup = function(ev){
         var keycode = ev.which;
         if(DEBUG){
            $("#keyup_debug").html(keycode);
    //        $("#start_down_debug").html(pos[0]);
    //        $("#end_down_debug").html(pos[1]);

            keyup_debug_color_index++;
            keyup_debug_color_index%=randomcolor.length;
            $("#keyup_debug").css("background-color", randomcolor[keyup_debug_color_index]);
        }  
    };
    var currentOuput = 0.0; // noise burst output

    window.onkeypress = function(ev){

        var keycode = ev.which;

      

        if ( ev.shiftKey == true && ev.which == 13)
        {
            strBook[currentBook] = "";
        }

        // update the visual first. 

        var code = strBook[currentBook].charCodeAt(strBook[currentBook].length-1);
        if (code == 8)
            return;
        if (keycode == 49){
            convolver.buffer = buffers['june_A'];
            return;
        } else if (keycode == 50){
            convolver.buffer = buffers['june_B'];
            return;
        }
        else if (keycode == 51){
            convolver.buffer = buffers['june_C'];
            return;
        }
        else if (keycode == 52){
            convolver.buffer = buffers['june_D'];
            return;
        }
        else if (keycode == 53){
            convolver.buffer = buffers['june_E'];
            return;
        }
        else if (keycode == 54){
            convolver.buffer = buffers['june_F'];
            return;
        }
        else if (keycode == 55){
            convolver.buffer = buffers['june_G'];
            return;
        }
        else if (keycode == 56){
            convolver.buffer = buffers['june_A1'];
            return;
        }
        
        var prevgeoindex = geoindex;
        geoindex++;
        geoindex%=2;
        geo[currentBook][geoindex] = geo[currentBook][prevgeoindex].clone();
        if ( currentBook == 2 && currentLine[2] <-7 && keycode >= 97 && keycode <=122)
            keycode -= getRandomInt(0,1) * 32;
        strBook[currentBook] +=String.fromCharCode(keycode);
        if (lineindex[currentBook] <=8 && currentBook == 0)
            volume = 0;
        addLetter(strBook[currentBook].charCodeAt(strBook[currentBook].length-1),strBook[currentBook].length-1,volume);
        if (currIndex[currentBook] == letterPerLine){
            strBook[currentBook] += "\n";
            addLetter(code,strBook[currentBook].length-1,0);
        }
        

        var currentTime = context.currentTime;

        keyInterval += currentTime - previousKeyPressTime;
        keyIntervalCnt ++; 
        previousKeyPressTime = currentTime;
        // play dron if interval is over threhold? 
        if ( keycode == 13 || keycode == 32 ){
            var avgInterval = keyInterval/keyIntervalCnt;
                // play drone sound 
            console.log("space or enter : " + avgInterval + "(" + keyInterval + "," + keyIntervalCnt + ")");

            if ( avgInterval > 0.4){
                var randompitch = [26,27,28,29,29,34][getRandomInt(0,5)];
                console.log("drone triggered : " + randompitch);
                var osc = new Oscillator(randompitch, 'sawtooth');
                var adsr = new ADSR();
                osc.node.connect(adsr.node);
                adsr.node.connect(reverb2);

                osc.play(0);
                osc.stop(context.currentTime +keyInterval);
                var dur = keyInterval/4;
                adsr.play(0,dur, dur, dur, dur,0.1,0.05);
            }
            keyInterval = 0;
            keyIntervalCnt = 0;
        }
        else if (keycode == 63){
            state ++;
            if (state == 1){

               // reverseGate.set('mix', 1.0,context.currenTime + 10);
               
                delay.params.mix.set(0.0,context.currentTime,1);
                delay.params.mix.set(0.0,context.currentTime+60,1);    
                delay.params.mix.set(1.0,context.currentTime+90,1);
                delay.params.mix.set(0.0,context.currentTime+120,1);

                var gain_filterbank = context.createGain();
                gain_filterbank.gain.value = 0.0;
                noise.to(fbank).to(cverb).to(gain_filterbank);
                chatter.to(fbank._inlet);

                gain_filterbank.connect(compressor)
                gain_filterbank.gain.linearRampToValueAtTime(0., context.currentTime);
                gain_filterbank.gain.linearRampToValueAtTime(0.3, context.currentTime + 3);

                cverb.set('output',0.3);


            }
        }


        
        //gain.connect(convolver);
      //  gain.connect(level_reverb);
       // convolver.connect(compressor);
    //    gain.connect(context.destination);

        var randomPitch = 24 + getRandomInt(-3,12);
    
        var osc = new Oscillator(randomPitch, 'triangle');
                var adsr = new ADSR();
                osc.node.connect(adsr.node);
      //          adsr.node.connect(level_reverb);
             //   osc.adsr = adsr;
               // oscillator_list[24] = osc;
    //              }

  
            osc.play(0);
            osc.stop(context.currentTime + 3.2);
            adsr.play(0,0.1,0.1,2,1);

        var currentTime = (new Date()).getTime();
        if (lastKeyTime == 0)
            lastKeyTime = currentTime;
        interval = interval * alpha + (1-alpha) * (currentTime - lastKeyTime) / 1000.0;
        if ((currentTime - lastKeyTime) / 1000.0 > 0.5)
            interval = 1;
        //interval = (currentTime - lastKeyTime);
      //  console.log(interval);
        lastKeyTime = currentTime;
         if(DEBUG){
            $("#keypress_debug").html(keycode);
    //        $("#start_down_debug").html(pos[0]);
    //        $("#end_down_debug").html(pos[1]);

            keypress_debug_color_index++;
            keypress_debug_color_index%=randomcolor.length;
            $("#keypress_debug").css("background-color", randomcolor[keypress_debug_color_index]);
        }  



        if (state%2== 1){
            var source = context.createBufferSource();
            var gain = context.createGain();
            gain.gain.value = 0.1;
            source.buffer = buffers['tick1'];
            //source.playbackRate.value = 1 + Math.random()*2;
            source.playbackRate.value = 1 + (keycode-97) / 60*4;
            source.connect(reverseGate._inlet);
            source.start(0);
        }



        if (currentBook == 2){
            var length = strBook[currentBook].length;
            var percent = WX.clamp(length/numCharBook[currentBook],0,1.0);
            equalPowerCrossfade(percent, chatter_filterGain, chatter_reverbGain, 0.5, 0.1);
            currentOuput = noiseBurst.get('output');
            noiseBurst.params.output.set(currentOuput, context.currentTime, 1);
            currentOuput = percent * 0.1;
            noiseBurst.params.output.set(currentOuput, context.currentTime + 0.1, 1);
        }

        if (code == 10 || code == 13){
            lineindex[currentBook]++;

            fbank.set('scale', scaleModel[getRandomInt(0,3)].value, WX.now + 4, 2);
           // fbank.set('pitch', fbank_pitchset[getRandomInt(0,3)]);
            if (lineindex[currentBook] == 2 && currentBook == 0){
                level_reverb.gain.linearRampToValueAtTime(0.0, context.currentTime )
                level_reverb.gain.linearRampToValueAtTime(1.0, context.currentTime + 30)

                var osc = new Oscillator(22, 'triangle');
                var adsr = new ADSR();
                osc.node.connect(adsr.node);
                adsr.node.connect(level_reverb);

                osc.play(0);
               // osc.stop(context.currentTime + 300);
              //adsr.play(0,30,120,30,120,0.05,0.025);
                adsr.noteOn(0,30,600,0.07,0.03);
                osc.node.detune.linearRampToValueAtTime(0.0, context.currentTime);
                osc.node.detune.linearRampToValueAtTime(0.0, context.currentTime + 30);
                osc.node.detune.linearRampToValueAtTime(900, context.currentTime + 120);
                osc.node.detune.linearRampToValueAtTime(200, context.currentTime + 240);
            }
            else if (lineindex[currentBook] == 4 && currentBook == 0){
                var shaderMaterial = new THREE.ShaderMaterial({
                    uniforms : uniforms,
                    attributes : attributes,
                    vertexShader : document.querySelector('#vertex1').textContent,
                    fragmentShader : document.querySelector('#fragment1').textContent
                });
                shaderMaterial.transparent = true;
                shaderMaterial.depthTest = false;
                for (var i=0; i< numBook; i++)
                    books[i].material = shaderMaterial;
                // turn on reverb gain slowly. 
                
           }


        }
        //var str = BOOK;
     //   j = 0; ln = 0;
     books[currentBook].geometry = geo[currentBook][geoindex];
        
    }

    var wheelHandler = function(ev) {
        var ds = (ev.detail < 0 || ev.wheelDelta > 0) ? (1/1.01) : 1.01;
        var fov = camera.fov * ds;
        fov = Math.min(120, Math.max(1, fov));
        camera.fov = fov;
        camera.updateProjectionMatrix();
        ev.preventDefault();
    };
    window.addEventListener('DOMMouseScroll', wheelHandler, false);
    window.addEventListener('mousewheel', wheelHandler, false);
    var drone;
    var pitchListforDrone = [15,17,22,10];
    var pitchIndex=0;
    window.onmousemove = function(ev) {
        if (down) {
            var dx = ev.clientX - sx;
            var dy = ev.clientY - sy;
      //      books[currentBook].rotation.x += dy/50.0;
    //        books[currentBook].rotation.y += dx/50.0;
            camera.rotation.y += dx/500 * (camera.fov/45);;
            //camera.rotation.y += dx/500 * (camera.fov/45);;
            camera.rotation.x += dy/500 * (camera.fov/45);
            sx += dx;
            sy += dy;
            //hellow
            if (drone  && currentBook >= 1)
                drone.detune(dy);
/*
            if (filterOn){
                var minValue = 40;
                var maxValue = context.sampleRate / 4;
                // Logarithm (base 2) to compute how many octaves fall in the range.
                var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
                // Compute a multiplier from 0 to 1 based on an exponential scale.
                var multiplier = Math.pow(2, numberOfOctaves * ( ev.clientX/1024/2 - 1.0));
                // Get back to the frequency value between min and max.
                filter.frequency.value = drone.frequency * multiplier;
            }
*/
        }
    };
  
    window.onmousedown = function (ev){
       if (ev.target == renderer.domElement) {
            down = true;
            sx = ev.clientX;
            sy = ev.clientY;
       }
//function ScissorVoice(noteNum, numOsc, oscType, detune){
        if ( currentBook >= 1){
            if (drone){
                drone.output.noteOff(0,1,drone.maxGain*2.0);    
                drone.stop(context.currentTime + 1);
            }
           drone = new ScissorVoice(pitchListforDrone[pitchIndex],getRandomInt(3,10),"triangle", 12);
           //drone = new ScissorVoice(pitchListforDrone[pitchIndex],getRandomInt(3,10),"triangle", [3,5,7,12][getRandomInt(0,3)]);
           drone.connect(reverb);
           drone.output.noteOn(0,1,6000,drone.maxGain*2.0,drone.maxGain*2.0);
           pitchIndex++;
           pitchIndex %= pitchListforDrone.length;
        }
    };
    window.onmouseup = function(){ 
        down = false; 
        if ( drone && currentBook >= 1)
        { // ADSR.prototype.noteOff= function(delay, R, sustainlevel){
            drone.output.noteOff(0,1,drone.maxGain);    
            drone.stop(context.currentTime + 1);
            delete drone;
            
        }
    };
    
    
};