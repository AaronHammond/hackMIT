/**
 * Created with JetBrains WebStorm.
 * User: aaron
 * Date: 10/5/13
 * Time: 1:12 PM
 * To change this template use File | Settings | File Templates.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./User');

var MessageSchema = new Schema({
    owner: Schema.Types.ObjectId,
    text: {type: String}
});


module.exports = mongoose.model('Message', MessageSchema);