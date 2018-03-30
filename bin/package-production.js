var AdmZip = require('adm-zip');
var colors = require('colors');
var cp = require('child_process');
var fs = require('fs');
var join = require('path').join;
var os = require('os');
var path = require('path');
var Promise = require("bluebird");
var resolve = require('path').resolve;
var rimraf = require('rimraf');

// Get Lambda Parent Folder
var src = resolve(__dirname, '../src/');

// Get Distributions Parent Folder
var dist = resolve(__dirname, '../dist/');

// Create Zip Handler
var zip = new AdmZip();

// Determine npm binary based on OS
var cmd = os.platform().startsWith('win') ? 'npm.cmd' : 'npm';

/**
 * Check that Lambas have required assets
 * @param  {String} lambdaPath Absolute Path to Lambda Folder
 * @param  {String} name Name of Lambda Function
 */
function checkLambda (lambdaPath, name) {
    if (!fs.existsSync(join(lambdaPath, 'package.json'))) {
      return Promise.reject(`× ERROR: '${name}' missing package.json`);
    }
    return Promise.resolve(`\n Packaging '${name}' lambda ... \n`);
}

/**
 * Cleanup Lambda before Packaging
 * @param  {String} nodeModulesPath Absolute Path to Lambda's node_modules Folder
 * @param  {String} zipPath Absolute Path to existing ZIP file
 * @param  {String} name Name of Lambda Function
 */

function cleanLambda (nodeModulesPath, zipPath, name) {
  return new Promise(function(resolve, reject) {
    rimraf(nodeModulesPath, function(){
        rimraf(zipPath, function(){
          resolve(`✓ '${name}' clean up complete`);
      });
    });
  });
}

/**
 * Install Lambda's Node Dependencies
 * @param  {String} lambdaPath Absolute Path to Lambda Folder
 * @param  {String} name Name of Lambda Function
 */
function installDeps (lambdaPath, name) {
  return new Promise(function(resolve, reject) {
    // Run `npm install` within lambda folder
    var install = cp.spawn(cmd, ['i'], { env: process.env, cwd: lambdaPath, stdio: null });

    // Listen for completion of `npm install`
    install.on('close', (code) => {
      resolve(`✓ '${name}' dependencies installed`);
    });
  });
}

/**
 * Zip Lambda's for uploading later to AWS S3
 * @param  {String} lambdaPath Absolute Path to Lambda Folder
 * @param  {String} zipPath Absolute Path to existing ZIP file
 * @param  {String} name Name of Lambda Function
 */
function packageLambda (lambdaPath, zipPath, name) {
  return new Promise(function(resolve, reject) {
    // Zip Lambda
    zip.addLocalFolder(lambdaPath, '');
    zip.writeZip(zipPath);

    resolve(`✓ ./dist/${name}.zip created`);
  });
}

// Loop through lambda's
Promise.mapSeries(fs.readdirSync(src), function (lambda) {
  var lambdaPath = join(src, lambda);
  var zipPath = join(dist, `${lambda}.zip`);
  var nodeModulesPath = join(lambdaPath, 'node_modules');

  // Skip if this is not a directory
  if (!fs.lstatSync(lambdaPath).isDirectory()) {
    return Promise.resolve();
  }

  // Run commands in specefic order using Promises
  return checkLambda(lambdaPath, lambda)
  .then(function(checkLambdaResponse){
    console.log(`${checkLambdaResponse}`.bgWhite.black);
    return cleanLambda(nodeModulesPath, zipPath, lambda);
  })
  .then(function(cleanLambdaResponse){
    console.log(`${cleanLambdaResponse}`.bold.green);
    return installDeps(lambdaPath, lambda);
  })
  .then(function(installDepsResponse){
    console.log(`${installDepsResponse}`.bold.green);
    return packageLambda(lambdaPath, zipPath, lambda);
  })
  .then(function(packageLambdaResponse){
      console.log(`${packageLambdaResponse}\n`.bold.green);
  });
});
