"use strict";
var mongoose = require('mongoose');

var logger = require('../library/winstonlogger');

var mongodb_url = require("../config/config.js").mongodb_url;

exports.connect = function() {
    //根据mongoose文档说autoIndex会影响性能
    mongoose.connect(mongodb_url, { config: { autoIndex: false }});

    mongoose.connection.on('connected',function () {
        logger.debug("Mongodb API connected to: " +  mongodb_url);
    });

    mongoose.connection.on('error',function (err) {
        logger.debug('Mongoose API connection error: ' + err);
    });

    mongoose.connection.on('disconnected', function () {
        logger.debug('Mongoose API connection disconnected');
    });
};

exports.disconnect = function(callback) {
    mongoose.disconnect(callback);
};