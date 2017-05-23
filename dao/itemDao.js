/**
 * Created by Ajay on 2017/3/26.
 */
var Item = require('../model/item');

/**
 * 通过ID查找一个商品
 * @param itemId
 */
exports.getItemById = function (itemId,  callback) {
    Item.findOne({_id: itemId}).exec(callback);
};



/**
 * 根据关键字，获取一组商品
 * Callback:
 * - err, 数据库异常
 * - items, 商品列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields   所返回的数据限制
 * @param {Function} callback 回调函数
 */
exports.getItemsByQuery = function (query,fields ,option , callback) {
   Item.find(query,fields,option,callback);
};