/**
 * Created by Administrator on 2016/4/13.
 */
var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth');

/************************************************************************我的*/

/*
 * 我的页面
 * 2016-04-05 CHEN PU 新建
 * 2016-04-12 CHEN PU 调整代码,用querystring传递openid
 * */
router.get('/me/:openid', function (req, res) {
    /*var userInfo = {
     nickname: '璞',
     province: '北京',
     city: '昌平',
     headimgurl: 'http://wx.qlogo.cn/mmopen/PiajxSqBRaEJLKaunSsjF2ky7vkXEicrZ21h6StXw0brPib0AUex7LOR42NKU2P0l5sJWPiavjH0h1M8DcmHd02B1aqmcUFcibEJ5sIcKqneLtf4/0'
     };*/

    models.userModel.getUser(req.params.openid, function (err, userInfo) {
        if (err) {
            res.render('errorView', {
                openid: req.params.openid,
                title: '服务器故障',
                message: '服务器故障',
                error: err
            });
        } else {
            if (req.query.ip != req.ip) {
                res.redirect('http://www.julyangel.cn/oAuth/' + userInfo.school_id + '/me');
            }
            else {
                models.userModel.getSeatActiveOrderSheet(req.params.openid, function (err, userSeatOrders) {
                    if (err) {
                        res.render('errorView', {title: '服务器故障', message: '服务器故障', error: err});
                    } else {
                        models.userModel.getLeaveApplication(req.params.openid, function (err, leaveApplications) {
                            if (err) {
                                res.render('errorView', {
                                    openid: req.params.openid,
                                    title: '服务器故障',
                                    message: '服务器故障',
                                    error: err
                                });
                            } else {
                                models.userModel.getLeaveApplicationWaitForApproving(req.params.openid, function (err, waitForApprovedLeaveApplications) {
                                    if (err) {
                                        res.render('errorView', {
                                            openid: req.params.openid,
                                            title: '服务器故障',
                                            message: '服务器故障',
                                            error: err
                                        });
                                    } else {
                                        res.render('./me/meView', {
                                            ip: req.ip,
                                            openid: req.params.openid,
                                            title: '我的信息',
                                            userInfo: userInfo[0],
                                            userSeatOrders: userSeatOrders,
                                            leaveApplications: leaveApplications,
                                            waitForApprovedLeaveApplications: waitForApprovedLeaveApplications
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });

});

/*
 * 释放座位
 * 2016-04-08 CHEN PU 新建
 * */
router.post('/me/release', function (req, res) {
    models.userModel.releaseSeat(req.body.orderID, function (err, results) {
        if (err) {
            res.send('释放失败，请重试');
        } else {
            res.send('座位已经成功释放');
        }
    });
});

/*
 * 暂离座位
 * 2016-04-08 CHEN PU 新建
 **/
router.post('/me/leave', function (req, res) {
    models.userModel.leaveSeat(req.body.orderID, function (err, results) {
        if (err) {
            res.send('设置暂离失败，请重试');
        } else {
            res.send('设置暂离成功');
        }
    });
});

/*
 * 批准请假
 * 2016-04-13 CHEN PU 新建
 *
 * */
router.post('/me/approveLeave', function (req, res) {
    models.userModel.approveLeaveApplication(
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

/*************************************************************************实名认证*/

/*
 * 实名认证页面
 * 2016-04-11 CHEN PU 新建
 * */
router.get('/me/realInfo/:openid', function (req, res) {
    models.departmentClassModel.getActiveDepartments(function (err, departments) {
        if (err) {
            res.render('errorView', {openid: req.params.openid, title: '服务器故障', message: '服务器故障', error: err});
        } else {
            var departmentNameArr = new Array();
            for (var index = 0; index < departments.length; index++) {
                departmentNameArr[index] = departments[index].department_name;
            }
            res.render('./me/realInfoView',
                {
                    ip:req.query.ip,
                    openid: req.params.openid,
                    title: '实名认证',
                    departments: departmentNameArr
                });
        }
    });
});

/*
 * 提交用户实名信息
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/realInfo/submitInfo', function (req, res) {
    models.userModel.fillRealInfo(
        req.body.name,
        req.body.code,
        req.body.department,
        req.body.classs,
        req.body.openid,
        function (err, result) {
            if (err) {
                res.send('亲，出错了额，请重试一下' + err.message);
            } else {
                res.send('亲，您的信息已认证');
            }
        });
});

/*
 * 实名认证页面上获取对应学院的下属班级列表
 * 2016-04-11 CHEN PU 新建
 * */
router.post('/me/realInfo/class', function (req, res) {
    models.departmentClassModel.getClass(req.body.department, function (err, classs) {
        var classStr = '';
        for (var index = 0; index < classs.length; index++) {
            classStr += classs[index].class_name;
            if (index < classs.length - 1) {
                classStr += ',';
            }
        }
        res.send(classStr);
    });
});


/*************************************************************************请假*/
/*
 * 填写请假申请表单的页面
 * 2016-04-11 CHEN PU   新建
 * */
router.get('/me/applyLeave/:openid', function (req, res) {
    res.render('./me/applyLeaveView',
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
router.post('/me/applyLeave/submitApplication', function (req, res) {
    models.userModel.applyLeave(
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

module.exports = router;
