// Base routes for default index/root path, about page, 404 error pages, and others..
var seneca = require('seneca')();
var client = seneca.client('10102');

var config = require('config');
var l = require('../../logger');
var Boom = require('boom');

var promise = require('bluebird');
client.actAsync = promise.promisify(client.act, {
    multiArgs: false,
    context: client
});

var uuid = 1;


// login using local database
// --------------------------------------------------------------
exports.loginLocal = function (request, reply) {
    console.log('POST /user/login/local ------->', request.auth);
    if (!request.payload.username || !request.payload.password) {
        message = 'Missing username or password fields';
        return reply(Boom.badRequest(message))
            .header('Access-Control-Allow-Origin','*')
            .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
            .header('Access-Control-Allow-Headers', 'Content-Type');
    }

    client.actAsync({ role:'auth', model: 'user', cmd:'validate', data: request.payload })
        .then(function(response){
            //check user is found and valid
            if (!response.user) {
                console.log('Bad username or password');
                return reply(Boom.unauthorized('Bad username or password'))
                    .header('Access-Control-Allow-Origin','*')
                    .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
                    .header('Access-Control-Allow-Headers', 'Content-Type');
            } else {
                // This will set the cookie and declare log in success
                const sid = String(++uuid);
                request.server.app.cache.set(sid, { account: response.user }, 0, (err) => {

                    if (err) {
                        reply(err);
                    }

                    console.log('POST /user/login/local ------->', request.auth);
                    request.cookieAuth.set({ sid: sid });
                    reply({message: 'success'})
                    .header('Access-Control-Allow-Origin','*')
                    .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
                    .header('Access-Control-Allow-Headers', 'Content-Type');
                });
                // console.log('User logged in successfully',response.user);
                // request.cookieAuth.set(response.user);
            }
        })
        .catch(function(err){
            console.log('error occured', err);
            return reply(Boom.unauthorized(err))
                .header('Access-Control-Allow-Origin','*')
                .header('Access-Control-Allow-Methods', 'OPTIONS,POST')
                .header('Access-Control-Allow-Headers', 'Content-Type');
        });
};




// render user profile
// --------------------------------------------------------------
exports.profile = function (request, reply) {
    console.log('GET /user/me ------->', request.auth);
    return reply({user: request.auth.credentials});
};




// logout the system
// --------------------------------------------------------------
exports.logout = function (request, reply) {
    request.cookieAuth.clear();
    console.log('GET /user/logout ------->', request.auth);
    return reply({msg: 'Logged out successfuly', auth:request.auth});
};




// login using facebook
// --------------------------------------------------------------
exports.loginFacebook = function (request, reply) {
    l.log('Login handler for facebook is called');
    
    if (!request.auth.isAuthenticated) {
        return reply('Authentication failed due to: ' + request.auth.error.message);
    }

    // Perform account lookup or registration, then setup local session,
    // and redirect to the application. 

    // The third-party credentials are stored in request.auth.credentials.
    // Any query parameters from the initial request are passed back via request.auth.credentials.query.
    var profile = request.auth.credentials.profile;
    
    // findOrCreateUser in database
    client.act({ role:'auth', model:'user', cmd:'findOrCreate', data: { facebook_id: profile.id, email: profile.email, display_name: profile.displayName} }, function (err, response) {
        console.log('>>>>>>> found user', response);
        // Here we take the profile that was kindly pulled in
        // by bell and set it to our cookie session.
        // This will set the cookie during the redirect and 
        // log them into your application.
        request.cookieAuth.set(response.user);

        // User is now logged in, redirect them to their account area
        reply({msg: 'Login Successful'});
    });
};




// login using google
// --------------------------------------------------------------
exports.loginGoogle = function (request, reply) {
    l.log('Login handler for facebook is called');
    
    if (!request.auth.isAuthenticated) {
        return reply('Authentication failed due to: ' + request.auth.error.message);
    }

    // Perform account lookup or registration, then setup local session,
    // and redirect to the application. 

    // The third-party credentials are stored in request.auth.credentials.
    // Any query parameters from the initial request are passed back via request.auth.credentials.query.
    var profile = request.auth.credentials.profile;
    
    // findOrCreateUser in database
    client.act({ role:'auth', model:'user', cmd:'findOrCreate', data: { facebook_id: profile.id, email: profile.email, display_name: profile.displayName} }, function (err, response) {
        console.log('>>>>>>> found user', response);
        // Here we take the profile that was kindly pulled in
        // by bell and set it to our cookie session.
        // This will set the cookie during the redirect and 
        // log them into your application.
        request.cookieAuth.set(response.user);

        // User is now logged in, redirect them to their account area
        reply({msg: 'Login Successful'});
    });
};


