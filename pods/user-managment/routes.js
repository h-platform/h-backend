var JWT         = require('jsonwebtoken');   // used to sign our content
var aguid       = require('aguid')  // https://github.com/ideaq/aguid
var url         = require('url');   // node core!
var JWT_SECRET  = process.env.JWT_SECRET || "o8fup9w8#$GW%Y#$^U&35y3%Yw35yE#Y#Yu4pf9pjw98epfaw8ofioawufe@#eFSADFASDFAS";
var Boom        = require('boom');
var Joi         = require('joi');




var users = { // our "users database" 
    admin: {
      id: 1,
      fullname: 'Administrator',
      username: 'admin',
      password: '1234'
    },
    user1: {
      id: 2,
      fullname: 'User One',
      username: 'user1',
      password: '1234'
    },
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







// validatin function to check session exsists in redis
var validate = function (decoded, request, callback) {
  console.log(" - - - - - - - DECODED token:");
  console.log(decoded);
  // do your checks to see if the session is valid
  redisClient.get(decoded.session_id, function (rediserror, reply) {
    /* istanbul ignore if */
    if(rediserror) {
      console.log(rediserror);
    }

    console.log(' - - - - - - - REDIS reply - - - - - - - ', reply);
    if(!reply) {
      return callback(rediserror, false);
    }

    var session = JSON.parse(reply);
    if (session.valid === true) {
      return callback(rediserror, true);
    } else {
      return callback(rediserror, false);
    }

  });
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
      method: 'OPTIONS', 
      path: '/api/user', 
      config: {
        auth: false
      },
      handler: function(request, reply) {
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET')
        .header('Access-Control-Allow-Headers', ['Content-Type', 'Authorization', 'Accept']);
      }
    },{
      method: 'GET', 
      path: '/api/user', 
      config: {
        cors: true,
        auth: {
          strategy:'jwt',
          mode: 'try'
        }
      },
      handler: function(request, reply) {
        reply({text: 'user Info', auth: request.auth})
        .header('Access-Control-Allow-Origin','*')
        .header("Authorization", request.headers.authorization);
      }
    }, {
      method: 'OPTIONS', 
      path: '/api/user/me', 
      config: {
        auth: false
      },
      handler: function(request, reply) {
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,GET')
        .header('Access-Control-Allow-Headers', ['Content-Type', 'Authorization', 'Accept']);
      }
    }, {
      method: 'GET', 
      path: '/api/user/me', 
      config: {
        cors: true,
        auth: 'jwt'
      },
      handler: function(request, reply) {
        reply({text: 'You used a Token!', auth: request.auth})
        .header('Access-Control-Allow-Origin','*')
        .header("Authorization", request.headers.authorization);
      }
    }, {
      method: 'OPTIONS', 
      path: '/api/user/login', 
      config: {
        auth: false
      },
      handler: function(request, reply) {
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
        .header('Access-Control-Allow-Headers', ['content-type', 'authorization', 'accept']);
      }
    },
    {
      /*
        Implement login function here.
        1\ check username and password valuse are valid (joi)
        2\ find user from db
        3\ validate passowrd
        4\ create session and save to redis with session_id as key
        5\ get old session and remove it from redit using username lookup
        6\ update username's lookup active session in redis with new one
        7\ create token which is signed session using JWT
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
      handler: function(request, reply) {
        console.log(request.payload);

        // find user from local variable
        request.payload.username = request.payload.email;
        var user = users[request.payload.username];

        //check user exsists
        if(!user){
          return reply(Boom.unauthorized('invalid username'));
        }


        //check password is valid
        if(user.password != request.payload.password){
          return reply(Boom.unauthorized('invalid password'));
        }

        //create new session
        var session = {
          valid: true, // this will be set to false when the person logs out
          session_id: aguid(), // a random session id
          exp: new Date().getTime() + 30 * 60 * 1000, // expires in 30 minutes time
          user_id: user.id,
          username: user.username,
        }

        // create the session in Redis
        redisClient.set(session.session_id, JSON.stringify(session));
        //destroy previous sessions for user
        redisClient.get(user.username, function(rediserror, redisreply) {
          /* istanbul ignore if */
          if(rediserror) {
            console.log(rediserror);
          }
          if(username_session = JSON.parse(redisreply)){
            console.log(' - - - - - - OLD Username SESSION - - - - - - - -')
            console.log(username_session);
            // update the session to no longer valid:
            redisClient.del(username_session.session_id);
          }
        });

        //update username active session
        redisClient.set(session.username, JSON.stringify(session));

        // sign the session as a JWT
        var token = JWT.sign(session, JWT_SECRET); // synchronous
        console.log(token);

        reply({text: 'Check Auth Header for your Token', access_token: token})
        .header("authorization", token);
      }
      
    }, {
      method: 'OPTIONS', 
      path: '/api/user/logout', 
      config: {
        auth: false
      },
      handler: function(request, reply) {
        reply({})
        .header('Access-Control-Allow-Origin','*')
        .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
        .header('Access-Control-Allow-Headers', ['Content-Type', 'Authorization', 'Accept']);
      }
    }, {
      /*
        1- any invalid token will not be processed, because we set auth mode to jwt/required
        2- decode authorization token provided by the client
        3- get session object from redis using session_id
      */
      method: 'POST',
      path: "/api/user/logout",
      config: { 
        cors: true,
        auth: 'jwt'
      },
      handler: function(request, reply) {
        var decoded = JWT.decode(request.headers.authorization,JWT_SECRET);
        console.log(decoded);
        var session;
        redisClient.get(decoded.session_id, function(rediserror, redisreply) {
          /* istanbul ignore if */
          if(rediserror) {
            console.log(rediserror);
          }
          session = JSON.parse(redisreply)
          console.log(' - - - - - - SESSION - - - - - - - -')
          console.log(session);
          // create the session in Redis
          redisClient.del(session.session_id);
          redisClient.del(session.username);

          reply({text: 'You have been logged out!'})
        })
      }
    },
    { 
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