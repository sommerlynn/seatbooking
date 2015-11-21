/**
 * Created by pchen on 2015/11/21.
 */
var crypto = require('crypto');

var debug = require('debug');
var log = debug('webot-example:log');
var verbose = debug('webot-example:verbose');
var error = debug('webot-example:error');

var _ = require('underscore')._;
var search = require('../lib/support').search;
var geo2loc = require('../lib/support').geo2loc;

var package_info = require('../package.json');

/**
 * ��ʼ��·�ɹ���
 */
module.exports = exports = function(webot){
    var reg_help = /^(help|\?)$/i
    webot.set({
        // name �� description �����Ǳ����
        name: 'hello help',
        description: '��ȡʹ�ð��������� help',
        pattern: function(info) {
            //�״ι�עʱ,���յ�subscribe event
            return info.is('event') && info.param.event === 'subscribe' || reg_help.test(info.text);
        },
        handler: function(info){
            var reply = {
                title: '��л������webot������',
                pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg',
                url: 'https://github.com/node-webot/webot-example',
                description: [
                    '�������������ָ��:',
                    'game : ��������ֵ���Ϸ��',
                    's+�ո�+�ؼ��� : �һ����ٶ������',
                    's+�ո�+nde : ���������ҵľ�������',
                    'ʹ�á�λ�á�������ľ�γ��',
                    '�ؿ���ָ����ظ�help���ʺ�',
                    '����ָ����ظ�more',
                    'PS: �������ġ��鿴ȫ�ġ�����ת���ҵ�githubҳ'
                ].join('\n')
            };
            // ����ֵ�����list����ظ�ͼ����Ϣ�б�
            return reply;
        }
    });

    // ���򵥵�����һ������
    webot.set(/^more$/i, function(info){
        var reply = _.chain(webot.gets()).filter(function(rule){
            return rule.description;
        }).map(function(rule){
            //console.log(rule.name)
            return '> ' + rule.description;
        }).join('\n').value();

        return ['�ҵ����˻�û����̫�ණ��,����Կ��ǰ��Ҽ���.\n���õ�ָ��:\n'+ reply,
            'û�и���������ǰ����ָ�\n' + reply];
    });

    webot.set('who_are_you', {
        description: '��֪������˭��? ����: who?',
        // pattern �ȿ����Ǻ�����Ҳ������ regexp �� �ַ���(ģ��ƥ��)
        pattern: /who|����[˭\?]+/i,
        // �ظ�handlerҲ����ֱ�����ַ��������飬������������������һ����Ԫ��
        handler: ['�������������', '΢�Ż�����']
    });

    // ����ƥ����ƥ������� info.query ��
    webot.set('your_name', {
        description: '���ҽ����°�, ����: I am [enter_your_name]',
        pattern: /^(?:my name is|i am|��(?:������)?(?:��|��)?)\s*(.*)$/i,

        // handler: function(info, action){
        //   return '���,' + info.param[1]
        // }
        // ���߸���һ��
        handler: '���,{1}'
    });

    // �򵥵Ĵ��ı��Ի��������õ����� yaml �ļ�������
    //require('js-yaml');
    //webot.dialog(__dirname + '/dialog.yaml');

    // ֧��һ���ԼӶ���������̨���ݿ�洢����
    webot.set([{
        name: 'morning',
        description: '����к���, ����: good morning',
        pattern: /^(����?��?|(good )?moring)[��\!��\.��]*$/i,
        handler: function(info){
            var d = new Date();
            var h = d.getHours();
            if (h < 3) return '[��] ����߻�����ҹ�أ����Ŵ����';
            if (h < 5) return '��ż����Ӱ����������ˣ�';
            if (h < 7) return '�簡���ˣ��������������~ �����밲�ˣ�\n ������μӵ�ʲô��أ�';
            if (h < 9) return 'Morning, sir! �µ�һ���ֿ�ʼ�ˣ�������������ô����';
            if (h < 12) return '�ⶼ�����ˣ����簡...';
            if (h < 14) return '�˼����緹���Թ��ˣ������ţ�';
            if (h < 17) return '������õ����磬�Ǻ��ʺϳ��Ź���';
            if (h < 21) return '�磬ʲô�磿�Ҳ���ң�';
            if (h >= 21) return '���������˯��...';
        }
    }, {
        name: 'time',
        description: '��֪��������? ����: time',
        pattern: /^(������|time)\??$/i,
        handler: function(info) {
            var d = new Date();
            var h = d.getHours();
            var t = '�����Ƿ�����ʱ��' + h + '��' + d.getMinutes() + '��';
            if (h < 4 || h > 22) return t + '��ҹ���ˣ����˯�� [����]';
            if (h < 6) return t + '���������ٶ�˯�����';
            if (h < 9) return t + '������һ�����õ��峿�أ�����׼��ȥ�������أ�';
            if (h < 12) return t + '��һ��֮�����ڳ�������Ҫ�������鰲�ź�����';
            if (h < 15) return t + '�����Ķ����Ƿ��ر��ˣ�';
            if (h < 19) return t + '������һ���������������磡������������������';
            if (h <= 22) return t + '������һ�����õ�ҹ����û��ȥ��ʲô�ݳ���';
            return t;
        }
    }]);

    // �ȴ���һ�λظ�
    webot.set('guess my sex', {
        pattern: /����.����Ů.|��.*�е�Ů��/,
        handler: '��²¿���',
        replies: {
            '/Ů|girl/i': '�˼ҲŲ���Ů����',
            '/��|boy/i': '�ǵģ��Ҿ������湫��һö',
            'both|���в�Ů': '��Ѿ�Ų��в�Ů��',
            '����': '�õģ��ټ�',
            // �����ʹ��ͨ���
            '/.*/': function reguess(info) {
                if (info.rewaitCount < 2) {
                    info.rewait();
                    return '�㵽�׻��²����';
                }
                return '��������Ĳ���°�';
            },
        }

        // Ҳ������һ�������㶨:
        // replies: function(info){
        //   return 'haha, I wont tell you'
        // }

        // Ҳ�����������ʽ��ÿ��Ԫ��Ϊһ��rule
        // replies: [{
        //   pattern: '/^g(irl)?\\??$/i',
        //   handler: '�´�'
        // },{
        //   pattern: '/^b(oy)?\\??$/i',
        //   handler: '�¶���'
        // },{
        //   pattern: 'both',
        //   handler: '��������...'
        // }]
    });

    // ����һ�� wait rule
    webot.waitRule('wait_guess', function(info) {
        var r = Number(info.text);

        // �û���������...
        if (isNaN(r)) {
            info.resolve();
            return null;
        }

        var num = info.session.guess_answer;

        if (r === num) {
            return '�������!';
        }

        var rewaitCount = info.session.rewait_count || 0;
        if (rewaitCount >= 2) {
            return '��ô�������²����������� ' + num + ' ����';
        }

        //����
        info.rewait();
        return (r > num ? '����': 'С��') +',����' + (2 - rewaitCount) + '�λ���,�ٲ�.';
    });

    webot.set('guess number', {
        description: '����: game , ��������ֵ���Ϸ��',
        pattern: /(?:game|��?��Ϸ)\s*(\d*)/,
        handler: function(info){
            //�ȴ���һ�λظ�
            var num = Number(info.param[1]) || _.random(1,9);

            verbose('answer is: ' + num);

            info.session.guess_answer = num;

            info.wait('wait_guess');
            return '��������ֵ���Ϸ��, 1~9,ѡһ��';
        }
    });

    webot.waitRule('wait_suggest_keyword', function(info, next){
        if (!info.text) {
            return next();
        }

        // ���ն������� name ��ȡ���� handler
        var rule_search = webot.get('search');

        // �û��ظ���������Ϣ
        if (info.text.match(/^(��|Ҫ|y)$/i)) {
            // �޸Ļظ���Ϣ��ƥ���ı���������������ִ��
            info.param[0] = 's nodejs';
            info.param[1] = 'nodejs';

            // ִ��ĳ������
            webot.exec(info, rule_search, next);
            // Ҳ���Ե��� rule �� exec ����
            // rule_search.exec(info, next);
        } else {
            info.param[1] = info.session.last_search_word;
            // ����ֱ�ӵ��� handler :
            rule_search.handler(info, next);
            // ����ֱ���������õ� function name �����ã�
            // do_search(info, next);
        }
        // remember to clean your session object.
        delete info.session.last_search_word;
    });
    // �������е�action
    webot.set('suggest keyword', {
        description: '����: s nde ,Ȼ���ٻظ�Y������',
        pattern: /^(?:����?|search|s\b)\s*(.+)/i,
        handler: function(info){
            var q = info.param[1];
            if (q === 'nde') {
                info.session.last_search_word = q;
                info.wait('wait_suggest_keyword');
                return '��������:' + q + '���ƺ�ƴд����Ҫ�Ұ������Ϊ��nodejs����������?';
            }
        }
    });

    function do_search(info, next){
        // pattern�Ľ������������param��
        var q = info.param[1];
        log('searching: ', q);
        // ��ĳ���ط�����������...
        return search(q , next);
    }

    // ����ͨ���ص����ؽ��
    webot.set('search', {
        description: '����: s �ؼ��� ',
        pattern: /^(?:����?|search|�ٶ�|s\b)\s*(.+)/i,
        //handlerҲ�������첽��
        handler: do_search
    });


    webot.waitRule('wait_timeout', function(info) {
        if (new Date().getTime() - info.session.wait_begin > 5000) {
            delete info.session.wait_begin;
            return '��Ĳ�����ʱ��,����������';
        } else {
            return '���ڹ涨ʱ������������: ' + info.text;
        }
    });

    // ��ʱ����
    webot.set('timeout', {
        description: '����timeout, �ȴ�5���ظ�,����ʾ��ʱ',
        pattern: 'timeout',
        handler: function(info) {
            info.session.wait_begin = new Date().getTime();
            info.wait('wait_timeout');
            return '��ȴ�5���ظ�';
        }
    });

    /**
     * Wait rules as lists
     *
     * ʵ�����Ƶ绰�ͷ����Զ�Ӧ������
     *
     */
    webot.set(/^ok webot$/i, function(info) {
        info.wait('list');
        return '����ָ�\n' +
            '1 - �鿴������Ϣ\n' +
            '2 - ��������ѡ��';
    });
    webot.waitRule('list', {
        '1': 'webot ' + package_info.version,
        '2': function(info) {
            info.wait('list-2');
            return '��ѡ������:\n' +
                '1 - Marry\n' +
                '2 - Jane\n' +
                '3 - �Զ���'
        }
    });
    webot.waitRule('list-2', {
        '1': '��ѡ���� Marry',
        '2': '��ѡ���� Jane',
        '3': function(info) {
            info.wait('list-2-3');
            return '����������Ҫ����';
        }
    });
    webot.waitRule('list-2-3', function(info) {
        if (info.text) {
            return '�������� ' + info.text;
        }
    });


    //֧��location��Ϣ ��examplesʹ�õ��Ǹߵµ�ͼ��API
    //http://restapi.amap.com/rgeocode/simple?resType=json&encode=utf-8&range=3000&roadnum=0&crossnum=0&poinum=0&retvalue=1&sid=7001&region=113.24%2C23.08
    webot.set('check_location', {
        description: '������ľ�γ��,�һ��ѯ���λ��',
        pattern: function(info){
            return info.is('location');
        },
        handler: function(info, next){
            geo2loc(info.param, function(err, location, data) {
                location = location || info.label;
                next(null, location ? '������' + location : '�Ҳ�֪������ʲô�ط���');
            });
        }
    });

    //ͼƬ
    webot.set('check_image', {
        description: '����ͼƬ,�ҽ�������hashֵ',
        pattern: function(info){
            return info.is('image');
        },
        handler: function(info, next){
            verbose('image url: %s', info.param.picUrl);
            try{
                var shasum = crypto.createHash('md5');

                var req = require('request')(info.param.picUrl);

                req.on('data', function(data) {
                    shasum.update(data);
                });
                req.on('end', function() {
                    return next(null, '���ͼƬhash: ' + shasum.digest('hex'));
                });
            }catch(e){
                error('Failed hashing image: %s', e)
                return '����ͼƬhashʧ��: ' + e;
            }
        }
    });

    // �ظ�ͼ����Ϣ
    webot.set('reply_news', {
        description: '����news,�ҽ��ظ�ͼ����Ϣ��',
        pattern: /^news\s*(\d*)$/,
        handler: function(info){
            var reply = [
                {title: '΢�Ż�����', description: '΢�Ż����˲����ʺţ�webot', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'https://github.com/node-webot/webot-example'},
                {title: '����ͬ��΢���ʺ�', description: '����ͬ��΢���ʺŶ�ά�룺douban-event', pic: 'http://i.imgur.com/ijE19.jpg', url: 'https://github.com/node-webot/weixin-robot'},
                {title: 'ͼ����Ϣ3', description: 'ͼ����Ϣ����3', pic: 'https://raw.github.com/node-webot/webot-example/master/qrcode.jpg', url: 'http://www.baidu.com'}
            ];
            // ���� "news 1" ʱֻ�ظ�һ��ͼ����Ϣ
            return Number(info.param[1]) == 1 ? reply[0] : reply;
        }
    });

    // ����ָ��ͼ����Ϣ��ӳ���ϵ
    webot.config.mapping = function(item, index, info){
        //item.title = (index+1) + '> ' + item.title;
        return item;
    };

    //������Ϣ���޷�ƥ��ʱ��fallback
    webot.set(/.*/, function(info){
        // ���� error log �ռ�����������Ϣ�������ڽ��������ƹ���
        // ��Ҳ���Խ���Щ message �������ݿ�
        log('unhandled message: %s', info.text);
        info.flag = true;
        return '�㷢���ˡ�' + info.text + '��,��ϧ��̫����,������. ����: help �鿴���õ�ָ��';
    });
};
