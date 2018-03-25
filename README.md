![StayWoke Logo](https://static1.squarespace.com/static/5820f5a7893fc002c48ffe4e/t/58d435f45016e1bc225fcce0/1521302363185/?format=300w "StayWoke Logo")

StayWoke AWS Lambda's
===

[![Build Status](https://circleci.com/gh/staywoke/lambdas/tree/master.svg?style=shield)](https://circleci.com/gh/staywoke/lambdas/tree/master)[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/staywoke/lambdas/master/LICENSE)[![GitHub contributors](https://img.shields.io/github/contributors/staywoke/lambdas.svg)](https://github.com/staywoke/lambdas/graphs/contributors)

> The AWS Lambda service automatically scales StayWoke applications to support whatever volume of traffic we need to support.  Our goal is to set up a base of standardized components that are built with extensive testing in order to assure stability and scalability.


Components
---

**User Interaction:**

* [Register](./register/README.md)


Developer Resources
---

* [AWS Lambda Overview](https://aws.amazon.com/lambda/)
* [Writing Lambda Unit Tests](https://github.com/vandium-io/lambda-tester/tree/master/docs)
* [Mocha Unit Test Assertions](https://mochajs.org/#assertions)

**NPM Scripts:**

Command                 | Description
------------------------|-------------
`npm test`              | Runs `npm run lint` and `npm run unit`
`npm run test:lint`     | Checks that code formatting meets standards requirements
`npm run test:unit`     | Runs Unit Tests for each component and builds Code Coverage report
`npm run test:coverage` | Opens Code Coverage in Browser
