var crypto = require('crypto'),
    User = require('../models/user.js');

var debug = require('debug')('Ablog:server');

module.exports = function(app) {
    app.get('/',function(req, res){
        res.render('index', {
                title: '主页',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
    });
    app.get('/reg', checkNotLogin);
    app.get('/reg', function(req, res){
        res.render('reg', {
                title: '注册',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function(req, res){
        var password = req.body.password,
            password_re = req.body['password-repeat'];
        debug('test');
        
        //校验两次输入的密码是否一致
        if(password_re !== password){
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/reg');
        }
        
        var md5 = crypto.createHash('md5');
        password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });
        //检查用户名是否已经存在
        User.get(newUser.name, function(err, user){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            if(user) {
                req.flash('error', '用户名已被占用！');
                return res.redirect('/reg');
            }
            //如果用户不存在,新建用户
            newUser.save(function(err, user){
                if(err){
                    req.flash('error', err);
                    return req.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功');
                res.redirect('/');
            });
        });
    });
    app.get('/login', checkNotLogin);
    app.get('/login', function(req, res){
        res.render('login', {
                title: '登陆',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function(req, res){
        //生成密码的md5
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        //检查用户名是否存在
        User.get(req.body.name, function(err, user){
            if(!user){
                req.flash('error', '用户不存在');
                return res.redirect('/login');
            }
            if(user.password != password){
                req.flash('error', '密码错误！');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', '登陆成功， 欢迎您'+user.name);
            res.redirect('/');
        })
    });
    app.get('/post', checkLogin);
    app.get('/post', function(req, res){
        res.render('post', {
                title: '发表',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
    });
    app.post('/post', checkLogin);
    app.post('/post', function(req, res){
        
    });
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res){
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');
    });
    
    function checkLogin(req, res, next) {
        if(!req.session.user){
            req.flash('error', "尚未登陆!");
            res.redirect('/login');
        }
        next();
    }
    
    function checkNotLogin(req, res, next){
        if(req.session.user){
            req.flash('error', '已登陆！');
            res.redirect('back');
        }
        next();
    }
};
