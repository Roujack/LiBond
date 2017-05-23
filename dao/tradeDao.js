/**
 * Created by Ajay on 2017/3/26.
 */
var Trade = require('../model/trade');

/**
 * 新建一个交易
 * @param info 一个交易的信息
 */
exports.newTradeAndSave = function (info,  callback) {
    var trade       = new Trade();
    trade.userId    = info.userId;
    trade.userName      = info.userName;
    trade.itemId    = info.itemId;
    trade.itemName      = info.itemName;
    trade.numberOfItem   = info.numberOfItem;
    trade.exchangeCode = info.exchangeCode;
    trade.save(callback);
};
