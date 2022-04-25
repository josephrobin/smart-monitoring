const { InfluxDB } = require('@influxdata/influxdb-client')

// You can generate an API token from the "API Tokens Tab" in the UI
const token = 'bE60tGFHIckL4djV_5pz6OW3D_48Pc9qwkoQ8LtA9lc0NyDqgbRQ7AJUwFF6Tk9GxsU65YJCyFmEvGeHCYrlEQ=='
const org = 'greyline'
const bucket = 'electricityManagement'

const client = new InfluxDB({ url: 'http://192.168.29.173:8086', token: token })

const queryApi = client.getQueryApi(org)

module.exports = () => {
  const query = `
  from(bucket: "electricityManagement") 
  |> range(start: -1h)
  |> filter(fn: (r) => r.phase == "r-phase")
  |> filter(fn: (r) => r.unit == "current")
  |> mean()
  `
  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row)
      console.log(o)
      // console.log(`${o._time} ${o._measurement}: ${o._field}=${o._value}`)
    },
    error(error) {
      console.error(error)
      console.log('Finished ERROR')
    },
    complete() {
      console.log('Finished SUCCESS')
    },
  })

}
