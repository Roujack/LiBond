/**
 * Created by MARDAN on 2016/7/26.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tipSchema = new Schema({
    handled:{type:String, default : 0} ,          // 0是未处理，1是已处理，默认未处理
    fromName : String,          //被举报人名字
    toName: String,
    postId :String ,           //被举报的帖子
    fromId : String ,         //举报方
    toId   :String,           //被举报方
    tipReason : String,       //举报内容
    tipDate: Date              //举报的时间
});

var tipModel = mongoose.model('tips',tipSchema);
module.exports = tipModel;











// var tipSchema = new Schema({
//     isHandle:{type:String, default : 0} ,          // 0是未处理，1是已处理，默认未处理
//     stuName : String,          //被举报人名字
//     postId :String ,           //被举报的帖子
//     fromId : String ,         //举报方
//     toId   :String,           //被举报方
//     tipReason : String,       //举报内容
//     tipDate: Date              //举报的时间
// });

// var tipModel = mongoose.model('tips',tipSchema);
// module.exports = tipModel;