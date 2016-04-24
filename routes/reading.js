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
    WeiJSAPI = require('../lib/weixin-jssdk'),
    sizeOf = require('image-size'),
    debug = require('debug'),
    log = debug('reading'),
    qiniu = require("qiniu");


var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

router.get('/reading/digest/list/:page', function(req, res){

    models.readingModel.listDigestPaged(req.params.page, 20, function(err, digests){
        if(err){

        }else{
            var jsonData = {
                "version":1,
                "pagesize":20,
                "total": digests.length,
                "result":[
                ]};
            for(var index = 0; index < digests.length; index++){
                jsonData.result[index] = {
                    "image":'http://7xt2h5.com1.z0.glb.clouddn.com/'+digests[index].image_name,
                    "width":digests[index].image_width,
                    "height":digests[index].image_height,
                    "authorimg":digests[index].headimgurl,
                    "authornickname":digests[index].nickname
                };
            }
            res.contentType('json');
            res.send(JSON.stringify(jsonData));
        }
    });


    /*var jsonData = {
        "total": 20,
        "result": [
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
        ]*/

});

router.post('/reading/digest/upload', function(req, res){
    models.weixinMessageModel.downloadFromWeiXin(req.body.openid, req.body.imageID, 'reading_digest_', function(err, fileName, filePath){
        if(err){
            res.send('哎呀, 出了点小故障, 我们再来一次好不好 1');
        }else{
            models.weixinMessageModel.uploadToQiniu(fileName, filePath, function(err, fileName, filePath){
                if(err){
                    res.send('哎呀, 出了点小故障, 我们再来一次好不好 2');
                }else{
                    sizeOf(filePath, function(err, dimensions){
                        if(err){
                            res.send('哎呀, 出了点小故障, 我们再来一次好不好 3');
                        }else{
                            models.readingModel.newDigest(req.body.openid, fileName, dimensions.width, dimensions.height, function(err, result){
                                if(err){
                                    res.send('哎呀, 出了点小故障, 我们再来一次好不好 4');
                                }else{
                                    res.send('书摘上传成功啦');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

module.exports = router;