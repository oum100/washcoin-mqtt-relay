import { connect } from "mqtt";
import { sourceMqtt, targetMqtt } from "./mqttcfg.js";
import { deviceList } from "./devicelist.js";
// import { wifiInfo } from "./mqtt2.js";


const production = 1;

let rssi = null;
let powerState = 0;
let currentValue = 0;

let clientSource = connect({
    host: sourceMqtt.mqttHost,
    port: sourceMqtt.mqttPort,
    username: sourceMqtt.mqttUser,
    password: sourceMqtt.mqttPass,
    protocol: sourceMqtt.mqttProtocal,
})

clientSource.on('connect', () => {
    console.log('Connected to Source MQTT broker (Glad Whale)');
    clientSource.subscribe('washcoin/#', (err) => {
        if (err) {
            console.error(err);
        }
    });
});

let clientTarget = connect({
    host: targetMqtt.mqttHost,
    port: targetMqtt.mqttPort,
    username: targetMqtt.mqttUser,
    password: targetMqtt.mqttPass,
    protocol: targetMqtt.mqttProtocal,
})

clientTarget.on('connect', () => {
    console.log('Connected to Target MQTT broker');
    clientTarget.subscribe('rgh18/stat/#', (err) => {
        if (err) {
            console.error(err);
        }
    });
})


// Flipup mqtt
clientTarget.on('message', async(topic, message) => {
    const uuid = topic.split('/')[2]
    // console.log("Target uuid: ",uuid);

    const action = topic.split('/')[3]
    // console.log("Target Action: ",action)

    for (const device of deviceList){
        if((device.target.uuid === uuid) && (action === "STATUS11")){
            const payload = JSON.parse(message.toString());
            const statusSTS = payload.StatusSTS;
            const wifi = statusSTS.Wifi;

            console.log("STATUS11 Wifi Info of:",uuid)
            console.log(wifi)
            rssi = wifi.RSSI;
        }

        if((device.target.uuid === uuid) && (action === "STATUS8")){
            const payload = JSON.parse(message.toString());
            // console.log("STATUS8 payload: ",payload)
            console.log("Time: ",payload.StatusSNS.Time)
            console.log("Voltage: ",payload.StatusSNS.ENERGY.Voltage)
            console.log("Current: ",payload.StatusSNS.ENERGY.Current)
        }

        if((device.target.uuid === uuid) && (action === "RESULT")){
            const payload = JSON.parse(message.toString());
            powerState = payload.POWER.toUpperCase()
        }
    }
})



// Washcoin mqtt
clientSource.on('message', async(topic, message) => {
    // console.log(topic, message.toString());

    const uuid = topic.split('/')[1];
    // console.log(uuid);

    //Main loop only device in deviceList
    for (const device of deviceList) {
        if (device.source.uuid === uuid) {
            console.log(`Message from ${device.source.name} : ${uuid}`);

            const payload = JSON.parse(message.toString());
            console.log("Received payload: ",payload.values);

            // Set publishTopic for target mqtt server
            const publishTopic = device.target.publishTopic.prefix + device.target.uuid + device.target.publishTopic.subfix;
            console.log("publishTopic: ",publishTopic)

            if(payload.values[0].key === "cmd_ping"){
                // Send publish to check rssi
                clientTarget.publish(publishTopic, JSON.stringify({"status": "11"}))
                setTimeout(() => {
                    console.log("RSSI now is: ",rssi)
                    if(rssi != null){
                        clientSource.publish(`washcoin/${uuid}`, JSON.stringify({
                            values:[
                                {"key":"ans_status", "value":"alive"},
                                {"key":"RSSI", "value":rssi}
                            ]
                        }))
                    }
                }, 500)
                console.log("Published ans_status back to washcoin \n");
            }


            /* --------------------------------------- For Dryer machine only -------------------------------- */
            if(payload.values[0].key === "cmd_timer"){
                // const payload = JSON.parse(message.toString());
                const timer = payload.values[0].value;
                const secTimer = parseInt(timer)
                const miliTimer = secTimer * 1000
                
                console.log("Action: ", payload.values[0].key)
                console.log("Service time: ", secTimer)
                console.log("miliTimer: ",miliTimer)
                
                /* -------------------- If 1 = use javascript timer, 0 = use device timer ------------------- */
                clientTarget.publish(publishTopic, JSON.stringify({"pulseTime1": secTimer+100}))  //User Tasmota device timer must +100
                clientTarget.publish(publishTopic, JSON.stringify({"power1": "on"})) // Turn on power 

                // Send start notify to server
                setTimeout( () => {
                    let responseFlag = 0;
                    if(powerState === "ON"){
                        responseFlag = 1
                    }else{
                        setTimeout(()=>{
                            clientTarget.publish(publishTopic, JSON.stringify({"state": ""}))
                        },500)
                        if(powerState === "ON"){
                            responseFlag = 1
                        }
                    }
                    // console.log("responseFlag: ",responseFlag)
                    if(responseFlag){
                        const resvalue = {
                            "values":[
                                {"key":"ans_timer","value":"started" },
                                {"key":"token","value":uuid },
                                {"key":"transactionid","value":payload.values[2].value}
                            ] 
                        }
                        if(production){
                            clientSource.publish(`washcoin/${uuid}`, JSON.stringify({resvalue}))
                        }
                        console.log("cmd_timer-> Response message: ",resvalue)
                    }
                },500)

                //Send stop notify to server
                setTimeout( ()=> {
                    let responseFlag = 0
                    if(powerState === "OFF"){
                        responseFlag = 1
                    }else{ 
                        setTimeout(()=>{
                            clientTarget.publish(publishTopic, JSON.stringify({"state": ""}))
                        },500)
                        if(powerState === "ON"){
                            responseFlag = 1
                        }
                    }
                    
                    if(responseFlag){
                        const resvalue = {
                            "values":[
                                {"key":"ans_timer","value":"stop" },
                                {"key":"asset","value":"" },
                                {"key":"transactionid","value":payload.values[2].value}
                            ] 
                        }
                        if(production){
                            clientSource.publish(`washcoin/${uuid}`, JSON.stringify({resvalue}))
                        }
                        console.log("cmd_timer-> Response message: ",resvalue)
                    }
                },(miliTimer+500))
            }


            /* --------------------------------------- For Washing machine only -------------------------------- */
            if(payload.values[0].key === "cmd_counter3"){
                const timer = payload.values[0].value;
                const secTimer = parseInt(timer)
                const miliTimer = secTimer * 1000

                clientTarget.publish(publishTopic, JSON.stringify({"power1": "on"})) // Turn on power 
                
                //Sending started status to server
                setTimeout(()=>{
                    let responseFlag = 0
                    if(powerState === "ON"){
                        responseFlag = 1
                    }else{
                        setTimeout(()=>{
                            clientTarget.publish(publishTopic, JSON.stringify({"state": ""}))
                        },500)
                        if(powerState === "ON"){
                            responseFlag = 1
                        }
                    }
                
                    if(responseFlag){
                        const resvalue = { //Start
                            "values":[
                                {"key":"ans_counter3","value":"started" },
                                {"key":"token","value":uuid},
                                {"key":"transactionid","value":payload.values[4].value}
                            ] 
                        }
                        if(production){
                            clientSource.publish(`washcoin/${uuid}`, JSON.stringify({resvalue}))
                        }
                        console.log("cmd_counter3-> Response message: ",resvalue)
                    }
                },500)

                //Sending stop status to server
                setTimeout(()=>{
                    let zeroCounter = 0
                    let responseFlag = 0
                    const intervalID = setInterval(()=>{
                        clientTarget.publish(publishTopic, JSON.stringify({"status": "8"}))
                        if(currentValue <= 0.15){
                            zeroCounter++
                            console.log("Counter: ",zeroCounter+"\n")
                            if(zeroCounter >= 5){
                                clientTarget.publish(publishTopic, JSON.stringify({"power": "off"}))
                                console.log("Reset Counter\n")
                                clearTimeout(intervalID);

                                setTimeout(()=>{
                                    if(powerState === "OFF"){
                                        responseFlag = 1
                                    }else{
                                        setTimeout(()=>{
                                            clientTarget.publish(publishTopic, JSON.stringify({"state": ""}))
                                        },500)
                                        if(powerState === "OFF"){
                                            responseFlag = 1
                                        }
                                    }
    
                                    if(responseFlag){
                                        const resvalue = { //Stop
                                            "values":[
                                                {"key":"ans_counter3","value":"stop" },
                                                {"key":"asset","value":payload.values[2].value },
                                                {"key":"transactionid","value":payload.values[4].value}
                                            ] 
                                        }
                                        if(production){
                                            clientSource.publish(`washcoin/${uuid}`, JSON.stringify({resvalue}))
                                        }
                                        console.log("cmd_counter3-> Response message: ",resvalue)
                                    }
                                },500)

                            }
                        }else{
                            zeroCounter = 0
                        }
                    },30000)
                },miliTimer)
            }


            /* --------------------------------------- For Power on, Power off machine -------------------------------- */
            if(payload.values[0].key === "cmd_power"){
                if(payload.values[0].value === "on"){
                    console.log("Turn ON machine: ",device.target.name);
                    clientTarget.publish(publishTopic, JSON.stringify({"power1": "on"}))
                    setTimeout( () => {
                        clientSource.publish(`washcoin/${uuid}`, JSON.stringify({
                            "values":[{"key":"ans_power","value":powerState.toLowerCase()}]
                        }))
                    },500)

                }

                if(payload.values[0].value === "off"){
                    console.log("Turn OFF machine: ",device.target.name);
                    clientTarget.publish(publishTopic, JSON.stringify({"power1": "off"}))
                    setTimeout( () => {
                        clientSource.publish(`washcoin/${uuid}`, JSON.stringify({
                            "values":[{"key":"ans_power","value":powerState.toLowerCase()}]
                        }))
                    },500)
                }

            }

        }
    }
})