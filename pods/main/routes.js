var controller = require('./controller');

exports.register = function(server, options, next){
    server.route([
        {
            method: 'GET',
            path: '/api/views/queues_with_count',
            config: {
                auth: false,
                handler: controller.getQueuesWithPostCount
            }
        },{
            method: 'GET',
            path: '/{path*}',
            config: {
                auth: false,
                handler: function(request, reply){
                    reply({"error": "resource not found"}, 404)
                      .code(404)
                      .header('Access-Control-Allow-Origin','*')
                      .header('Content-Type', 'application/vnd.api+json');
                },
                id: '404'
            }
        }
    ]);

    next();
};

exports.register.attributes = {
    name: 'base'
};