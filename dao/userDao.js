 /**
 * Created by MARDAN on 2016/7/10.
 */
var User = require('../model/user').user;


/**
 * 注册初始化
 * @param stuName
 * @param phone
 * @param password
 * @param callback
 */
exports.newUserAndSave = function (phone, stuName, stuNum,password, sex,  callback) {
    var user        = new User();
    user.stuName    = stuName;
    user.stuNum    = stuNum;
    user.phone      = phone;
    user.password   = password;
    user.registerTime = new Date();
    user.sex = sex;
    user.avatar = (sex == 0 ? "/avatar/default_1.jpg":"/avatar/default_2.jpg");
    user.save(callback);
};


/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields    所返回的数据限制
 * @param {Function} callback 回调函数
 */
exports.getUsersByQuery = function (query,fields,option,callback) {
    User.find(query,fields,option,callback);
};


/**
 * 根据关键字，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields    所返回的数据限制
 * @param {Function} callback 回调函数
 */
 //Adventure.findById(id, 'name', { lean: true }, function (err, doc) {});
exports.getUserByQuery = function (query,fields,option,callback) {
    //Adventure.findById(id, '-length').exec(function (err, adventure) {});
    User.findById(query,fields,option,callback);
};

/**
 * 根据用户手机号，获取用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param  phone 用户电话
 * @param {Function} callback 回调函数
 */
exports.getUserByPhone = function (phone, callback) {
    User.findOne({frozen:1,phone: phone}, callback);
};


/**
 * 根据关键字，获取一组用户的长度
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {String} query 关键字
 * @param {Object} option 选项
 * @param fields          所返回的数据限制
 * @param {Function} callback 回调函数
 */
exports.getUsersLengthByQuery = function (query,fields  ,option , callback) {
    User.find(query,fields,option,function (err,users) {
        if(err){
            return callback('getUsersLengthByQuery'+'查询数据库失败');
        }else{
            return callback(null,users.length);
        }
    });
};



/**
 * 根据用户ID，查找用户
 * Callback:
 * - err, 数据库异常
 * - user, 用户
 * @param {String} id 用户ID
 * @param {Function} callback 回调函数
 */
exports.getUserById = function (id, callback) {
    User.findOne({_id: id,frozen:1}, callback);
};

/**
 * 根据学生姓名列表查找用户列表
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} names 用户名列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByStuNames = function (names, callback) {
    User.find({ 'stuName': { $in: names } }, callback);
};



/**
 * 根据用户ID列表，获取一组用户
 * Callback:
 * - err, 数据库异常
 * - users, 用户列表
 * @param {Array} ids 用户ID列表
 * @param {Function} callback 回调函数
 */
exports.getUsersByIds = function (ids, callback) {
    User.find({_id: {"$in": ids}}, callback);
};
















