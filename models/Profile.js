/**
 * Created with JetBrains WebStorm.
 * User: aaron
 * Date: 10/5/13
 * Time: 1:13 PM
 * To change this template use File | Settings | File Templates.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./User');

var ProfileSchema = new Schema({
    owner: Schema.Types.ObjectId,
    firstName: {type: String},
    lastName: {type: String},
    gender: {type: String},
    hometown: {type: String},
    image: String
});


module.exports = mongoose.model('Profile', ProfileSchema);
