/**
 * Created by Administrator on 2016/6/23.
 */
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

router.get('/creditLogList/:openid', function (req, res) {
    models.creditModel.getLog(req.params.openid, function (err, logs) {
        res.render('./credit/creditLogListView', {
            openid: req.params.openid,
            title: '信用记录详单',
            logs:logs
        });
    });
});

module.exports = router;