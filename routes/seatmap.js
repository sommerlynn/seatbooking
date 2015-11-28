/**
 * Created by pchen on 2015/11/28.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.render('seatmap',{ title: '×ùÎ»Í¼' });
});

module.exports = router;
