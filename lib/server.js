var DEBUG = true;
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var mime = require('mime');
var cache = {};
var crypto = require('crypto');
var base64url = require('base64url');
var querystring = require('querystring');
var express = require('express');    //Express Web Server 
var app = express();
var fileSize = 15;

var express = require('express');    //Express Web Server 
var app = express();


//var absolutePath = "/home/snaglee/livewriting"
// this is for local running
//var absolutePath = "/home/snaglee/op_livewriting"
// this is for local running
var absolutePath = "/Users/sangwonlee/Public/umich/livewriting"
/** Sync */
function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

app.use(express.static( absolutePath +'/public_html/'));

app.get('/', function(req, res) {
    res.sendFile(path.join(absolutePath + '/public_html/index.html'));
});

app.get('/whattime', function (req, res) {
    var now = new Date().getTime();
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(now.toString());
});

// accept POST request at /play
app.post('/play', function (req, res) {

    if(DEBUG)console.log('do you want to play?');
    var fileReadingDone = false;
    var dataReceivedDone = false;
    req.on('data', function(chunk){
        var data = JSON.parse(chunk);
        if(DEBUG)console.log('aid recieved:' + data['aid']);
        var dataFilePath = absolutePath + '/lib/data/' + data['aid'];
        fs.exists(dataFilePath, function(exists){
            if(! exists )
            {
                if(DEBUG)console.log("file does not exist:"+dataFilePath);
                res.writeHead(404, {'Content-type': 'application/json'});
                res.end('{"state" : "file does not exists", "status" : 404}');          
            }
            else{
                if(DEBUG)console.log("file exists:"+dataFilePath);
                fs.readFile(dataFilePath, function (err, data) {
                    if(err) {
                        if(DEBUG)console.log(err);
                        res.writeHead(404, {'Content-type': 'application/json'});
                        res.end('{"state" : "reading file failed.", "status" : 404}');                               } else {
                        res.writeHead(200, {'Content-type': 'application/json'});
                        res.end(data);      
                    }
                });
                
            }
        });
    });
    
    req.on('end', function(chunk){
        if(DEBUG)console.log("data end received");
    });
});

app.get('/', function(req,res){

});

// accept PUT request at /post
app.post('/post', function (req, res) {
    if(DEBUG)console.log('do you want to post?');
    var strChunk = "";

    req.on('data', function(chunk){
        if(DEBUG)console.log('parsed:', chunk);
        strChunk += chunk;
       
    });

    req.on('end', function(chunk){
        if(DEBUG)console.log('done parsing');
        var randomFileName = randomStringAsBase64Url(fileSize);
        var dataFilePath = absolutePath + '/lib/data/' + randomFileName;
        while(fs.existsSync(dataFilePath)){ // find a way to do this asynchronously ? 
            randomFileName = randomStringAsBase64Url(fileSize);
            dataFilePath = absolutePath + '/lib/data/' + randomFileName;
        }
        console.log(dataFilePath);
        fs.writeFile(dataFilePath, strChunk, function(err) {
            if(err) {
                if(DEBUG)console.log(err);
            } else {
                if(DEBUG)console.log('The file was saved!');
            }
        }); 
        
        res.writeHead(200, {'Content-type': 'application/json'});
        res.end('{"success" : "Updated Successfully", "status" : 200, "aid": "'+randomFileName+'"}'  );      
    });
});

var server = app.listen(2401, function() {
    console.log('Listening on port %d', server.address().port);
});
