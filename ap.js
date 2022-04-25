const AWS = require("aws-sdk");
const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const app = express();
const APP_SERVER_PORT = 5001;
const API_BASE = '/api';

// MQTT Broker running on same machine
const mqttClient = mqtt.connect('mqtt://localhost:1883')

// Connect to DynamoDB
AWS.config.update({
  region: "us-east-2",
});
const dbClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "iot-db";

mqttClient.on('connect', function () {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('home', function (err) {
    if (err) {
      console.log('Error while connecting to MQTT broker: ', err);
    }
  })
})

/*
  MQTT broker topic name is used as orgId
*/
mqttClient.on('message', function (topic, message) {
  const jsonString = message.toString();
  const parsed = JSON.parse(jsonString);
  const { timestamp, ...payload } = parsed;
  const ts = timestamp ? moment(payload.timestamp) : moment();

  const params = {
      TableName: TABLE_NAME,
      Item: {
        orgId: topic,
        timestamp: ts.valueOf(),
        humanReadableTimeStamp: ts.format('YYYY-MM-DD HH:mm:ss'),
        ...payload
      }
  };

  dbClient.put(params, function(err, data) {
      if (err) {
          console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          console.log("Added item:", JSON.stringify(data, null, 2));
      }
  });
});

app.use('*', cors());

// Express Server
app.get(`${API_BASE}/:orgId/data`, (req, res) => {
  const { orgId } = req.params;
  const startDate = moment().subtract(30, 'days').valueOf();
  const endDate   = moment().valueOf();

  const dbQuery = {
    TableName : TABLE_NAME,
    KeyConditionExpression: "#oid = :org_id and #ts between :sd and :ed",
    ExpressionAttributeNames:{
      "#oid": "orgId",
      "#ts" : "timestamp",
    },
    ExpressionAttributeValues: {
      ":org_id": orgId,
      ":sd": startDate,
      ":ed": endDate,
    },
  };

  dbClient.query(dbQuery, function(err, data) {
    if (err) {
      console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
      res.status(500).send({ message: err });
    } else {
      res.send(data);
    }
  });
});

app.get(`${API_BASE}/sample`, (req, res) => {
  return res.send({ message: "All good" });
});

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
    
  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(APP_SERVER_PORT, () => {
  console.log(`Example app listening at http://localhost:${APP_SERVER_PORT}`)
});