'use strict';

var crypto = require('crypto');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

module.exports = {
    getUser: function(userId, callback) {
      dynamodbDoc.get({
        TableName: 'users',
        Key: {
          id: userId
        }
      }, function(err, user) {
        if (err || !user) {
            return callback(err);
        }

        console.log('user:', user);

        return callback(null, user.Item);
      });
    }, 
    computeHash: function(password, salt, callback) {
      var len = 64;
      var iterations = 4096;
      var digest = 'sha1';

      
      crypto.pbkdf2(password, salt, iterations, len, digest, function(err, derivedKey) {
        if (err) {
          return callback(err);
        }

        return callback(null, derivedKey.toString('base64'));
      });  
    },
};

