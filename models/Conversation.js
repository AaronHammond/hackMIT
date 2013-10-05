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
var Message = require('./Message');

var ConversationSchema = new Schema({
    user1: Schema.Types.ObjectId,
    user2: Schema.Types.ObjectId,
    messages: [Schema.Types.ObjectId],
    active: {type: Boolean, default: true}
});


module.exports = mongoose.model('Conversation', ConversationSchema);
