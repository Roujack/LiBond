var redis_host = require("../config/config.js").redis_host;
var redis_port = require("../config/config.js").redis_port;
var redis_pwd = require("../config/config.js").redis_pwd;
var redis = require('redis');

var logger = require("../library/winstonlogger");


var redisClient =
    redis.createClient({
            host: redis_host
            ,port: redis_port
            ,password:redis_pwd
            ,detect_buffers: true
    })
    .on('error', function (err) {
            logger.error(redis_host + ":" + redis_port + " " + err);
        })
        .on('connect', function () {
            logger.debug('Redis connected ' + redis_host + ":" + redis_port);
        });

exports.redis = redis;
exports.redisClient = redisClient;