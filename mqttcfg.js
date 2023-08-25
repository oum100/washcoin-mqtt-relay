const sourceMqtt = {
    mqttName: "Glad Whale",
    mqttHost: "glad-whale.rmq.cloudamqp.com",
    mqttPort: 1883,
    mqttUser: "ilsrjeyw",
    mqttPass: "1riEi7_wHGpUA7r-oF76FF4ay81diLJr",
    mqttProtocal: 'mqtt',
    mqttSubTopic: 'washcointest/#',
}

const targetMqtt = {
    mqttName: "Glad Whale",
    mqttHost: "glad-whale.rmq.cloudamqp.com",
    mqttPort: 1883,
    mqttUser: "ilsrjeyw",
    mqttPass: "1riEi7_wHGpUA7r-oF76FF4ay81diLJr",
    mqttProtocal: 'mqtt',
    mqttSubTopic: 'relay/stat/#',
}

// const targetMqtt = {
//     mqttName: "FLIPUP",
//     mqttHost: "flipup.net",
//     mqttPort: 1883,
//     mqttUser: "sammy",
//     mqttPass: "password",
//     mqttProtocal: 'mqtt',
//     mqttTopic: 'relay/stat/#',
// }

export { sourceMqtt, targetMqtt }