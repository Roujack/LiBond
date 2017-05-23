"use strict";

const ApplicationDao = require('../dao/index').ApplicationDao;
const StuInfoDao = require('../dao/index').StuInfoDao;
const message = require('../config/message.js');
const moment = require('moment');
const fs = require('fs');
const xlsx = require('node-xlsx');
const mime = require('mime');


//添加一个报名信息
var insertRegister = function(req,res){
  return res.json({statusCode:-100,message:'报名已截止'});
	let body = req.body;
	let phone = body.phone;
	let sex = body.sex;
	if(!body.college || !body.name || body.sex==undefined || !body.stuNum ||
		!body.phone || !body.wechat || !body.grade) {
		return res.json({statusCode:-100,message:'报名信息不完整'});
	}
	if(!(/^1[3|4|5|7|8]\d{9}$/.test(phone)) ){
		return res.json({statusCode:-100,message:"手机号不正确"});
	}
	if(sex !=0 && sex != 1){
		return res.json({statusCode:-100,message:"性别不正确"});
	}
	//通过学号在学生信息集合里面查找学生
	StuInfoDao.getUserByStuNum(body.stuNum, (err, stu) => {
		if(err){
			return res.json(message.MONGODB_ERROR);
		}else if(stu){
			ApplicationDao.getRegisterByStuNum(body.stuNum,(err,register)=>{
				if(err){
					return res.json(message.MONGODB_ERROR);
				}else if(register){
					return res.json({statusCode:-100,message:'亲，你已经报名了噢'});
				}
				else{
					if(stu.stuName == body.name){
						ApplicationDao.insertRegister(body,(err,register)=>{
							if(err)
								res.json({statusCode:-100,message:'数据库出错'});
							else
								res.json({statusCode:100,message:'操作成功',result:register});
						});
					}
					else{
						return res.json(message.STUNUM_NAME_UNMATCH);
					}
				}
			})
			

		}else{
			return res.json(message.STUNUM_UNEXIST);
		}
	})
	
}

exports.insertRegister = insertRegister;

var exportToExcel = function(req,res){
   // console.log('hefadfllo');
    ApplicationDao.getApplicationsByQuery((err,register_list)=>{
        //console.log('hello');
        if(err)
            console.log(err);
        else{
           // console.log('hello');
            let data = [];
            register_list = arrayUnique(register_list);
            console.log(register_list);
            data = register_list.map((p)=>{
                let post = [];
               // post.push(p._id.toString());
                post.push(p.name);
                post.push(p.stuNum);
                post.push(p.college);
                post.push(p.grade);
                
                post.push((p.sex==0)?'女':'男');
                
                post.push(p.phone);
                //post.push(moment(p.applyDate).format('YYYY-MM-DD:hh:mm:ss'));
                post.push(p.wechat);
                //console.log(post);
                return post;
            })
            data.unshift(['姓名','学号','学院','年级','性别','手机号','微信']);
            let buffer = xlsx.build([{name:"register_list",data:data}]);
            //fs.writeFileSync('C:/永旺日语演讲比赛.xlsx',buffer,'binary');
            console.log('done');
            let now = moment().format('YYYYMMDDHHmmss');
			let filename = 'register_list_ ' + now + '.xlsx';
			let mimetype = mime.lookup(filename);
			res.setHeader('Content-disposition', 'attachment; filename=' + filename);
			res.setHeader('Content-type', mimetype);
			res.send(buffer);
            //res.json({message:'ok'});
        }
    })
   // console.log('wtf');
}
exports.exportToExcel = exportToExcel;

var getAll = function(req,res){
   // console.log('hefadfllo');
    ApplicationDao.getApplicationsByQuery((err,register_list)=>{
        //console.log('hello');
        if(err)
            res.json({statusCode:-100,message:err.message});
        else{
           // console.log('hello');
            let data = [];
            register_list = arrayUnique(register_list);
            res.json({statusCode:100,message:'获取成功',result:register_list});
        }
    })
   // console.log('wtf');
}
exports.getAll = getAll;

//去掉重复项  
var arrayUnique=function(arr){  
    var result=[];  
    var l=arr.length;  
    if(arr!=undefined && arr.length>0){  
       for(var i=0;i<l;i++){  
           var temp=arr.slice(i+1,l);
           var flag = false;
           temp.forEach((e)=>{
           	if(e.stuNum == arr[i].stuNum)
           		flag = true;
           }) 
           if(!flag)
           	result.push(arr[i]);  
       }  
    }  
    return result;  
}  