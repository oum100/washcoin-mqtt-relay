/*  Washcoin mqtt relay version 1.0.0
    Purpose for control TASMOTA device (using firmware from tasmota) without using IOT from Washcoin.
    Requirement:
        1. Device must install TASMOTA firmware.
        2. Device must configuration MQTT to
           2.1 HOST: as Washcoin mqtt:    Ex. glad-whale.rmq.cloudamqp.com   PORT:1883
           2.2 USER: as mqtt need.  Ex. user: ilsrjeyw   pass: 1riEi7_wHGpUA7r-oF76FF4ay81diLJr
           2.3 TOPIC: %12X
           2.4 FULL TOPIC:  relay/%prefix%/%topic%
           2.5 set "pulseTime1" to 0    {"pulseTime1":"0"}


    Functional.
        1. Detect mqtt command for specific device in "deviceList" from sourceMqtt.
        2. Send that command via targetMqtt to specific device.
        3. Perform action on that device and reply the result back to sourceMqtt.
*/

import { connect } from "mqtt";
import { sourceMqtt, targetMqtt } from "./mqttcfg.js";
import { deviceList } from "./devicelist.js";


const production = 1;

let rssi = null;
let powerState = 0;
let currentValue = 0;
let isPowerON = 0;

//*******************************  SourceMqtt Connection ********************************
let clientSource = connect({
    host: sourceMqtt.mqttHost,
    port: sourceMqtt.mqttPort,
    username: sourceMqtt.mqttUser,
    password: sourceMqtt.mqttPass,
    protocol: sourceMqtt.mqttProtocal,
})

clientSource.on('connect', () => {
    console.log('Source MQTT: '+ sourceMqtt.mqttName + '...Connected');
    clientSource.subscribe(sourceMqtt.mqttSubTopic, (err) => {
        if (err) {
            console.error(err);
        }
    });
});


//*******************************  TargetMqtt Connecting ********************************
let clientTarget = connect({
    host: targetMqtt.mqttHost,
    port: targetMqtt.mqttPort,
    username: targetMqtt.mqttUser,
    password: targetMqtt.mqttPass,
    protocol: targetMqtt.mqttProtocal,
})

clientTarget.on('connect', () => {
    console.log('Target MQTT: '+targetMqtt.mqttName +'...Connected');
    // clientTarget.subscribe('relay/stat/#', (err) => {
    clientTarget.subscribe(targetMqtt.mqttSubTopic, (err) => {
        if (err) {
            console.error(err);
        }
    });
})


//*******************************  TargetMqtt command function ********************************
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

            console.log(`[STATUS 11] Wifi Info of: ${uuid}`)
            console.log(wifi)
            rssi = wifi.RSSI;
        }

        if((device.target.uuid === uuid) && (action === "STATUS8")){
            const payload = JSON.parse(message.toString());
            currentValue = 0

            console.log("[STATUS 8] Info")
            console.log("Time: ",payload.StatusSNS.Time)
            console.log("Voltage: ",payload.StatusSNS.ENERGY.Voltage)
            console.log("Current: ",payload.StatusSNS.ENERGY.Current)
            console.log("\n")

            currentValue = payload.StatusSNS.ENERGY.Current
            console.log("[STATUS 8] Current value: ",currentValue)
        }

        if((device.target.uuid === uuid) && (action === "RESULT")){
            powerState = null
            const payload = JSON.parse(message.toString());
            if(payload.POWER != undefined){
                console.log("[RESULT] Payload.POWER: ",payload.POWER)
                powerState = payload.POWER.toUpperCase()
                console.log("[RESULT] powerState: ",powerState)
            }
            if(powerState === "ON"){
                isPowerON = 1
            }else{
                isPowerON = 0
            }
            console.log("[RESULT] isPowerON: ",isPowerON);
        }
    }
})



//****************************  Washcoin mqtt command function ****************************
clientSource.on('message', async(topic, message) => {
    
    const uuid = topic.split('/')[1];

    //Main loop only device in deviceList
    for (const device of deviceList) {
        if (device.source.uuid === uuid) {
            console.log(`Device ${device.source.name} : ${uuid}`);

            const payload = JSON.parse(message.toString());
            console.log("   |-Received payload: ",payload.values);

            // Set publishTopic for target mqtt server
            const publishTopic = device.target.publishTopic.prefix + device.target.uuid + device.target.publishTopic.subfix;
            console.log("   |-publishTopic: ",publishTopic)

            if(payload.values[0].key === "cmd_ping"){
                // Send publish to check rssi
                clientTarget.publish(publishTopic, JSON.stringify({"status":"11"}))
                setTimeout(() => {
                    console.log("Device RSSI now is: ",rssi)
                    if(rssi != null){
                        console.log("source PublishTopic: ",`${device.source.publishTopic.prefix}${uuid}`)
                        clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify({
                            values:[
                                {"key":"ans_status", "value":"alive"},
                                {"key":"RSSI", "value":rssi}
                            ]
                        }))
                    }
                },1500)
                console.log(`   |-Published ans_status to sourceMQTT: ${sourceMqtt.mqttName}`);
            }


            /* --------------------------------------- For Dryer machine only -------------------------------- */
            if(payload.values[0].key === "cmd_timer"){
                // const payload = JSON.parse(message.toString());
                const timer = payload.values[0].value;
                const secTimer = parseInt(timer)
                const miliTimer = (secTimer)* 1000 
                
                console.log("Action: ", payload.values[0].key)
                console.log("Service time: ", secTimer)
                console.log("miliTimer: ",miliTimer)
                
                /* -------------------- If 1 = use javascript timer, 0 = use device timer ------------------- */
                console.log("[cmd_timer] Sending Power ON command...and wait for 3 second")
                clientTarget.publish(publishTopic, JSON.stringify({"pulseTime1": secTimer+100}))  //User Tasmota device timer must +100
                clientTarget.publish(publishTopic, JSON.stringify({"power1":"on"})) // Turn on power 

                // Send start notify to server
                const isPowerONCheckID = setInterval( () => {
                    console.log("[cmd_timer] After 3 sec reading isPowerON: ",isPowerON)
    
                    if(isPowerON){
                        clearTimeout(isPowerONCheckID)

                        const resvalue = {
                            "values":[
                                {"key":"ans_timer","value":"started" },
                                {"key":"token","value":uuid },
                                {"key":"transactionid","value":payload.values[2].value}
                            ] 
                        }
                        if(production){
                            clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify(resvalue))
                        }

                        //Start Monitoring for job by miliTimer...
                        console.log("[cmd_timer] Staring monitor job for miliTimer: ",miliTimer)
                        setTimeout( ()=> {
                            let zeroCounter = 0
                            //************************************************
                            
                            console.log("[cmd_timer] Job finish after miliTimer...")
                            const resvalue = {
                                "values":[
                                    {"key":"ans_timer","value":"stop" },
                                    {"key":"asset","value":"" },
                                    {"key":"transactionid","value":payload.values[2].value}
                                ] 
                            }
                            if(production){
                                clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify(resvalue))
                            }
                            // console.log("cmd_timer-> Response message: ",resvalue)
                            // clearTimeout(intervalID);
                            clientTarget.publish(publishTopic, JSON.stringify({"pulseTime1": "0"}))  //User Tasmota device timer must +100
                            console.log("[cmd_timer] Reset PulseTime to 0")
                            if(isPowerOn){ // force power off
                                console.log["Machine not power off... force power off"]
                                clientTarget.publish(publishTopic, JSON.stringify({"power1": "off"}))
                            }
                        },miliTimer)

                        // console.log("cmd_timer-> Response message: ",resvalue)
                    }else{
                        console.log("[cmd_timer] Power on machine but not response...")
                    }
                },3000)

                //Send stop notify to server
                
            }
            /* --------------------------------------- Ending For Dryer machine only -------------------------------- */

            /* --------------------------------------- For Washing machine only -------------------------------- */
            if(payload.values[0].key === "cmd_counter3"){
                const timer = payload.values[0].value;
                const secTimer = parseInt(timer)
                const miliTimer = secTimer * 1000

                console.log("[cmd_counter3] Sending Power ON command...and wait for 3 second")
                clientTarget.publish(publishTopic, JSON.stringify({"power1":"on"})) // Turn on power 
                
                const isPowerONCheckID = setInterval(()=>{
                    console.log("[cmd_counter3] After 3 sec reading isPowerON: ",isPowerON)

                    if(isPowerON){ //Double check power state by send state command
                        clearTimeout(isPowerONCheckID)
                        const resvalue = { //Start
                            "values":[
                                {"key":"ans_counter3","value":"started" },
                                {"key":"token","value":uuid},
                                {"key":"transactionid","value":payload.values[4].value}
                            ] 
                        }
                        if(production){
                            clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify(resvalue))
                        }

                        //After machine on start monitor for miliTimer...
                        console.log("[cmd_counter3] Staring monitor job for miliTimer: ",miliTimer)
                        setTimeout(()=>{
                            let zeroCounter = 0

                            const intervalID = setInterval(()=>{
                                setTimeout(()=>{
                                    console.log("[cmd_counter3] Checking current value")
                                    clientTarget.publish(publishTopic, JSON.stringify({"status": "8"}))
                                },1500)
        
                                console.log("[cmd_counter3] currentValue: ",currentValue)
                                console.log("[cmd_counter3] compare: ",currentValue <= 0.1)
                                if(currentValue <= 0.1){
                                    zeroCounter++
                                    console.log("[cmd_counter3] Counter: ",zeroCounter)
                                    if(zeroCounter >= 10){
                                        clientTarget.publish(publishTopic, JSON.stringify({"power":"off"}))
                                        console.log("[cmd_counter3] Reset Counter\n")
                                        clearTimeout(intervalID);
            
                                        setTimeout(()=>{
                                            console.log("[cmd_counter3] powerState: ",powerState)
                                            if(powerState === "OFF"){
                                                isPowerON = 1
                                            }else{
                                                setTimeout(()=>{
                                                    clientTarget.publish(publishTopic, JSON.stringify({"state": ""}))
                                                },1500)
                                                if(powerState === "OFF"){
                                                    isPowerON = 1
                                                }
                                            }
            
                                            if(isPowerON){
                                                const resvalue = { //Stop
                                                    "values":[
                                                        {"key":"ans_counter3","value":"stop" },
                                                        {"key":"asset","value":payload.values[2].value },
                                                        {"key":"transactionid","value":payload.values[4].value}
                                                    ] 
                                                }
                                                if(production){
                                                    clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify(resvalue))
                                                }
                                                // console.log("cmd_counter3-> Response message: ",resvalue)
                                            }
                                        },1500)
                                    }
                                }else{
                                    zeroCounter = 0
                                    console.log("[cmd_counter3] Machine still running... check again in 10 sec\n")
                                }
                            },10000)
                        },miliTimer)
                    }else{
                        console.log("[cmd_counter3] Power on machine but not response...")
                    }
                },3000)
            }
            /* --------------------------------------- Ending For Washing machine only -------------------------------- */

            /* --------------------------------------- For Power on, Power off All machine type -------------------------------- */
            if(payload.values[0].key === "cmd_power"){
                if(payload.values[0].value === "on"){
                    console.log("Turn ON machine: ",device.target.name);
                    clientTarget.publish(publishTopic, JSON.stringify({"power1": "on"}))
                    setTimeout( () => {
                        clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify({
                            "values":[{"key":"ans_power","value":powerState.toLowerCase()}]
                        }))
                    },1500)

                }

                if(payload.values[0].value === "off"){
                    console.log("Turn OFF machine: ",device.target.name);
                    clientTarget.publish(publishTopic, JSON.stringify({"power1": "off"}))
                    setTimeout( () => {
                        clientSource.publish(`${device.source.publishTopic.prefix}${uuid}`, JSON.stringify({
                            "values":[{"key":"ans_power","value":powerState.toLowerCase()}]
                        }))
                    },1500)
                }

            }
            /* --------------------------------------- Ending For Power on, Power off All machine type -------------------------------- */
        }
    }
})