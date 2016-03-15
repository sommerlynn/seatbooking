var express = require('express'),
    router = express.Router(),
    async = require('async'),
    Promise = require('bluebird'),
    xlsx = require('node-xlsx'), // https://github.com/mgcrea/node-xlsx
    models = require('../models'),
    OAuth = require('wechat-oauth');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('indexView', { title: '七玥星空' });
});

router.get('/index', function(req, res) {
    res.render('indexView', { title: '七玥星空' });
});

/*
* Get seat map of a classroom
* 获取一个教室的座位图
* */
router.get('/seatmap/:cid', function(req, res) {

  models.classroomModel.getByID(req.params.cid, function(err, classroom){
      if(err){
          res.render('errorView', {message:'服务器故障', error: err});
      }
      else {
          var map = new Array();
          var rowCount = classroom['row_count'];
          var columnCount = classroom['column_count'];

          for(var rindex = 0; rindex < rowCount; rindex++){
              var cstr = '';
              for (var cindex = 0; cindex < columnCount; cindex++){
                  cstr = cstr+'a';
              }
              map[rindex] = cstr;
          }

          /*var map = ['aaa_aaaaaaaaa_aaa',
              'aaa_aaaaaabaa_aaa',
              'aaa_aaaabaaaa_aaa',
              'aaa_aaaaaagaa_aga',
              'aaa_aaataaaaa_aaa',
              'aaa_ataaaaaaa_aaa',
              'aaa_aaaaagaaa_aaa',
              'aaa_aataaaaaa_aaa',
              'aaa_aaaaaaaaa_aaa'];*/

          var today = new Date(),
              nextDay = new Date(today.getTime()+24*60*60*1000);

          res.render('seatMapView',{ title:classroom['full_name'], map: map, cid: req.params.cid}
          );
      }
  });
});

/*
* Get buildings of a school
* 获取教学楼列表
* */
router.get('/building', function(req, res){
    if(req.session.userInfo) {
        models.classroomModel.getAll(1, function (err, classroomList) {
            if (err) {
                res.render('errorView', {message: '服务器故障', error: err});
            }
            else {
                res.render('buildingView', {title: '七玥天使-自习室导航', classroomList: classroomList});
            }
        });
    }else {
        var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
        var url = client.getAuthorizeURL('http://www.julyangel.cn/callbackbuilding', '123', 'snsapi_userinfo');
        res.redirect(url);
    }
});

router.get('/building2', function(req, res){
    if(req.session.userInfo) {
        models.classroomModel.getAll(1, function (err, classroomList) {
            if (err) {
                res.render('errorView', {message: '服务器故障', error: err});
            }
            else {
                res.render('buildingView', {title: '七玥天使-自习室导航', classroomList: classroomList});
            }
        });
    }else {
        var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
        var url = client.getAuthorizeURL('http://www.julyangel.cn/callbackbuilding', '123', 'snsapi_userinfo');
        res.redirect(url);
    }
    /*var err = {status:'ok', stack:'ok 111'};
    res.render('errorView', {title:'预约座位', message:'building', error: err});*/
});

router.get('/me', function(req, res){
    if(req.session.userInfo){
        models.userModel.getSeatOrderSheet(req.session.userInfo.openid, function(err, userSeatOrders){
            if(err){
                res.send('错误' + err);
            }else{
                res.render('meView',{title:'我的信息', userInfo:req.session.userInfo, userSeatOrders:userSeatOrders});
            }
        });
    }else{
        var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
        var url = client.getAuthorizeURL('http://www.julyangel.cn/callbackme', '123', 'snsapi_userinfo');
        res.redirect(url);
    }
});

router.get('/me2', function(req, res){
    if(req.session.userInfo){
        models.userModel.getSeatOrderSheet(req.session.userInfo.openid, function(err, userSeatOrders){
            if(err){
                res.send('错误' + err);
            }else{
                res.render('meView',{title:'我的信息', userInfo:req.session.userInfo, userSeatOrders:userSeatOrders});
            }
        });
    }else{
        var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
        var url = client.getAuthorizeURL('http://www.julyangel.cn/callbackme', '123', 'snsapi_userinfo');
        res.redirect(url);
    }
});

router.get('/medebug', function(req, res){
    var userInfo = {
        nickname:'璞',
        province:'北京',
        city:'昌平',
        headimgurl:'http://wx.qlogo.cn/mmopen/PiajxSqBRaEJLKaunSsjF2ky7vkXEicrZ21h6StXw0brPib0AUex7LOR42NKU2P0l5sJWPiavjH0h1M8DcmHd02B1aqmcUFcibEJ5sIcKqneLtf4/0'
    };

    res.render('meView',{title:'我的信息', userInfo:userInfo});
});

router.get('/callbackbuilding',function(req, res){
    var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
    client.getAccessToken(req.query.code, function (err, result) {
        if(err){
            res.send('错误' + err);
        }
        else{
            //var accessToken = result.data.access_token;
            var openid = result.data.openid;
            client.getUser(openid, function (err, result) {
                if(err){
                    res.send('错误' + err);
                }else{
                    var userInfo = result;
                    req.session.userInfo = userInfo;
                    res.redirect("building2");

                    models.weixinMessageModel.addUserInfo(userInfo, function(err){
                        if(err) {
                            res.send('错误' + err);
                        }else{
                        }
                    });
                }
            });
        }
    });
});

router.get('/callbackme',function(req, res){
    var client = new OAuth('wxeec4313f49704ee2', '36012f4bbf7488518922ca5ae73aef8e');
    client.getAccessToken(req.query.code, function (err, result) {
        //var accessToken = result.data.access_token;
        if(err){
            res.send('错误' + err);
        }else{
            var openid = result.data.openid;
            client.getUser(openid, function (err, result) {
                if(err){
                    res.send('错误' + err);
                }else{
                    var userInfo = result;
                    req.session.userInfo = userInfo;
                    res.redirect("me2");
                    models.weixinMessageModel.addUserInfo(userInfo, function(err){
                        if(err) {
                            res.send('错误' + err);
                        }else{
                        }
                    });
                }
            });
        }
    });
});

router.post('/seatStatus', function(req, res){
   //req.session.userInfo.openid, req.body.classroom, req.body.row, req.body.column
   var response = '';
   var row = req.body.row,
       column = req.body.column;
   if(row < 10){
        row = '0'+row;
   }
   else{
        row = row+'';
   }
   if(column < 10){
        column = '0'+column;
   }
   else{
        column = column+'';
   }

   var today = new Date(),
       nextDay = new Date(today.getTime()+24*60*60*1000);

   response += '<li class="card">'+
        '<div class="card-header"><div style="width: 50%">座位券</div><div style="width: 50%">'+today.toLocaleDateString()+'</div></div>'+
        '<div class="card-content">'+
        '<div class="card-content-inner">'+'图书馆五层南区'+'</div>'+
        '<div class="card-content-inner">'+row+column+'号 (第'+req.body.row+'排'+'第'+req.body.column+'列)</div>'+
            /*'<div class="card-content-inner">'+index+':00 -'+(index+2)+':00</div>'+*/
        '</div>'+
        '<div class="card-time">'+
        '<div class="card-time-header">8:00</div><div class="card-time-header">10:00</div><div class="card-time-header">14:00</div><div class="card-time-header">16:00</div><div class="card-time-header">19:00</div>'+
        '<div class="card-time-header">~</div><div class="card-time-header">~</div><div class="card-time-header">~</div><div class="card-time-header">~</div><div class="card-time-header">~</div>'+
        '<div class="card-time-header">10:00</div><div class="card-time-header">12:00</div><div class="card-time-header">16:00</div><div class="card-time-header">18:00</div><div class="card-time-header">21:00</div>'+
        '<div class="card-time-status">空闲</div><div class="card-time-status">空闲</div><div class="card-time-status">空闲</div><div class="card-time-status">空闲</div><div class="card-time-status">空闲</div>'+
        '</div>'+
        '<div class="card-footer" id="today-card-footer">'+'仅限本人使用 点击领取'+'</div>'+
        '</li>';
   res.send(response);
});

router.post('/order', function(req, res){
    if(req.session.userInfo){
        var dateArr = req.body.time.split(' ');
        var hour = dateArr[0].substr(0, dateArr[0].length-1);
        var minute = dateArr[1].substr(0, dateArr[1].length-1);
        var today = new Date();
        var orderTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, minute);

        models.userModel.order(req.session.userInfo.openid, req.body.classroom, req.body.row, req.body.column, orderTime, function(err){
            if(err) {
                res.send('错误' + err);
            }else{
                res.send('已成功预定');
            }
        });
    }
    else{
        res.send('未取得用户信息');
    }
});

router.get('/myseatorder', function(req, res){
    if(req.session.userInfo){

        models.userModel.getSeatOrderSheet(req.session.userInfo.openid, function(err, userSeatOrders){
            if(err){
                res.send('错误' + err);
            }else{

            }
        });
    }else{
        res.send('未取得用户信息');
    }
});

router.get('/loadcourse', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var data = dataFromFile[0]['data'];
    var msg = '执行完毕';

    async.forEachSeries(data, function(item, callback){
        var courseInfo = {
            'course_name':item[0],
            'course_xkkh':item[3],
            'teacher_name':item[2],
            'teacher_code':item[1]
        }
        models.parseModel.addCourse(courseInfo, callback);
    },function(err){
        msg = err;
    });
    res.render('parseView', {title:'解析数据', msg:msg});
});

// 0 课程名
// 1 教工号
// 2 教师姓名
// 3 选课课号
// 4 教室类型 多媒体 普通教室 操场 电工实验室 电机实验室 .....
// 5 上课时间
// 6 上课地点

router.get('/loadbuilding', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function(item, callback){
        console.log(item);
        models.parseModel.parseBuildingArea(item, callback);
    }, function(err){
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title:'加载教学楼信息', msg:msg});
});


router.get('/loadclassroom', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;

    async.eachSeries(datas, function(item, callback){
        console.log(item);
        models.parseModel.parseClassRoom(item, callback);
    }, function(err){
        msg = err;
        console.log(err);
    });

    res.render('parseView', {title:'加载教室信息', msg:msg});
});

router.get('/loadclasstime', function(req, res, next){
    var dataFromFile = xlsx.parse('./bak/data.xlsx');
    var datas = dataFromFile[0]['data'];
    var msg;
    async.eachSeries(datas, function(item, callback){
        //console.log(item);
        models.parseModel.parseClassTime(item, callback);
    },
    function(err){
        msg = err;
        console.log(err);
    });
    res.render('parseView', {title:'加载教室信息', msg:msg});
});

module.exports = router;
