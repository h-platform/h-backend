// Base routes for default index/root path, about page, 404 error pages, and others..
var seneca = require('seneca')();
var client = seneca.client('10102');

var config = require('config');
var l = require('../../logger');

const users = {
    yasir: {
        email: 'yasir',
        password: 'password',
        name: 'Yasir Hantoush'
    }
};

var uuid = 1;




// shows the different login options for the user
// --------------------------------------------------------------
exports.loginScreen = function(request, reply) {
    // User is now logged in, redirect them to their account area
    if(request.auth.isAuthenticated) {
        if(request.query.next) {
            return reply.redirect(request.query.next);
        } else {
            return reply.redirect('/');
        }
    }

    reply.view('user/login', {next: request.query.next});
};




// login using local database
// --------------------------------------------------------------
exports.loginManual = function (request, reply) {
    if (!request.payload.username || !request.payload.password) {
        message = 'Missing username or password';
        return reply.view('user/login', {message: message});
    } 

    account = users[request.payload.username];
    console.log(request.payload.username);
    console.log(account);
    
    if (!account || account.password !== request.payload.password) {
        message = 'Invalid username or password';
        return reply.view('user/login', { message: message });
    }

    const sid = String(++uuid);
    request.server.app.cache.set(sid, { account: account }, 0, (err) => {

        if (err) {
            reply(err);
        }

        request.cookieAuth.set({ sid: sid });
        return reply.redirect('/');
    });
};




// render user profile
// --------------------------------------------------------------
exports.profile = function (request, reply) {
    // console.log('$$$$$$$$$', request.auth);
    return reply.view('user/profile', {
        auth: request.auth,
    });
};




// login using facebook
// --------------------------------------------------------------
exports.loginFacebook = function (request, reply) {
    l.log('Login handler for facebook is called');
    // console.log('>>>> request.auth >>>>', request.auth);
    // console.log('>>>> request.auth.credentials.query >>>>', request.auth.credentials.query);
    
    if (!request.auth.isAuthenticated) {
        return reply('Authentication failed due to: ' + request.auth.error.message);
    }

    // Perform account lookup or registration, then setup local session,
    // and redirect to the application. 

    // The third-party credentials are
    // stored in request.auth.credentials. Any query parameters from
    // the initial request are passed back via request.auth.credentials.query.

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
        if(request.auth.credentials.query.next) {
            return reply.redirect(request.auth.credentials.query.next);
        } else {
            return reply.redirect('/');
        }
    });
};




// login using google
// --------------------------------------------------------------
exports.loginGoogle = function (request, reply) {
    l.log('Login handler for facebook is called');

    // Here we take the profile that was kindly pulled in
    // by bell and set it to our cookie session.
    // This will set the cookie during the redirect and 
    // log them into your application.
    request.cookieAuth.set(request.auth.credentials.profile);
    // console.log('$$$$$$$$$', request.auth);
    // console.log(request.query);

    // User is now logged in, redirect them to their account area
    if(request.query.next) {
        return reply.redirect(request.query.next);
    } else {
        return reply.redirect('/');
    }
};




// logout the system
// --------------------------------------------------------------
exports.logout = function (request, reply) {
    // Clear the cookie
    request.cookieAuth.clear();
    return reply.redirect('/');
};