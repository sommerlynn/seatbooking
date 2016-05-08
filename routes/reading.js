/**
 * Created by pchen on 2016/4/20.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    sizeOf = require('image-size'),
    debug = require('debug'),
    log = debug('reading'),
    weixinAPIClient = models.weixinAPIClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

//OAuth = require('wechat-oauth'),
//WeiJSAPI = require('../lib/weixin-jssdk'),
//var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

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
                    "digestid":digests[index].digest_id,
                    //"image":'http://7xt2h5.com1.z0.glb.clouddn.com/'+digests[index].image_name,
                    "image":'http://store.julyangel.cn/'+digests[index].image_name,
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