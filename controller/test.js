"use strict";
const ApplicationDao = require('../dao/index').ApplicationDao;
const xlsx = require('node-xlsx');
//const mime = require('mime');
const moment = require('moment');
const fs = require('fs');

var exportToExcel = function(){
    console.log('hefadfllo');
    ApplicationDao.getRegisterByStuNum('2014150212',(err,register_list)=>{
        console.log('hello');
        if(err)
            console.log(err);
        else{
            console.log('hello');
            let data = [];
            data = register_list.map((p)=>{
                let post = [];
                post.push(p._id.toString());
                post.push(p.college);
                post.push(p.grade);
                post.push(p.name);
                post.push((p.sex==0)?'男':'女');
                post.push(p.stuNum);
                post.push(p.phone);
                post.push(moment(p.applyDate).format('YYYY-MM-DD:hh:mm:ss'));
                post.push(p.wechat);
                console.log(post);
                return post;
            })
            data.unshift(['报名ID ','学院','年级','姓名','性别','学号','手机号','报名时间','微信']);
            let buffer = xlsx.build([{name:"register_list",data:data}]);
            fs.writeFileSync('register_list.xlsx',buffer,'binary');
        }
    })
    console.log('wtf');
}
exportToExcel();
/*var User = require('../model/user').user;
console.log('wtf');
var getUsers = function () {
    console.log('dasf');
    User.findOne({stuName:'老罗先生'},function(err,users){
        if(err)
            console.log(err);
        if(users){
            users.forEach((item)=>{
                console.log(item);
            })
        }
        if(!user)
            console.log('fadsf');
    })
};
getUsers();*/
//var winston = require('winston');

/**
 * Winston logger config
 */
// winston.emitErrs = true;

// var logger = new winston.Logger({
//     transports: [
//         new winston.transports.File({
//             level: 'info',
//             name: 'info-file',
//             filename: '../logs/info-logs.log',
//           //  handleExceptions: true,
//             json: false,
//             colorize: true
//         }),
//         new winston.transports.File({
//             level: 'warn',
//             name: 'warn-file',
//             filename: '../logs/warn-logs.log',
//            // handleExceptions: true,
//             json: false,
//             colorize: true
//         }),
//         new winston.transports.File({
//             level: 'error',
//             name: 'error-file',
//             filename: '../logs/error-logs.log',
//             handleExceptions: true,
//             timestamp:true,
//             json: false,
//             colorize: true
//         }),
//         new winston.transports.File({
//             level: 'debug',
//             name: 'debug-file',
//             filename: '../logs/debug-logs.log',
//            // handleExceptions: true,
//             timestamp:true,
//             json: false,
//             colorize: true
//         }),
//         new winston.transports.Console({
//             level: 'debug',
//             handleExceptions: true,
//             prettyPrint: true,
//             json: false,
//             colorize: true
//         })
//     ],
//     exitOnError: false
// });
// logger.debug('hello guys');
// logger.debug({a:1});
/*var winston = require('winston');

winston.log('info','Hello distributed log files');


winston.add(winston.transports.File,{filename:'test.log'});
winston.handleExceptions(new winston.transports.File({ filename: 'exceptions.log' }))
a.for();
winston.level = 'debug';
winston.log('debug','now my debug message are',{anything:'thsi is metadata'});*/

/*new Promise((resolve,reject)=>{
    var a = b.c;
    if(a==1)
    {
         resolve();
       
    }
    if(a==2)
        reject();
})
.then(()=>{
    console.log('aaa');
})
.catch(()=>{
    console.log('bbb');
})*/
// var gm = require('gm');
// gm('C:\\Users\\301\\Desktop\\tbApi\\public\\images\\1469607452893.jpg').size(function(err,value){
// 		if(err)
// 			console.log(err);
// 		else
// 			console.log(value);
// 	})
//creating an image
// gm().size(function(err,value){
// 		if(err)
// 			console.log(err);
// 		else
// 			console.log(value);
// 	})
// var a = [1,2,3,4];
// a.forEach(function(item,index){
// 	console.log(item);
// 	if(index == 3)
// 	{
// 		return false;
// 	}
// })
// for(var item in a){
// 	console.log(a[item]);
// 	if(a[item] == 3){
// 		break;
// 	}
// }
// function getFinalScore(scores){
//     var finalScore,
//     totalScore = 0,
//     finalScore = 0;
//     var length = scores.length;
//     scores.forEach(function(score,index){
//         totalScore += score;
//     })
//     aveScore = totalScore / length;
//     finalScore = (length * aveScore + 30)/(length+10);
//     return finalScore;
// // }
// var redisClient = require('../db/redis').redisClient;
// var redis = require('../db/redis').redis;
// redisClient.setex("13025429718",120,"453389",function(err,result){
// 	if(err)
// 		console.log(err);
// 	else
// 		console.log(result);
// });
// redisClient.expire("13025429718",10);
// client.setex(key, 24*60*60, value, function(err, result) {
    //check for success/failure here
  // });
// const PostDao = require('../dao/index').PostDao;
// var Post = require('../model/post');

// Post.find({lock:0}).exec(function(err,result){
// 	console.log('adfa');
// 	if(err)
// 		console.log(err);
// 	else{
// 		console.log('adfa');
// 		console.log(result[0].publisher.stuName);
// 		console.log(result);
// 	}

// });
/*const config = require('../config/config.js');
 var msg = config.assignMsg;
        sendMsg('13025429718',msg,function(err,result){
            console.log(result);
            if(err)
                reject(err)
             //如果状态码（result.error）为0，说明发送成功，否则状态码为负数，发送失败
            else if(result.error==0){
                res.send({statusCode: 100, message: 'ok', result:''});
            }
            else {
                reject({status:result.error,message:result.msg,result:''})
            }
        })*/
/*"use strict";
let a = [1,2,34,5,6,2134,234];
console.log(a);
a.forEach(function(item,index){
    console.log('index='+index);
    if(item == 1){
        console.log(item);
        a.splice(index,1);
    }
})
console.log(a);*/
/*var _      = require('underscore');
var a = {};
console.log(a.b);
console.log(_.isEmpty(a.b));
console.log(_.isEmpty(null));
console.log(_.isEmpty(a));

console.log(typeof(5) == 'number');
*/
