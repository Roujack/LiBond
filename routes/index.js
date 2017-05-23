"use strict";

var express = require('express');
var router = express.Router();


const User = require('../controller/user.js');
const Post = require('../controller/post.js');
const Application = require('../controller/application.js');
//用户模块
router.post('/user/insertStu', User.insertStu);
router.post('/user/verifyStuNum', User.verifyStuNum);
router.post('/user/signup', User.signup);
router.post('/user/login', User.login);
router.post('/user/logout', User.logout);
router.post('/user/getVerCode', User.getVerCode);
router.post('/user/getMyInfo', User.getMyInfo);
router.post('/user/update', User.update);
router.post('/user/updatePass', User.updatePass);
router.post('/user/avatar', User.avatar);
router.post('/user/getInfo', User.getInfo);
router.post('/user/myPubPosts', User.myPubPosts);
router.post('/user/myJoinPosts', User.myJoinPosts);
router.post('/user/myFavoPosts', User.myFavoPosts);
router.post('/user/checkin', User.checkin);
router.post('/user/rank', User.rank);
router.post('/user/grade', User.grade);
router.post('/user/getMsg', User.getMsg);
router.post('/user/markRead', User.markRead);
router.post('/user/multi', User.multi);
router.post('/user/getScoreStatus', User.getEvaluateStatus);
router.post('/user/getDefaultAvatar', User.getDefaultAvatar);
//router.post('/user/insertMsg', User.insertMsg);
router.post('/search', User.search);
router.post('/getURL', User.getURL);
router.post('/user/buy', User.buy);
router.post('/getItems', User.getItems);
router.post('/insertRegister',Application.insertRegister);
router.post('/exportToExcel',Application.exportToExcel);
router.post('/register/getAll',Application.getAll);
//router.post('/user/myUnpassPosts', User.myUnpassPosts);

//帖子模块
router.post('/post/favorCancel',Post.favorCancel);
router.post('/post/getAll', Post.getAll);
router.post('/post/getPost', Post.getPost);
router.post('/post/favo', Post.favo);
router.post('/post/publish', Post.publish);
router.post('/post/register', Post.register);
router.post('/post/assign', Post.assign);
router.post('/post/cancel', Post.cancel);
router.post('/post/confirm', Post.confirm);
router.post('/post/comment', Post.comment);
router.post('/post/tipoff', Post.tipoff);
router.post('/post/getReason', Post.getReason);

module.exports = router;