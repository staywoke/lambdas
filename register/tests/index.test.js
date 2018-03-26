'use strict';

var expect = require('chai').expect;
var LambdaTester = require('lambda-tester');
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

describe('register', function() {
  var AWSStub;
  var lambda;
  var mockUser;

  var getDoc = function (data, callback) {
    return callback(null, null);
  };

  var putDoc = function (data, callback) {
    return callback(null, data);
  };

  var getOpenId = function (data, callback) {
    return callback(null, data);
  };

  beforeEach(function() {
    mockUser = {
      username: 'tester',
      password: '123',
      first_name: 'Test',
      last_name: 'User',
      email: 'test@test.com'
    };

    AWSStub = {
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

    lambda = proxyquire('../index', {
      'aws-sdk': AWSStub
    });
  });

  describe('.handler', function() {
    it('successfully create user', function() {
      return LambdaTester(lambda.handler).event(mockUser).expectSucceed(function(result) {
        expect(result).to.deep.equal(mockUser);
      });
    });

    it('fails when username is undefined', function() {
      delete mockUser.username;
      return LambdaTester(lambda.handler).event(mockUser).expectFail(function(err) {
        expect(err.message).to.equal('Missing Required username');
      });
    });

    it('fails when password is undefined', function() {
      delete mockUser.password;
      return LambdaTester(lambda.handler).event(mockUser).expectFail(function(err) {
        expect(err.message).to.equal('Missing Required password');
      });
    });

    it('fails when first_name is undefined', function() {
      delete mockUser.first_name;
      return LambdaTester(lambda.handler).event(mockUser).expectFail(function(err) {
        expect(err.message).to.equal('Missing Required first_name');
      });
    });

    it('fails when last_name is undefined', function() {
      delete mockUser.last_name;
      return LambdaTester(lambda.handler).event(mockUser).expectFail(function(err) {
        expect(err.message).to.equal('Missing Required last_name');
      });
    });

    it('fails when email is undefined', function() {
      delete mockUser.email;
      return LambdaTester(lambda.handler).event(mockUser).expectFail(function(err) {
        expect(err.message).to.equal('Missing Required email');
      });
    });
  });
});
