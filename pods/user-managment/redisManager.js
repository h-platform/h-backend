var l = require('../../logger');




// Preparing redis client connection
var redisClient = require('redis-connection')(); // instantiate redis-connection
redisClient.set('redis', 'working');
redisClient.get('redis', function (rediserror, reply) {
  /* istanbul ignore if */
  if(rediserror) {
    l.error('Error occured during creating redis connection', rediserror);
  }
  l.info('Redis connection is ' + reply.toString()); // confirm we can access redis
});

