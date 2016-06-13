/**
 * Created by Administrator on 2016/6/13.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    debug = require('debug'),
    log = debug('index'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

router.get('/0125/:openid', function(req, response){
    models.userModel.getUser(req.params.openid, function(err, user){
        models.classroomModel.getAllActive(user[0].school_id, function (err, classroomList) {
            res.render('./0125/classroomListView', {
                openid: req.params.openid,
                title: '阅览室列表',
                classroomList:classroomList
            }); 
        });
    });
});

module.exports = router;