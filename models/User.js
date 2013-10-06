/**
 * Created with JetBrains WebStorm.
 * User: aaron
 * Date: 10/5/13
 * Time: 12:33 PM
 * To change this template use File | Settings | File Templates.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var Conversation = require('./Conversation');
var SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    username: {type: String, required: true, index : { unique: true} },
    password: { type: String, required: true }
});

/*
    Borrowed from MongoDB Manual
 */
UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};
UserSchema.statics.random = function(callback) {
    console.log(this);
    mongoose.model('User', UserSchema).count(function(err, count) {
        if (err) {
            return callback(err);
        }
        var rand = Math.floor(Math.random() * count);
        mongoose.model('User', UserSchema).findOne().skip(rand).exec(callback);
    }.bind(this));
};




UserSchema.methods.startConversation = function() {
    var convo = new Conversation();
    var me = this;

    UserSchema.statics.random(function(err, user){
        if(err){
            return err;
        }
        if(me == user){
            return me.startConversation();
        }

        convo = new Conversation({user1: me._id, user2: user._id, messages: []});
        convo.save();
        return convo;
    })
}

module.exports = mongoose.model('User', UserSchema);
