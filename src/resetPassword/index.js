
console.log('Loading function');

var AWS = require('aws-sdk');
var crypto = require('crypto');
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

var getUser = function(userId, callback) {
    dynamodb.get({
        TableName: 'users',
        Key: {
            id: userId
        }
    }, function(err, data) {
        if (err) {
            return callback(err);
        }
        
        return callback(null, (data ? data.Item : null) );
    });
};

var getUserLogin = function(identityId, callback){
    dynamodbDoc.get({
        TableName: 'auth',
        Key: {
            id: identityId
        }
    }, function (err, login) {
        if (err){
            return callback(err);
        }
        return callback(err, (login ? login.Item : null));
    });
};

var updatePassword = function(user, password, callback) {
    var now = new Date().toISOString();
    var login = {
        id: user.identityId,
        identityId: user.identityId, 
        userId: user.id
    };
    var len = 64; 
    crypto.randomBytes(len, function(err, salt) {
        if (err) {
          return callback(err);
        }

        salt = salt.toString('base64');
        Auth.computeHash(password, salt, function (err, salt, hash) {
            if (err) {
                return callback('Error in hash: ' + err);
            }

            login.updatedDate = now;
            login.passwordSalt = salt;
            login.passwordHash = hash;

            return callback(null, login);
        }); 
    });
};

var saveLogin = function(login, callback){
    var params = {
        TableName: 'auth',
        Item: login
    };
    dynamodbDoc.put(params, callback);
};

exports.handler = function(event, context, callback){
    var userId = event.userId;
    var oldPassword = event.password;
    var newPassword = event.newPassword;

    if(newPassword && newPassword.length < 8) {
        return callback('New password is too short.');
    }


    getUser(userId, function(err, user) {
        if (err || !user ) {
            return callback(new Error('invalud username'));
        }

        getUserLogin(user.identityId, function(err, login){
            if (err){
                return callback(err);
            }
            if (!login || !login.passwordSalt || login.disabled) {
                console.log('unable to locate login record in logins table', user);
                return callback(new Error('invalid login'));
            }
        
            // // check old password 
            Auth.computeHash(oldPassword, login.passwordSalt, function(err, salt, hashedPassword) {
                if (err) {
                    return callback(err);
                }

                if (login.passwordHash !== hashedPassword){
                    console.log('failed password reset');
                    return callback(new Error('failed password reset'));  
                } 

                updatePassword(user, newPassword, function(err){
                    if (err) {
                        return callback(err);
                    }

                    saveLogin(login, callback);
                });
            });
        });
    });
};
