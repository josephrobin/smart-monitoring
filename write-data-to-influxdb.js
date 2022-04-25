const { InfluxDB, Point } = require('@influxdata/influxdb-client')

const config = require('config')

// You can generate an API token from the "API Tokens Tab" in the UI
const token = 'bE60tGFHIckL4djV_5pz6OW3D_48Pc9qwkoQ8LtA9lc0NyDqgbRQ7AJUwFF6Tk9GxsU65YJCyFmEvGeHCYrlEQ=='
const org = 'greyline'
const bucket = 'electricityManagement'

const client = new InfluxDB({ url: 'http://192.168.29.173:8086', token: token })

module.exports = async (data, topic) => {

    const tags = config.get(topic);
    // console.log(tags.unit)

    const writeApi = client.getWriteApi(org, bucket)
    writeApi.useDefaultTags({ host: 'host1' })

    let point = new Point('mem')
    point = point.floatField('data', data)
    point = point.tag('unit', tags.unit)
    point = point.tag('phase', tags.phase)
    point = point.tag('source', tags.source)
    await writeApi.writePoint(point)
    writeApi.close()
        

}
// .then(() => {
//     console.log('FINISHED')
// })
// .catch(e => {
//     console.error(e)
//     console.log('Finished ERROR')
// })