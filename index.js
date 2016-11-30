'use strict';
const ini = require('ini-config-parser');
const os = require('os');

const fallbackAWSRegion = 'us-east-1';

// the order of precedence for setting the credentials is:
// 1. --profile command-line parameter
// 2. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
// 3. AWS_PROFILE or default
const initCustomCredentials = (AWS, params) => {
  const key = params.accessKey ? params.accessKey : process.env.AWS_ACCESS_KEY_ID;
  const secret = params.secretKey ? params.secretKey : process.env.AWS_SECRET_ACCESS_KEY;
  /* eslint-disable */
  const profile = params.profile ? params.profile :
    (process.env.AWS_PROFILE ? process.env.AWS_PROFILE : 'default');
  /* eslint-enable */
  // if they provided an access key and secret key, load this:
  if (key && secret) {
    AWS.config.update({ accessKeyId: key, secretAccessKey: secret });
  } else {
    AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile });
  }
};

const extractRegionFromConfigFile = (params) => {
  const sharedAWSConfigFilePath = `${os.homedir()}/.aws/config`;
  const data = ini.parse(sharedAWSConfigFilePath);
  const profile = params.profile ? params.profile : 'default';
  // some config files use this format:
  if (data[`profile ${profile}`]) {
    return data[`profile ${profile}`].region;
  } else if (data[profile]) {
    return data[profile].region;
  }
  return fallbackAWSRegion;
};

// the order of precedence for setting the AWS region is:
// 1. --region command line parameter
// 2. AWS_DEFAULT_REGION environment variable
// 3. the ~/.aws/config file
// 4. 'us-east-1'
const initRegion = (AWS, awsModule, params) => {
  let region = params.region ? params.region : process.env.AWS_DEFAULT_REGION;
  const options = {};
  if (region) {
    options.region = region;
  }
  if (params.endpoint) {
    options.endpoint = params.endpoint;
  }
  try {
    options.region = extractRegionFromConfigFile(params);
    return new AWS[awsModule](options);
  } catch (exc) {
    options.region = fallbackAWSRegion;
    return new AWS[awsModule](options);
  }
};

module.exports = (AWS, awsModule, argv) => {
  initCustomCredentials(AWS, argv);
  return initRegion(AWS, awsModule, argv);
};
