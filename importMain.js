/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var request=require('request');
var path = require('path');
var fs = require('fs');
var asyncLoop = require('node-async-loop');
var cheerio = require('cheerio');

var serverData={
    server_name: 'http://192.168.249.128/nhanes'
    ,userid: 'admin'
    ,password: 'password'
}

var mysql=require('mysql');
var dbConn = mysql.createConnection({
        host: 'localhost',
        user : 'root',
        password : 'mydbpwd',
        database : 'nhanes',
        multipleStatements: true
    });

dbConn.connect();



var EHRConnection=require("./EHRConnection.js").EHRConnection;

var EHRconn = new EHRConnection(serverData);

var NHANESconn=require("./NHANESData.js").NHANESData(dbConn,"_g");

function createPatients()
{
    NHANESconn.load_demographics().then(()=>{
            console.log(NHANESconn.patient_list.length);
            EHRconn.login().then((data)=>{
                asyncLoop(NHANESconn.patient_list,EHRconn.createPatientLoop);
            });
        });    
}

function loadMCQProblemData()
{
    NHANESconn.load_mcq_data().then(()=>{
            console.log("MCQ Data Loaded");
            EHRconn.login().then((data)=>{
                asyncLoop(NHANESconn.mcq_data,EHRconn.addProblemListLoop);
            });
    });// End load_mcq_data
        
}

function loadBPQProblemData()
{
    NHANESconn.load_bpq_data().then(()=>{
            console.log("BPQ Data Loaded");
            EHRconn.login().then((data)=>{
                asyncLoop(NHANESconn.bpq_data,EHRconn.addProblemListLoop);
            });
    });// End load_bpq_data
        
}

function loadDIQProblemData()
{
    NHANESconn.load_diq_data().then(()=>{
            console.log("DIQ Data Loaded");
            console.log(JSON.stringify(NHANESconn.diq_data));
            EHRconn.login().then((data)=>{
                asyncLoop(NHANESconn.diq_data,EHRconn.addProblemListLoop);
            });
    });// End load_diq_data
        
}

function loadKIQ_UProblemData()
{
    NHANESconn.load_kiq_u_data().then(()=>{
            console.log("KIQ_U Data Loaded");
            console.log(JSON.stringify(NHANESconn.kiq_u_data));
            EHRconn.login().then((data)=>{
                asyncLoop(NHANESconn.kiq_u_data,EHRconn.addProblemListLoop);
            });
    });// End load_diq_data
        
}


function loadRXQ_RX_Data()
{
    NHANESconn.load_rxq_rx_data().then(()=>{
                console.log("RXQ_RX Data Loaded");
                console.log(JSON.stringify(NHANESconn.rxq_rx_data));
                EHRconn.login().then((data)=>{
                    asyncLoop(NHANESconn.rxq_rx_data,EHRconn.addMedicationsListLoop);
                });                
            });
}

function loadBP_Data()
{
    NHANESconn.load_bpx_data().then(()=>{
        console.log("BP Data loaded");
        console.log(JSON.stringify(NHANESconn.bpx_data));
        EHRconn.login().then((data)=>{
                    asyncLoop(NHANESconn.bpx_data,EHRconn.addBPDataListLoop);
                });
        });
}

function loadLab_Data()
{
    NHANESconn.load_lab_data().then(()=>{
        console.log("Lab data loaded");
        EHRconn.login().then((data)=>{
                    asyncLoop(NHANESconn.lab_data,EHRconn.addLabDataListLoop);
                });
    });
}
//loadMCQProblemData();
//loadBPQProblemData();

//loadDIQProblemData();
//loadKIQ_UProblemData();
//loadRXQ_RX_Data();
//createPatients();
loadLab_Data();