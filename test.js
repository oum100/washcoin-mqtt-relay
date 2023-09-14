import {deviceStart, deviceStop} from './washcoinapi.js';


const device = {
    "source":{
        "name":"WF-103",
        "mac":"5c:cf:7f:a7:fa:3a",
        "uuid":"A7DIWY71138H4N56V5X7",
        "type":"washer",            
        "subscribeTopic":{
            "prefix":"washcoin/",
            "subfix":"",
        },
        "publishTopic":{
            "prefix":"washcoin/",
            "subfix":"",
        },
        
    },
    "target":{
        "name":"WF-103",
        "uuid":"C049EFEFBC80",
        "type":"washer",
        "subscribeTopic":{
            "prefix":"relay/stat/",
            "subfix":"",
        },
        "publishTopic":{
            "prefix":"relay/cmnd/",
            "subfix":"/json",
        },   
    }
}

// deviceStart(device.source.mac,"010923005377251")


deviceStop(device.source.uuid,"010923005377251")