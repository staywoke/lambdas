// Initialize the Amazon Cognito credentials provider
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:b421c663-df47-43f7-8cd3-5f19c010e27e',
});


var lambda = new AWS.Lambda();

var signup = function() {

  var result = document.getElementById('result');
  var firstName = document.getElementById('firstName');
  var lastName = document.getElementById('lastName');
  var username = document.getElementById('username');
  var email = document.getElementById('email');
  var password = document.getElementById('password');
  var verifyPassword = document.getElementById('verify-password');

  result.innerHTML = 'Sign Up...';

  if (!firstName.value){
    result.innerHTML = 'Please specify your first name.';
  }
  else if (!lastName.value){
    result.innerHTML = 'Please specify your last name.';
  }
  else if (!username.value){
    result.innerHTML = 'Please specify your username.';
  }
	else if (!email.value) {
  	result.innerHTML = 'Please specify your email address.';
  } 
  else if (!password.value) {
    result.innerHTML = 'Please specify a password.';
  } 
  else if (password.value !== verifyPassword.value) {
    result.innerHTML = 'Passwords are <b>different</b>, please check.';
  } 
  else {

    var user = {
      first_name: firstName.value, 
      last_name: lastName.value, 
      username: username.value, 
      email: email.value,
      password: password.value,
    };

    lambda.invoke({
      FunctionName: 'register',
      Payload: JSON.stringify(user)
    }, function(err, data) {
      if (err) {  
        err = JSON.parse(err);
        console.log(err, err.stack);
      }
    
      var output = JSON.parse(data.Payload);
      if (output && output.success) {
        result.innerHTML = 'User ' + user.email + ' created. Please check your email to validate the user and enable login.';
        return;
      }
      
      result.innerHTML = 'User <b>not</b> created.';

      
    });

  }
};

var form = document.getElementById('signup-form');
form.addEventListener('submit', function(evt) {
  evt.preventDefault();
  signup();
});
