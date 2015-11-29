/**
 * Created by pchen on 2015/11/30.
 */
var path = require('path'),
    config;

config = {
    mysql:{
        host:'mysql56.rdsmxaxdpurey85.rds.bj.baidubce.com',
        port:'3306',
        user:'pchen',
        password:'1qazxsw2',
        database:'seatbooking',
        multipleStatements:true
    }
};

module.exports = config;