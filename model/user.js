/**
 * Created by MARDAN on 2016/7/8.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;



var userSchema = new Schema({
    //socket      :{},
    registerTime:{ type:String , required:true },            //注册时间
    stuName     : { type:String , required:true },            //姓名非空
    phone       : { type:String , required:true },            //长号
    password    : { type:String , required:true },            //密码
    phone_short : { type:String , default : 0 },              //短号
    wechat      : { type:String , default : 0 },              //微信号
    qq          : { type:String , default : 0 },              //qq
    frozen      : { type:String , default :1 },               //0 冻结 | 1 未冻结
    stuNum      : { type:String , default : 0 },              //学号
    sex         : { type:String , default : 0 },              //性别 0 男| 1 女
    avatar      : { type:String , default : 0 },              //头像
    skills      : { type:String , default : 0 },              //特长
    favorCount  : {    type:Number, default:0},                 //收藏帖子数
    pubCount    :{    type:Number, default:0},                  //发布帖子数
    joinCount   :{    type:Number, default:0},                  //参与的帖子数
    lastLoginTime: { type:Date , default:new Date()},
    coin        : {    type:Number, default:30},              //金币默认值为30
    scores : [                                   //评分
        {
            isValidate : { type:String , default:1 } ,                      //0无效|1默认有效
            postId  : { type:String , required:true },                  //来自哪个帖子的评分
            fromUser : { type:String , required:true },                   //(_id)
            score    : { type:Number , default:3 },                   //(0-5 0.5间隔)
            time     : { type:Date , default:new Date()}
        }
    ],
    finalScore :{ type:Number , default : 3 },//最终评分，根据贝叶斯平均计算
    check:{                                     //签到信息
        checkDate:[],
        lastDate:Date,
        checkLog : { type:Number , default:0 }
    },
    message : [                      //信息
        {
            date :Date,            //信息时间 
            messageType: String ,   
            // 0 帖子回复 |
            // 1 帖子报名成功 |
            // 2 你已报名帖子 |
            // 3 你的帖子被报名 |
            // 4 帖子对方已转入时间币 |
            // 5 帖子对方评分尽快完成任务 |
            // 6 帖子被举报 |
            // 7 帖子被锁定 |
            // 8 帖子被解mess锁 |
            // 9 帖子时间币被锁定 |
            // 10 帖子时间币被解锁 |
            // 11 帖子交易评分被锁定 |
            // 12 帖子交易评分被解锁 |
            // 13 你账号被锁定 |
            // 14 你账号被解锁
            // 15 你被谁@了
            // 16 你没有被选为任务人
            // 17 帖子被取消了
            read:  { type:String , default:0 } ,          //0 未读 | 1 已读
            content :{  
                userId  :String ,      //信息触发者id
                postId :String,        //帖子id
                userStuName :String ,  //信息触发者姓名
                postTitle :String      //帖子标题
            }
        }
    ]
});
var userModel = mongoose.model('users', userSchema);

exports.user = userModel;
























// var userSchema = new Schema({
//     nickName    : { type:String},                             //昵称 
//     stuName     : { type:String , required:true },            //姓名非空
//     phone       : { type:String , required:true },            //长号
//     password    : { type:String , required:true },            //密码
//     phone_short : { type:String , default : 0 },              //短号
//     weChat      : { type:String , default : 0 },              //微信号
//     qq          : { type:String , default : 0 },              //qq
//     frozen      : { type:String , default :1 },               //0 冻结 | 1 未冻结
//     stuNum      : { type:String , default : 0 },              //学号
//     sex         : { type:String , default : 0 },              //性别
//     avatar      : { type:String , default : 0 },              //头像
//     skills      : { type:String , default : 0 },              //特长
//     coin        : {    type:Number, default:30},              //金币默认值为30
//     scores : [                                   //评分
//         {
//             postId  :{ type:String , required:true },                  //来自哪个帖子的评分
//             fromUser : { type:String , required:true },                   //(_id)
//             score    : { type:Number , default:0 },                   //(0-5 0.5间隔)
//             time     : { type:Date , default:new Date()}
//         }
//     ],
    
//     check:{                                     //签到信息
//         checkDate:[],
//         lastDate:Date,
//         checkLog : { type:Number , default:0 }
//     },
//     message : [                      //信息
//         {
//             messageType: String ,   //0帖子回复 1管理员私信 2报名 3完成任务 4成为任务人 5时间币到账
//             read: String ,          //0 未读 | 1 已读
//             content :{  
//                 fromId  :String ,      //信息触发者id
//                 postId :String,        //帖子id
//                 missionCoin: Number,   //任务金币
//                 content : String,      //信息内容
//                 date :Date,            //信息时间
//                 expTime : Date         //任务截止时间
//             }
//         }
//     ]
// });
// var userModel = mongoose.model('users', userSchema);

// exports.user = userModel;






