var crypto = require('crypto')
var debug = require('debug')
var log = debug("wechat-mp::wechat::log")
var error = debug("wechat-mp::wechat:error")

var mp_xml = require('./xml')

function calcSig(token, timestamp, nonce) {
  var s = [token, timestamp, nonce].sort().join('')
  return crypto.createHash('sha1').update(s).digest('hex')
}

/**
 * Check signature
 */
function checkSig(token, query) {
  if (!query) return false
  var sig = query.signature
  return query.signature === calcSig(token, query.timestamp, query.nonce)
}

function defaults(a, b) {
  for (var k in b) {
    if (!(k in a)) {
      a[k] = b[k]
    }
  }
}


var DEFAULT_OPTIONS = {
  tokenProp: 'wx_token',
  dataProp: 'body',
  session: true
}


/**
 *
 * New Wechat MP instance, handle default configurations
 *
 * Options:
 *
 *    `token`      - wechat token
 *    `tokenProp`  - will try find token from this property of `req`
 *
 */
function Wechat(options) {
  if (!(this instanceof Wechat)) return new Wechat(options)
  if ('string' == typeof options) {
    options = {token: options}
  }
  this.options = options || {}
  defaults(this.options, DEFAULT_OPTIONS)
}

/**
 * To parse wechat xml requests to webot Info realy-to-use Object.
 *
 * @param {object|String} options/token
 *
 */
Wechat.prototype.start =
Wechat.prototype.parser = function bodyParser(opts) {
  log("if ('string' == typeof opts) {");
  if ('string' == typeof opts) {
    opts = {token: opts}
  }
  opts = opts || {}
  defaults(opts, this.options)

  var self = this
  var tokenProp = opts.tokenProp
  var dataProp = opts.dataProp
  var generateSid

  log("if (opts.session !== false) " + opts.session)
  if (opts.session !== false) {

    log("if (opts.session !== false) " + opts.session)
    generateSid = function(data) {
      return ['wx', data.sp, data.uid].join('.')
    }
  }
  log(generateSid);
  log("00::return function(req, res, next)")
  return function(req, res, next) {
    // use a special property to demine whether this is a wechat message
    log("11::if (req[dataProp] && req[dataProp].sp) {")
    if (req[dataProp] && req[dataProp].sp) {
      // data already set, pass
      return next()
    }
    log("22::var token = req[tokenProp] || opts.token")
    var token = req[tokenProp] || opts.token
    if (!checkSig(token, req.query)) {
      return Wechat.block(res)
    }
    log("33::var token = req[tokenProp] || opts.token")
    if (req.method == 'GET') {
      return res.end(req.query.echostr)
    }
    log("44::var token = req[tokenProp] || opts.token")
    if (req.method == 'HEAD') {
      return res.end()
    }
    log("55::var token = req[tokenProp] || opts.token");
    Wechat.parse(req, function(err, data) {
      if (err) {
        res.statusCode = 400
        return res.end()
      }
      req[dataProp] = data
      if (generateSid) {
        var sid = generateSid(data)
        // always return the same sessionID for a given service_provider+subscriber
        var propdef = {
          get: function(){ return sid },
          set: function(){ }
        }
        Object.defineProperty(req, 'sessionID', propdef)
        Object.defineProperty(req, 'sessionId', propdef)
      }
      next()
    })
  }
}

/**
 * to build reply object as xml string
 */
Wechat.prototype.end =
Wechat.prototype.responder = function responder() {
  return function(req, res, next) {
    log("Wechat.prototype.end");
    res.setHeader('Content-Type', 'application/xml')
    res.end(Wechat.dump(Wechat.ensure(res.body, req.body)))
  }
}

/**
 * Ensure reply string is a valid reply object,
 * get data from request message
 */
Wechat.ensure = function(reply, data) {
  reply = reply || { content: '' }
  data = data || { }
  if ('string' == typeof reply) {
    reply = { content: reply, msgType: 'text' }
  }
  // fill up with default values
  reply.uid = reply.uid || data.uid
  reply.sp = reply.sp || data.sp
  // msgType is always lowercase
  reply.msgType = (reply.msgType || reply.type || 'text').toLowerCase()
  reply.createTime = reply.createTime || new Date()
  return reply
}

Wechat.parse = function (req, callback) {
  var chunks = [];
  req.on('data', function (data) {
    chunks.push(data);
  });
  req.on('end', function () {
    req.rawBody = Buffer.concat(chunks).toString();
    try {
      var data = Wechat.load(req.rawBody)
      callback(null, data)
    } catch (e) {
      log(e);
      return callback(e)
    }
  });

}

/**
 * Block unsignatured request
 */
Wechat.block = function endRes(res) {
  log("Here is a test break Wechat.block")
  res.statusCode = 401
  res.end('Invalid signature')
}

/**
 * Check signature
 */
Wechat.checkSignature = checkSig

/**
 * parse xml string
 */
Wechat.load = mp_xml.parse

/**
 * dump reply as xml string
 * if content in reply is empty should return empty string as response body
 * see: https://mp.weixin.qq.com/cgi-bin/announce?action=getannouncement&key=1413446944&version=15&lang=zh_CN
 */
Wechat.dump = function(reply) {
  log("Here is a test break Wechat.dump")
  if (reply.content === '') {
    return '';
  }
  return mp_xml.build(reply);
}


module.exports = Wechat
