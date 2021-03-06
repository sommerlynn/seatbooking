/**
 * Created by Administrator on 2016/4/14.
 */

var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    urllib = require('urllib'),
    weixinAPIClient = models.weixinClient.getInstance('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

//OAuth = require('wechat-oauth'),
//WeiJSAPI = require('../lib/weixin-jssdk'),
//var weiJSAPI = new WeiJSAPI('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');

/*
 * 填写请假申请表单的页面
 * 2016-04-11 CHEN PU   新建
 * */
router.get('/me/leaveSheet/:openid', function (req, res) {
    res.render('./leave/leaveSheetView',
        {
            ip: req.query.ip,
            openid: req.params.openid,
            title: '请假申请'
        }
    );
});

/*
 * 提交请假申请信息
 * 2016-04-11 CHEN PU   新建
 * */
router.post('/me/leaveSheet/submitApplication', function (req, res) {
    models.leaveApplicationModel.apply(
        req.body.openid,
        req.body.leaveReason,
        req.body.startTime,
        req.body.endTime,
        req.body.mobile,
        req.body.address,
        function (err, results) {
            if (err) {
                res.send('亲，出错了额，请重试一下' + err.message);
            } else {
                res.send('亲，您的申请已提交');

                weixinAPIClient.jsAPIClient.getAccessToken(function (err, token) {
                    if (err) {

                    } else {
                        models.userModel.getUser(req.body.openid, function (err, applier) {
                           if(err){

                           } else{
                                models.userModel.getManager(req.body.openid, function(err, managers){
                                    if(err){

                                    }else{
                                        for(var index = 0; index < managers.length; index++){

                                            // 发送请假申请模板消息给管理员
                                            // https://mp.weixin.qq.com/advanced/tmplmsg?action=edit&id=LCnBfAKZ1uMUZGFb73lJgGyq6qhsFxu3TUWoDP6cjQc&token=735404091&lang=zh_CN
                                            var sendData = {
                                                "touser":managers[index].openid,
                                                "template_id":"LCnBfAKZ1uMUZGFb73lJgGyq6qhsFxu3TUWoDP6cjQc",
                                                "url":"http://campus.julyangel.cn/oAuth/"+applier[0].school_id+'/me',
                                                "data":{
                                                    "first":{
                                                        "value":'请假条'
                                                    },
                                                    "childName":{
                                                        "value":applier[0].real_name
                                                    },
                                                    "time":{
                                                        "value":req.body.startTime+'至'+req.body.endTime
                                                    },
                                                    "score":{
                                                        "value":req.body.leaveReason
                                                    },
                                                    "remark":{
                                                        "value":""
                                                    }
                                                }
                                            };
                                            var url = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token="+token.data.access_token;
                                            var options = {
                                                method:"POST",
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                content: JSON.stringify(sendData)
                                            };
                                            urllib.request(url, options);
                                        }
                                    }
                                });
                           }
                        });
                    }
                });
            }
        });
});

/*
 * 批准请假
 * 2016-04-13 CHEN PU 新建
 *
 * */
router.post('/me/approveLeave', function (req, res) {
    models.leaveApplicationModel.approve(
        req.body.openid,
        req.body.applicationID,
        function (err, result) {
            if (err) {
                res.send('内部错误，请重试或联系系统管理员');
            } else {
                res.send('已成功批准');
            }
        });
});

router.post('/me/rejectLeave', function (req, res) {
    models.leaveApplicationModel.reject(
        req.body.openid,
        req.body.applicationID,
        function (err, result) {
            if (err) {
                res.send('内部错误，请重试或联系系统管理员');
            } else {
                res.send('已驳回该申请');
            }
        });
});

router.get('/me/oldLeave/:openid', function(req, res){
    models.leaveApplicationModel.getOld(req.params.openid, function(err, leaveApplications){
        if(err){
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }else{
            res.render('./leave/oldLeaveView', {
                openid:req.params.openid,
                title:'历史假条',
                leaveApplications:leaveApplications
            });
        }
    });
});

router.get('/me/checkedLeave/:openid', function(req, res){
    models.leaveApplicationModel.getChecked(req.params.openid, function(err, leaveApplications){
        if(err){
            res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
        }else{
            res.render('./leave/oldLeaveView', {
                openid:req.params.openid,
                title:'已审假条',
                leaveApplications:leaveApplications
            });
        }
    });
});

module.exports = router;