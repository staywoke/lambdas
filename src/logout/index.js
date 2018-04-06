console.log('Loading function');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();


var updateUser = function(user, callback) {
    //// change
    var now = new Date().toISOString();
    user.updatedDate = now;
    var params = {
        TableName: 'users',
        Key: {
            id: user.id
        },
        UpdateExpression: 'set lastLogoutDate = :lastLogout, #online = :online',
        ExpressionAttributeNames: {'#online': 'online'},
        ExpressionAttributeValues: { ':lastLogout': now, ':online': false }
    };
    dynamodbDoc.update(params, function(err){
        if (err){
            return callback(err);
        }

        user.online = false;
        return callback(null, user);
    });
};



var getAuthorizedUser = function(identityId, callback) {
    dynamodbDoc.get({
        TableName: 'auth',
        Key: {
            id: identityId
        }
    }, function (err, login) {
        if (err){
            return callback(err);
        }

        login = (login ? login.Item : null);

        if(!login) {
            return callback(err, null);
        }

        dynamodbDoc.get({
            TableName: 'users',
            Key: {
                id: login.userId
            }
        }, function (err, user) {
            if (err){
                return callback(err);
            }

            return callback(null, (user ? user.Item : null));
        });
    });
}

exports.handler = function (event, context, callback) {
    console.log('event: \n', event);
    if ((!context.identity && !context.identity.cognitoIdentityId)) {
        console.log('invalid access rights', context.identity);
        return callback(new Error('you are not authorized to perform this action'));
    }

    //verify authorized
    getAuthorizedUser(context.identity.cognitoIdentityId, function (err, user) {
        if (err || !user) {
            return callback(new Error('you are not authorized to perform this action'));
        }
        
        updateUser(user, function(err, user) {  
            if (err){
                return callback(err);
            }          

            console.log('User logged out: ', user.id);
            return callback(null, user);
        });
    });
};








