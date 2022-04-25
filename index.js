const express = require('express')
const mqtt = require('mqtt')
const writeDataToInfluxDB = require('./write-data-to-influxdb')
const readDataFromInfluxDB = require('./read-data-from-influxdb');
// const logger = require('./logger')

const mqttClient = mqtt.connect('mqtt://192.168.29.173:1883')

const app = express()
const port = 3000

// parse form data
app.use(express.urlencoded({ extended: false }))
// parse json
app.use(express.json())

mqttClient.on('connect', function () {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe([
    'rphv',
    'yphv',
    'bphv',
    'rpha',
    'ypha',
    'bpha',

  ], function (err) {
    if (!err) {
      mqttClient.publish('presence', 'Hello mqtt')
    }
  })
})

mqttClient.on('message', function (topic, message) {
  // message is Buffer
  let data = Number(message.toString());
  // console.log(data);
  writeDataToInfluxDB(data, topic);


})

app.get('/', (req, res) => {

  let a = readDataFromInfluxDB();
  console.log(a)
  res.json(a)
})

app.post('/api', (req, res) => {
  console.log(req.body, req.query);

  const queryApi = client.getQueryApi(org)

  res.status(201).json({ success: true, person: "sdsd" })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
