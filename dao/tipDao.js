/**
 * Created by MARDAN on 2016/7/26.
 */
var Tip = require('../model/tip');

/**
 * 举报帖子的初始化
 * @param callback
 * @param tipInfo
 */
exports.newTipAndSave = function (tipInfo, callback) {
    var tip          = new Tip();
    tip.fromName      = tipInfo.fromName;
    tip.toName       = tipInfo.toName;
    tip.postId       = tipInfo.postId;
    tip.fromId       = tipInfo.fromId;
    tip.toId         = tipInfo.toId;
    tip.tipReason    = tipInfo.tipReason;
    tipDate = new Date(); 
    tip.save(callback);
};


/**
 * 根据关键字，获取一组举报信息的长度
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields          所返回的数据限制
 * @param {Function} callback 回调函数
 */
exports.getTipsLengthByQuery = function (query,fields  ,option , callback) {
    Tip.find(query,fields,option,callback.length);
};



/**
 * 通过举报者和帖子id获取举报信息
 * @param fromId
 * @param postId
 * @param callback
 */
exports.getTipByUserIdAndPostId = function (fromId , postId ,callback) {
    Tip.findOne({fromId: fromId,postId:postId},callback);
};