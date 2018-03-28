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
      return reject(colors.bold.red(`\n× ERROR: '${name}' missing package.json\n`));
    } else {
      return resolve(colors.bgWhite.black(`\n Packaging '${name}' lambda ... \n`));
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
        return resolve(colors.bold.green(`✓ '${name}' clean up complete`));
      }
    });

    // Remove previous build
    rimraf(zipPath, function(){
      completed.zip = true;
      if (completed.nodeModules && completed.zip) {
        return resolve(colors.bold.green(`✓ '${name}' cleanup complete`));
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
    var install = cp.spawn('npm', ['install'], { env: process.env, cwd: lambdaPath });

    install.stdout.on('data', (error) => {
      return reject(colors.bold.red(`\n× killed: installing '${name}' package.json > ${error}\n`));
    });

    install.stderr.on('data', (error) => {
      return reject(colors.bold.red(`\n× killed: installing '${name}' package.json > ${error}\n`));
    });

    install.on('error', (error) => {
      return reject(colors.bold.red(`\n× killed: installing '${name}' package.json > ${error}\n`));
    });

    // Listen for completion of `npm install`
    install.on('close', (code, data) => {
      if (code === 0) {
        return resolve(colors.bold.green(`✓ '${name}' dependencies installed`));
      } else {
        return reject(colors.bold.red(`\n× ERROR: '${name}' dependencies could not be installed\n  CHECK: cd ./src/${name}/ && npm install\n`));
      }
    });
  });
}

/**
 * Zip Lambda
 * @param  {String} lambdaPath Absolute Path to Lambda Folder
 * @param  {String} zipPath Absolute Path to existing ZIP file
 * @param  {String} name Name of Lambda Function
 */
function packageLambda (lambdaPath, zipPath, name) {
  return new Promise(function(resolve, reject) {
    // Zip Lambda
    zip.addLocalFolder(lambdaPath, '');
    zip.writeZip(zipPath);

    return resolve(colors.bold.green(`✓ ./dist/${name}.zip created`));
  });
}

// Story order we want to run Promises in
var promises = [];

// Loop through lambda's
fs.readdirSync(src).map(function (lambda) {
  var lambdaPath = join(src, lambda);
  var zipPath = join(dist, `${lambda}.zip`);
  var nodeModulesPath = join(lambdaPath, 'node_modules');

  // Skip if this is not a directory
  if (!fs.lstatSync(lambdaPath).isDirectory()) {
    return;
  }

  promises.push(checkLambda(lambdaPath, lambda));
  promises.push(cleanLambda(nodeModulesPath, zipPath, lambda));
  promises.push(installDeps(lambdaPath, lambda));
  promises.push(packageLambda(lambdaPath, zipPath, lambda));
})

// Run commands in specefic order they were requested
Promise.all(promises).then(values => {
  values.map(function (response) {
    console.log(response);
  });
})
.catch(function(error){
  console.error(error);
});
