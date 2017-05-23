var winston = require('winston');

/**
 * Winston logger config 
 * 详细介绍见https://www.npmjs.com/package/winston
 * winston 是一个日志管理模块，它可以把数据打印在控制台
 * 文件或者是数据库中，也能够捕获异常，那么我们就可以根据
 * 日志对系统进行优化。
 */
winston.emitErrs = true;
winston.stream({start:-1});
var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',      //level表示级别 error|0 warn|1 info|2 debug|4
                                //数字越大级别越高，比如logger.error也会记录到warn info ，debug中去 
            name: 'info-file',  //传输的名字，可以根据名字来删除transports
            filename: '../logs/info-logs.log',
            json: false,
            colorize: true
        }),
        new winston.transports.File({
            level: 'warn',
            name: 'warn-file',
            filename: '../logs/warn-logs.log',
            json: false,
            colorize: true
        }),
        new winston.transports.File({
            level: 'error',
            name: 'error-file',
            filename: '../logs/error-logs.log',
            handleExceptions: true,
            timestamp:true,
            json: false,
            colorize: true
        }),
        new winston.transports.File({
            level: 'debug',
            name: 'debug-file',
            filename: '../logs/debug-logs.log',
            timestamp:true,
            json: false,
            colorize: true
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            prettyPrint: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;