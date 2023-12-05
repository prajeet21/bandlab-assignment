const AWS = require("aws-sdk");
// Load .env file configurations
require("dotenv").config();

// Update the AWS configuration object
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Create a DynamoDB client and S3 service object
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

module.exports = {
  dynamoDB,
  s3,
};
