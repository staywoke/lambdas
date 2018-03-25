'use strict';

var expect = require('chai').expect;
var LambdaTester = require('lambda-tester');
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

describe('index', function() {
  var AWSStub;
  var request;
  var lambda;
  var mockUser;

  beforeEach(function() {
    mockUser = {
      username: 'tester'
    };

    request = {
      get: sinon.stub()
    };

    AWSStub = {
      CognitoIdentity: sinon.stub().returns({
        getOpenIdTokenForDeveloperIdentity: sinon.stub()
      }),
      DynamoDB: {
        DocumentClient: sinon.stub().returns({
          get: sinon.stub().returns({}),
          query: sinon.stub(),
          scan: sinon.stub()
        })
      }
    };

    lambda = proxyquire('../index', {
      'request': request,
      'aws-sdk': AWSStub
    });
  });

  describe('.handler', function() {
    it('successful invocation:', function() {
      request.get.withArgs(sinon.match.any).yields(null, {statusCode: 200}, {name: 'Joe'});

      return LambdaTester(lambda.handler).event(mockUser).expectResult(function(result) {
        expect(result.valid).to.be.true;
      });
    });

    it('fail: when name is invalid:', function() {
      return LambdaTester(lambda.handler).event(null).expectError(function(err) {
        expect(err.message).to.equal('unknown name');
      });
    });
  });
});
