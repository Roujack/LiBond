/*
by ajay  2017/3/26
用于兑换物品
*/
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var itemSchema = new Schema({
   name: {type: String,required:true},
   isDelete: {type: Boolean,default:false},
   img: {type: String},
   stock:{type:Number,default:0},
   time_to_market:{type:Date,default:new Date()},
   price:{type:Number,required:true}
}); 

var itemModel = mongoose.model('items', itemSchema);

module.exports = itemModel;