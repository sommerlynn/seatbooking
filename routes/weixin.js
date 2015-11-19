/**
 * Created by lenovo on 2015/11/19.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send(req["href"]);
});

module.exports = router;