"use strict";

const crypto = require('crypto');
const genToken = require('../library/genToken.js').generToken;
var _      = require('underscore');
const delToken = require('../library/delToken.js').delToken;
const logger = require('../library/winstonlogger.js');
const message = require('../config/message.js');
const config = require('../config/config.js');


const UserDao = require('../dao/index').UserDao;
const StuInfoDao = require('../dao/index').StuInfoDao;
const PostDao = require('../dao/index').PostDao;
const ItemDao = require('../dao/index').ItemDao;
const TradeDao = require('../dao/index').TradeDao;


const getOptions = require('../library/tools.js').getOptions;
const getFinalScore = require('../library/tools.js').getFinalScore;
const uploadMultiPics = require('../library/tools.js').uploadMultiPics;
const sendVerifyCode = require('../library/tools.js').sendVerifyCode;
const getRandomInt = require('../library/tools.js').getRandomInt;
const pGetUserByPhone = require('../library/tools.js').pGetUserByPhone;
const pGetUserById = require('../library/tools.js').pGetUserById;
const pGetPostById = require('../library/tools.js').pGetPostById;



const path = require('path');
var User = require('../model/user').user;
var redisClient = require('../db/redis').redisClient;
//上传文件模块
var multer  = require('multer');
var fs = require('fs');
//图片裁剪模块
var gm = require('gm');
var mongoose = require('mongoose');
var User = require('../model/user').user;

//兑换接口
var buy = function(req,res){
	let body = req.body;
	let numberOfItem = body.numberOfItem;
	if(!body.userId || !body.itemId || !body.numberOfItem || body.numberOfItem<1)
		return res.json(message.UNCOMPLETE_INPUT);
	let p1 = new Promise((onFulfill,onReject)=>{
		UserDao.getUserById(body.userId, (err, user)=>{
			if(err) 
				onReject(message.MONGODB_ERROR);
			else if(!user) 
		 		onReject(message.USER_NOT_EXIST);
			else 
		   		onFulfill(user);
		})	
	});

	let p2 = new Promise((onFulfill,onReject)=>{
		ItemDao.getItemById(body.itemId, (err, item)=>{
			if(err) 
				onReject(message.MONGODB_ERROR);
			else if(!item) 
		 		onReject(message.ITEM_NOT_EXIST);
			else 
		   		onFulfill(item);
		})	
	});

	Promise.all([p1,p2]).then(function(result){
		return new Promise(function(onFulfill,onReject){
			let user = result[0];
			let item = result[1];
			console.log(user.coin);
			if(numberOfItem > item.stock){
				
				onReject(message.STOCK_OVERFLOW);
			}
			else if(user.coin < (item.price*numberOfItem)){
				
				onReject(message.UN_ENOUGH_COINS);
			}
			else
				onFulfill(result);
		})
	})
	.then(function(result){
		return new Promise(function(onFulfill,onReject){
			let user = result[0];
			let item = result[1];
			user.coin = user.coin - (item.price*numberOfItem);
			item.stock = item.stock - numberOfItem;
			item.save((err)=>{
				if(err)
					onReject(message.MONGODB_ERROR);
				else{
					user.save((err)=>{
						if(err)
							onReject(message.MONGODB_ERROR);
						else{
							console.log(user.coin);
							onFulfill(result);
						}

					})
				}
			})
		})
	})
	.then(function(result){
		
		let user = result[0];
		let item = result[1];
		let trade = {};
		trade.userId = user._id;
		trade.userName = user.stuName;
		trade.itemId = item._id;
		trade.itemName = item.name;
		trade.numberOfItem = body.numberOfItem;
		sendVerifyCode(false,user.phone,function(err,result){
			if(err)
				res.json(err);
			else{
				trade.exchangeCode = result.result;
				TradeDao.newTradeAndSave(trade,function(err,trade){
					if(err){
						console.log(err);
						res.json(message.MONGODB_ERROR);
					}
					else{
						console.log("yes");
						res.json(message.OPERATION_SUCCESS);
					}
				})
			}
		});
	})
	.catch((err)=>{
		console.log(err);
		res.json(err);
		logger.debug(err);
	})

}


//插入学号接口 
var insertStu = function(req,res){
	//首先检查姓名和学号是否为空
	if(!req.body.stuName || !req.body.stuNum)
		return res.json(message.UNCOMPLETE_INPUT);
	
	new Promise((onFulfill,onReject)=>{
		StuInfoDao.getUserByStuNum(req.body.stuNum,(err,stu) => {
			if(err) onReject(message.MONGODB_ERROR);
			else if(stu) onReject(message.STUNUM_SIGNUP_ALREADY);
			else onFulfill();
		})
	})
	.then(() => {
		return new Promise((onFulfill,onReject)=>{
			StuInfoDao.newStuAndSave(req.body.stuName,req.body.stuNum, (err, stu) => {
				if(err){
					onReject(message.MONGODB_ERROR);
				}else{
					onFulfill(message.OPERATION_SUCCESS);
				}
			})
		})
	})
	.then((resultMsg) => {
		res.json(resultMsg);
	})
	.catch((errMsg) =>{
		res.json(errMsg);
	})
	
	
	
}
//验证学号接口
var verifyStuNum = function(req,res){
	let stuName = req.body.stuName;
	let stuNum = req.body.stuNum;
	if(!stuName || !stuNum){
		return res.json(message.UNCOMPLETE_INPUT);
	}
	new Promise((onFulfill,onReject)=>{
		//通过学号在学生信息集合里面查找学生
		StuInfoDao.getUserByStuNum(stuNum, (err, stu) => {
			if(err){
				onReject(message.MONGODB_ERROR);
			}else if(stu){
				if(stu.isSignup == 1){
					onReject(message.STUNUM_SIGNUP_ALREADY);
				}
				else if(stu.stuName == stuName){
					onFulfill();
				}else{
					onReject(message.STUNUM_NAME_UNMATCH);
				}

			}else{
				onReject(message.STUNUM_UNEXIST);
			}
		})
	})
	.then(()=>{
		return new Promise((onFulfill,onReject)=>{
			let isvalid = getRandomInt(6);
			//6位随机数用于判断在注册之前是否进过学号验证，设置在一天后过期
			redisClient.setex(stuNum,24*60*60,isvalid,function(err,response){
                if(err)
                    onReject(message.REDIS_ERROR);
                else                   	
                    onFulfill({statusCode:100,message:"验证通过",result:isvalid});                    
			})
		})
	})
	.then((resultMsg)=>{
		res.json(resultMsg);
	})
	.catch((errMsg)=>{
		logger.info(errMsg);
		res.json(errMsg);
	})

}


//注册接口
var signup = function(req, res) {

	let stuName = req.body.stuName;


	let stuNum = req.body.stuNum;
	let isValid = req.body.isValid;


	let phone = req.body.phone;
	let password = req.body.password;
	let userVerifyCode = req.body.verifyCode;
	//存放在服务器的验证码
	let verifyCode;
	let sex = req.body.sex || 0;
	let resultMsg;
	let errMsg;

	if(!stuName || !stuNum || !phone || !password || !isValid || (sex != 0 && sex != 1)){
		res.json(message.UNCOMPLETE_INPUT);
	}
	else {
		new Promise((onFulfill,onReject) => {
			//一个用户最多只有一个账号
			StuInfoDao.getUserByStuNum(stuNum, (err, stu) => {
				if(err)
				{
					onReject(message.MONGODB_ERROR);
				}
				else if(stu && stu.isSignup == 1)
				{
					onReject(message.STUNUM_SIGNUP_ALREADY);
				}
				else
					onFulfill();
			})
		})
		.then( () => {
			return new Promise((onFulfill,onReject)=>{
		
				//此处判断验证码是否正确
				redisClient.get(phone,function(err,res){
					
					if(err)
						onReject(err);
					else if(res != null){
						verifyCode = res.toString();
						if(verifyCode != null && userVerifyCode != verifyCode)
						 	onReject(message.VERIFYCODE_ERROR);
						else
							onFulfill();
					}
					else	
						onReject(message.VERIFYCODE_ERROR);
				})

				//onFulfill();
				
			})
		
		}).then(()=>{
   			return new Promise((onFulfill, onReject) => {
				//此处检查6位随机数判断该用户是否经过学号验证
				redisClient.get(stuNum,function(err,res){
				
					if(err)
						onReject(err);
					else if(res != null){
						let checkKey = res.toString();
						if(isValid != null && isValid != checkKey)
						 	onReject(message.AUTHENTICATION_FAILED);				 
						else
							onFulfill();
					}
					else	
						onReject(message.AUTHENTICATION_FAILED);	
				})
			})
		}).then(()=>{
   		 	return	new Promise((onFulfill, onReject) => {
				UserDao.getUserByPhone(phone, (err, user) => {
					if(err){
						onReject(message.MONGODB_ERROR);
					}else if(user){
						onReject(message.PHONE_ERROR);
					}else{
						onFulfill();
					}
				})
			})
		}).then(()=>{
			return new Promise((onFulfill, onReject) => {
				//漏洞，如果password是一个数组，将返回空对象
				//需要将密码进行md5加密算法处理再存入数据库
				//MD5可以把密码变成另外一个字符串，而且很难根据这个字符串
				//找回密码
				let encodePass;
				let md5 = crypto.createHash('md5');
				md5.update(password);
				encodePass = md5.digest('hex');
				logger.debug(encodePass);
				UserDao.newUserAndSave(phone, stuName, stuNum, encodePass, sex, (err, user) => {
					if(err){
						logger.debug(message.MONGODB_ERROR);
						onReject(message.MONGODB_ERROR)
					}else{
						onFulfill(message.REGISTER_SUCCESS);
					}
				})
			})
		}).then((resultMsg) => {

			res.json(resultMsg);
			//logger.debug('用户注册成功', resultMsg);

			//一个用户最多只有一个账号
			StuInfoDao.getUserByStuNum(stuNum, (err, stu) => {
				if(stu)
				{
					stu.isSignup = 1;
					stu.save();
				}
				else
				{
					console.log("error at signup:can not save stu info");
				}
			})
		}).catch((errMsg)=>{
			res.json(errMsg);
			logger.info(errMsg);
		})
	}
	
}
//发送验证码接口
var getVerCode = function(req, res) {

	let phone = req.body.phone;
	let type = req.body.type;
	let stuNum = req.body.stuNum;

	//console.log(type);
	if(!phone ||  (type != 0 && type != 1) || (!stuNum && type== 0) ) {
		res.json(message.UNCOMPLETE_INPUT);
		return;
	}
	if(!(/^1[3|4|5|7|8]\d{9}$/.test(phone)) ){
		return res.json({statusCode:-100,message:"手机号不正确"});
	}
	
	//type=0表示用户注册时发送验证码
	if(type == 0){
		new Promise((onFulfill,onReject) => {
			let isValid = req.body.isValid;
			if(!isValid)
				onReject(message.UNCOMPLETE_INPUT);
			//此处判断该用户是否合法
			redisClient.get(stuNum,function(err,response){
				if(err)
					onReject(message.REDIS_ERROR);
				else if(response != null){
					let checkKey = response.toString();
					if(isValid != null && isValid != checkKey)
					 	onReject(message.AUTHENTICATION_FAILED);
					else
						onFulfill();
				}
				else
					onReject(message.AUTHENTICATION_FAILED);
			})
		})
		.then(() => {
			return new Promise((onFulfill,onReject) =>{
				//通过验证才发验证码
				UserDao.getUserByPhone(phone, (err, user)=>{
					if(err) 
						onReject(message.MONGODB_ERROR);
					else if(!user) 
				 		onFulfill();
					else 
				   		onReject(message.PHONE_ERROR);
				})	
				onFulfill();	
			})				
		})
		.then(() => {
			return new Promise((onFulfill,onReject) =>{
				sendVerifyCode(true,phone,function(err,result){
					if(err)
						onReject(err);
					else{
						//发送成功将会有所记录
						//为了避免恶意用户随便调用发送短信接口
						//每24个小时内最多发送10次短信
						//为了避免键值重复（用户可能会找回密码）
						//我在手机号前加个'1'
						redisClient.get('1'+phone,function(err,response){
							
							if(err)
								console.log(err);
							else if(response != null){
								let errTimes =  parseInt(response.toString())+1;

								redisClient.setex('1'+phone,24*60*60,errTimes,function(err,response){
					                if(err){
					                	console.log(message.REDIS_ERROR);
					                    logger.err(err.message);
					                   // console.log(message.REDIS_ERROR);                   
					                }
								})
							}
							else	
								redisClient.setex('1'+phone,24*60*60,1,function(err,response){
					                if(err){
					                	console.log(message.REDIS_ERROR);
					                    logger.err(err.message);
					                }
					                                       
								})
						})
						onFulfill(result);
					}		
				})
			})		
		})
		.then((resultMsg) =>{
			res.json({statusCode:resultMsg.statusCode,message:resultMsg.message});
			//res.json({statusCode:100,message:"获取成功"});
		})
		.catch((err) => {
			logger.info(err);
			res.json(err);
		})
	}
	//type=1表示更改密码时发送验证码
	else if(type == 1){
		new Promise((onFulfill,onReject) => {
			UserDao.getUserByPhone(phone, (err, user) => {
				if(err) onReject(message.MONGODB_ERROR);
				else if(user) onFulfill();
				else onReject(message.USER_NOT_EXIST);
			})
		})
		.then(() => {
			return new Promise((onFulfill,onReject)=>{
				sendVerifyCode(true,phone,function(err,result){
					if(err)
						onReject(err);
					else{
						//发送成功将会有所记录
						//为了避免恶意用户随便调用发送短信接口
						//每24个小时内最多发送10次短信
						//为了避免键值重复（用户可能会找回密码）
						//我在手机号前加个'1'
						redisClient.get('1'+phone,function(err,response){
							
							if(err)
								console.log(err);
							else if(response != null){
								let errTimes =  parseInt(response.toString())+1;

								redisClient.setex('1'+phone,24*60*60,errTimes,function(err,response){
					                if(err){
					                	console.log(message.REDIS_ERROR);
					                    logger.err(err.message);
					                   // console.log(message.REDIS_ERROR);                   
					                }
								})
							}
							else	
								redisClient.setex('1'+phone,24*60*60,1,function(err,response){
					                if(err){
					                	console.log(message.REDIS_ERROR);
					                    logger.err(err.message);
					                }
					                                       
								})
						})
						onFulfill(result);
					}
							
				})
			})
			
		})
		.then((resultMsg) => {
			//res.json({statusCode:100,message:"获取成功"});
			res.json({statusCode:resultMsg.statusCode,message:resultMsg.message});
		})
		.catch((err) => {
			logger.info(err);
			res.json(err);
		})
	}
	
}
//登录接口
var login = function(req, res) {
	let phone = req.body.phone;
	let password = req.body.password;
	let errMsg;
	let resultMsg;
	if(!phone || !password){
		res.json(message.LOGIN_INFO_ERROR);
		return;
	}
	new Promise((onFulfill, onReject) => {
		UserDao.getUserByPhone(phone, (err, user) => {
			err &&  onReject(message.MONGODB_ERROR);
			!user  && onReject(message.USER_NOT_EXIST);
			user && onFulfill(user); 
		})
	})
	.then((user)=> {

		return new Promise((onFulfill, onReject) => {
			
			let encodePass;
			let md5 = crypto.createHash('md5');
			md5.update(password);
			encodePass = md5.digest('hex');	
			//先将请求的密码md5，再跟数据库的密码匹配	
			if(user.password === encodePass){
				user.lastLoginTime = new Date();
				user.save();
				//如果输入密码正确，将当天错误的次数清0
				redisClient.expire('0'+phone,'3');
				onFulfill(user._id)	
			}else{
				//为了避免穷举攻击有必要对用户写错密码的次数进行限制：
				//每十二个小时内最多填错10次密码
				//为了避免键值重复（用户可能会找回密码）
				//我在手机号前加个'0'
				redisClient.get('0'+phone,function(err,response){
					
					if(err)
						console.log(err);
					else if(response != null){
						let errTimes =  parseInt(response.toString())+1;

						redisClient.setex('0'+phone,12*60*60,errTimes,function(err,response){
			                if(err)
			                    console.log(message.REDIS_ERROR);                   
						})
					}
					else	
						redisClient.setex('0'+phone,12*60*60,1,function(err,response){
			                if(err)
			                    console.log(message.REDIS_ERROR);                   
						})
				})
				
				onReject(message.PASSWORD_ERROR);
			}
		})
	})
	.then((userId)=> {
		userId = userId.toString();
		genToken(userId, (err, token) => {
			err && res.json(message.GEN_TOKEN_ERROR);
			resultMsg = {statusCode: 102, 
						 message: message.LOGIN_SUCCESS, 
						 result: {
						 	userId: userId,
						 	token: token
						 }};
			res.json(resultMsg);
		})	
	})
	.catch((errMsg) => {

		res.json(errMsg);
		logger.info(errMsg);
	})
}

//注销登录 主要的动作是把token删除掉了
var logout = function(req, res) {
	
	let userId = req.body.userId || req.headers.xkey;
	if(userId){
		delToken(userId, (err, reply) => {
			if(err){
				logger.error('Redis 数据库错误：' + err);
				res.json({statusCode: -1014, message: message.REDIS_ERROR});
			}else{
				res.json({statusCode: 100, message: message.OPERATION_SUCCESS});
			}
		})
	}else{
		res.json({statusCode: 100, message: '用户未登陆'});
	}
}
//查找个人信息通过type字段区分，type=me为查找自己的信息
//type=he为查找他人信息
var getInformation = function(req,res,type){
	let userId = req.body.userId ;//|| req.headers.xkey;
	let query;
	if(!userId)
		return res.json(message.UNCOMPLETE_INPUT);
	if(type == 'me')
		query = '-frozen -scores -check';
	else if(type == 'he')
		query = '-phone -frozen  -message -password -check -frozen -scores';
	UserDao.getUserByQuery(
		{'_id':userId,'frozen':1},
		query,
		//'weChat qq skills',
		{},
		(err, user) => {
				if(err)  
					res.json(err.message);//message.MONGODB_ERROR);
				else if(!user) 
					res.json(message.USER_NOT_EXIST);
				else {     res.json({statusCode: 100, 
							  message: message.OPERATION_SUCCESS, 
							  result: {
							  	userInfo: user
				  			  }
				  			})
				 }
			});
			
		
	//})
}
//获取自己的信息 几乎把所有数据都返回了
var getMyInfo = function(req, res) {
	getInformation(req,res,'me');
}

//查看他人信息
var getInfo = function(req, res) {
	getInformation(req,res,'he');
}

//查看用户排名表,返回用户所有信息
var rank =function(req,res){
	let rankBy = req.body.rankBy;
	if( req.body.start_num<0  || req.body.page_size<0  || _.isEmpty(rankBy) || (rankBy != 'scores' && rankBy != 'coin'))
	{
		return res.json(message.PARAMS_ERROR);
	}
	let start_num = req.body.start_num || 0;
	let page_size = req.body.page_size || 10;
	let query = {frozen:1};
	let field = {stuName:1,stuNum:1,coin:1,avatar:1,finalScore:1};
	let option;
	if(rankBy == 'scores')
  			option = {limit:Number(req.body.page_size),sort:{'finalScore':-1},skip:Number(req.body.start_num)};
	else if(rankBy == 'coin')
  			option = {limit:Number(req.body.page_size),sort:{'coin':-1},skip:Number(req.body.start_num)};	
	UserDao.getUsersByQuery(query,field,option,function (err,users) {
		err && res.json(message.MONGODB_ERROR);
		users && res.json({statusCode:100,message:'success',result:users});
	});
	
}


//用户签到，每日签到时间币+1，连续7天签到时间币额外+3
var checkin = function(req,res){
	var userId = req.body.userId;
	var coins = 1;
	var now = new Date();
	//规格化时间为月/日/年,用于计算最后签到日期和当前日期的天数差
	var now=now.toLocaleDateString();
	//根据userId在数据库里面查找
	UserDao.getUserById(userId,function(err,user){
		if(err) logger.error('checkin接口出错：' + err) && res.json(message.USERID_ERROR);
		
		else if(!user) res.json(message.USER_NOT_EXIST);
		
		else{
			//如果用户没有签到记录
			if(user.check.checkDate.length == 0){
				user.check.checkLog = 1;
				user.check.checkDate.push(now);
				user.check.lastDate = now;
				user.coin += coins;
				user.save(function(err,result){
					if(err){
						logger.error('checkin接口出错：' + err);
						res.json(message.MONGODB_ERROR);
					} 
					else{
						res.json({statusCode:100,message:message.OPERATION_SUCCESS,result:coins});
					}
				});
		
			}
			//如果这个用户之前签过到
			else{
				var dif = (Date.parse(now) - Date.parse(user.check.lastDate));
				var difDays = dif/86400000;
				if(difDays<0){
					res.json(message.CHECKDATE_ERROR1);
				}
				//当天已签到
				else if(difDays==0){
					res.json(message.CHECKDATE_ERROR2);
				}
				else{
					//昨天和今天都签到了
			 		if(difDays==1){
						user.check.checkLog++;
						if(user.check.checkLog==7){
							coins = 4;
							user.check.checkLog=0;
						}
					}
					else{
						user.check.checkLog = 1;
					}

					user.check.checkDate.push(now);
					user.check.lastDate = now;
					user.coin += coins;
					user.save(function(err,result){
						if(err){
							logger.error('checkin接口出错：' + err);
							res.json(message.MONGODB_ERROR);
						} 
						else{
							res.json({statusCode:100,message:message.OPERATION_SUCCESS,result:coins});
						}
					});
				}

			}
		}
	})
}

//与我相关的帖子，包括我收藏的帖子、参与的帖子和我发布的帖子，由type字段确定
var myPosts = function(req,res,type){
	let info = req.body;
	info.start_num = info.start_num||0;
	info.page_size = info.page_size||10;
	let query;
    new Promise(function(resolve, reject) {
    	
        if(_.isEmpty(info.userId)||
            _.isEmpty(info.type)||
            _.isEmpty(info.status)||
            _.isEmpty(info.start_num)||
            _.isEmpty(info.page_size))
        {
        	
            reject(message.UNCOMPLETE_INPUT);
        } 
        else if(
        	
            (!((info.type==1||info.type==0||info.type==2)&&
            (info.status==1||info.status==0||info.status==2
            ||info.status==3 || info.status == 4 || info.status == 5
            ||info.status==6)))
        ){
            reject(message.POST_TYPE_ERROR);
        }else{
        	
            resolve(info);
        }
       
    })
    .then(function(info) {
    		//console.log(1);
        	return new Promise((onFulfill,onReject) => {
        		
        		if(type == 'favo')
        		{
        		 	query ={lock:0,"favorUser.userId" : info.userId};
        			 if(info.status==0){
              	 	 query.status = {"$in":["0","1","2","5"]};
           			 }else if(info.status==1 || info.status==2){
              			  query.status = parseInt(info.status) + 2;
            		}
            		else //if (info.status==3)
               			 query.status = {"$in":["0","1","2","5","3","4"]};


            		if(info.type!=2){
              			 query.postType = info.type;
            		}
        		}
        		if(type == 'pub')
        		{
        			
        			 query ={lock:0,publisher : info.userId};
           
            		if(info.status==0){
                  	  //query.status = {"$in":["1","2"]};//,"5"]};
          		    	query.status = 2;
          		    }else if(info.status==3){
                		query.status = 7;
            		}else if(info.status == 4){
            			query.status = 0;
            		}
            		else if(info.status == 5){
            			query.status = {"$in":["0","1","2","3","4","5","7"]};
            		}
            		else if(info.status == 1){
                  		 // query.status = parseInt(info.status)+2;
           			 	query.$or = [{status:3},{"$and":[{status:5},{scoreStatus:1}]},{"$and":[{status:5},{scoreStatus:3}]}];
           			 }
           			 else if(info.status == 6){
           			 	query.$or = [{"$and":[{status:5},{scoreStatus:0}]},{"$and":[{status:5},{scoreStatus:2}]}];
           			 }
           			 else if(info.status == 2){
           			 	//query.status = {"$or":[{}]};
           			 	
                  		  query.status = parseInt(info.status)+2;
           			 	//}
           			 }
           			 else {
           			 	onReject(message.POST_TYPE_ERROR);
           			 }
           			 if(info.type!=2){
              				 query.postType = info.type;
           			 }
        		}
        		if(type == 'join')
            	{
            		
            		//query = {lock:0,"participant.userId" : info.userId};
            		if(info.status==0){
            			query = {lock:0,"participant.userId" : info.userId,"participant.status":{"$in":["0","1"]} };
           			 }else if(info.status==2){
           			 	query = {lock:0,"participant.userId" : info.userId,"participant.status":parseInt(info.status)+3 };
               			
            		 }else if(info.status == 1 ||　info.status == 3){
                		query = {lock:0,"participant.userId" : info.userId,"participant.status": parseInt(info.status)+1 };
            		 }
            		 else if(info.status == 4){
            		 	query = {lock:0,"participant.userId" : info.userId,"participant.status": {"$in":["0","1","2","4","5"]} };
            		 }
            		 else {
           			 	onReject(message.POST_TYPE_ERROR);
           			 }
           			if(info.type != 2){
              			 query.postType = info.type;
            		}
            		console.log(query);
            	}
            	
            	//console.log(query);
            	let option = {limit:Number(info.page_size),sort:{'pubTime':-1},skip:Number(info.start_num)};
            	PostDao.getPostsByQuery(query,null,option,function (err,posts) {
            		//console.log(posts);
            		//console.log(posts.length);
                	if(err){
                 	   onReject(message.MONGODB_ERROR);
               		 }else if(!posts||posts.length==0){
                  		onReject(message.OPERATION_SUCCESS);
                	}else {
                   		onFulfill(posts);
               		 }
            	})
            })


    })
    .then((posts) => {
    	//console.log(2);
    	 PostDao.getPostsLengthByQuery(query,null,null,function (err,length) {
            if(err){
            	
                onReject(message.MONGODB_ERROR);
            }
            else {
            	
                posts.forEach(function(item){
                	if(item.publisherInfo != null){
                		item.publisherName = item.publisherInfo.stuName;
	                    item.publisherAvatar = item.publisherInfo.avatar;
	                    item.publisherScore = item.publisherInfo.finalScore.toFixed(1);
	                    item.save();
                	}
                })
              
                res.json({statusCode: 100, message: message.OPERATION_SUCCESS, result:posts ,result_count:length});
            }
        })
      
    }).catch(function (err) {
    	//console.log('err');
    	logger.info(err);
     	res.json(err);
    })
}

//我收藏的帖子
var myFavoPosts = function(req,res){
	myPosts(req,res,'favo');
}
//我发布的帖子
var myPubPosts = function(req,res){
	myPosts(req,res,'pub');
}
//我参与的帖子
var myJoinPosts = function(req,res){
	myPosts(req,res,'join');
}

//修改密码，检查密码是否一致，然后检查手机验证码，如果相符修改数据库
var updatePass = function(req,res){
	//获取手机验证码以及修改的密码
	var phone = req.body.phone;
	var verifyCode = req.body.verifyCode;
	var password = req.body.password;
	
	if(_.isEmpty(password) || _.isEmpty(phone)|| _.isEmpty(verifyCode))
	{
		return res.json(message.UNCOMPLETE_INPUT);
	}
	
		//检查用户验证码
		new Promise(function(resolve,reject){

			//检查验证码
			redisClient.get(phone,function(err,res){
				if(err)
					reject(err);
					
				else if(res != null){
					let trueCode = res.toString();
					if(verifyCode==trueCode){
						resolve();
					}
					else{
						reject(message.VERIFYCODE_ERROR);
					}
				}
				else{
					reject(message.VERIFYCODE_ERROR);
				}
			});
		})
		.then(function(){
			return pGetUserByPhone(phone);
		})
		.then(function(user){
				return new Promise( function(resolve,reject){
					let encodePass;
					let md5 = crypto.createHash('md5');
					md5.update(password);
					encodePass = md5.digest('hex');
					user.password = encodePass;
					user.save(function(err){
						if(err){
							logger.error('updatePass接口出错：' + err);
							reject(message.MONGODB_ERROR);
						} 
						else
							resolve();
					})
				})
		})
		.then(function(){
			res.json(message.OPERATION_SUCCESS);
		})
		.catch(function(errMsg){
			logger.info(err);
			res.json(errMsg);
			
		})
	
}

//修改个人资料
var update = function(req,res){
	var body = req.body;
	if(_.isEmpty(body.userId)){
		res.json(message.UNCOMPLETE_INPUT);
	}
	else{
		//手机验证码检查
		UserDao.getUserById(body.userId,function(err,user){
			if(err){
				logger.error('update接口出错：' + err);
				res.json(message.MONGODB_ERROR);
			} 
			else{
				//昵称，长号，短号，qq,wechat,skills(个人简介),sex
				if(!_.isEmpty(body.stuName)){
				user.stuName = body.stuName;
				}
				//目前不允许修改密码
				// if(!_.isEmpty(body.phone)){
				// user.phone = body.phone;
				// }
				if(!_.isEmpty(body.phone_short)){
				user.phone_short = body.phone_short;
				}
				if(!_.isEmpty(body.qq)){
				user.qq = body.qq;
				}
				if(!_.isEmpty(body.wechat)){
				user.wechat = body.wechat;
				}
				if(!_.isEmpty(body.skills)){
					user.skills = body.skills;
				}
				if(!_.isEmpty(body.sex) && (body.sex == 0 || body.sex == 1)){
					user.sex = body.sex;
				}
				user.save(function(err){
					if(err){
						logger.error('update接口出错：' + err);
						res.json(message.MONGODB_ERROR);
					} 

					else {
						
						res.json(message.OPERATION_SUCCESS);
					}
				})
			}
			
		})
	}
}

//获取三张默认头像
var getDefaultAvatar = function(req,res){
	res.json({statusCode:100,message:message.OPERATION_SUCCESS,result:config.defaultAvatar});
}

//single表示只上传一张头像
//var upload = multer(getOptions('avatar')).single('avatar');
var avatar= function(req,res){
    /*upload(req,res,function(err){
        if(err || _.isEmpty(req.file)) {
          
			return res.json(message.UPLOAD_FILE_ERROR);
        }
        console.log(req.body.userId);*/
        	
        
		//获取裁剪参数,flag 是是否成功截图的标记
   		 let x = req.body.x || 0,
      	 y = req.body.y || 0,
      	 height = req.body.height || 50,
      	 flag =0;
      	 let userId = req.body.userId || req.headers.xkey;

      	 new Promise(function(resolve,reject){

      	 	if(x >= 0 && y >= 0  && height > 0 )
   	   		{
   	   			resolve();
   	   		}
   	   		else{
   	   			
   	   			reject(message.PARAMS_ERROR);
   	   		}
   	   	})
      	.then(function(){
      		return new Promise(function(resolve,reject){
      			gm(req.file.path).size(function(err,value){
    				if(err||_.isEmpty(value))
    				{
    					logger.error('avatar接口出错：' + err);
           				 reject(message.GM_ERROR);
    				}
    				else{
    					
    					resolve(value);
    				}
    			})
      		})
      	})
      	.then(function(value){
      		return new Promise(function(resolve,reject){
      			gm(req.file.path).resize(value.width,value.height).crop(height,height,x,y).write(req.file.path,function(err) {
        				if(err){
        					logger.error('avatar接口出错：' + err);		
            				reject(message.GM_ERROR);
       	 				}
       	 				else
       	 					resolve();
       	 				
      			})
      		})
      	})
      	.then(function(){
      		return pGetUserById(userId);
      	})
 		.then(function(user){
 			
 			//删除用户以前的头像,但是不能删除系统默认的三张头像
       		let index1 = config.defaultAvatar.indexOf(user.avatar);
       		if(!_.isEmpty(user.avatar) && index1 == -1){
       			
       			fs.unlink('C:/Users/301/Desktop/tbApi/public/'+user.avatar,function(err){
       				if(err)
       									
       					logger.error('avatar接口出错：' + err);
       			
       			})
       		}
			
       		user.avatar = '/avatar/'+ req.file.filename;
       		user.save(function(err){
       			if(err){
       				logger.error('avatar接口出错：' + err);
       				reject(message.MONGODB_ERROR);
       			}
       			else{
       				res.json({statusCode: 100, message: message.OPERATION_SUCCESS, result: user.avatar});
       			}

       		})
 		})
 		.catch(function(err){
 			
 			fs.unlink(req.file.path,function(err){
    			if(err) 
    				logger.error('avatar接口出错：' + err);
    		});
    		logger.info(err);
 			res.json(err);
 		})
         	
        
        
   // })
}
          
var multi = function(req,res){
	uploadMultiPics(req,res,function(err,result,body){
		if(err)
			res.json(err);
		else{
			console.log(body);
			res.json(result);
		}
	})
}
exports.multi = multi;

//获取评分状态
var getScoreStatus = function(userId,postId,cb){
	PostDao.getPostById(postId,function(err,post){
		var status = {};
		if(err){
			//cb({statusCode: -1036, message: message.POSTID_ERROR, result:''});
			status.code = -1036;
			status.message = message.POSTID_ERROR;

			//cb(status);
		} 
		else if(_.isEmpty(post)){
			//cb({statusCode: -1037, message: message.POST_NOT_EXIST, result:''})
			status.code = -1037;
			status.message = message.POST_NOT_EXIST;
		}
		else if(post.status != 5){
			//cb({statusCode: -1038, message: message.TASK_NOT_FINISHED, result:''});
			status.code = -1038;
			status.message = message.TASK_NOT_FINISHED;
		}
		else{
			var scoreStatus = post.scoreStatus;
			var flag = 0;
			post.participant.forEach(function(item){
				if(item.userId == userId)
					flag = 1;
			});
			if(scoreStatus ==3){
				//cb({statusCode: -1039, message: message.SCORE_FINISHED, result:''});
				status.code = -1039;
				status.message = message.SCORE_FINISHED;
			}
			else if(scoreStatus == 0){
				//cb({statusCode: -1040, message: '双方尚未评分', result:''});
				status.code = 0;
				status.message = '双方尚未评分';
			}
			else if((scoreStatus == 1 && userId == post.publisher) || (scoreStatus == 2 && flag == 1))
			{
				//cb({statusCode: 100, message: '你已经评分', result:''});
				status.code = -1;
				status.message = '你已经评分';
			}
			else if((scoreStatus == 1 && flag == 1) || (scoreStatus == 2 && userId == post.publisher)){
				//cb({statusCode: 100, message: '对方等待你评分', result:''});
				status.code = 1;
				status.message = '对方等待你评分';
			}
			else{
				//cb({statusCode: -100, message: '评分逻辑出错', result:''});
				status.code = -2;
				status.message = '评分人不是发布人也不是任务人';
			}

		}
		cb(status);
	})	
}
var getEvaluateStatus = function(req,res){
	getScoreStatus(req.body.userId,req.body.postId,function(status){
		res.json({statusCode: status.code, message: status.message, result:''});
	})
}
exports.getEvaluateStatus = getEvaluateStatus;
//用户评分
var grade = function(req,res){
	let body = req.body;
	if(_.isEmpty(body.userId)||
            _.isEmpty(body.target)||
            _.isEmpty(body.postId)||
            _.isEmpty(body.score)){
		return res.json(message.UNCOMPLETE_INPUT);
	}
	if(parseInt(body.score)<0)
		req.body.score = 0;
	if(parseInt(body.score)>5)
		req.body.score = 5;
	
	let p1 = pGetUserById(req.body.userId);

	let p2 = pGetUserById(req.body.target);

	var p3 =pGetPostById(req.body.postId);
	//当userId，targetId,postId都存在的时候
	Promise.all([p1,p2,p3]).then(function(result){
		return new Promise(function(resolve,reject){
			let post = result[2];
			if(post.status != 5)
			{
				reject(message.TASK_NOT_FINISHED);
			}
			else{
				//如果评分人是参与人，flag = 1
				let flag = 0;
				post.participant.forEach(function(item){
					if(item.userId == result[0]._id)
						flag = 1;
					if(item.userId == result[1]._id)
						flag = 2;
				});
				if(post.scoreStatus == 3){
					reject(message.SCORE_FINISHED);
				}
				else if(result[0]._id != result[2].publisher && flag == 0){
					reject(message.GRADE_ERROR);
				}
				else if((result[0]._id == result[2].publisher && result[2].scoreStatus == 1) 
					|| (flag == 1 && result[2].scoreStatus == 2)){
					reject(message.GRADE_ERROR);
				}
				else if( (result[0]._id == result[2].publisher && flag == 2 ) || (result[1]._id == result[2].publisher && flag == 1) )
				{
					resolve(result);
				}
				else
				{
					reject(message.GRADE_ERROR);
				}

			}
		})
	})
	.then(function(result){
		return new Promise(function(resolve,reject){
			let user = result[0],
			target = result[1],
			post = result[2];
			//深拷贝与浅拷贝
			let temp = post;
			//如果评分人是参与人，flag = 1
			let flag = 0;
			post.participant.forEach(function(item){
				//只有参与人的状态为4才可以评分
				if(item.userId == user._id && item.status == 4)
					flag = 1;
			});
			if(user._id == post.publisher && post.scoreStatus == 0){
				post.scoreStatus = 1;
			}
			else if(flag == 1 && post.scoreStatus == 0){
				post.scoreStatus = 2;
			}
			else if((user._id == post.publisher && post.scoreStatus == 2) || (flag == 1 && post.scoreStatus == 1)){
				post.scoreStatus = 3;
				post.status = 3;
				post.participant.forEach(function(item){
					if(item.status == 4)
						item.status = 2;
				})
			}
			else{
				logger.error('grade接口出错：评分逻辑错误');
				reject(message.GRADE_ERROR);
			}
			let item = {
				isValidate : 1 ,                      //0无效|1默认有效
        		postId  : post._id,                 //来自哪个帖子的评分
        		fromUser :  user._id,                  //(_id)
        		score    : req.body.score,             //(0-5 0.5间隔)
       			time     : new Date()			
			}
			target.scores.push(item);
			//刷新finalScore
			target.finalScore = getFinalScore(result[1].scores);
			post.save(function(err){
				if(err) {
					logger.error('grade接口出错：' + err);
					reject({statusCode:-1015,message:message.MONGODB_ERROR,result:''});	
				}
				resolve([target,post,temp]);
			})
		})
	})
	.then(function(result){
		let target = result[0];
		let post = result[1];
		let temp = result[2];
		target.save(function(err){
			if(err){
				logger.error('grade接口出错：' + err);
				//事务回滚
				post = temp;
				post.save(function(err){
					if(err){
						logger.error('grade接口出错：事务回滚出错');
						reject(message.ROLLBACK_ERROR);
					}
					else{
						logger.error('grade接口出错：mongoDB出错');
						reject({statusCode:-1015,message:message.MONGODB_ERROR,result:''});
					}
				})
			} 
			else{
				res.json(message.OPERATION_SUCCESS);
			}
								
		})
		
	})
	.catch(function(err){

		res.json(err);
		logger.info(err);
	})	
}
//标记已读消息
var markRead = function(req,res){
	var userId = req.body.userId;
	var msgId = req.body.msgId;
	if(_.isEmpty(userId) || _.isEmpty(msgId)){
		return res.json(message.UNCOMPLETE_INPUT);
	}
	pGetUserById(userId)
	.then((user)=> {
		return new Promise((resolve,reject)=>{
			_.isEmpty(user.message) && reject(message.USER_NOT_MSG);
			//flag标记是否找到匹配消息
			let flag = 0,
			l =user.message.length;
			let item;
			for(let i = 0 ; i < l; ++i){
					item = user.message[i];
					if(item._id == msgId){
						flag = 1;
						if(item.read == 1){
							resolve(message.OPERATION_SUCCESS);
					
						}
						else if(item.read == 0){
							item.read = 1;
							user.save(function(err){
								if(err){
									logger.error('markRead接口出错：' + err);
									res.json(message.MONGODB_ERROR);
								}
								else
								resolve(message.OPERATION_SUCCESS);
							})
					
						}
						break;
					}
			}
			if(flag == 0){
				reject(message.MSG_NOT_EXIST);
			}
		})
	})
	.then((result)=>{
		res.json(result);
	})
	.catch((errMsg)=>{
		res.json(errMsg);
		logger.info(errMsg);
	})
	
	
}
//用于消息的排序
// General comparison function for convenience
function compare(x, y) {
  if (x === y) {
    return 0;
  }
  return x > y ? 1 : -1;
}


//获取消息
var getMsg = function(req,res){
	var userId = req.body.userId || req.headers.xkey;
	
	
	UserDao.getUserById(userId,(err, user) => {
		if(err){
					logger.error('getMsg接口出错：' + err);
					return res.json(message.MONGODB_ERROR);
		}
		if(!user) return res.json(message.USER_NOT_EXIST);
					
				
		//先按read排，再按date排序
		user.message.sort(function(x,y){
			if(x.read != y.read)
				return compare(x.read,y.read);
			return compare(Date.parse(y.date),Date.parse(x.date));
		})
		//只筛选前面20条信息
		let end = 20>user.message.length?user.message.length:20;
		//console.log(end);

		let message1 = user.message.slice(0,end);
		//console.log(message1.length);
		let readStatus = _.countBy(message1,function(item){
			return item.read == 0 ? 'unread': 'read';
		})		

		/*if(message1.length == readStatus.read){
			readStatus.unread = 0;
		}*/
		//console.log(readStatus);
		//console.log(readStatus.unread);
		/*console.log({statusCode: 100, 
		  message: message.OPERATION_SUCCESS, 
		  result:{
		  	unReadNum:readStatus.unread,
		  	msgList: message1
		  }
		});*/
		res.json({statusCode: 100, 
		  message: message.OPERATION_SUCCESS, 
		  result:{
		  	unReadNum:readStatus.unread,
		  	msgList: message1
		  }
		});
					
				
	})
	
}

			
//查找跟关键字相关的用户和帖子
var search = function(req, res) {
	let type = req.body.type;
	let keyword = req.body.keyword;
	let start_num = req.body.start_num || 0;
	let page_size = req.body.page_size || 10;
	let query;
	let errMsg;
	let result;
	//搜索用户姓名学号，帖子标题内容
	var userField = {stuName:1,stuNum:1,coin:1,avatar:1,skills:1,finalScore:1,sex:1};
	var postField = {title:1,content:1,publisherName:1,status:1,pubTimeL:1,favorCount:1,coinBank:1,commentNum:1,publisherInfo:1,publisherAvatar:1};
	var userQuery = {frozen:1,"$or":[{"stuName": new RegExp(keyword, 'i')},{"stuNum": new RegExp(keyword, 'i')}]};
	var postQuery = {lock:0,"$or":[{"title": new RegExp(keyword, 'i')},{"content":new RegExp(keyword, 'i')}]};
	var p1 = new Promise(function(resolve,reject){
		UserDao.getUsersByQuery(userQuery,userField,{skip: Number(start_num), limit: Number(page_size)},(err, users_list)=>{
			if(err){
				logger.error('search接口出错：' + err);
				reject(message.MONGODB_ERROR);	
			}
			else{
				resolve(users_list);
			}
		})
	})
	var p2 = new Promise(function(resolve,reject){
		PostDao.getPostsByQuery(postQuery,postField,{skip: Number(start_num), limit: Number(page_size)},(err, posts_list)=>{
			if(err){
				logger.error('search接口出错：' + err);
				reject(message.MONGODB_ERROR);	
			}
			else{
				//对输出的post进行处理，使得post里面与user有关的数据同步
				posts_list.forEach(function(item){
                        		item.publisherName = item.publisherInfo.stuName;
                        		item.publisherAvatar = item.publisherInfo.avatar;
                        		item.save();
                });
				resolve(posts_list);
			}
		})
	})

    Promise.all([p1,p2]).then(function(list){
    	res.json({statusCode:100,message:message.OPERATION_SUCCESS,result:list});
    })
    .catch(function(err){
    	logger.info('search接口出错：' + err);
    	res.json(err);
    })	
}
//获取网上商城的URL
var getURL = function(req, res) {
	res.json({url:'http://210.39.12.70:3000/mall/mall.html',showBtn:true});
}
//获取网上商城的商品
var getItems = function(req,res){
	console.log(req.body.start_num);
	let start_num = req.body.start_num || 0;
	let page_size = req.body.page_size || 10;
	let sortBy = req.body.sortBy || 'time_to_market';
	//console.log(sortBy);
	let query = {isDelete:false};
	let field = {isDelete:0};
	let option;
	 
	if(sortBy == 'price')
		option = {skip: Number(start_num), limit: Number(page_size),sort:{price:-1}}; 
	else{
		option = {skip: Number(start_num), limit: Number(page_size),sort:{time_to_market:-1}};
	}

	ItemDao.getItemsByQuery(query,field,option,(err,items)=>{
		if(err)
			res.json(message.MONGODB_ERROR);
		else
			res.json({statusCode:100,message:'获取成功',result:items});
	});
}
exports.getItems = getItems;
exports.buy = buy;
exports.getURL = getURL;
exports.myFavoPosts = myFavoPosts;
exports.myJoinPosts = myJoinPosts;
exports.myPubPosts = myPubPosts;

exports.insertStu = insertStu;
exports.verifyStuNum = verifyStuNum;
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.getMyInfo = getMyInfo;
exports.rank = rank;
exports.getVerCode = getVerCode;
exports.getInfo = getInfo;
exports.checkin = checkin;
exports.updatePass = updatePass;
exports.update = update;
exports.avatar = avatar;
exports.grade = grade;
exports.markRead = markRead;
exports.getMsg = getMsg;
exports.getDefaultAvatar = getDefaultAvatar;
exports.search = search;


