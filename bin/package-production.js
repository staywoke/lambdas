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
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(join(lambdaPath, 'package.json'))) {
      reject(`× ERROR: '${name}' missing package.json`);
    } else {
      resolve(`\n Packaging '${name}' lambda ... \n`);
    }
  });
}

/**
 * Cleanup Lambda before Packaging
 * @param  {String} nodeModulesPath Absolute Path to Lambda's node_modules Folder
 * @param  {String} zipPath Absolute Path to existing ZIP file
 * @param  {String} name Name of Lambda Function
 */
function cleanLambda (nodeModulesPath, zipPath, name) {
  return new Promise(function(resolve, reject) {
    var completed = {
      nodeModules: false,
      zip: false
    };

    // Remove lambda's node_modules directory so we get a clean install each time
    rimraf(nodeModulesPath, function(){
      completed.nodeModules = true;
      if (completed.nodeModules && completed.zip) {
        resolve(`✓ '${name}' clean up complete`);
      }
    });

    // Remove previous build
    rimraf(zipPath, function(){
      completed.zip = true;
      if (completed.nodeModules && completed.zip) {
        resolve(`✓ '${name}' cleanup complete`);
      }
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
 * [packageLambda description]
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
fs.readdirSync(src).forEach(function (lambda) {
  var lambdaPath = join(src, lambda);
  var zipPath = join(dist, `${lambda}.zip`);
  var nodeModulesPath = join(lambdaPath, 'node_modules');

  // Skip if this is not a directory
  if (!fs.lstatSync(lambdaPath).isDirectory()) {
    return;
  }

  // Run commands in specefic order using Promises
  checkLambda(lambdaPath, lambda).then(function(checkLambdaResponse){
    cleanLambda(nodeModulesPath, zipPath, lambda).then(function(cleanLambdaResponse){
      installDeps(lambdaPath, lambda).then(function(installDepsResponse){
        packageLambda(lambdaPath, zipPath, lambda).then(function(packageLambdaResponse){
          console.log(`${checkLambdaResponse}`.bgWhite.black);
          console.log(`${cleanLambdaResponse}`.bold.green);
          console.log(`${installDepsResponse}`.bold.green);
          console.log(`${packageLambdaResponse}\n`.bold.green);
        });
      });
    });
  }).catch(function(error){
    console.log(`\n${error}`.bold.red);
  });
})
