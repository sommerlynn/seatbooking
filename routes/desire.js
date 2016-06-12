/**
 * Created by Administrator on 2016/6/11.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    models = require('../models'),
    debug = require('debug'),
    log = debug('index'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

router.get('/desire', function (req, res) {
    res.render('./desire/desireView',
        {
            title: '心语星愿'
        });
});

router.post('/desire/submit', function(req, res){
    models.desireModel.newDesire(req.body.openid, req.body.desireType, req.body.desireText, req.body.desireImage, function(err, result){
        if(err){
            res.send('提交失败, 请重试一下');
        }else{
            res.send('你的心语星愿已许下');
        }
    });
});

module.exports = router;