'use strict';
var schedule = require('node-schedule');
var PostDao = require('../dao/index').PostDao;
var UserDao = require('../dao/index').UserDao;
var https = require('http');
var querystring = require('querystring');
var redisClient = require('../db/redis').redisClient;
var redis = require('../db/redis').redis;
var multer = require('multer');
var fs = require('fs');
const message = require('../config/message.js');
const path = require('path');
var gm = require('gm');
var _ = require('underscore');
//贝叶斯平均计算最终评分,score为一个数组,先验值为3分，十个人评分
function getFinalScore(scores){
    var finalScore,
    totalScore = 0,
    finalScore = 0;
    var length = scores.length;
    scores.forEach(function(item,index){
        if(item.isValidate == 1){
            totalScore += item.score;
        }
        
    })
    //var aveScore = totalScore / length;
    finalScore = (totalScore + 30)/(length+10);
    return finalScore.toFixed(1);
}
exports.getFinalScore = getFinalScore;
//通过手机号查找用户 返回一个promise 主要是要来优化代码
function pGetUserByPhone(phone){
    return new Promise( (resolve,reject) => {
                    UserDao.getUserByPhone(phone,function (err, user) {
                        if(err){
                            //logger.debug('updatePass接口出错：' + err);
                            reject(message.MONGODB_ERROR);
                        } 
                        else if(!user){                 
                            reject(message.USER_NOT_EXIST);
                        }
                        else{
                            resolve(user);
                        }
                   })

            })
}
exports.pGetUserByPhone = pGetUserByPhone;

//通过ID查找用户 返回一个promise 主要是要来优化代码
function pGetUserById(userId){
    return new Promise( (resolve,reject) => {
                    UserDao.getUserById(userId,function (err, user) {
                        if(err){
                            //logger.debug('updatePass接口出错：' + err);
                            reject(message.MONGODB_ERROR);
                        } 
                        else if(!user){                 
                            reject(message.USER_NOT_EXIST);
                        }
                        else{
                            resolve(user);
                        }
                   })

            })
}
exports.pGetUserById = pGetUserById;

//通过ID查找帖子 返回一个promise 主要是要来优化代码
function pGetPostById(postId){
    return new Promise( (resolve,reject) => {
                    PostDao.getPostById(postId,function (err, post) {
                        if(err){
                            //logger.debug('updatePass接口出错：' + err);
                            reject(message.MONGODB_ERROR);
                        } 
                        else if(!post){                 
                            reject(message.POST_NOT_EXIST);
                        }
                        else{
                            resolve(post);
                        }
                   })

            })
}
exports.pGetPostById = pGetPostById;

//图片文件格式过滤
function fileFilter (req,file,cb){
    var filename = file.originalname;
    var suffix = (filename.substring(filename.lastIndexOf('.'), filename.length)).toLowerCase();
     if((suffix != '.jpg') && (suffix != '.gif') && (suffix != '.jpeg') && (suffix != '.png') && (suffix != '.bmp')) {    
         //cb(null,false);
         cb(new Error('SUFFIX_ERROR'));
     }
    else{
         cb(null,true);
     }
}
//上传图片配置，str为post,或者 avater,存放图片的路径
function getOptions(str){
	var storage = multer.diskStorage({
   		 destination: function(req, file, cb){
            //绝对路径存放图片
   		 	if(str == 'avatar')
    	    	cb(null,'C:/Users/301/Desktop/tbApi/public/avatar');
    	    else if(str == 'post')
    	    	cb(null,'C:/Users/301/Desktop/tbApi/public/images');
    	    //默认是post
    	    else
    	    	cb(null,'C:/Users/301/Desktop/tbApi/public/images');
   		 },
    	filename:function (req,file,cb){
        var filename = file.originalname;
        var suffix = (filename.substring(filename.lastIndexOf('.'), filename.length)).toLowerCase();
        var filename = Date.now()+suffix;//文件名为时间戳+原文件名后缀
        return cb(null,filename);
    	}
	})
	var options = {
   		storage: storage,
    	fileFilter: fileFilter,
    	limits: {
    	fileSize : 2 * 1024 * 1024   //默认最大为2M
		}
	}
	return options;
}	
exports.getOptions = getOptions;	
//上传多张图片接口，最多上传九张
var uploadMulti = multer(getOptions('post')).array('postPics',9);
var uploadMultiPics = function(req,res,cb){
	uploadMulti(req,res,function(err){
        if(err) {
            //logger.debug('上传多张图片接口出错：' + err);
            if(err.message == 'SUFFIX_ERROR') {
                cb({statusCode: -1026, message: message.FILE_TYPE_ERROR, result: ''});
            }
            else if(err.message == 'File too large'){
                cb({statusCode: -1027, message: message.FILE_SIZE_ERROR, result: ''});
            }
            else if(err.message == 'Unexpected field'){
                cb({statusCode: -1035, message: message.FILE_NAME_ERROR, result: ''});
            }
            else{
                cb({statusCode: -100, message: err.message, result: ''});
            }

        }
        else{
            if(req.files == undefined){
                cb({statusCode: -100, message: "请使用formdata格式上传表单", result: ''});
            }
        	else if(req.files.length == 0){
                    req.body.pictures = [];
        			cb(null,req.body);
        	}
        	else{
        		 new Promise(function(resolve,reject){
        			var length = req.files.length;
        			var cnt =0;
        			req.files.forEach(function(photo,index){
        				gm(photo.path).size(function(err,value){
        					if(err||_.isEmpty(value))
            				{
            					//删除图片
            					req.files.forEach(function(photo,index){
            						fs.unlink(photo.path,function(err){
            							logger.debug('上传多张图片接口出错：' + err);
            						});
            					})
            					reject({statusCode: -100, message: '获取尺寸出错', result: ''});
            				}
            				else{
            					gm(photo.path).resize(value.width,value.height).write(photo.path,function(err){
            						if(err){
            							//删除图片
            							req.files.forEach(function(photo,index){
            								fs.unlink(photo.path,function(err){
            									logger.debug('上传多张图片接口出错：' + err);
            								});
            							}) 
            							reject({statusCode: -100, message: '图片压缩出错', result: ''}); 							
            						}
            						else{
            							++cnt;
            							if(cnt == length){
            								resolve();
            							}
            							
            						}
            						
            					
            					})
            			

            				}
            			})
    
        			})
        		})
        		.then(function(){
        		  var picsArray;       		
        		  var l = req.files.length;
        		
        		  return new Promise(function(resolve,reject){
        			 picsArray = req.files.map(function(photo,index){
        				return '/images/'+photo.filename;
        			 })      			
        			 resolve(picsArray);        			
        		  })
        		})
        		.then(function(picsArray){
                    req.body.pictures = picsArray;
        			cb(null,req.body);
        		})
        		.catch(function(err){
                    logger.debug('上传多张图片接口出错：' + err);
        			cb(err);
        		});
        	}
	    }
    })
}
exports.uploadMultiPics = uploadMultiPics;

function getRandomInt (length){
	length = length || 4;
	if(length < 0 || length > 10){
		length = 4;
	}

	let s = '0123456789';
	let result = '';

	for(let i = 0; i < length; i ++) {
		result += s[Math.floor(Math.random() * 10)];
	}
	return result
}
exports.getRandomInt = getRandomInt;


//发送验证码，参数为手机号
function sendVerifyCode(type,phone,callback){
	//默认是六位长度的验证码
	var verifycode = getRandomInt(6);

	var msg;
    if(type)
        msg = verifycode+'(XXXX验证码)，请尽快完成验证。【XXXX】';
    else
        msg = verifycode+'(奖品兑换码)，请尽快来XXXXX兑换你的奖品。【XXXX】';
    //console.log(msg);
	sendMsg(phone,msg,function(err,result){
        //console.log(result);
		if(err)
			callback(err);
		else{
			//console.log(result);
			result = JSON.parse(result);
			var msgStatus = {statusCode:result.error,message:result.msg,result:verifycode};
			//如果状态码（result.error）为0，说明发送成功，否则状态码为负数，发送失败
			if(result.error==0){
				redisClient.setex(phone,2*60,verifycode,function(err,res){
                    if(err)
                        callback(err)
                    else
                    {
                        callback(null,msgStatus);
                    }
                });
            }
            else {
                callback({statusCode:result.error,message:result.msg,result:''})
            }
		}
	})
}
exports.sendVerifyCode = sendVerifyCode;



function sendMsg(phone , msg ,callback){
    var postData = {
        mobile:phone,
        message:msg
    };
    var content = querystring.stringify(postData);
    var options = {
        host:'sms-api.luosimao.com',
        path:'/v1/send.json',
        method:'POST',
        auth:'api:螺丝帽开发者key',
        agent:false,
        rejectUnauthorized : false,
        headers:{
            'Content-Type' : 'application/x-www-form-urlencoded',
            'Content-Length' :content.length
        }
    };
    var req = https.request(options,function(res){
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end',function(){
            callback(null, data);

            //console.log('data='+data+'send  msg over');
        });
        res.on('error', function(err){
            callback(err);
        })
    });
    //console.log(content);
    req.write(content);
    req.end();
}
exports.sendMsg = sendMsg;

function checkParams(paramsArray){
    return new Promise((onFullfill,onReject) => {
        paramsArray.forEach(function(item){
            if(_.isNull(item) || _.isUndefined(item) || (typeof(item)!='number' && _.isEmpty(item)))
                onReject(message.UNCOMPLETE_INPUT);
        })
        onFullfill();
    })
}
exports.checkParams = checkParams;


//定时任务
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 16;
rule.minute = 9;

schedule.scheduleJob(rule, function(){
    new Promise(function(resolve, reject) {
       var date = new Date();
       console.log(date);
    PostDao.getPostsByQuery({lock:0,'coinBank.lock':0,'coinBank.status':0,status:2,'coinBank.expDealTime':{$lt:date}},null,null,function (err,posts) {
        if(err){
            reject(err);
        }
        //else if(posts.length==0){
            //reject('没有帖子需要进行自动转账');
        //}
        else{
            reject("帖子"+posts);
        }
    });
    }).catch(function (err) {
        console.log(err);
    })

});

