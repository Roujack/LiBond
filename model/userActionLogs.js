/**
 * Created by MARDAN on 2016/7/10.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userActionSchema = new Schema ({
    user_id : String,
    user_ip : String,
    actionDate : Date
});

var userActionModel = mongoose.model('user_Action_Log',userActionSchema);

exports.userActionlog = userActionModel;

