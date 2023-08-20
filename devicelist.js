const deviceList = [
    // {
    //     "source":{
    //         "name":"DF-96",
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
    //         "uuid":"C049EFEFD5CC",
    //         "type":"dryer",
    //         "subscribeTopic":{
    //             "prefix":"rgh18/stat/",
    //             "subfix":"",
    //         },
    //         "publishTopic":{
    //             "prefix":"rgh18/cmnd/",
    //             "subfix":"/json",
    //         },   
    //     }
    // },
    {
        "source":{
            "name":"WF-103",
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
                "prefix":"rgh18/stat/",
                "subfix":"",
            },
            "publishTopic":{
                "prefix":"rgh18/cmnd/",
                "subfix":"/json",
            },   
        }
    }
]

export { deviceList }