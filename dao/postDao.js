/**
 * Created by MARDAN on 2016/7/10.
 */
var Post = require('../model/post');
var config = require('../config/config');
var mongoose = require('mongoose');
/**
 * 初始化帖子，发帖子是初始化
 * @param callback
 * @param postInfo
 */
exports.newPostAndSave = function (postInfo, callback) {
    var post          = new Post();
    post.topicType      = postInfo.topicType;
    post.contact      = postInfo.contact;
    post.publisherName = postInfo.publisherName;
    //publisher类型必须是objectId,不然ref失败
    post.publisher    = postInfo.userId;
    post.publisherInfo= mongoose.Types.ObjectId(postInfo.userId);
    //现在只有一种帖子 1 类型
    //post.postType     = postInfo.postType;
    post.postType     = 1;
    post.title        = postInfo.title;
    post.content      = postInfo.content;
    post.expTime      = postInfo.expTime;
    post.pictures     = postInfo.pictures;
    post.publisherAvatar = postInfo.publisherAvatar;
    post.publisherScore = postInfo.publisherScore;
    post.pubTime      = new Date();
    post.coinBank.expDealTime =  new Date(Number(post.expTime)  + Number(config.autoMakeDealTime));
    post.missionCoin  = postInfo.missionCoin;
    post.save(callback);
    
};



/**
 * 根据关键字，获取一组帖子的长度
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields          所返回的数据限制
 * @param {Function} callback 回调函数
 */
exports.getPostsLengthByQuery = function (query,fields  ,option , callback) {
    Post.find(query,fields,option,function (err,posts) {
        if(err){
            return callback('getPostsLengthByQuery'+'查询数据库失败');
        }else{
            return callback(null,posts.length);
        }
    });
};

/**
 * 查找用户的所有帖子列表
 * Callback:
 * - err, 数据库异常
 * - posts, 帖子列表
 * @param {Array} publisherId 用户id
 * @param {Function} callback 回调函数
 */
// exports.getPostsByPublisher = function (publisherId, callback) {
//     Post.find( {lock:0,publisher:publisherId }, callback);
// };

exports.getPostsByPublisher = function (publisherId, callback) {
    Post.find( {lock:0,publisher:publisherId }).populate({path: 'publisherInfo',select: 'stuName _id avatar finalScore'}).exec(callback);
};


/**
 * 根据帖子标题列表查找帖子列表
 * Callback:
 * - err, 数据库异常
 * - posts, 帖子列表
 * @param {Array} titles 帖子列表
 * @param {Function} callback 回调函数
 */
// exports.getPostsByTitles = function (titles, callback) {
//     Post.find({ lock:0,title: { $in: titles} }, callback);
// };
exports.getPostsByTitles = function (titles, callback) {
    Post.find({ lock:0,title: { $in: titles} }).populate({path: 'publisherInfo',select: 'stuName _id avatar finalScore'}).exec(callback);
};


/**
 * 根据关键字，获取一组帖子
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields          所返回的数据限制
 * @param {Function} callback 回调函数
 */
// exports.getPostsByQuery = function (query,fields ,option , callback) {
//     Post.find(query,fields,option,callback);
// };
exports.getPostsByQuery = function (query,fields ,option , callback) {
    Post.find(query,fields,option).populate({path: 'publisherInfo',select: 'stuName _id avatar finalScore'}).exec(callback);
}




/**
 * 根据标题查找帖子
 * Callback:
 * - err, 数据库异常
 * - post, 帖子
 * @param {String} title 登录名
 * @param {Function} callback 回调函数
 */
//  exports.getPostsByTitle = function (title, callback) {
//     Post.findOne({lock:0,title: title},callback);
// };

exports.getPostsByTitle = function (title, callback) {
    Post.findOne({lock:0,title: title}).populate({path: 'publisherInfo',select: 'stuName _id avatar finalScore'}).exec(callback);
};


// *
//  * 根据postType查找帖子列表
//  * Callback:
//  * - err, 数据库异常
//  * - post, 帖子
//  * @param {String} postType 帖子类型
//  * @param {Function} callback 回调函数
 
// exports.getPostsByPostType = function (postType, callback) {
//     Post.find({postType: postType}, callback);
// };



/**
 * 根据帖子ID，查找单个帖子
 * Callback:
 * - err, 数据库异常
 * - post, 帖子
 * @param {String} id 帖子ID
 * @param {Function} callback 回调函数
 */
//  exports.getPostById = function (id, callback) {
//     Post.findOne({lock:0,_id: id},callback);
// };
exports.getPostById = function (id, callback) {
    Post.findOne({lock:0,_id: id}).populate({path: 'publisherInfo',select: 'stuName _id avatar finalScore'}).exec(callback);
};




