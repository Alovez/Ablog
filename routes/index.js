var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

var debug = require('debug')('Ablog:server');

module.exports = function(app) {
   
    app.get('/',function(req, res){
        Post.getAll(null, function(err, posts){
            if(err){
                posts = [];
            }
            res.render('index', {
                    title: '主页',
                    user: req.session.user,
                    posts: posts,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
            });
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
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功');
            res.redirect('/');
        });    
    });
    
    app.get('/logout', checkLogin);
    app.get('/logout', function(req, res){
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');
    });
    
    app.get('/upload', checkLogin);
    app.get('/upload', function(req, res){
        res.render('upload', {
            title: '上传',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
        })
    })
    
    app.post('/upload', checkLogin);
    app.post('/upload',function(req, res){
        req.flash('success', "文件上传成功!");
        res.redirect('/upload');
    })
    
    app.get('/u/:name', function(req, res){
        User.get(req.params.name, function(err, user){
            if(!user){
                req.flash('error', '提供的用户不存在，请核实后再试！');
                return res.redirect('/');
            }
            Post.getAll(user.name, function(err, posts){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user', {
                    title: user.name,
                    user: req.session.user,
                    posts: posts,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });
    
    app.get('/u/:name/:day/:title', function(req, res){
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                user: req.session.user,
                post: post,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    
    app.post('/u/:name/:day/:title', function(req, res){
        var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function(err){
            if (err){
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功!');
            res.redirect('back');
        });
    });
    
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function(req, res){
       var currentUser = req.session.user;
       Post.edit(currentUser.name, req.params.day, req.params.title, function(err, post){
           if(err){
               req.flash('error', err);
               return res.redirect('back');
           }
           res.render('edit', {
               title: "编辑",
               post: post,
               user: req.session.lyuser,
               success: req.flash('success').toString(),
               error: req.flash('error').toString()
           });
       });
    });
        
    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function(req, res){
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function(err){
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
            if(err){
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', "修改成功");
            res.redirect(url);            
        });
    });
    
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function(req, res){
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功');
            res.redirect('/');
        });
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
