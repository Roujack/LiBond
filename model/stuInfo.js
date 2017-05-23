/**
 * Created by Ajay on 2016/12/28.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var stuInfoSchema = new Schema({
    stuName     : { type:String , required:true },            //学生真实姓名 非空
    stuNum      : { type:String , required:true },            //学号
    isSignup    : { type:String , default:0 },          //0 未注册 | 1 已注册
    
});
var stuInfoModel = mongoose.model('stuInfos', stuInfoSchema);
exports.stuInfo = stuInfoModel;


