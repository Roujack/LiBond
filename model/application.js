/*
by ajay  2017/4/5
用于记录永旺日语演讲比赛报名信息
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var applicationSchema = new Schema({
   college:{type:String,required:true},
   grade:{type:String,required:true},
   name: {type: String,required:true},
   sex:{type:Number,required:true},
   stuNum: {type: String,required:true},
   phone:{type:String,required:true},
   applyDate:{type:Date,default:new Date()},
   wechat:{type:String,required:true}
}); 

var applicationModel = mongoose.model('applications', applicationSchema);

module.exports = applicationModel;