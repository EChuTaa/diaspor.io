require('./env.js')
console.log(process.env);
console.log('Node ' + process.version);
//console.log(process.versions);

var axios = require('axios')
var qs = require('qs')

var express = require('express')
var app = express()

var http = require('http')
var bodyParser = require('body-parser')
var argon2 = require('argon2')
var jwt = require('jsonwebtoken')

// secrets
var salt = new Buffer('somesalt')
app.set('jwtSecret', 'ChangeMeForProduction')

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//load static paths
app.use(express.static(__dirname + '/static'));


var MongoURL = process.env.MONGOURL;
var MongoClient = require('mongodb').MongoClient, test = require('assert')


function genRedditOauthURL( client_id, state, redirect_uri, duration, scope ) {
  var response_type = '&response_type=code'
  client_id = 'client_id=' + client_id
  state = '&state=' + state
  redirect_uri = '&redirect_uri=' + redirect_uri
  duration = '&duration=' + duration
  scope = '&scope=' + scope

  var url = 'https://www.reddit.com/api/v1/authorize?'
  url += client_id
  url += response_type
  url += state
  url += redirect_uri
  url += duration
  url += scope

  return url
}

function getRedditToken(appID, appSecret, code, callback) {
  var url = 'https://www.reddit.com/api/v1/access_token'
  var config = {
      auth: {
        username: appID,
        password: appSecret
      }
    }
  var payload = {
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': 'http://localhost/reddit_auth_callback'
  }

  var reply = axios.post(url, qs.stringify(payload), config)
  .then(function (response) {
    console.log('success');
    reply = response.data
    callback(reply);
  })
  .catch(function (error) {
    console.log('error');
    reply = error
    callback(reply);
  });
}

app.route('/')
  .get(function (req, res) {
    res.render('index.ejs');
  })

app.route('/reddit_auth_callback')
  .get(function (req, res) {
    var error = req.query.error;
    var state = req.query.state;
    var code = req.query.code;
    var reply = ''

    //TODO: verify state

    if (error === undefined) {
      var appID = process.env.REDDITAPPID
      var appSecret = process.env.REDDITAPPSECRET

      getRedditToken(appID, appSecret, code, function(reply) {
        //TODO: if register save token and username
        //TODO: if login verify username
        //TODO: if link verify username and save token
        //TODO: if add verify username and save token
        res.send(reply)
      })
    }
    else {
      reply = 'error: '+ error +'</br>state: '+ state
      res.send(reply)
    }
  })

var apiRoutes = express.Router();

apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Documentation index would go here' });
});

apiRoutes.route('/redditoauth')
  .get(function (req, res) {
    var client_id = process.env.REDDITAPPID
    //TODO: Generate unique state from timestamp and random string
    //TODO: Save state object (state, register(t/f), username) to redis state collection
    var state = 'superSecret'
    var redirect_uri = 'http://localhost/reddit_auth_callback'
    var duration = 'temporary'
    var scope = 'identity'

    url = genRedditOauthURL(client_id, state, redirect_uri, duration, scope)

    res.send(url)
  })

apiRoutes.route('/user/register')
  .post(function (req, res) {
    //TODO: sanitize request data

    const reply = {saved: false, err: false, dupe: false, username: false, password: false, email: false, token: null}

    if(req.body.username) { reply.username = true; }
    if(req.body.password) { reply.password = true; }
    if(req.body.email) { reply.email = true; }
    if(reply.username && reply.password && reply.email) {
      argon2.hash(req.body.password, salt).then(hash => {
        req.body.password = hash

        MongoClient.connect(MongoURL, function (err, db) {
          if (err) return console.log(err)
          const collection = db.collection('users')

          collection.findOne({username: req.body.username}, function (err, results) {
            if(results == null) {

              collection.save({
                username: req.body.username,
                password: req.body.password,
                email: req.body.email,
                validated: false,
                role: 'user',
                linkedAccounts: {
                  reddit: false,
                  youtube: false
                }
              }, function (err, result) {
                test.equal(null, err);

                reply.saved = true;
                reply.token = jwt.sign({username: req.body.username}, app.get('jwtSecret'), {expiresIn: "1h"});
                res.json(reply);

                db.close();
              })
            }
            else {
              reply.dupe = true
              res.json(reply);
              db.close();
            }
          })
        })
      }).catch(err => {
        console.log(err);
        reply.err = true
        res.json(reply);
      });
    }
    else {
      reply.err = true
      res.json(reply);
    }
  })

apiRoutes.route('/user/login')
  .post(function (req, res) {
    //TODO: sanitize request data

    const reply = {err: false, message: "", username: req.body.username, token: null}
    MongoClient.connect(MongoURL, function (err, db) {
      if (err) return console.log(err)
      console.log("Connected to MongoDB");

      db.collection('users').findOne({username: req.body.username}, function (err, results) {
        if (results != null) {
          argon2.verify(results.password, req.body.password).then(match => {
            if (match) {
              //TODO: generate JWT and return it
              reply.token = jwt.sign({username: req.body.username}, app.get('jwtSecret'), {expiresIn: "1h"});
              reply.message = "Welcome back!"
              res.json(reply)
            } else {
              reply.err = true
              //TODO: in production this needs to be generic "didnt find a matching record"
              reply.message = "Password didnt match username"
              res.json(reply)
            }
          }).catch(err => {
          console.log(err);
            reply.err = true
            reply.message = "Something broke on our end!"
            res.json(reply)
          });
        }
        else {
          reply.err = true
          //TODO: in production this needs to be generic "didnt find a matching record"
          reply.message = "We couldn't find that username"
          res.json(reply)
        }
      })
      db.close();
    })
  })

// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
  var token = req.body.token
  if (token) {
    jwt.verify(token, app.get('jwtSecret'), function(err, decoded) {
      if (err) {
        console.log(err);
        reply = { success: false, name: err.name, message: err.message }
        res.json(reply);
      }
      else {
        req.decoded = decoded
        next();
      }
    })
  }
  else {
    res.json({
      success: false,
      message: 'No token provided.'
    });
  }
})

apiRoutes.route('/user/info')
  .post(function (req, res) {
    MongoClient.connect(MongoURL, function (err, db) {
      if (err) return console.log(err)
      const collection = db.collection('users')

      collection.findOne({username: req.decoded.username}, function (err, results) {
        if(results != null) {
          const reply = {
            success: true,
            user: {
              username: results.username,
              email: results.email,
              validated: results.validated,
              role: results.role,
              linkedAccounts: {
                reddit: results.linkedAccounts.reddit,
                youtube: results.linkedAccounts.youtube,
              }
            }
          }
          res.json(reply)
        }
      })
    })
  })

//TODO: admin only for production
apiRoutes.route('/users')
  .post(function (req, res) {
    MongoClient.connect(MongoURL, function (err, db) {
      if (err) return console.log(err)

      db.collection('users').find().toArray(function (err, results) {
        res.json(results)
      })
      db.close();
    })
  })

//TODO: admin only for production
apiRoutes.route('/mongolist')
  .post(function (req, res) {
    MongoClient.connect(MongoURL, function (err, db) {
      test.equal(null, err);
      console.log("Connected to MongoDB");

      db.listCollections().toArray(function(err, collections) {
        test.equal(null, err);
        res.json(collections)
        db.close()
      })
    })
  })

//TODO: admin only for production
apiRoutes.route('/mongoclear')
  .post(function (req, res) {
    MongoClient.connect(MongoURL, function (err, db) {
      if (err) return console.log(err)
      console.log("Connected to MongoDB");
      db.dropDatabase();
      res.send("MongoDB cleared")
      db.close();
    })
  })

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
var port = process.env.PORT || 3000;
http.createServer(app).listen(port, function() {
  console.log('Listening on port ' + port);
});
