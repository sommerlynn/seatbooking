var webot = require('../webot')
var Webot = webot.Webot
var Info = webot.Info
var wechat = require('../wechat-mp')
var debug = require('debug')
var log = debug("weixin-robot::weixin::log")
var error = debug("weixin-robot::weixin::error")

var mp = wechat()

// keep the original watch method private,
// but accessible.
Webot.prototype._watch = Webot.prototype.watch

Webot.prototype.watch = function(app, options) {
  options = options || {}
  if (typeof options === 'string') {
    options = {
      token: options
    }
  }

  var self = this
  var path = options.path || '/'

  // start must go before cookie middleware
  app.use(path, mp.start(options))

  // handlers can be set at last
  process.nextTick(function() {
    app.use(path, self.middleware())
    app.use(path, mp.end())
    log('watching "%s" ~ %j', path, options)
  })
}

/**
 * Format info.reply to `wechat-mp` rendable version
 *
 * Examples:
 *
 *    info.reply == 'text'  ->  { msgType: 'text', content: text }
 *
 *    info.reply == {
 *      title: 'Hello',     ->  { msgType: 'news', content: [{title: ...}] }
 *      url: 'http://..'
 *    }
 *
 *    info.reply = [{
 *      title: 'title1':
 *    }, {                  ->  { msgType: 'news', content: [{title: ...}] }
 *      title: 'title2'
 *    }]
 *
 *    info.reply = {
 *      type: 'news',
 *      content: ''
 *    }
 *
 *    info.reply = {
 *      type: 'music',      -> { msgType: 'music', content: { musicUrl: 'xxx' } }
 *      musicUrl: ''
 *    }
 *
 */
Webot.prototype.formatReply = function(info) {
  // the response body should be data we want to send to wechat
  // empty news will shut up wechat.
  var reply = info.reply || ''
  var msgType = 'object' !== typeof reply ? 'text' : reply.type
  var kfAccount = reply.kfAccount || "" // !!"" === false
  var content = reply.content || reply

  log("Webot.prototype.formatReply::if (msgType !== 'text')::before")

  if (msgType !== 'text') {
    msgType = msgType || 'news'
    if (msgType === 'news' && !Array.isArray(content)) {
      content = [content]
    }
  }
  if (info.noReply) {
    content = ''
    msgType = 'text'
  }
  return {
    sp: info.sp,
    uid: info.uid,
    msgType: msgType,
    content: content,
    createTime: new Date(),
    kfAccount: kfAccount,
  }
}

Webot.prototype.middleware = function() {
  var self = this
  return function(req, res, next) {
    var info = Info(req.body)

    info.req = req
    info.res = res
    info.session = req.session

    log("Webot.prototype.middleware::self.reply.outter");
    self.reply(info, function(err, info) {
      log("Webot.prototype.middleware::self.reply.enter");
      res.body = self.formatReply(info)
      next()
    })
  }
}

// Export `wechat-mp` module.
webot.wechat = wechat

module.exports = webot
