/*
by ajay  2017/3/26
用于记录交易
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tradeSchema = new Schema({
   userId: {type:String, required:true},//兑换者ID
   userName: {type: String,required:true},//兑换商品的同学的名称
   itemId:{type:String, required:true},//兑换商品ID
   itemName:{type:String, required:true},//商品名
   numberOfItem:{type:Number,required:true},//商品数量
   isDeal: {type: Boolean,default:false},//是否已处理   
   dealTime:{type:Date,default:new Date()},
   exchangeCode:{type:Number,required:true}
}); 

var tradeModel = mongoose.model('trades', tradeSchema);

module.exports = tradeModel;