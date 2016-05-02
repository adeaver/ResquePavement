// Node Requirements
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var mongoose = require('mongoose');
var redis = require('redis');
var nr = require('node-resque');
var expressSession = require('express-session');

var redisManager = require('./redis/redismanager.js');

// Server requirements
var app = express();
var http = require('http').Server(app);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//TODO: replace with new URI and link via auth file instead?
mongoose.connect('mongodb://jwei:jwei@ds025459.mlab.com:25459/pavement');

redisManager.initialize();

var PORT = process.env.PORT || 5000;

http.listen(PORT, function() {
	console.log('listening on port: ', PORT);
})