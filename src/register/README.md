![StayWoke Logo](https://static1.squarespace.com/static/5820f5a7893fc002c48ffe4e/t/58d435f45016e1bc225fcce0/1521302363185/?format=300w "StayWoke Logo")

**[⬅ BACK](../README.md)**

Register
===

> This should be a basic overview of the component and when it should be used.


Example Usage
---

**BASIC:**

```html
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.213.1.min.js"></script>
<script>
var lambda = new AWS.Lambda();

var newUser = {
  username: 'newuser',
  password: 'abc123'
};

lambda.invoke({
  FunctionName: 'register',
  Payload: JSON.stringify(newUser)
}, function (err, data) {
  if (err) {
    console.log(err, err.stack);
  } else {
    var output = JSON.parse(data.Payload);
  }
});
</script>
```

**BASIC RESPONSE:**

```json
{ "success": true, "response": [] }
```

**ERROR:**

```js
var register = require('./lambdas/register');

// @TODO: Have Ayana flush this out with actual example that will fail ( invalid input, etc )
```

**ERROR RESPONSE:**

```json
{ "success": false, "response": [] }
```


Developer Resources
---

Here are a few resources that might be helpful with this specific component:

* [AWS DynamoDB](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html)
