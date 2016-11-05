var seneca = require('seneca')();
var client = seneca.client();




// shows the different login options for the user
// --------------------------------------------------------------
exports.getQueuesWithPostCount = function(request, reply){
    client.act({ role:'database', model: 'queue', cmd:'queryRecords', view: 'with_post_counts' }, function (err, result) {
        reply(result);
    });
};




// shows the different login options for the user
// --------------------------------------------------------------
exports.getPost = function(request, reply){
    var tray = {};
    client.act({ role:'database', model: 'queue', cmd:'queryRecords', view: 'with_post_counts' }, function (err, result) {
        tray.auth = request.auth;
        tray.queue_list = result.records;
        client.act({ role:'database', model: 'post', cmd:'getRecord', id: request.params.id}, function (err, result2) {
            tray.post = result2.record;
            tray.active_queue = result2.record.queue_id;
            client.act({ role:'database', model: 'comment', cmd:'queryRecords', where: [{col: 'post_id', op: '=', val:request.params.id}] }, function (err, result3) {
                tray.comment_list = result3.records;
                reply.view('post_view', tray);
            });
        });
    });
};




// shows the different login options for the user
// --------------------------------------------------------------
exports.postEdit = function(request, reply){
    client.act({ role:'database', model: 'queue', cmd:'queryRecords', view: 'with_post_counts' }, function (err, result) {
        var tray = {
            queue_list: result.records,
            post_id: request.params.id
        };
        client.act({ role:'database', model: 'post', cmd:'getRecord', id: tray.post_id}, function (err, result2) {
            // var tray2 = tray;
            tray.post = result2.record;
            tray.active_queue = result2.record.queue_id;
            tray.auth = request.auth;

            client.act({ role:'database', model: 'comment', cmd:'queryRecords', where: [{col: 'post_id', op: '=', val:request.params.id}] }, function (err, result3) {
                tray.comment_list = result3.records;
                reply.view('post_edit', tray);
            });
        });
    });
};




// shows the different login options for the user
// --------------------------------------------------------------
exports.processPostEdit = function(request, reply){
    request.payload.entity_type_id = 1; //post type
    request.payload.category_id = 1; //land category
    request.payload.area_unit = "م.م."; //area unit
    // console.log(request.payload);
    client.act({ role:'database', model: 'post', cmd:'saveRecord', record: request.payload}, function (err, results) {
        if(err) {
            console.log('**************');
            console.log(err.details.orig$);
            console.log('**************');
            reply.view('500',{msg: ''});
        } else {
            // console.log(results);
            reply.redirect('/posts/' + results.record.id);
        }
    });
};