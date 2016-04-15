/**
 * Created by Administrator on 2016/4/14.
 */

var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth');

/*
 * 填写请假申请表单的页面
 * 2016-04-11 CHEN PU   新建
 * */
router.get('/me/leaveSheet/:openid', function (req, res) {
    res.render('./leave/leaveSheetView',
        {
            ip:req.query.ip,
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
            }
        }
    );
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


module.exports = router;