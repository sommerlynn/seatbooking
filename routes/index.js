var express = require('express'),
    router = express.Router(),
    models = require('../models/buildings');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: '������ʹ' });
});

/*
* Get seat map of a classroom
* ��ȡһ�����ҵ���λͼ
* */
router.get('/seatmap', function(req, res, next) {
  res.render('seatmap',{ title: '�߫h��ʹ-������λͼ' });
});

/*
* Get buildings of a school
* ��ȡ��ѧ¥�б�
* */
router.get('/building', function(req, res, next){
  models.getAll(1, function(err, areas){
    if(err){
      res.render('error', {title:'���������ϣ����Ժ�����'});
    }
    else{
      res.render('building', {title:'�߫h��ʹ-����У԰��ϰ��', areas: areas});
    }
  });
});

module.exports = router;
