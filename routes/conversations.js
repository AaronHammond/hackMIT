/**
 * Created with JetBrains WebStorm.
 * User: aaron
 * Date: 10/5/13
 * Time: 2:18 PM
 * To change this template use File | Settings | File Templates.
 */


exports.display = function(req, res){
    res.render('chat', { title: 'Chat', msg: req.flash('error') });
}