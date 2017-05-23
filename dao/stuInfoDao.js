 /**
 * Created by Ajay on 2016/12/28.
 */
var StuInfo = require('../model/stuInfo').stuInfo;


/**
 * 注册初始化
 * @param stuName
 * @param stuNum
 * @param callback
 */
exports.newStuAndSave = function (stuName, stuNum,  callback) {
    var stuInfo        = new StuInfo();
    stuInfo.stuName    = stuName;
    stuInfo.stuNum      = stuNum;
    stuInfo.save(callback);
};

/**
 * 根据学号，获取用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param  stuNum 学号
 * @param {Function} callback 回调函数
 */

exports.getUserByStuNum = function (stuNum, callback) {
    StuInfo.findOne({stuNum: stuNum}, callback);
};
