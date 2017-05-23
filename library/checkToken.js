"use strict"

const jwt = require('jwt-simple');
const logger = require('./winstonlogger.js');
const config = require('../config/config.js');
const redisClient = require('../db/redis').redisClient;

const message = require('../config/message.js');

var validateToken = function(req, res, next) {
	const token = req.headers.xtoken;
	const key = req.headers.xkey;	//userID
	let decoded;
	return new Promise((onFulfilled, onRejected)=>{
		
		if(token !== '' && token !== null && typeof token !== undefined && key !== undefined){
			try{
				//先对token解码
				decoded = jwt.decode(token, config.jwtTokenSecret);
			}catch(e){
				res.json({statusCode: -1000, message: message.TOKEN_ERROR});
				onRejected(e.message);
			}
			//检查token是否过期
			if(decoded.expire_time > (new Date).getTime()) {
				//从redis数据库中按key即userID获取数据
				redisClient.get(JSON.stringify(key), (err, redis_token) => {
					if(err){
						res.json({statusCode: -1014, message: message.REDIS_ERROR});
						onRejected('redis 数据库出错')
					}else{
						onFulfilled(redis_token);
					}
				});
			}else{
				res.json({statusCode: -1001, message: message.TOKEN_EXPIRED});
				onRejected('Token 过期');
			}
		}else{
			res.json({statusCode: -1000, message: message.TOKEN_ERROR});
			onRejected('request headers 中Token为空或者参数不完整');
		}
	}).then( (redis_token)=>{
		//console.log('redis_token: ', redis_token);
		//对比客户端传过来的token以及存放在服务器的token
		if(redis_token === null){
			res.json({statusCode: -1000, message: message.TOKEN_ERROR});
			logger.info('Token为空');
		}else if(token !== redis_token){
			res.json({statusCode: -1000, message: message.TOKEN_ERROR});
			logger.info('Token拒绝');
		}else{
			next();
		}
	},(err_msg)=>{
		if(err_msg){
			logger.info(err_msg);
		}
	})
}

exports.validateToken = validateToken;
