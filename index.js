var Keycloak = require('keycloak-connect');
var hogan = require('hogan-express');
var express = require('express');
var session = require('express-session');
var adminClient = require('keycloak-admin-client');
var app = express();
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});


// Register '.mustache' extension with The Mustache Express
app.set('view engine', 'html');
app.set('views', require('path').join(__dirname, '/view'));
app.engine('html', hogan);


// A normal un-protected public URL.
app.get('/', function (req, res) {
  res.render('index');
});


// Create a session-store to be used by both the express-session
// middleware and the keycloak middleware.
var memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'mySecret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));


// Provide the session store to the Keycloak so that sessions
// can be invalidated from the Keycloak console callback.
// Additional configuration is read from keycloak.json file
// installed from the Keycloak web console.
var keycloak = new Keycloak({
  store: memoryStore
});


// Install the Keycloak middleware.
// Specifies that the user-accessible application URL to
// logout should be mounted at /logout
// Specifies that Keycloak console callbacks should target the
// root URL.  Various permutations, such as /k_logout will ultimately
// be appended to the admin URL.

// !!
// keycloak defined action: route path
// !!
app.use(keycloak.middleware({
  logout: '/logoff123',
  admin: '/',
  // protected: '/protected/resource',
  // protected: '/protected/test',
}));


app.get('/test', (req, res) => {
  const settings = {
    baseUrl: 'http://127.0.0.1:8080/auth',
    username: 'admin',
    password: 'admin',
    grant_type: 'password',
    client_id: 'admin-cli'
  };
  adminClient(settings)
    .then((client) => {

      // 1. list realms
      // client.realms.find("nodejs-example")
      //   .then((realms) => {
      //     return res.json({
      //       realms
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 2. create role
      // client.realms.roles.create('nodejs-example', {name: 'new role from api'})
      //   .then((newRole) => {
      //     console.log('newRole: ', newRole);
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 3. list roles
      // client.realms.roles.find('nodejs-example', '')
      //   .then((roles) => {
      //     return res.json({
      //       roles
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 4. create user
      // client.users.create('nodejs-example', { username: 'new user from api' })
      //   .then((newUser) => {
      //     return res.json({
      //       newUser
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 5. list users
      // client.users.find('nodejs-example', '')
      //   .then((users) => {
      //     return res.json({
      //       users
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 6. add role to user
      // user id: 21763e38-3d29-43f1-879e-1b9660a37c48
      // role id: e070c22c-22bb-4c9a-9485-b7c9755a2f5d
      // role name: new role from api
      // client.realms.maps.map('nodejs-example', '21763e38-3d29-43f1-879e-1b9660a37c48',
      //   [
      //     {
      //       id: 'e070c22c-22bb-4c9a-9485-b7c9755a2f5d',
      //       name: 'new role from api',
      //     },
      //   ])
      //   .then(() => {
      //     console.log('added');
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // 7. remove role from user
      // client.realms.maps.unmap('nodejs-example', '21763e38-3d29-43f1-879e-1b9660a37c48',
      //   [
      //     {
      //       id: 'e070c22c-22bb-4c9a-9485-b7c9755a2f5d',
      //       name: 'new role from api',
      //     },
      //   ])
      //   .then(() => {
      //     console.log('removed');
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

    })
    .catch((err) => {
      console.log('Error', err);
    })
})


// Routes
app.get('/login', keycloak.protect(), function (req, res) {
  // console.log(req.session['auth_redirect_uri']);
  // console.log(req.session['keycloak-token']);
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: '1. Authentication\n2. Login'
  })
})


// #1
// user: user
// password: user
// user role: "user"
// resource: res1
// realm id: nodejs-apiserver
// matched permission type: scope
//  > scope: view, create, delete
//  > these scopes were added to the res1
//  > applied policy: policy1 -> role policy to "user"
app.get('/protected/resource', keycloak.enforcer(['res1:view'], {
  resource_server_id: 'nodejs-apiserver'
}), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: '1. Access granted to Default Resource\n'
  })
})


app.get('/protected/test', keycloak.enforcer(['res1:create'], {
  resource_server_id: 'nodejs-apiserver'
}), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: '1. Access granted to Default test\n'
  })
})


app.get('/test111', keycloak.enforcer(['res2:delete'], {
  resource_server_id: 'nodejs-apiserver'
}), (req, res) => {
  return res.json({
    Confirmation: 'realm scope protected'
  })
})


// #2
app.get('/testRole', keycloak.protect('realm:user'), (req, res) => {
  return res.json({
    Confirmation: 'realm role protected'
  })
})
