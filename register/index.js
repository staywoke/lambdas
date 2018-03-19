'use strict';

var AWS = require('aws-sdk'); 
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();
var crypto = require('crypto');
var cognitoidentity = new AWS.CognitoIdentity(); 

function getOpenId(user, callback) {
    /* documentation - https://docs.aws.amazon.com/cognitoidentity/latest/APIReference/API_GetOpenIdTokenForDeveloperIdentity.html
        getOpenIdTokenForDeveloperIdentity returns - 
            {
               "IdentityId": "string",
               "Token": "string"
            }

    */
    var params = {
        IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',  
        Logins: {},
        TokenDuration: 86400  
        IdentityId: null // // when creating a new identity, the identityId is null, since that's what's being retrieved
    };
    
    params.Logins['login.staywoke.platform'] = user.id;
    cognitoidentity.getOpenIdTokenForDeveloperIdentity(params, function (err, data) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        
        user.identityId = data.IdentityId;
        return callback(null, user);
    });
}

function getUser(userId, callback) {
    // // username === userId
    dynamodbDoc.get({
        TableName: 'users',
        Key: {
            id: userId
        }
    }, function (err, data) {
        console.log(data);
        return callback(err, (data ? data.Item : null));
    });
}


function createUser(event, callback) {
    // // add some role stuff 
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
    }, function (err) {
        if (err) {
            return callback(err);
        }        
                
        return callback(null, user);
     
    });
}

function computeHash(password, salt, callback) {
    var len = 64;
    var iterations = 4096;
    
    // // if salt is provided 
    if (arguments.length === 3) {
        crypto.pbkdf2(password, salt, iterations, len, function (err, derivedKey) {
            if (err) {
                return callback(err);
            }
            
            return callback(null, derivedKey.toString('base64'));
        });
        
    } else {
        callback = salt;
        crypto.randomBytes(len, function (err, salt) {
            if (err) {
                return callback(err);
            }
            salt = salt.toString('base64');
            crypto.pbkdf2(password, salt, iterations, len, function (err, derivedKey) {
                if (err) {
                    return callback(err);
                }
                
                return callback(null, salt, derivedKey.toString('base64'));
            });
        });
    }
}


function createPassword(user, password, callback) {

    var now = new Date().toISOString();

    var login = {
        id: user.identityId,
        identityId: user.identityId, 
        userId: user.id
    }

    computeHash(password, function (err, salt, hash) {
        if (err) {
            return callback('Error in hash: ' + err);
        }

        login.passwordHash = hash;
        login.passwordSalt = salt;
        login.updatedDate = now;

        callback(null, login)
    });   
}

function createLogin(login, callback) {

    var params = {
        TableName: 'auth',
        Item: login
    }

    dynamodbDoc.put(params, callback);
}



// function loginUser(user, callback) {
    
//     var params = {
//         IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',
//         Logins: {},
//         TokenDuration: 43200  //12 hours
//     };
    
//     params.Logins['login.staywoke.platform'] = user.id;
//     cognitoidentity.getOpenIdTokenForDeveloperIdentity(params, function (err, data) {
//         if (err) {
//             return callback(err);
//         }
        
//         user.token = data.Token;
        
//         var now = new Date().toISOString();

//         dynamodbDoc.update({
//             TableName: 'auth',
//             Key: {
//                 id: user.identityId
//             },
//             UpdateExpression: 'set lastLoginDate = :lastLogin',
//             ExpressionAttributeValues: {':lastLogin': now }
//         }, function (err, data) {
//             if (err) {
//                 console.log('error updating login', err);
//             }

//             return callback(err);
//         });
//     });
// }



var handler = function(event, context, callback){
    getUser(event.username, function(err, user){
        if (err){
            return callback(err);
        }

        if (user){
            console.log('username is unavailable');
            return callback(new Error('The Username ' + event.username + ' is Unavailable.'));
        }

        createUser(event, function(err, user){
            if (err){
                return callback(err);
            }

            getOpenId(user, function(err){
                if (err){
                    return callback(err);
                }

                createPassword(user, event.password, function(err, login){
                    if (err){
                        return callback(err);
                    }

                    createLogin(login, function(err){
                        if (err){
                            return callback(err);
                        }

                        return callback(null);
                        // loginUser(user, callback);  
                    });
                });
            });
        });
    });
};

exports.handler = handler; 














