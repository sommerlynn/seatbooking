/**
 * Created by pchen on 2015/11/21.
 */
var crypto = require('crypto');

var debug = require('debug');
var log = debug('webot-example:log');
//var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');

var _ = require('underscore')._;
var search = require('../../support').search;
//var geo2loc = require('./../support').geo2loc;

//var package_info = require('../package.json');

/**
 * 初始化路由规则
 */
module.exports = exports = function(webot){
    var reg_help = /^(help|\?)$/i
    webot.set({
        // name 和 description 都不是必须的
        name: 'subscribe',
        description: '订阅事件',
        pattern: function(info) {
            //首次关注时,会收到subscribe event
            return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
        },
        handler: function(info){
            var reply = {
                title: '【你好】我是七玥',
                pic: 'http://img5.duitang.com/uploads/item/201506/12/20150612194418_T4S3r.thumb.700_0.jpeg',
                url: 'http://julyangel.cn/building',
                description: [
                    '在青春岁月里',
                    '陪你走过每一个季节',
                    '助你通过每一门考试',
                    '帮你实现每一个梦想',
                    '倾听你的烦恼和忧愁',
                    '给你带去快乐带走忧愁'
                    //'s+空格+关键词 : 我会帮你百度搜索喔',
                    //'s+空格+nde : 可以试试我的纠错能力'
                ].join('\n')
            };
            // 返回值如果是list，则回复图文消息列表
            return reply;
        }
    });

    webot.set({
        // name 和 description 都不是必须的
        name: 'location',
        description: '获取用户地理位置',
        pattern: function(info) {
            //首次关注时,会收到subscribe event
            return info.is('event') && info.param.event === 'LOCATION' || reg_help.test(info.text);
        },
        handler: function(info){
            var reply = {
                title: '【你好】我是七玥',
                pic: 'http://img5.duitang.com/uploads/item/201506/12/20150612194418_T4S3r.thumb.700_0.jpeg',
                url: 'http://julyangel.cn/building',
                description: [
                    '你当前的地理位置是',
                    '维度'+info.param.lat,
                    '经度'+info.param.lng
                ].join('\n')
            };
            // 返回值如果是list，则回复图文消息列表
            return reply;
        }
    });

    // 更简单地设置一条规则
    webot.set(/^more$/i, function(info){
        var reply = _.chain(webot.gets()).filter(function(rule){
            return rule.description;
        }).map(function(rule){
            //console.log(rule.name)
            return '> ' + rule.description;
        }).join('\n').value();

        return ['我的主人还没教我太多东西,你可以考虑帮我加下.\n可用的指令:\n'+ reply,
            '没有更多啦！当前可用指令：\n' + reply];
    });

    webot.set('who_are_you', {
        description: '想知道我是谁吗? 发送: who?',
        // pattern 既可以是函数，也可以是 regexp 或 字符串(模糊匹配)
        pattern: /who|你是[谁\?]+/i,
        // 回复handler也可以直接是字符串或数组，如果是数组则随机返回一个子元素
        handler: ['你好，我是七玥，很高兴认识你。']
    });

    webot.set('want_a_seat', {
        description: '想订座',
        // pattern 既可以是函数，也可以是 regexp 或 字符串(模糊匹配)
        pattern: /学|自习[座\?]+/i,
        // 回复handler也可以直接是字符串或数组，如果是数组则随机返回一个子元素
        handler: function(info){
            var reply = {
                title: '【你好】认真学习 天天向上',
                pic: 'http://img5.duitang.com/uploads/item/201506/12/20150612194418_T4S3r.thumb.700_0.jpeg',
                url: 'http://180.76.185.145/seatmap',
                description: [
                    '在青春岁月里',
                    '陪你走过每一个季节',
                    '助你通过每一门考试',
                    '帮你实现每一个梦想',
                    '倾听你的烦恼和忧愁',
                    '给你带去快乐带走忧愁'
                    //'s+空格+关键词 : 我会帮你百度搜索喔',
                    //'s+空格+nde : 可以试试我的纠错能力'
                ].join('\n')
            };
            // 返回值如果是list，则回复图文消息列表
            return reply;
        }
    });

    //所有消息都无法匹配时的fallback
    webot.set(/.*/, function(info){
        // 利用 error log 收集听不懂的消息，以利于接下来完善规则
        // 你也可以将这些 message 存入数据库
        log('unhandled message: %s', info.text);
        info.flag = true;
        return '你发送了「' + info.text + '」,可惜我太笨了,听不懂. 发送: help 查看可用的指令';
    });
};
