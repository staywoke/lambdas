'use strict';

var AWS = require('aws-sdk');
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var crypto = require('crypto');
var cognitoidentity = new AWS.CognitoIdentity();

// @TODO: Flush out DocBlock

/**
 * [getOpenId description]
 * @param  {[type]}   user     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
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

/**
 * [getUser description]
 * @param  {[type]}   userId   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function getUser(userId, callback) {
  dynamodbDoc.get({
    TableName: 'users',
    Key: {
      id: userId
    }
  }, function(err, data) {
    if (err) {
      return callback(err);
    }

    return callback(null, data ? data.Item : null);
  });
}

/**
 * [createUser description]
 * @param  {[type]}   event    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
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

/**
 * [computeHash description]
 * @param  {[type]}   password [description]
 * @param  {[type]}   salt     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function computeHash(password, salt, callback) {
  var len = 64;
  var iterations = 4096;
  var digest = 'sha1';

  if (arguments.length === 3) {
    crypto.pbkdf2(password, salt, iterations, len, digest, function(err, derivedKey) {
      if (err) {
        return callback(err);
      }

      return callback(null, derivedKey.toString('base64'));
    });

  } else {
    callback = salt;
    crypto.randomBytes(len, function(err, salt) {
      if (err) {
        return callback(err);
      }
      salt = salt.toString('base64');
      crypto.pbkdf2(password, salt, iterations, len, digest, function(err, derivedKey) {
        if (err) {
          return callback(err);
        }

        return callback(null, salt, derivedKey.toString('base64'));
      });
    });
  }
}

/**
 * [createPassword description]
 * @param  {[type]}   user     [description]
 * @param  {[type]}   password [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function createPassword(user, password, callback) {

  var now = new Date().toISOString();

  var login = {
    id: user.identityId,
    identityId: user.identityId,
    userId: user.id
  };

  computeHash(password, function(err, salt, hash) {
    if (err) {
      return callback('Error in hash: ' + err);
    }

    login.passwordHash = hash;
    login.passwordSalt = salt;
    login.updatedDate = now;

    callback(null, login);
  });
}

/**
 * [createLogin description]
 * @param  {[type]}   login    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
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

  getUser(event.username, function(err, user) {
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
