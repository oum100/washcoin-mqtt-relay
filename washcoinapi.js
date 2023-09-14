import axios from 'axios';

export async function deviceStart(mac,transId){
    console.log("mac: ",mac)
    console.log("transactionId: ",transId)

    const config = {
        method:'post',
        url:'https://elysium.washcoin.net/apis/v3.0.1/devicestart',
        headers: {
            'washcoin-appcode':'NIOC-HSAW-2016',
            'apikey':'LDKGITJENCJFG395867365',
            'mac':mac,
            'transactionid':transId
        }
    }

    let res = await axios(config);
    console.log("status: ",res.status);
    console.log("data: ",res.data);
}

export async function deviceStop(token,transId){

    console.log("token: ",token)
    console.log("transactionId: ",transId)

    const config  = {
        method:'post',
        url:'https://elysium.washcoin.net/apis/v3.0.1/updatetransactionstatus',
        headers: {
            'Authorization':'LDKGITJENCJFG395867365',
            'Content-Type':'application/x-www-form-urlencoded'
        },
        data:{
            'device_token':token,
            'transactionid':transId,
        }
    }

    let res = await axios(config);
    console.log("status: ",res.status);
    console.log("data: ",res.data);
}

