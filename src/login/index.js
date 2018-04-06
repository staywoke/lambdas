console.log('Loading function');

var AWS = require('aws-sdk');
var crypto = require('crypto');
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var cognitoidentity = new AWS.CognitoIdentity();
var Auth = require('../auth.js'); 
var config = {
    "DEVELOPER_PROVIDER_NAME": "login.staywoke.platform";
};

var getToken = function(login, callback) {
    var param = {
        IdentityPoolId: 'us-east-1:26af1d68-584e-43d1-8c2f-486a9c2bda74',
        Logins: {},
        TokenDuration: 30600  //8.5 hours
    };
    
    param.Logins[config.DEVELOPER_PROVIDER_NAME] = login.userId;
    cognitoidentity.getOpenIdTokenForDeveloperIdentity(param, function (err, data) {
        if (err) {
            return callback(err);
        }
        
        login.token = data.Token;
        
        return callback(null, login);
    });
};

var updateLogin = function(login, callback) {
    var now = new Date().toISOString();
    dynamodbDoc.update({
        TableName: 'auth',
        Key: {
            id: login.id
        },
        UpdateExpression: 'set lastLoginDate = :lastLogin',
        ExpressionAttributeValues: {':lastLogin': now }
    }, function (err, data) {
        if (err) {
            console.log('error updating login', err);
        }

        return callback(err, login);
    });
};


var loginUser = function(user, password, callback) {
    dynamodbDoc.get({
        TableName: 'auth',
        Key: {
            id: user.identityId
        }
    }, function (err, login) {
        login = (login ? login.Item : null);

        if(!login || !login.passwordSalt || login.disabled) {
            console.log('unable to locate login record in logins table, or passwordSalt missing', login);
            return callback('Invalid login');
        }

        Auth.computeHash(password, login.passwordSalt, function (err, hash) {
            if (err) {
                console.log('Error generating hash', err);
                return callback('error signing in');
            }
            
            if (hash !== login.passwordHash) {
                console.log('Wrong Password: ' + user.id);
                // consider creating an event document 
                return callback('Incorrect Password');
            } 


            getToken(login, function (err, login) {
                if (err) {
                    return callback('Error in getToken: ' + err);
                }
                    
                user.token = login.token;

                // // updates auth table which manages sessions 
                updateLogin(login, function(err){
                    if (err){
                        return callback(err); 
                    }

                    return callback(null, user);
                });
            });            
        });
    });
};

function updateUser(user, event, callback) {
    var now = new Date().toISOString();
    user.updatedDate = now;
    user.lastLoginDate = now;

    var params = {
        TableName: 'users',
        Key: {
            id: user.id
        },
        UpdateExpression: 'set lastLoginDate = :lastLogin',
        ExpressionAttributeValues: { ':lastLogin': now  }        
    };

    dynamodbDoc.update(params, function (err, data) {
        if (err) {
            console.log('error updating user', err);
            return callback(err, user);
        }       

        // // consider saving the login event 
        return callback(err, user);
    });
}




exports.handler = function (event, context, callback) {
    var userId = event.userId.toLowerCase().trim();
    Auth.getUser(userId, function(err, user) {
        if(!user) {
            console.log(err);
            return callback('invalid user Id');
        }

        loginUser(user, event.password, function(err, user) {
            if (err) {
                return callback(err);
            }

            return callback(null, user);
        });
    });
};
