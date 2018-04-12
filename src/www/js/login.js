// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',
});

var lambda = new AWS.Lambda();

var login = function() {

  var result = document.getElementById('result');
  var username = document.getElementById('username');
  var password = document.getElementById('password');

  result.innerHTML = 'Login...';

  if (!username.value) {
    result.innerHTML = 'Please specify your username.';
  } 
  else if (!password.value) {
    result.innerHTML = 'Please specify a password.';
  } 
  else {

    var input = {
      userId: username.value,
      password: password.value
    };

    lambda.invoke({
      FunctionName: 'login',
      Payload: JSON.stringify(input)
    }, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      }
      
      else {
        var output = JSON.parse(data.Payload);
        if (!output.identityId) {
          result.innerHTML = '<b>Not</b> logged in';
        } 
        else {
          result.innerHTML = 'Logged in with IdentityId: ' + output.identityId + '<br>';

          var creds = AWS.config.credentials;
          creds.params.IdentityId = output.identityId;
          creds.params.Logins = {
            'cognito-identity.amazonaws.com': output.token
          };
          // creds.expired = true;

          // Do something with the authenticated role

        }
      }
    });

	}
};

var form = document.getElementById('login-form');
form.addEventListener('submit', function(evt) {
  evt.preventDefault();
  login();
});
