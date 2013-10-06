/*
 * GET users listing.
 */

var User = require('../models/User');
var Profile = require('../models/Profile');
var Conversation = require('../models/Conversation');
var passport = require('../util/passport');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


exports.register = function(req, res){
    res.render('register', { title: 'Register', msg: req.flash('error') });
}
exports.login = function(req, res){
    res.render('login', { title: 'Login', msg: req.flash('error') });
}

exports.doLogin = passport.authenticate('local', {successRedirect: '/chat',
        failureRedirect: '/users/login',
        failureFlash: true});

exports.doRegister = function(req, res){
    User.findOne({username: req.param('username')}, function(user, err) {
        console.log("HEREE");
        if(user){
            console.log('found a user with username ' + req.params['user']);
            console.log(user);
            // username is non unique
            req.flash('error', 'An account with that username already exists!');
            return res.redirect('/users/register');
        }
        user = new User({username: req.param('username'),
            password: req.param('password')});
        user.save(function (err, doc){
            if(err){
                req.flash('error', err);
                return res.redirect('/users/register');
            }

            var prof = new Profile({owner: user._id, image: req.param('user-image')});
            prof.save();
            doc.startConversation();
            req.login(doc, function(err){
                if(err){
                    req.flash('error', 'Your account was created but we couldn\'t log you in. Welp');
                    return res.redirect('/users/login');
                }
                return res.redirect('/users/profile');
            })

        });

    });

}

exports.viewProfile = function(req, res) {
    if(!req.user){
        return res.redirect('/');
    }

    console.log(req.user);

    Profile.find({}, function(err, results){
        for(var i in results){
            console.log("Comparing " + String(results[i].owner) + " " + String(req.user._id));
            if(String(results[i].owner) == String(req.user._id)){
                console.log('found ze owner');
                return res.render('profile', {title: 'Profile', profile: results[i]});
            }
        }
        return res.redirect('/');
    });
}

exports.setProfile = function(req, res){
    if(!req.user){
        res.redirect('/');
    }

    console.log(req.user);

    Profile.find({}, function(err, results){

        for(var i in results){
            console.log("Comparing " + String(results[i].owner) + " " + String(req.user._id));
            if(String(results[i].owner) == String(req.user._id)){
                console.log('found ze owner');

                results[i].lastName = req.param('lastName');
                results[i].firstName = req.param('firstName');
                results[i].hometown = req.param('hometown');
                results[i].gender = req.param('gender');
                results[i].image = req.param('user-image');

                results[i].save();

                return res.redirect('/chat');
            }
        }
        return res.redirect('/');
    });
}

exports.killConversation = function(req, res){
    console.log('KILL IT');


    if(!req.user){
        console.log('not logged in');
        return res.redirect('/');
    }

    console.log(req.user);
    Conversation.find({}, function(err, results){
        console.log('results ' + results);
        for(var i in results){
            console.log('Considering ' + results[i]);
            if(results[i].active && (String(results[i].user1) == String(req.user._id) || String(results[i].user2) == String(req.user._id))){


                Conversation.remove({_id : results[i]._id}, function(err, ct){
                    console.log('removed ' + ct );
                });
                req.user.startConversation();

                return res.redirect('/');
            }
        }
    });
}