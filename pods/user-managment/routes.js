var JWT         = require('jsonwebtoken');   // used to sign our content
var aguid       = require('aguid')  // https://github.com/ideaq/aguid
var url         = require('url');   // node core!
var JWT_SECRET  = process.env.JWT_SECRET || "o8fup9w8#$GW%Y#$^U&35y3%Yw35yE#Y#Yu4pf9pjw98epfaw8ofioawufe@#eFSADFASDFAS";
var Boom        = require('boom');
var Joi         = require('joi');
var seneca      = require('seneca')();
var client      = seneca.client('10102');
var l           = require('../../logger');





var promise = require('bluebird');
client.actAsync = promise.promisify(client.act, {
    multiArgs: false,
    context: client
});






// var controller  = require('./controller');

var controller = {
  login: function(request, reply) {
    client.actAsync({ role:'auth', model: 'user', cmd:'validate', data: request.payload })
      .then(function(response){
        //check user is found and valid
        if (!response.user) {
            l.warn('Bad username or password');
            return reply(Boom.unauthorized('Bad username or password'));
        } else {
          var user = response.user;
          var session = createSessionAndSaveToRedis(user);

          // sign the session as a JWT
          var token = JWT.sign(session, JWT_SECRET); // synchronous
          l.debug('created new token:', token);

          reply({text: 'Check Auth Header for your Token', access_token: token})
          .header("authorization", token);
        }
      })
      .catch(function(err){
        console.log('error occured during login', err);
        return reply(Boom.unauthorized(err.details.message));
      });
  },


  logout: function(request, reply) {
    // l.debug('logout: auth object:', request.auth);
    // var decoded = JWT.decode(request.headers.authorization,JWT_SECRET);
    // l.debug('logout: decoded token: ', decoded);
    l.debug('logout: tying to remove session from redis', request.auth.credentials);
    redisClient.get(request.auth.credentials.session_id, function(rediserror, redisreply) {
      /* istanbul ignore if */
      if(rediserror) {
        l.error('logout: Redis error during logout',rediserror);
      }
      var session = JSON.parse(redisreply);
      l.debug('logout: found session in redis:',session);
      // Delete session in Redis
      redisClient.del(session.session_id);
      redisClient.del(session.username);
      l.debug('logout: deleted session from redis:',session);
      reply({msg: 'You have been logged out!'});
    });
  }
};













// preparing redis client connection
var redisClient = require('redis-connection')(); // instantiate redis-connection
redisClient.set('redis', 'working');
redisClient.get('redis', function (rediserror, reply) {
  /* istanbul ignore if */
  if(rediserror) {
    console.log(rediserror);
  }
  console.log('redis is ' + reply.toString()); // confirm we can access redis
});







//validatin function to check session exsists in redis
var validate = function (decoded, request, callback) {
  l.debug('Validate JWT Token: Decoded Token', decoded);
  // do your checks to see if the session is valid
  redisClient.get(decoded.session_id, function (rediserror, reply) {
    /* istanbul ignore if */
    if(rediserror) {
      l.error('Validate JWT Token: Redis error during validation ', rediserror);
    }

    l.debug('Validate JWT Token: Found value in redis', reply);
    
    if(!reply) {
      l.debug('Validate JWT Token: Invalid value from redis', reply);
      return callback(rediserror, false);
    }

    var session = JSON.parse(reply);
    l.debug('Validate JWT Token: token.valid = ',session.valid);
    if (session.valid === true) {
      return callback(rediserror, true);
    } else {
      return callback(rediserror, false);
    }

  });
};






//Create new session object for the provided user with session_id
//Save the session object to redis db with session_id as a key
//Clear previous session for user
//Link the user with new session object

var createSessionAndSaveToRedis = function (user) {
  //create new session
  var session = {
    valid: true, // this will be set to false when the person logs out
    session_id: aguid(), // a random session id
    exp: new Date().getTime() + 30 * 60 * 1000, // expires in 30 minutes time
    user_id: user.id,
    username: user.username,
  };

  //create the session in Redis
  redisClient.set(session.session_id, JSON.stringify(session));
  l.debug('Redis: Created new session for user:', session);
  
  //destroy previous sessions for user if found
  redisClient.get(user.username, function(rediserror, redisreply) {
    /* istanbul ignore if */
    if(rediserror) {
      l.error('Redis: Error during removing old session for user:',rediserror);
    }

    var username_session = JSON.parse(redisreply);
    if(username_session){
      l.debug('Redis: Found old session linked to user:', username_session);
      // update the session to no longer valid:
      redisClient.del(username_session.session_id);
      l.debug('Redis: Removed old session which was linked to user:', username_session);
    }
  });

  //update username active session
  redisClient.set(session.username, JSON.stringify(session));
  l.debug('Redis: Linked new session for user:', session);

  return session;
};








exports.register = function (server, options, next) {

  server.auth.strategy('jwt', 'jwt', true,
  { 
      key: JWT_SECRET,  
      validateFunc: validate,
      verifyOptions: { 
        ignoreExpiration: true 
      }
  });



  server.route([
    {
      method: 'GET', 
      path: '/api/user/me', 
      config: {
        cors: true,
        auth: {
          strategy:'jwt',
          mode: 'try'
        }
      },
      handler: function(request, reply) {
        reply({auth: request.auth})
        .header("Authorization", request.headers.authorization);
      }
    }, {
      /*
        Implement login function here.
        1\ check username and password valuse are valid (joi)
        2\ find user from auth micro service
        3\ validate passowrd
        4\ createSessionAndSaveToRedis
          4.1\ create session and save to redis with session_id as key
          4.2\ get old session and remove it from redit using username lookup
          4.3\ update username's lookup active session in redis with new one
          4.4\ create token which is signed session using JWT
        8\ reply success with new token in authorization header.
      */
      method: 'POST',
      path: "/api/user/login",
      config: {
        cors: true,
        auth: {
          mode: 'try',
          strategy: 'jwt'
        },
        validate: {
          payload: {
            email: Joi.string().min(1),
            password: Joi.string().min(4)
          }
        }
      },
      handler: controller.login
      
    }, {
      /*
        1- any invalid token will not be processed, because we set auth mode to jwt/required
        2- decode authorization token provided by the client
        3- get session object from redis using session_id
      */
      method: 'POST',
      path: "/api/user/logout",
      config: {
        auth: 'jwt'
      },
      handler: controller.logout
    }, { 
      // remove this method if you use this in PROD!
      method: 'GET', 
      path: '/end', 
      config: {
        cors: true,
        auth: false
      },
      handler: function(request, reply) {
        redisClient.end();
        reply({text: 'end'});
      }
    }
  ]);

  next();
};






exports.register.attributes = {
    name: 'userManagmentPlugin',
    version: '0.0.1'
};