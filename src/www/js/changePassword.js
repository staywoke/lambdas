// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; 
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',
});

var lambda = new AWS.Lambda();

function changePassword() {

  var result = document.getElementById('result');
  var username = document.getElementById('username');
  var oldPassword = document.getElementById('old-password');
  var newPassword = document.getElementById('new-password');
  var verifyNewPassword = document.getElementById('verify-new-password');

  result.innerHTML = 'Change Password...';

  if (!username.value) {
    result.innerHTML = 'Please specify your email address.';
  } 
  else if (!oldPassword.value) {
    result.innerHTML = 'Please specify your current password.';
  } 
  else if (!newPassword.value) {
    result.innerHTML = 'Please specify a new password.';
  } 
  else if (newPassword.value !== verifyNewPassword.value) {
      result.innerHTML = 'The new passwords are <b>different</b>, please check.';
  } 
  else {

    var input = {
      userId: username.value,
      password: oldPassword.value, 
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
				console.log('identityId: ' + output.identityId);
				console.log('token: ' + output.token);
        if (!output.identityId) {
          result.innerHTML = '<b>Not</b> logged in';
          return;
        } 
        result.innerHTML = 'Logged in with identityId: ' + output.identityId + '<br>';

				var creds = AWS.config.credentials;
				creds.params.IdentityId = output.identityId;
				creds.params.Logins = {
					'cognito-identity.amazonaws.com': output.token
				};
				// creds.expired = true;

        var input = {
          userId: username.value,
          oldPassword: oldPassword.value,
          newPassword: newPassword.value
        };

			  lambda.invoke({
			    FunctionName: 'changePassword',
			    Payload: JSON.stringify(input)
			  }, function(err, data) {
			    if (err) {
            console.log(err, err.stack);
          }
			    
		      var output = JSON.parse(data.Payload);
		      if (!output.changed) {
		        result.innerHTML = 'Password <b>not</b> changed.';
		      } else {
		        result.innerHTML = 'Password changed.';
					}
					
				});
      }
    });
  }
}

var form = document.getElementById('change-password-form');
form.addEventListener('submit', function(evt) {
  evt.preventDefault();
  changePassword();
});
