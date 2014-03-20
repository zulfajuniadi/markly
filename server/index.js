var express = require('express'),
    app = express(),
    qt = require('quickthumb'),
    md5 = require('MD5'),
    fs = require('fs'),
    path = require('path'),
    webshot = require('webshot');

var webshotOptions = {
  screenSize: {
    width: 1366,
    height: 800
  },
  shotSize: {
    width: 1366,
    height: 800
  },
  streamType: 'jpg',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36'
};

app.configure(function(){
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
  app.use(express.bodyParser());
  app.use('/images', function(req, res, next){
    var size = '284';
    var url = decodeURIComponent(req.path.replace('/', ''));
    if(req.query.dim) {
      size = req.query.dim
    }
    req.url = '/' + md5(req.path) + '.jpg?dim=' + size;
    req.query.dim = size;
    var filePath = __dirname +'/images' + req.path;
    if(!fs.existsSync(filePath)) {
      return webshot(url.replace('.jpg',''), filePath, webshotOptions, function(err) {
        console.log(err)
        next();
      });
    }
    next();
  });
  app.use('/images', qt.static(__dirname + '/images'));
});

app.listen(3333, '0.0.0.0');
console.log('server listening');