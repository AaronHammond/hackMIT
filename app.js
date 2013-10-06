/**
 * Module dependencies.
 */

var flash = require('connect-flash');
var express = require('express');

var http = require('http');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var User = require('./models/User');
var Conversation = require('./models/Conversation');
var Message = require('./models/Message');
var Profile = require('./models/Profile');
var MemoryStore = express.session.MemoryStore;
var sessionStore = new MemoryStore();
var io = require('socket.io');
var cookie = require("cookie");
var connect = require('connect');
var connectEnsureLogin = require('connect-ensure-login');

// db set up
//var connStr = 'mongodb://localhost:27017/hackmit';
var connStr = 'mongodb://nodejitsu:b5e8fbdb53b03e7cc1ce8da39dbd31e3@paulo.mongohq.com:10082/nodejitsudb8229868647';
mongoose.connect(connStr, function(err) {
    if (err) throw err;
    console.log('Successfully connected to MongoDB');
    dumpdata();
});

var passport = require('./util/passport');

// all environments
app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(path.join(__dirname, 'public')));
    /*
     Stuff needed to get passport to STFU
     */
    app.use(express.cookieParser() );
    app.use(express.session({ secret: 'razzledazzle' , store: sessionStore, key: 'express.sid'}));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    /*
     Keep yo router
     */
    app.use(app.router);


    app.use(express.errorHandler());

});


/*
 * ROUTING
 */
var routes = require('./routes');
var users = require('./routes/users');
var conversations = require('./routes/conversations');

//root
app.get('/', routes.index);

//user
app.get('/users/register', users.register);
app.post('/users/register', users.doRegister);

app.get('/users/login', users.login);
app.post('/users/login', users.doLogin);

app.get('/users/profile', users.viewProfile);
app.post('/users/profile', connectEnsureLogin.ensureLoggedIn('/users/login'), users.setProfile);

app.get('/users/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.post('/users/killconversation', users.killConversation);

//conversation
app.get('/chat', connectEnsureLogin.ensureLoggedIn('/users/login'), conversations.display);



io = io.listen(http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
}));


// sockets for conversation/profile reveal

io.set('authorization', function (data, callback) {
    if(data.headers.cookie) {
        // save parsedSessionId to handshakeData
        data.cookie = cookie.parse(data.headers.cookie);
        data.sessionId = connect.utils.parseSignedCookie(data.cookie['express.sid'], 'razzledazzle');
    }
    console.log("authorizing...")
    callback(null, true);
});

io.sockets.on('connection', connectionHandler);

function connectionHandler(socket) {
    var sessionId    = socket.handshake.sessionId;
    if(!sessionStore.sessions[sessionId]){
         return;
    }
    sess = JSON.parse(sessionStore.sessions[sessionId]);
    var uid = sess.passport.user;
    User.findOne({_id: uid}, function (err, me){

        if(me){

            Conversation.find({}, function (err, results){
                for(i in results){
                    if(results[i].active && (String(results[i].user1) == String(me._id) || String(results[i].user2) == String(me._id))){

                        var convo = results[i];



                        var otherUser;
                        //if i am user 1
                        if(String(results[i].user1) == String(me._id)){
                            otherUser = results[i].user2;
                        }
                        else{
                            otherUser = results[i].user1;
                        }

                        Profile.find({}, function(err, results){
                            for(var i in results){
                                if(String(results[i].owner) == String(otherUser)){
                                    var viewableProf = {};
                                    if(convo.messages.length > -1){
                                        viewableProf['firstName'] = results[i].firstName;
                                        viewableProf['image'] = results[i].image;
                                    }
                                    if(convo.messages.length > 3){
                                        viewableProf['lastName'] = results[i].lastName;
                                    }
                                    if(convo.messages.length > 5){
                                        viewableProf['hometown'] = results[i].hometown;
                                    }
                                    socket.emit('profile', viewableProf);
                                }

                            }

                        });



                        convo.messages.map(function (message){
                            Message.findOne({_id: message}, function(err, msg){
                                socket.emit('message', msg.text);
                            });
                        });

                        socket.on('message', function(data){
                            var msg = new Message({owner: me._id, text : (me.username + " - " + data)});
                            msg.save();
                            if(data){
                                convo.messages.push(msg._id);
                            }

                            convo.save();

                            //folks that are involved in the conversation
                            var subspace = io.sockets.clients().filter(function(sock) {
                                if(sock.handshake.sessionId && sessionStore.sessions[sock.handshake.sessionId]){
                                    var them = JSON.parse(sessionStore.sessions[sock.handshake.sessionId]).passport.user;

                                    return (convo.user1 == them || convo.user2 == them);
                                }
                            })
                            //emit to all interested parties
                            for(sock in subspace){
                                subspace[sock].emit('message', msg.text);

                                var target = JSON.parse(sessionStore.sessions[subspace[sock].handshake.sessionId]).passport.user;
                                Conversation.find({}, function (err, results){
                                    for(i in results){

                                        if(results[i].active && (String(results[i].user1) == String(target) || String(results[i].user2) == String(target))){


                                            var otherUser;
                                            //if i am user 1
                                            if(String(results[i].user1) == String(target)){
                                                otherUser = results[i].user2;
                                            }
                                            else{
                                                otherUser = results[i].user1;
                                            }

                                            Profile.find({}, function(err, results){
                                                for(var i in results){
                                                    if(String(results[i].owner) == String(otherUser)){
                                                        var viewableProf = {};
                                                        if(convo.messages.length > -1){
                                                            viewableProf.firstName = results[i].firstName;
                                                            viewableProf['image'] = results[i].image;
                                                        }
                                                        if(convo.messages.length > 3){
                                                            viewableProf.lastName = results[i].lastName;
                                                        }
                                                        if(convo.messages.length > 5){
                                                            viewableProf.hometown = results[i].hometown;
                                                        }
                                                        subspace[sock].emit('profile', viewableProf);
                                                    }

                                                }

                                            })


                                        }
                                    }
                                });
                            }
                        });
                        return;
                    }
                }
                me.startConversation();
                connectionHandler(socket);
            });
        }
    });
}


function dumpdata(){
    console.log('dumping data');
    Profile.remove({}, function(err){ if(err) throw err;});
    Message.remove({}, function(err){ if(err) throw err;});
    Conversation.remove({}, function(err){ if(err) throw err;});
    User.remove({}, function(err){ if(err) throw err;});


    aaron = new User({username: 'aaron', password: 'pass'});

    dan = new User({username: 'dan', password: 'pass'});
    dan.save();
    (new Profile({owner: dan._id, firstName: 'Dan', lastName: 'Savage',
        hometown: 'Cambridge', gender: 'M', image: 'http://xfinity.comcast.net/blogs/tv/files/2011/01/dan-savage.jpg'})).save();

    barbie = new User({username: 'barbie', password: 'pass'});
    barbie.save();
    (new Profile({owner: barbie._id, firstName: 'Barbie', lastName: 'Duckworth',
        hometown: 'Nashua', gender: 'F', image: 'http://s3.amazonaws.com/rapgenius/filepicker/8aD6CphbRxmTnlcsGFty_barbie_profile.jpg'})).save();

    angela = new User({username: 'angela', password: 'pass'});
    angela.save();
    (new Profile({owner: angela._id, firstName: 'Angela', lastName: 'Merkel',
        hometown: 'Worcester', gender: 'F', image: 'http://images.forbes.com/media/lists/11/2008/34AH.jpg'})).save();

    aaron.save(function(err, doc){
        doc.startConversation();
    });
    (new Profile({owner: aaron._id, firstName: 'Aaron', lastName: 'Hammond',
        hometown: 'Dunstable', gender: 'M', image: 'http://cdn.theatlantic.com/static/infocus/putin091311/p34_DWI22303.jpg'})).save();




}





