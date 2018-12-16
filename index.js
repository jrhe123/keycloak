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

      // client.realms.find("nodejs-example")
      //   .then((realms) => {
      //     return res.json({
      //       realms
      //     })
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      // client.realms.roles.create('nodejs-example', {name: 'new role from api'})
      //   .then((newRole) => {
      //     console.log('newRole: ', newRole);
      //   })
      //   .catch((err) => {
      //     console.log('Error', err);
      //   })

      client.realms.roles.find('nodejs-example', '')
        .then((roles) => {
          return res.json({
            roles
          })
        })
        .catch((err) => {
          console.log('Error', err);
        })


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
  });
});


// resource scope
app.get('/protected/resource', keycloak.enforcer(['res1:view'], {
  resource_server_id: 'nodejs-apiserver'
}), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: '1. Access granted to Default Resource\n'
  });
});


// resource scope
app.get('/protected/test', keycloak.enforcer(['res1:create'], {
  resource_server_id: 'nodejs-apiserver'
}), function (req, res) {
  res.render('index', {
    result: JSON.stringify(JSON.parse(req.session['keycloak-token']), null, 4),
    event: '1. Access granted to Default test\n'
  });
});


// realm role
app.get('/testRole', keycloak.protect('realm:user'), (req, res) => {
  return res.json({
    Confirmation: 'realm role protected'
  })
});


app.get('/test111', keycloak.enforcer(['res2:delete'], {
  resource_server_id: 'nodejs-apiserver'
}), (req, res) => {
  return res.json({
    Confirmation: 'realm scope protected'
  })
});
