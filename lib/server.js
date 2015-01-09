var DEBUG = false;
var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var mime = require('mime');
var cache = {};
var crypto = require('crypto');
var base64url = require('base64url');
var querystring = require('querystring');
var fileSize = 10;
var absolutePath = "."
/** Sync */
function randomStringAsBase64Url(size) {
    return base64url(crypto.randomBytes(size));
}

function send404(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('Error 404: resource not found.');
    res.end();
}

function sendFile(res, filePath, fileContents) {
  res.writeHead(
    200,
    {'Content-Type': mime.lookup(path.basename(filePath))}
      //,'Content-Length':Buffer.byteLength(fileContents)}
  );
  res.end(fileContents);
}

function serveStatic(res, cache, absPath){
    if (cache[absPath]){
        sendFile(res, absPath, cache[absPath]);
    }
    else{
        fs.exists(absPath, function(exists){
            if(exists){
                fs.readFile(absPath, function(err, data){
                    if(err){
                        send404(res)
                    }
                    else{
                        cache[absPath] = data;
                        sendFile(res, absPath, data);
                    }
                });
            }
            else{
                send404(res);
            }
        });
    }
}



function handlePOST(req, res){
     if(req.url =='/post'){
	if(DEBUG)console.log('do you want to post?');
        var strChunk = "";
        req.on('data', function(chunk){
            if(DEBUG)console.log('parsed:', chunk);
            strChunk += chunk;
           
        });
        req.on('end', function(chunk){
            if(DEBUG)console.log('done parsing');
            var randomFileName = randomStringAsBase64Url(fileSize);
            var dataFilePath = absolutePath + '/data/' + randomFileName;
            while(fs.existsSync(dataFilePath)){ // find a way to do this asynchronously ? 
                randomFileName = randomStringAsBase64Url(fileSize);
                dataFilePath = absolutePath + '/data/' + randomStringAsBase64Url(fileSize);
            }
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
    }else if ( req.url == '/play'){
        if(DEBUG)console.log('do you want to play?');
        var fileReadingDone = false;
        var dataReceivedDone = false;
        req.on('data', function(chunk){
            var data = JSON.parse(chunk);
            if(DEBUG)console.log('aid recieved:' + data['aid']);
            var dataFilePath = absolutePath + '/data/' + data['aid'];
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

    }
    else{
        send404(res);
    }
}

function handlePlay(req, res, querystring){
    var article_id = querystring['aid'];
    if(DEBUG)console.log('handlePlay:' + article_id);
    // get article id first. 
    
}

var server = http.createServer(function(req, res){
    var filePath = false;
    if(DEBUG)console.log('request:' + req.url);
//    if(DEBUG)console.log('request method:' + req.method);
    req.setEncoding('utf8');
    
    if(req.method =='POST'){
        handlePOST(req, res);
        return;
    }
    var querystring = url.parse(req.url, true).query;
    var pathname = url.parse(req.url).pathname;
//    if(DEBUG)console.log(JSON.stringify(str_query));
  //  if(DEBUG)console.log(querystring);
    if(pathname =='/'){
        filePath = 'public_html/index.html';
    }
    else if (pathname.substr(0,6) == '/play/'){
        filePath = 'public_html/index.html';
    }    
    else{
        filePath = 'public_html' + pathname;
    }
    var absPath = absolutePath + '/../' + filePath;
        if(DEBUG)console.log(absPath);

    serveStatic(res, cache, absPath);
});

server.listen(9137, function(){
    console.log('Server Listening on port 9137');
});

