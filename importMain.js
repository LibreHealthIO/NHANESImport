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
    server_name: 'http://192.168.249.128/libreehr'
    ,userid: 'admin'
    ,password: 'pass'
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
    });// End load_mcq_data
        
}


//loadMCQProblemData();
loadBPQProblemData();
//createPatients();