"use strict";

const jwt = require('jwt-simple');
const logger = require('./winstonlogger.js');
const config = require('../config/config.js');
const redisClient = require('../db/redis').redisClient;

var generToken = function(userId, cb) {
	let expire_time = (new Date).getTime() + config.token_expired_time;
	let token = jwt.encode({'expire_time': expire_time}, config.jwtTokenSecret);

	redisClient.set(JSON.stringify(userId), token, (err, reply) => {
		if(err){
			logger.error('Token set failed');
			cb(err);
		}else{
			//logger.debug('Token set in Redis: ', reply.toString());
			cb(null, token);
		}
	})
}

/*example

genToken('111', (err, token)=>{
	if(err){
		console.log(err);
	}else{
		console.log(token);
	}
})

*/


exports.generToken = generToken;