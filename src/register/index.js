'use strict';

var AWS = require('aws-sdk');
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var crypto = require('crypto');
var cognitoidentity = new AWS.CognitoIdentity();
var Auth = require('../auth.js'); 

function getOpenId(user, callback) {
  var params = {
    IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',
    Logins: {},
    TokenDuration: 86400,
    IdentityId: null
  };

  params.Logins['login.staywoke.platform'] = user.id;
  cognitoidentity.getOpenIdTokenForDeveloperIdentity(params, function(err, data) {
    if (err) {
      return callback(err);
    }

    user.identityId = data.IdentityId;
    return callback(null, user);
  });
}


function createUser(event, callback) {
  var user = {
    id: event.username,
    first_name: event.first_name,
    last_name: event.last_name,
    email: event.email,
    created: new Date().toString(),
    updated: new Date().toString()
  };

  dynamodbDoc.put({
    TableName: 'users',
    Item: user
  }, function(err) {
    if (err) {
      return callback(err);
    }

    return callback(null, user);
  });
}

function createPassword(user, password, callback) {
  var now = new Date().toISOString();

  var login = {
    id: user.identityId,
    identityId: user.identityId,
    userId: user.id
  };

  crypto.randomBytes(len, function(err, salt) {
    if (err) {
      return callback(err);
    }
    salt = salt.toString('base64');

    Auth.computeHash(password, salt, function(err, salt, hash) {
      if (err) {
        return callback('Error in hash: ' + err);
      }

      login.passwordHash = hash;
      login.passwordSalt = salt;
      login.updatedDate = now;

      callback(null, login);
    
    });
  });
}

function createLogin(login, callback) {
  var params = {
    TableName: 'auth',
    Item: login
  };

  dynamodbDoc.put(params, callback);
}

exports.handler = function(event, context, callback) {
  if (!event.username) {
    return callback(new Error('Missing Required username'));
  }

  if (!event.password) {
    return callback(new Error('Missing Required password'));
  }

  if (!event.first_name) {
    return callback(new Error('Missing Required first_name'));
  }

  if (!event.last_name) {
    return callback(new Error('Missing Required last_name'));
  }

  if (!event.email) {
    return callback(new Error('Missing Required email'));
  }

  Auth.getUser(event.username, function(err, user) {
    if (err) {
      return callback(err);
    }

    if (user) {
      return callback(new Error('The Username ' + event.username + ' is Unavailable.'));
    }

    createUser(event, function(err, user) {
      if (err) {
        return callback(err);
      }

      getOpenId(user, function(err) {
        if (err) {
          return callback(err);
        }

        createPassword(user, event.password, function(err, login) {
          if (err) {
            return callback(err);
          }

          createLogin(login, function(err) {
            if (err) {
              return callback(err);
            }

            return callback(null);
          });
        });
      });
    });
  });
};
