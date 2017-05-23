"use strict";

var express = require('express');
var path = require('path');
var logger = require('./library/winstonlogger.js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('winston');
var morgan = require('morgan');
var rfs = require('rotating-file-stream');
//require mongo
var mongo = require('./db/mongo.js');

var routes = require('./routes/index.js');
var checkToken = require('./library/checkToken.js');
var redisClient = require('./db/redis').redisClient;
var app = express();

//2017-3-1
var multer  = require('multer');
const message = require('./config/message.js');
const getOptions = require('./library/tools.js').getOptions;
var _      = require('underscore');
var fs = require('fs');
const uploadMultiPics = require('./library/tools.js').uploadMultiPics;



//cross domain 跨域 http://www.cnblogs.com/dojo-lzz/p/4265637.html
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, xkey, xtoken");
    next();
});



//limite some interfaces aceess time,每个用户明天最多修改十次密码，以ip地址作为判断标志
/*var limiter = require('express-limiter')(app,redisClient);
limiter({
  path:'/user/getVerCode',
  method:'post',
  lookup:'connection.remoteAddress',
  total:10,
  expire:1000 * 60 * 60*24,
  onRateLimited:function(req,res,next){
    res.json({statusCode: -100, message: 'access times limited!'});
  }
});*/
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
//设置当前环境为产品环境，与development环境的区别是production不会把错误堆栈信息显示给用户
app.set('env','production');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.all('*', function (req, res, next) {
    let originalUrl = req.originalUrl;

    logger.debug(req.url);
    logger.debug("req.body:" + JSON.stringify(req.body));
    
    if(/\/user\/signup/.test(originalUrl)
    || /\/user\/login/.test(originalUrl)
    || /\/user\/updatePass/.test(originalUrl)
    || /\/user\/getVerCode/.test(originalUrl)
    || /\/user\/rank/.test(originalUrl)
    || /\/user\/insertStu/.test(originalUrl)
    || /\/user\/verifyStuNum/.test(originalUrl)
    || /\/post\/getAll/.test(originalUrl)) {
      return next();
    }
    //logger.debug('req.headers: xkey: ' + req.headers.xkey + '\txtoken: ' + req.headers.xtoken);
    next();
});





//app.use(morgan('tiny'));
//app.use(morgan(':method :url :response-time'));
var logDirectory = path.join(__dirname, 'logs/access');

// ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
})

// setup the logger
app.use(morgan(':method :url :req[body] :response-time', {stream: accessLogStream}));

//登录中间件
//为了避免穷举攻击有必要对用户写错密码的次数进行限制：
//每十二个小时内最多填错10次密码
app.use('/user/login',(req,res,next) => {
    //为了避免键值重复（用户可能会找回密码）
    //我在手机号前加个'0'
    redisClient.get('0'+req.body.phone,function(err,response){
      if(response != null && parseInt(response.toString()) >= 10){
          res.json(message.LOGIN_LIMIT);
      }
      else 
        next(); 
    })
})
//获取验证码中间件
//为了避免短信的随意发送，对发送短信的次数进行限制；
//每天只能对同一个手机号发送最多十条短信
app.use('/user/getVerCode',(req,res,next)=>{
  //为了避免键值重复（用户可能会找回密码）
  //我在手机号前加个'1'
  redisClient.get('1'+req.body.phone,function(err,response){
    if(response != null && parseInt(response.toString())>=10){
      res.json(message.GETVERCODE_LIMIT);
    }
    else
      next();
  })
})
//single表示只上传一张头像
var upload = multer(getOptions('avatar')).single('avatar');
//头像中间件
app.use('/user/avatar',(req,res,next) => {
    //console.log('/user/avatar');
    upload(req,res,function(err){
        if(err || _.isEmpty(req.file))    
          return res.json(message.UPLOAD_FILE_ERROR);
        if(req.body.userId != req.headers.xkey){
          fs.unlink(req.file.path,function(err){
            if(err) 
               logger.error('avatar接口出错：' + err);
          })
          return res.json(message.PARAMS_ERROR);
        }
        next();
    })     
})
//发布帖子中间件
app.use('/post/publish',(req,res,next) => {
    //console.log('/post/publish');
    uploadMultiPics(req,res,function(err,body){
        req.body=body;
        if(err )  {
          console.log(err);
          return res.json(message.UPLOAD_FILE_ERROR);
        }  
          
        if(req.body.userId != req.headers.xkey){
            //删除图片
            req.files.forEach(function(photo,index){
                fs.unlink(photo.path,function(err){
                  if(err)
                    logger.error('上传多张图片接口出错：' + err);
                })
            }) 
            return res.json(message.PARAMS_ERROR);
        }
        next();
    })     
})

app.use('*', (req, res, next) => {
  
  let originalUrl = req.originalUrl;
  if(/\/user\/signup/.test(originalUrl)
    || /\/user\/login/.test(originalUrl)
    || /\/user\/updatePass/.test(originalUrl)
    || /\/user\/getVerCode/.test(originalUrl)
    || /\/user\/rank/.test(originalUrl)
    || /\/user\/insertStu/.test(originalUrl)
    || /\/getURL/.test(originalUrl)
    || /\/getItems/.test(originalUrl)
    || /\/insertRegister/.test(originalUrl)
    || /\/exportToExcel/.test(originalUrl)
    || /\/user\/verifyStuNum/.test(originalUrl)
    || /\/post\/assign/.test(originalUrl)
    || /\/register\/getAll/.test(originalUrl)
    || /\/post\/getAll/.test(originalUrl)) {
    return next();
  }
  //避免冒充
  if( !(/\/user\/getInfo/.test(originalUrl)
    || /\/post\/getPost/.test(originalUrl)
    || /\/search/.test(originalUrl) ))
  {
    
    req.headers.xkey = req.body.userId;

    if( /\/post\/register/.test(originalUrl))
      req.headers.xkey = req.body.registerId;

    if( /\/post\/comment/.test(originalUrl))
      req.headers.xkey = req.body.fromId;
  }
  checkToken.validateToken(req, res, next);
})

app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

//Connect to MongoDB
mongo.connect();

function getDateString(date) {
  if (typeof date === 'number') {
    date = new Date(date);
  }
  return String(date.getFullYear()) + (date.getMonth() + 1) + date.getDate();
}

//将日志按日期划分开来，方便删除，分析等
setInterval(function(){
    var now = new Date();
    //console.log('yep');
    if(now.getHours() == 10)
    {
        var filename = '../logs/debug/debug-logs'+getDateString(now)+'.log';
        //console.log(filename);
        logger.remove('debug-file');
        logger.add(winston.transports.File,{
            level: 'debug',
            name: 'debug-file',
            filename: filename,
            timestamp:true,
            json: false,
            colorize: true
        });
    }
},60*60*1000);

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  //console.log('why');
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {status:err.status}
  });
});


module.exports = app;
