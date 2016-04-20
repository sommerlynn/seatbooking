/**
 * Created by pchen on 2016/4/20.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth'),
    WeiJSAPI = require('../lib/weixin-jssdk');

router.get('/reading/data', function(req, res){

    var jsonData = {
        "total": 20,
        "result": [
            {
                "image": "http://7xt2h5.com2.z0.glb.clouddn.com/20150819131101_hQkZL.thumb.700_0.jpeg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://7xt2h5.com2.z0.glb.clouddn.com/20150225163034_BWrZV.jpeg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/003.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/004.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/005.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/006.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/007.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/008.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/009.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/010.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/011.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/012.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/013.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/014.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/015.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/016.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/017.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/018.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/019.jpg",
                "width": 0,
                "height": 0
            },
            {
                "image": "http://wlog.cn/demo/waterfall/images/020.jpg",
                "width": 0,
                "height": 0
            }
        ]
    };
    res.contentType('json');
    res.send(JSON.stringify(jsonData));
});

module.exports = router;