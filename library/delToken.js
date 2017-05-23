"use strict";

const logger = require('./winstonlogger.js');
const config = require('../config/config.js');
const redisClient = require('../db/redis').redisClient;

var delToken = function(userId, cb) {
	redisClient.del(JSON.stringify(userId), (err, reply)=>{
		if(err){
			cb(err);
		}else{
			cb(null, reply);
		}
	})
}

exports.delToken = delToken;

/* example reply为1表示成功 0为失败
delToken('keyName', (err, reply) => {
	if(err){
		console.log(err);
	}else{
		console.log(reply);
	}
})
*/
