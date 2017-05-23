"use strict";
const uploadMultiPics = require('../library/tools.js').uploadMultiPics;
const sendVerifyCode = require('../library/tools.js').sendVerifyCode;
const sendMsg= require('../library/tools.js').sendMsg;
const checkParams= require('../library/tools.js').checkParams;
const pGetUserByPhone = require('../library/tools.js').pGetUserByPhone;
const pGetUserById = require('../library/tools.js').pGetUserById;
const pGetPostById = require('../library/tools.js').pGetPostById;

const logger = require('../library/winstonlogger.js');
const message = require('../config/message.js');
const UserDao = require('../dao/index').UserDao;
const PostDao = require('../dao/index').PostDao;
const TipDao  = require('../dao/index').TipDao;
const _ = require('underscore');
const config = require('../config/config.js');
var fs = require('fs');
//发布帖子
//减去用户金币
var publish = function(req, res){
    let postInfo = req.body;
    console.log(postInfo);
    checkParams([postInfo.userId,postInfo.postType,postInfo.topicType,
        postInfo.content,postInfo.missionCoin,postInfo.expTime])
    .then(function() {
       return new Promise(function (resolve,reject) {
            if(Number(postInfo.missionCoin)<=0 || !Number.isInteger(Number(postInfo.missionCoin))){
                    reject({statusCode:-100,message:'时间币参数不正确'});
            }
            else{
                UserDao.getUserById(postInfo.userId,function (err,user) {
                    //console.log(user.coin);
                   // console.log("missionCoin="+Number(postInfo.missionCoin));
                    if(err){
                       reject(message.USERID_ERROR);
                    }else if(!user){
                        reject(message.USER_NOT_EXIST);
                    } else if(Number(user.coin)<Number(postInfo.missionCoin)){
                        reject(message.UN_ENOUGH_COINS);
                    }
                    else{
                        postInfo.publisherAvatar=user.avatar;
                        postInfo.publisherName=user.stuName;
                        postInfo.publisherScore=user.finalScore.toFixed(1);
                        //当发布帖子时直接减去用户时间币
                        user.coin=user.coin-Number(postInfo.missionCoin);
                        PostDao.newPostAndSave(postInfo,function (err,post) {
                           // console.log(err+post);
                            if (err) {
                              reject(message.MONGODB_ERROR);
                            }else{
                               user.pubCount++;
                               user.save();
                               //console.log("dafaf="+post._id);
                               resolve(post._id);
                             }
                         })
                   }
               })
            }
           
       })
   }).then(function (postId) {
        res.json(message.OPERATION_SUCCESS); 
        let d = (new Date(postInfo.expTime)).getTime();
        d = d - Date.now();
        //console.log(d);
        setTimeout(function(){
             console.log('setTimeout');
           // console.log(postId);
            PostDao.getPostById(postId,(err,post)=>{
                if(post){
                    //如果帖子到了截止日期还没有人报名的话
                    //帖子将会自动取消
                    if(post.status == 0){
                        post.status = 4;
                        post.cancelReason = '帖子自动过期';
                        post.save();
                    }
                }
                else
                    console.log(err+' '+post);
            })
        },d);
  }).catch(function (errMsg) {
        
         res.json(errMsg);
          logger.info(errMsg);
        //删除图片
        req.files.forEach(function(photo,index){          
            fs.unlink(photo.path,function(err){
                if(err)
                    logger.error('上传多张图片接口出错：' + err);
            })
        }) 
        
  });	
}
//获取帖子详情
//已优化
var getPost = function(req, res){
 let postId = req.body.postId;
    if(_.isEmpty(postId)){
        return res.json(message.PARAMS_ERROR);
    }
    PostDao.getPostById(postId,function (err,post) {
        if(err){
            res.json(message.POSTID_ERROR);
            logger.error(err);
        }else if(!post){
            res.json(message.POST_NOT_EXIST);
        }else {
            post.publisherName = post.publisherInfo.stuName;
            post.publisherAvatar = post.publisherInfo.avatar;
            post.publisherScore = post.publisherInfo.finalScore.toFixed(1);
            post.save();
            //2016/10/31 by ajay
            //对帖子参与人过滤
            /*var participantNotCancel = new Array();
            post.participant.forEach(function(e){
                if(e.status!= 5)
                {
                    participantNotCancel.push(e);
                }
            });
            post.participant = participantNotCancel;*/
            //console.log(post);
            res.json({statusCode: 100, message: 'ok', result:post});
        }
    }) 
}
//获取所有帖子
//待改进
var getAll = function(req, res){
    var info = req.body;
    new Promise(function(resolve, reject) {
        if(_.isEmpty(info.type)||
            _.isEmpty(info.status)||
            _.isEmpty(info.start_num)||
             _.isEmpty(info.topicType)||
            _.isEmpty(info.page_size))
        {
            reject(message.UNCOMPLETE_INPUT);
        } else if((!(info.type==1||info.type==0||info.type==2))){
            reject(message.POST_TYPE_ERROR);
        }else{
            resolve(info);
        }
    }).then(function(info) {
        let option = {limit:Number(info.page_size),sort:{ 'priority':1,'pubTime':-1},skip:Number(info.start_num)};
        let query ={};
        
        //要进行对未审核帖子的过滤和挑选
        if(info.topicType==0)
            query = {lock:0,status:{"$in":["0","1"]}};
        else
            query = {lock:0,status:{"$in":["0","1"]},topicType:info.topicType};
        if(info.type!=2)
            query.postType =info.type;
        //可以考虑用索引
        if(info.sortBy=='missionCoin'){
            option.sort = {'missionCoin':-1};
        }
        if(info.sortBy == 'favorCount'){
            option.sort={'favorCount':-1};
        }
        PostDao.getPostsByQuery(query,null,option,function (err,posts) {
            if(err){
                res.json(message.MONGODB_ERROR);
            }else if(!posts){
                res.json(message.POST_NOT_EXIST);
            }else {
                //对过期的帖子进行过滤
                /*posts.forEach((post)=>{
                    if(post.status == 0 || post.status == 1|| post.status == 6){
                        let d = (new Date(post.expTime)).getTime();
                        d = d - Date.now();
                        if(d<0){
                            post.status = 4;
                            post.cancelReason = '帖子自动过期';
                            post.save();
                        }
                        
                    }
                });*/
                PostDao.getPostsLengthByQuery(query,null,option,function (err,length) {
                    if(err){
                        res.json(message.MONGODB_ERROR);
                    }
                    else {
                        let posts_list = [];
                       // console.log(length);
                        let cnt = 0;
                        //对输出的post进行处理，使得post里面与user有关的数据同步
                        posts.forEach(function(item){
                            if(item.participant.length==0){
                                //console.log(item);
                                item.publisherName = item.publisherInfo.stuName;
                                item.publisherAvatar = item.publisherInfo.avatar;
                                item.publisherScore = item.publisherInfo.finalScore.toFixed(1);
                                item.save();
                                posts_list.push(item);
                                ++cnt;
                            }
                            else
                                --length; 
                        });
                        //console.log(length);
                       // console.log(posts[0].publisherInfo.stuName);
                        res.json({statusCode: 100, message: 'ok', result:posts_list ,result_count:cnt});
                    }
                });
            }
        })
    })
    .catch(function (err) {
       
        res.json(err);
         logger.info(err);


    })
};

//收藏帖子与取消收藏帖子，通过flag确定
//已优化
var favoOperation = function(req,res,flag){
    let userId = req.body.userId;
    let postId = req.body.postId;
    checkParams([userId,postId]).then(function() {
        return pGetUserById(userId);
    }).then(function(user) {
        return new Promise((resolve, reject)=>{
            PostDao.getPostById(postId,function (err,post) {
                if(err){
                    reject(message.POSTID_ERROR);
                }else if(!post){
                    reject(message.POST_NOT_EXIST);
                }
                else if(post){
                    resolve({post,user});
                }
            })
        })
    })
    .then(function (postAnduser) {
        return new Promise((resolve,reject)=>{
            if(flag){
                let isFavo = false;
                for(let i = 0;i<postAnduser.post.favorUser.length;i++){
                    if(postAnduser.post.favorUser[i].userId == userId)
                        isFavo = true;
                }
                if(isFavo)
                {
                   reject(message.POST_ALREADY_FAVOR);
                }else{
                   postAnduser.post.favorCount++;
                   postAnduser.user.favorCount++;
                    postAnduser.post.favorUser.addToSet({
                        userId:userId,
                        date : new Date()
                    })
                    resolve(postAnduser);
                }
            }
            else{
                let isFavo = true;  //判断该用户是否已取消
               for(let i = 0;i<postAnduser.post.favorUser.length;i++){
                    if(postAnduser.post.favorUser[i].userId == userId)
                    {
                        isFavo=false;
                        postAnduser.post.favorUser.splice(i,1);
                        postAnduser.post.favorCount--;
                        postAnduser.user.favorCount--;
                        resolve(postAnduser);
                    }
                }
                //如果已被取消
                if(isFavo==true){
                    reject(message.POST_ALREADY_FAVORCANCEL);
                }
            }
        })
    }).then(function(postAnduser){
        postAnduser.post.save(function(err){
                if (err){
                    reject(message.MONGODB_ERROR);
                }else{
                    postAnduser.user.save(function(err){
                        if (err){
                            reject(message.MONGODB_ERROR);
                        }else{
                            res.json(message.OPERATION_SUCCESS);
                        }
                    })     
                }
            })  
    }).catch(function (err) {
        res.json(err);
        logger.info(err);
    })
}
//收藏帖子
var favo = function(req, res){
    favoOperation(req,res,true);
}
//取消收藏
var favorCancel = function(req,res){
    favoOperation(req,res,false);
}

//报名和确认任务人合一
var register = function(req,res){
    let registerId = req.body.registerId;
    let postId = req.body.postId;
    checkParams([registerId,postId]).then(function(){
        return pGetPostById(postId);
    }).then(function(post){
        return new Promise(function(resolve,reject){
            UserDao.getUserById(registerId,function(err,register){
                if(err){
                    reject(message.USERID_ERROR);
                }else if(!register){
                    reject(message.USER_NOT_EXIST);
                }else{
                    resolve({post,register});
                }
            })
        }) 
    }).then(function(PostRegister){
        return new Promise(function(resolve,reject){
            UserDao.getUserById(PostRegister.post.publisher,function (err,publisher){
                if (!publisher) {
                    reject(message.USER_NOT_EXIST);
                } else if (err) {
                    reject(message.USERID_ERROR);
                }else if(PostRegister.post.publisher.toString()==registerId.toString()){
                    reject(message.REGISTER_ERROR);
                }else{
                    let post=PostRegister.post;
                    let register=PostRegister.register;
                    resolve({post,register,publisher});
                }
            })
        }) 
    }).then(function(PostRegisterPublisher){
        return new Promise(function(resolve,reject){
            //console.log('adfaf='+PostRegisterPublisher.post);
            //判断是否已经有人报名
            if(PostRegisterPublisher.post.participant[0]!=null&&PostRegisterPublisher.post.participant[0].userId.toString()!=PostRegisterPublisher.register._id.toString())
                reject(message.REGISTER_ERROR);
            //判断是否报名过
            else if(PostRegisterPublisher.post.participant[0]!=null&&PostRegisterPublisher.post.participant[0].userId.toString()==PostRegisterPublisher.register._id.toString())
                reject(message.REGISTERED_ERROR);
            else{
                let d = (new Date(PostRegisterPublisher.post.expTime)).getTime();
                d = d - Date.now();
                if(d<0){
                    reject(message.POST_EXPIRED);
                }
                //对报名人的处理
                PostRegisterPublisher.register.joinCount++;
                PostRegisterPublisher.register.message.addToSet ({
                    messageType: 1,         //报名成功
                    date: new Date(),        //信息时间
                    content : {
                        userId: PostRegisterPublisher.post.publisher,      //信息触发者id
                        postId:PostRegisterPublisher.post._id,        //帖子id
                        userStuName:PostRegisterPublisher.post.publisherName,
                        postTitle:PostRegisterPublisher.post.title
                    }
                });

                //对帖子的处理
                PostRegisterPublisher.post.status=2;
                PostRegisterPublisher.post.participant[0]={
                    selected: 1 ,
                    finalScore :PostRegisterPublisher.register.finalScore.toFixed(1) ,
                    name:PostRegisterPublisher.register.stuName,
                    avatar:PostRegisterPublisher.register.avatar,
                    userId:PostRegisterPublisher.register._id,
                    partakeTime: new Date(),                        //参与时间
                    status : 1                                    //0 报名 | 1成为任务人 | 2完成任务 | 3取消
                };
                PostRegisterPublisher.post.coinBank =
                {
                    status :0,        // 0任务正在进行|1任务确认被完成|任务被取消了
                    fromId : PostRegisterPublisher.publisher._id ,    //给钱方
                    toId: PostRegisterPublisher.register._id,       //收钱方
                    coin: Number(PostRegisterPublisher.post.missionCoin) ,        //交易金币数
                    date: new Date()
                };
                
                //对用户的处理
                PostRegisterPublisher.publisher.message.addToSet({
                    date :new Date(),      
                    messageType: 3 ,   //你的帖子被报名
                    read: 0 ,          //0 未读 | 1 已读
                    content : {
                        //userId  :PostRegisterPublisher.publisher._id ,      //信息触发者id
                        userId  :PostRegisterPublisher.register._id ,      //信息触发者id
                        postId :PostRegisterPublisher.post._id,        //帖子id
                        userStuName :PostRegisterPublisher.register.stuName ,  //信息触发者姓名
                        postTitle :PostRegisterPublisher.post.title      //帖子标题
                    }
                })
                //保存
                PostRegisterPublisher.post.save(function(posterr){
                    PostRegisterPublisher.publisher.save(function(publishererr){
                        PostRegisterPublisher.register.save(function(registererr){
                            if(posterr||publishererr||registererr)
                                reject(MONGODB_ERROR);
                            else
                                res.json({statusCode: 100, message: 'ok', result: ''});
                        })
                    })
                });
            }
        })  
    }).catch(function (err) {
        res.json(err);
        logger.info(err);
    });
}; 
//取消接口
var cancel = function(req, res){
    let userId = req.body.userId;
    let postId = req.body.postId;
    let reason = req.body.reason;
    checkParams([userId,postId,reason]).then(function(){
        return pGetUserById(userId);
    })
    .then(function(user){
        return new Promise((resolve, reject)=>{
            PostDao.getPostById(postId,function (err,post) {
                if (err) {
                    reject(message.POSTID_ERROR);
                }else if(!post){
                    reject(message.POST_NOT_EXIST);
                }/*else if(post.status==3){
                    reject(message.POST_FINISHED);
                }else if(post.status==4){
                    reject(message.POST_CANCELED);
                }*/
                else if(post.status == 0 || post.status == 1 ||
                    post.status == 2 || post.status == 6){
                    resolve({post,user});
                }
                else 
                    reject(message.STATUS_ERROR);
            });
        })
    })
    .then(function(PostUser) {
        return new Promise((resolve, reject)=>{
            //发帖人和人任务人都可以取消
            if(PostUser.post.status==0 || PostUser.post.status == 1 || PostUser.post.status == 6){
                PostUser.post.status=4;
                PostUser.post.cancelReason=reason;
                PostUser.user.coin=PostUser.user.coin+Number(PostUser.post.missionCoin);
                /*PostUser.post.save(function (err) {
                    PostUser.user.save(function(err1){
                        if(err||err1)  reject(message.MONGODB_ERROR);
                        else  res.json(message.OPERATION_SUCCESS);
                    })
                });*/
                resolve(PostUser);
            }
            //任务人取消
            else if((PostUser.post.status==2) &&  (userId==PostUser.post.participant[0].userId)){
               //对帖子的处理
               PostUser.post.status = 4;
               PostUser.post.participant[0].status = 5;
               PostUser.post.cancelReason = reason;
               PostUser.post.coinBank.status = 2;
               //当发帖人取消任务时
               /*if(userId==PostUser.post.publisher){
                    PostUser.user.message.addToSet({
                        date : new Date(),
                        messageType:17,
                        content :{  
                            postId :PostUser.post._id,        //帖子id
                            postTitle :PostUser.post.title      //帖子标题
                        }
                    })
                    PostUser.user.coin=PostUser.user.coin+Number(PostUser.post.missionCoin);
                    resolve(PostUser);
                }*/
                //当任务人取消任务
               
               PostUser.user.message.addToSet({
                    date : new Date(),
                    messageType:17,
                    content :{  
                        postId :PostUser.post._id,        //帖子id
                        postTitle :PostUser.post.title      //帖子标题
                    }
                })
               PostUser.user.joinCount--;
               //查找帖子发布者
               UserDao.getUserById(PostUser.post.publisher,function(err,publisher){
                    if(err){
                       reject(message.USERID_ERROR);
                    }else if(!publisher){
                        reject(message.USER_NOT_EXIST);
                    }else{
                        publisher.message.addToSet({
                            date : new Date(),
                            messageType:17,
                            content :{  
                                postId :PostUser.post._id,        //帖子id
                                postTitle :PostUser.post.title      //帖子标题
                            }
                        })
                        publisher.coin+=Number(PostUser.post.missionCoin);
                        //为了resolve的数据统一先保存publisher
                        publisher.save(function(err){
                            if(err){
                                reject(message.MONGODB_ERROR);
                            }
                            else resolve(PostUser);
                        })
                    }
                })
            
            }
            else
                reject(message.CANCEL_LIMIT);
        })
    }).then(function(PostUser) {
        return new Promise((resolve, reject)=>{  
            //对数据的保存
            PostUser.post.save(function(posterr){
                PostUser.user.save(function(usererr){
                    if(posterr||usererr)
                        reject(message.MONGODB_ERROR);
                    else{
                       res.json(message.OPERATION_SUCCESS);
                    }
                })
            })
        })
    }).catch(function (err) {
        res.json(err);
        logger.info(err);
    });
};



//确定任务wancheng接口
var confirm = function(req, res){
    let userId = req.body.userId;
    let postId = req.body.postId;
    checkParams([userId,postId]).then(function() {
        return pGetPostById(postId);
    }).then(function(post) {
        return new Promise((resolve, reject)=>{
            if(post.status !=2)
                reject(message.STATUS_ERROR);
            if(post.publisher != userId)
                reject(message.CANT_CONFIRM);
            resolve(post);
        })
    }).then(function(post) {
        return new Promise((resolve, reject)=>{
            UserDao.getUserById(post.coinBank.toId,function (err,toUser) {
                if(err){
                    reject(message.USERID_ERROR);
                } else if(!toUser){
                    reject(message.USER_NOT_EXIST);
                }else{
                    resolve({post,toUser});
                }
            })
        })
    }).then(function(PostTouser) {
        return new Promise((resolve, reject)=>{
            //post.status 一定等于 2
            if(PostTouser.post.coinBank.status==1){
                reject(message.CONFIRMED_ALREADY);
            }else{
                //转账
                PostTouser.toUser.coin=PostTouser.toUser.coin+PostTouser.post.coinBank.coin;
                //MongoDB弊端之一，不能保证两个集合的事务性
                PostTouser.toUser.message.addToSet({
                    date : new Date(),            //信息时间 
                    messageType: 4 ,   
                    content :{  
                        userId  :userId ,      //信息触发者id
                        postId :PostTouser.post._id,        //帖子id
                        userStuName :PostTouser.post.publisherInfo.stuName ,  //信息触发者姓名
                        postTitle :PostTouser.post.title      //帖子标题
                    }        
                });  
                PostTouser.toUser.save(function(err){
                    if(err){
                         reject(message.MONGODB_ERROR);
                    }else{
                        resolve(PostTouser.post);
                    }
                })   
            }
        })
    }).then(function(post) {
        return new Promise((resolve, reject)=>{
            post.participant[0].status= 4;
            post.coinBank.status=1;
            post.status=5;
            post.save(function (err) {
                if(err){
                    reject(message.MONGODB_ERROR);
                }else{
                    res.json(message.OPERATION_SUCCESS);
                }
            });
        })
    }).catch(function (err) {
        res.json(err);
        logger.info(err);
    });
};
//举报接口
var tipoff = function (req, res) {
    let tipInfo= {};
    tipInfo.postId = req.body.postId;
    tipInfo.fromId = req.body.userId;
    checkParams([tipInfo.postId,tipInfo.fromId]).then(function() {
        return new Promise((resolve, reject)=>{
            TipDao.getTipByUserIdAndPostId(tipInfo.fromId,tipInfo.postId,function (err,tip) {
                if (!tip) {
                    resolve(tipInfo);
                }else if (err) {
                    reject(message.MONGODB_ERROR);
                }else if(tip){
                    reject(message.TIP_ALREADY);
                }
            });
        })
    }).then(function(tipInfo) {
        return new Promise((resolve, reject)=>{
            PostDao.getPostById(tipInfo.postId,function (err,post) {
                if (!post) {
                    reject(message.POST_NOT_EXIST);
                } else if (err) {
                    reject(message.POSTID_ERROR);
                } else{
                     UserDao.getUserById(tipInfo.fromId,function (err,user) {
                        if(err){
                            reject(message.USERID_ERROR);
                        }else if(!user){
                            reject(message.USER_NOT_EXIST);
                        }else{
                            tipInfo.fromName=user.stuName; 
                            tipInfo.toName= post.publisherName;
                            tipInfo.toId=post.publisher;
                            resolve([post,user]);                                                        
                        }
                     });
                }
            });
        })
    }).then(function(body) {
        return new Promise((resolve, reject)=>{
            UserDao.getUserById(body[0].publisher,function (err,user) {
                if (!user) {
                    reject(message.USER_NOT_EXIST);
                } else if (err) {
                    reject(message.USERID_ERROR);
                }else if (body[0].publisher==tipInfo.fromId) {
                    reject(message.TIP_ERROR);
                }else{
                    user.message.addToSet({
                                date : new Date(),            //信息时间 
                                messageType: 6 ,   
                                content :{  
                                userId  :tipInfo.fromId ,      //信息触发者id
                                postId :tipInfo.postId,        //帖子id
                                userStuName :body[0].stuName ,  //信息触发者姓名
                                postTitle :body[0].title      //帖子标题
                                }        
                            });  
                            user.save(function(err){
                                if(err){
                                     reject(message.MONGODB_ERROR);
                                }else{
                                    tipInfo.stuName=user.stuName;
                                    tipInfo.tipReason=req.body.reason;
                                    resolve();
                                }
                            })   
                }
            });
        })
    }).then(function() {
        return new Promise((resolve, reject)=> {
            TipDao.newTipAndSave(tipInfo, function (err) {
                if (err) {
                    reject(message.MONGODB_ERROR);
                } else {
                    resolve();
                }
            })
        });
    }).then(function () {
        res.json({statusCode: 100, message: 'ok', result:''});
    }).catch(function (err) {
        
        res.json(err);
        logger.info(err);
    });
};
//评论接口
var comment = function (req, res) {
    let body = req.body;
    checkParams([body.fromId,body.content,body.postId])
    .then(() => {
       return pGetUserById(body.fromId);
    })
    .then(function(user) {
        return new Promise((resolve, reject)=>{
        body.user=user;
        if(_.isEmpty(body.atId)){
            resolve(body)
        }else{
            UserDao.getUserById(body.atId,function(err,user){
                  if (err) 
                    reject(message.MONGODB_ERROR);
                
                  PostDao.getPostById(body.postId,function (err,post) {
                    if(err) {
                         reject(message.POSTID_ERROR);
                     }else if(!post){
                         reject(message.POST_NOT_EXIST);
                    }else if (!user) {
                         reject(message.USER_NOT_EXIST);
                    }else{
                        user.message.addToSet({
                                date : new Date(),            //信息时间 
                                messageType: 15 ,   
                                content :{  
                                userId  :body.fromId ,      //信息触发者id
                                postId :body.postId,        //帖子id
                                userStuName :body.user.stuName ,  //信息触发者姓名
                                postTitle :post.title      //帖子标题
                                }
                            });
                            user.save(function(err){
                                if(err){
                                     reject(message.MONGODB_ERROR);
                                }else{
                                    resolve(body);
                                }
                            })
                    }
                 })
                
            })
        }
    })
    }).then(function(body) {
        return new Promise((resolve, reject)=>{
            
            UserDao.getUserById(post.publisher,function(err,user){
                if (!post) {
                    reject(message.POST_NOT_EXIST);
                } else if (err) {
                    reject(message.USERID_ERROR);
                } else if (!user) {
                    reject(message.USER_NOT_EXIST);
                }else {
                     if(!(_.isEmpty(body.atId))){
                        resolve([post,user]);
                    }else{
                        user.message.addToSet({
                        date : new Date(),            //信息时间 
                        messageType: 0 ,   
                        content :{  
                        userId  :body.fromId ,      //信息触发者id
                        postId :body.postId,        //帖子id
                        userStuName :body.user.stuName ,  //信息触发者姓名
                        postTitle :post.title      //帖子标题
                        }
                        });
                         user.save(function(err){
                              if(err){
                                   reject(message.MONGODB_ERROR);
                             }else{
                                 resolve([post,user]);
                              }
                         })
                    }
                }
            });
                
            
        })
    })
    .then(function(info) {
        return new Promise((resolve, reject)=>{
        UserDao.getUserById(body.fromId,function(err,user){
            if (err) {
                reject(message.USERID_ERROR);
            } else if (!user) {
                reject(message.USER_NOT_EXIST);
            }else {
                resolve([info[0],user]);
            }
        })
       })
    }).then(function(info) {
        info[0].comment.addToSet({
            fromAvatar :info[1].avatar, //评论者头像
            fromId:info[1]._id,
            atId:  body.atId,
            atName :body.atName,
            fromName :info[1].stuName,
            content: body.content,
            time: new Date()
        });
        info[0].commentNum++;
        info[0].save(function (err) {
            if(err){
                res.json(message.MONGODB_ERROR);
            }
            else{
                res.json({statusCode: 100, message: 'ok', result: ''});
            }
        })
    }).catch(function (err) {
       
        res.json(err);
         logger.info(err);
    })
};

var getReason = function(req,res){
    let userId = req.body.userId;
    let postId = req.body.postId;
    checkParams([userId,postId]).then(()=>{
        return pGetPostById(postId);
    }).then((post)=>{
        return new Promise((resolve,reject)=>{
            console.log(post.publisher);
            if(post.publisher != userId)
                reject(message.PARAMS_ERROR);
            else{
                console.log('yes');
                resolve({statusCode:100,message:post.cancelReason,result:post.cancelReason});
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
var assign = function(req,res){
    res.json(message.OPERATION_SUCCESS);
}
exports.favorCancel = favorCancel;
exports.publish = publish;
exports.comment = comment;
exports.tipoff = tipoff;
exports.confirm = confirm;
exports.cancel = cancel;
exports.assign = assign;
exports.register =register;
exports.favo = favo;
exports.getAll = getAll;
exports.getPost = getPost;
exports.getReason = getReason;




