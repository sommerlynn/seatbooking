/**
 * Created by pchen on 2015/11/21.
 */
var debug = require('debug');
var log = debug('webot-example:log');

var _ = require('underscore')._;
var request = require('request');

/**
 * ͨ���ߵµ�ͼAPI��ѯ�û���λ����Ϣ
 */
exports.geo2loc = function geo2loc(param, cb){
    var options = {
        url: 'http://restapi.amap.com/rgeocode/simple',
        qs: {
            resType: 'json',
            encode: 'utf-8',
            range: 3000,
            roadnum: 0,
            crossnum: 0,
            poinum: 0,
            retvalue: 1,
            sid: 7001,
            region: [param.lng, param.lat].join(',')
        }
    };
    log('querying amap for: [%s]', options.qs.region);

    //��ѯ
    request.get(options, function(err, res, body){
        if(err){
            error('geo2loc failed', err);
            return cb(err);
        }
        var data = JSON.parse(body);
        if(data.list && data.list.length>=1){
            data = data.list[0];
            var location = data.city.name || data.province.name;
            log('location is %s, %j', location, data);
            return cb(null, location, data);
        }
        log('geo2loc found nth.');
        return cb('geo2loc found nth.');
    });
};

/**
 * �����ٶ�
 *
 * @param  {String}   keyword �ؼ���
 * @param  {Function} cb            �ص�����
 * @param  {Error}    cb.err        ������Ϣ
 * @param  {String}   cb.result     ��ѯ���
 */
exports.search = function(keyword, cb){
    log('searching: %s', keyword);
    var options = {
        url: 'http://www.baidu.com/s',
        qs: {
            wd: keyword
        }
    };
    request.get(options, function(err, res, body){
        if (err || !body){
            return cb(null, '������ʱ�޷��������������������');
        }
        var regex = /<h3 class="t">\s*(<a[\s\S]*?>.*?<\/a>)[\s\S]*?<\/h3>/gi;
        var links = [];
        var i = 1;

        while (true) {
            var m = regex.exec(body);
            if (!m || i > 5) break;
            links.push(i + '. ' + m[1]);
            i++;
        }

        var result;
        if (links.length) {
            result = '�ڰٶ�����:' + keyword +',�õ����½����\n' + links.join('\n');
            result = result.replace(/\s*data-click="[\s\S]*?"/gi,  '');
            result = result.replace(/\s*onclick="[\s\S]*?"/gi,  '');
            result = result.replace(/\s*target="[\s\S]*?"/gi,  '');
            result = result.replace(/\s{2,}/gi, ' ');
            result = result.replace(/<em>([\s\S]*?)<\/em>/gi,  '$1');
            result = result.replace(/<font[\s\S]*?>([\s\S]*?)<\/font>/gi,  '$1');
            result = result.replace(/<span[\s\S]*?>([\s\S]*?)<\/span>/gi,  '$1');
        } else {
            result = '�Ѳ����κν����';
        }

        // result ��ֱ����Ϊ
        // robot.reply() �ķ���ֵ
        //
        // ������ص���һ�����飺
        // result = [{
        //   pic: 'http://img.xxx....',
        //   url: 'http://....',
        //   title: '������������������',
        //   description: '����������....'
        // }];
        //
        // �������ͼ���б�
        return cb(null, result);
    });
};

/**
 * ����ͼƬ
 *
 * ע��:ֻ�Ǽ�ª��ʵ��,�������������Ƿ���ȷ,ʵ��Ӧ�û���Ҫ���statusCode.
 * @param  {String} url  Ŀ����ַ
 * @param  {String} path ����·��
 */
exports.download = function(url, stream){
    log('downloading %s a stream', url);
    return request(url).pipe(stream);
};

/**
 * 计算两个地理位置之间的距离
 *
 * */
exports.distance = function(Longtiude1, Latitude1, Longtiude2, Latitude2){
    var R = 6378137;
    var dLat = (Latitude2 - Latitude1) * Math.PI / 180;
    var dLng = (Longtiude2 - Longtiude1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Latitude1 * Math.PI / 180) * Math.cos(Latitude2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d);
};

/**
 * 获取指定长度的随机数
 *
 * */
exports.random = function(len){
    len = len || 32;
    var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (var i = 0; i < len; i++) {
        pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
};

/**
 * 获取指定日期的周次
 *
 * 2016-06-15 CHEN PU 创建
 *
 * */
exports.getWeekNO = function(date){
    var totalDays = 0;
    var days = new Array(12);
    days[0] = 31;
    days[2] = 31;
    days[3] = 30;
    days[4] = 31;
    days[5] = 30;
    days[6] = 31;
    days[7] = 31;
    days[8] = 30;
    days[9] = 31;
    days[10] = 30;
    days[11] = 31;

    //判断是否为闰年，针对2月的天数进行计算
    if (Math.round(date.getFullYear() / 4) == date.getFullYear() / 4) {
        days[1] = 29;
    } else {
        days[1] = 28;
    }
    if (date.getMonth() == 0) {
        totalDays = totalDays + date.getDate();
    } else {
        var curMonth = date.getMonth();
        for (var count = 0; count < curMonth; count++) {
            totalDays = totalDays + days[count];
        }
        totalDays = totalDays + date.getDate();
    }
    // 指定日期所在天第一天是周几
    var yearFirstDay = new Date(date.getFullYear(), 0, 1).getDay() || 7;
    var week = null;
    if (yearFirstDay == 1) {
        week = Math.ceil(totalDays / yearFirstDay);
    } else {
        totalDays -= (7 - yearFirstDay + 1);
        week = Math.ceil(totalDays / 7) + 1;
    }
    return week;
};