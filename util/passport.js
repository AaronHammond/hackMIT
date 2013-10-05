/**
 * Created with JetBrains WebStorm.
 * User: aaron
 * Date: 10/5/13
 * Time: 11:50 AM
 * To change this template use File | Settings | File Templates.
 */

var flash = require('connect-flash');
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('../models/User');

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findOne(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("hurr");
        User.findOne({username: username}, function(err, user) {
            console.log("Logging in " + username);
            if(err){
                return done(err);
            }
            if(!user) {
                console.log("Bad username");
                return done(null, false, {message: 'Incorrect Username'});
            }
            return user.comparePassword(password, function(err, isMatch){
                if(err || !isMatch){
                    console.log("Bad pass");
                    return done(null, false, {message: 'Incorrect Password'});
                }
                return done(null, user);
            })

        });
    }
));

module.exports = passport;