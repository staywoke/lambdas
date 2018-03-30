'use strict';

var expect = require('chai').expect;
var LambdaTester = require('lambda-tester');
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

describe('register', function() {
  var AWS;
  var doc;
  var lambda;
  var mockUser;

  // Mock Function for AWS.DynamoDB.DocumentClient.get()
  var getDoc = function (data, callback) {
    return callback(null, doc);
  };

  // Mock Function for AWS.CognitoIdentity.getOpenIdTokenForDeveloperIdentity()
  var getOpenId = function (data, callback) {
    return callback(null, data);
  };

  // Mock Function for AWS.DynamoDB.DocumentClient.put()
  var putDoc = function (data, callback) {
    return callback(null, data);
  };

  // Reset before each test
  beforeEach(function() {
    // Create Sample Payload
    mockUser = {
      username: 'tester',
      password: '123',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@test.com'
    };

    // This is the document that is returned via `getDoc`
    doc = null;

    // Mock AWS methods used in lambda
    AWS = {
      CognitoIdentity: sinon.stub().returns({
        getOpenIdTokenForDeveloperIdentity: getOpenId
      }),
      DynamoDB: {
        DocumentClient: sinon.stub().returns({
          get: getDoc,
          put: putDoc
        })
      }
    };

    // Load lambda function via require proxy so we can mock 'aws-sdk' using `AWS`
    lambda = proxyquire('../index', {
      'aws-sdk': AWS
    });
  });

  describe('.handler', function() {
    it('successfully create user', function() {
      return LambdaTester(lambda.handler).event(mockUser).expectResult(function(result) {
        expect(result).to.be.undefined;
      });
    });

    it('fails that user already exists', function() {
      doc = { Item: 123 };
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('The Username ' + mockUser.username + ' is Unavailable.');
      });
    });

    it('fails when username is undefined', function() {
      delete mockUser.username;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('Missing Required username');
      });
    });

    it('fails when password is undefined', function() {
      delete mockUser.password;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('Missing Required password');
      });
    });

    it('fails when first_name is undefined', function() {
      delete mockUser.first_name;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('Missing Required first_name');
      });
    });

    it('fails when last_name is undefined', function() {
      delete mockUser.last_name;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('Missing Required last_name');
      });
    });

    it('fails when email is undefined', function() {
      delete mockUser.email;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        expect(err.message).to.equal('Missing Required email');
      });
    });
  });
});
