const deviceList = [
    // {
    //     "source":{
    //         "name":"DF-96",
    //         "mac":"84:f3:eb:3e:56:23",
    //         "uuid":"GH485S9W5482OQ2W5X7Z",
    //         "type":"dryer",            
    //         "subscribeTopic":{
    //             "prefix":"washcoin/",
    //             "subfix":"",
    //         },
    //         "publishTopic":{
    //             "prefix":"washcoin/",
    //             "subfix":"",
    //         },
            
    //     },
    //     "target":{
    //         "name":"DF-96",
    //         // "uuid":"C049EFEFD5CC",
    //         "uuid":"C049EFEFBC80",
    //         "type":"dryer",
    //         "subscribeTopic":{
    //             "prefix":"relay/stat/",
    //             "subfix":"",
    //         },
    //         "publishTopic":{
    //             "prefix":"relay/cmnd/",
    //             "subfix":"/json",
    //         },   
    //     }
    // },
    {
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
    },
    // {
    //     "source":{
    //         "name":"WF-093",
    //         "uuid":"BCR2X7B1E38IK8MQRT52",
    //         "type":"washer",            
    //         "subscribeTopic":{
    //             "prefix":"washcoin/",
    //             "subfix":"",
    //         },
    //         "publishTopic":{
    //             "prefix":"washcoin/",
    //             "subfix":"",
    //         },
            
    //     },
    //     "target":{
    //         "name":"WF-093",
    //         "uuid":"C049EFEFBC80",
    //         "type":"washer",
    //         "subscribeTopic":{
    //             "prefix":"relay/stat/",
    //             "subfix":"",
    //         },
    //         "publishTopic":{
    //             "prefix":"relay/cmnd/",
    //             "subfix":"/json",
    //         },   
    //     }
    // }
]

export { deviceList }