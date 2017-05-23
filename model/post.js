/**
 * Created by MARDAN on 2016/7/8.
 */
// var users = require('../model/user');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    topicType:{type:String, default : 1},                                        //1拿快递 2求撑伞 3求借东西 4二手闲置 5兼职信息 6活动组队 7食堂打包 8技术互助 9其他 0全部返回
    publisher :{type:String, required:true} ,   
    publisherInfo : {type:Schema.Types.ObjectId, ref:'users'} ,              //发布人(id)
    publisherName:{type:String, required:true} ,  
    publisherAvatar:{type:String} ,          //
    publisherScore:{type:Number,default:3} , 
    lock    :  {type:String, default : 0} ,                //0未锁定|1锁定
    postType : {type:String, default : 0} ,                //type: 0 提供帮助 | 1 请求帮助
    title : {type:String, default : 0},                    //标题
    content : {type:String, default : 0} ,                 //内容
    scoreStatus:{type:String, default : 0},                //评分状态 0未评分|1发布人评分完毕|2参与人评分完毕|3双方评分完成
    expTime : {type:Date},                               //报名截止时间（选填）
    status : {type:String, default : 0},                   //状态 0 已发布未报名||1 已报名未确定任务人||2 进行中（确定了任务人）|| 3 已完成|| 4 已取消 ||5 评分中 ||6未审核 ||7审核未通过 
    cancelReason:{type : String}  ,                         //审核未通过时的理由|任务人取消任务的理由
    participant :[ 
        {
        selected: {type:String, default : 0} ,       //1 selected                                             //参与者
        finalScore :Number,
        name:String,
        avatar:String ,
        userId:String,
        partakeTime: Date,                                   //参与时间
        status : {type:String, default : 0}                                      //0 报名 | | 1进行中 | 2完成任务 | 3未成为任务人 | 4评分中 | 5帖子取消了
        }
    ],
    priority : {type:String, default : 5 },                 // 优先级（用户 内容 时间）0-10
    favorUser: [
        {
        userId:String,
        date : Date                                        //收藏时间
        }
    ], 
    favorCount : {type:Number, default : 0},                                    //收藏次数 
    commentNum: {type:String, default : 0} ,                //评论数
    missionCoin : {type:String, default : 0},               //任务金币
    pubTime: {type:Date , default : Date.now()},              //发布时间
    contact:{type:String, default : 0},                                        //联系方式
    comment :[
        {
            fromAvatar :String, //评论者头像
            fromId:String,       //评论者_id
            fromName :String,//评论者昵称
            atId:  String,       //被@的人_id
            atName :String,  //被@的人昵称
            content: String,      //内容
            time: Date           //时间
        }],
    coinBank: {
        lock    :  {type:String, default : 0} ,     //0未锁定|1锁定
        status: {type:String, default : 0},        // 0任务正在进行|1任务转账完毕|2任务被取消了
        fromId: String,                            //给钱方
        toId: String,                              //收钱方
        coin: {type: Number, default: 0},          //交易金币数
        date: Date,                                 //交易完成日期
        expDealTime: Date                               //交易期望日期
    } ,
    pictures:[],
    pubGradeLocked: {type:String, default : 0},
    joinGradeLocked: {type:String, default: 0}

}); 
//2017/2/23 by Ajay
//添加索引
postSchema.index({ 'priority':1,'pubTime':-1});

var postModel = mongoose.model('posts', postSchema);

module.exports = postModel;


















// var postSchema = new Schema({
//     publisher : {type:String, required:true} ,              //发布人(id)
//     postType : {type:String, default : 0} ,                //type: 0 提供帮助 | 1 请求帮助
//     title : {type:String, default : 0},                    //标题
//     content : {type:String, default : 0} ,                 //内容
//     scoreStatus:{type:String, default : 0},                //评分状态 0未评分|1一方评分完毕|2双反评分完成
//     expTime : {type:Date, default : Date.now()},           //报名截止时间（选填）
//     status : {type:String, default : 0},                   //状态 0 已发布未报名||1 已报名未确定任务人||2 进行中（确定了任务人）|| 3 已完成|| 4 已取消
//     participant :[ 
//         {                                                   //参与者
//         userId:String,
//         partakeTime: Date,                                   //参与时间
//         status : Number                                      //0 报名 | | 1进行中 | 2完成任务 | 3取消 
//         }
//     ],
//     priority : {type:String, default : 0},                 // 优先级（用户 内容 时间）0-10
//     favorUser: [
//         {
//         userId:String,
//         date : Date                                        //收藏时间
//         }
//     ], 
//     favorCount : {type:Number, default : 0},                                    //收藏次数 
//     commentNum: {type:String, default : 0} ,                //评论数
//     missionCoin : {type:String, default : 0},               //任务金币
//     pubTime: {type:Date , default : Date.now},              //发布时间
//     contact:{type:String, default : 0},                                        //联系方式
//     comment :[
//         {
//             fromId:String,       //评论者_id
//             fromName :String,//评论者昵称
//             atId:  String,       //被@的人_id
//             atName :String,  //被@的人昵称
//             content: String,     //内容
//             time: Date           //时间
//         }],
//     coinBank: {
//         status: String,        // 0任务正在进行|1任务转账完毕|2任务被取消了
//         fromId: String,      //给钱方
//         toId: String,           //收钱方
//         coin: {type: Number, default: 0},          //交易金币数
//         date: Date            //交易完成日期
//     }
// }); 

// var postModel = mongoose.model('posts', postSchema);

// module.exports = postModel;




