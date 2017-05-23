/**
 * Created by Ajay on 2017/4/5.
 */
var Application = require('../model/application');
var mongoose = require('mongoose');
/**
 * 初始化报名信息
 * @param callback
 * @param postInfo
 */
exports.insertRegister = function (Info, callback) {
    var application   = new Application();
    application.college = Info.college;
    application.name = Info.name;
    application.grade = Info.grade;
    application.stuNum = Info.stuNum;
    application.sex = Info.sex;
    application.phone = Info.phone;
    application.wechat = Info.wechat;
    application.applyDate = Date.now();
    application.save(callback);
};

/**
 * 根据学号，获取申请
 * Callback:
 * - err, 数据库异常
 * - register, 用户
 * @param  stuNum 学号
 * @param {Function} callback 回调函数
 */

exports.getRegisterByStuNum = function (stuNum, callback) {
    Application.findOne({stuNum: stuNum}, callback);
};


exports.getApplicationsByQuery = function ( callback) {//query,fields ,option ,
   Application.find(callback);//query,fields,option,
};