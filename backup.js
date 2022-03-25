const fs = require('fs');
const AWS = require('aws-sdk');
const BUCKET_NAME = 'awsjoobucket';
const env = require("dotenv").config({path: '/home/bitnami/payment/.env'});

const s3 = new AWS.S3({accessKeyId: process.env.accessKeyId,
secretAccessKey: process.env.secretAccessKey});

const today = new Date();

const year = today.getFullYear();
const month = ('0' + (today.getMonth() + 1)).slice(-2);
const day = ('0' + today.getDate()).slice(-2);

const backup_file = (year + '-' + month  + '-' + day + '-payment-backup.tar.gz').toString();

const uploadFile = (fileName) => {
  const fileContent = fs.readFileSync(fileName);
  const params = {
    Bucket: BUCKET_NAME,
    Key: backup_file,
    Body: fileContent
  };
  s3.upload(params, function(err, data) {
    if (err) {throw err;}
    console.log('File uploaded successfully.');
  });
};
console.log("merong")
uploadFile(backup_file);