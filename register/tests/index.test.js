'use strict';

var expect = require('chai').expect;
var LambdaTester = require('lambda-tester');
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');
var Promise = require('bluebird');

// eslint-disable-next-line no-console
describe('index', function() {
  var AWSStub;
  var lambda;
  var mockUser;

  beforeEach(function() {
    mockUser = {
      username: 'tester',
      password: '123'
    };

    AWSStub = {
      CognitoIdentity: sinon.stub().returns({
        getOpenIdTokenForDeveloperIdentity: sinon.stub()
      }),
      DynamoDB: {
        DocumentClient: sinon.stub().returns({
          get: sinon.stub().returns(function(){
            return {
              promise: function () {
                return Promise.resolve({ id: 1337 });
              }
            };
          })
        })
      }
    };

    lambda = proxyquire('../index', {
      'aws-sdk': AWSStub
    });
  });

  describe('.handler', function() {
    it('successful invocation', function() {
      return LambdaTester(lambda.handler).event(mockUser).expectResult(function(result) {
        console.log('RESULT', result);
        expect(result).to.be.true;
      });
    });

    it('fail: when name is invalid', function() {
      delete mockUser.username;
      return LambdaTester(lambda.handler).event(mockUser).expectError(function(err) {
        console.log('ERROR', err);
        expect(err.message).to.equal('unknown name');
      });
    });
  });
});
