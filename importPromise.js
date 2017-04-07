/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var request=require('request');
var path = require('path');
var fs = require('fs');

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

var csv=require('csv-parse/lib/sync');

function EHRConnection(serverData)
{
    this.server_name=serverData.server_name;
    this.userid=serverData.userid;
    this.password=serverData.password;
    var self=this;
    const loginPage='/interface/main/main_screen.php?auth=login&site=default'
    
    this.login = function()
    {
        return new Promise(function (resolve,reject) {
                request({
                    followAllRedirects: true,
                        url:self.server_name+loginPage,
                        formData: {
                                new_login_session_management:1,
                                authProvider: 'Default',
                                authUser:self.userid,
                                clearPass:self.password,
                                languageChoice:1,
                        },
                        jar: true,
                        method: 'POST'  
                    }
                    ,function(err,body)
                    {
                        if(err)
                        {
                            console.log(err);
                            reject(err)
                        }
                        resolve(body);
                    });            
        });
    }
    
    const patient_save_page="/interface/new/new_comprehensive_save.php";
    this.createPatient = function(patientData)
    {
        return new Promise(function (resolve,reject) {
                request({                    
                            followAllRedirects: true, 
                            url:self.server_name+patient_save_page,
                            formData: patientData,
                            jar: true,
                            method: 'POST'  
                        },
                        function(err,body)
                        {
                            if(err)
                            {
                                console.log(err);
                                reject(err)
                            }
                            resolve(body);
                        }    
                );
        });
    };
    return this;
}


function PatientData(demo_row)
{
    this.seqn=demo_row.seqn;
    
    if(demo_row.ridageyr==0)
    {
        this.age=demo_row.ridagemn/12;
        this.infant=true;
    }
    else
    {
        this.infant=false;
        this.age=demo_row.ridageyr
    }
    if(demo_row.riagendr===1)
    {
        this.sex="Male";
    }
    else if (demo_row.riagendr===2)
    {
        this.sex="Female";
    }
    if(!this.infant)
    {
        var dayOfYear = (this.seqn - this.age) % 365;
        var curDate = new Date();
        var dateBirth = new Date(curDate.getFullYear() -this.age,0,0);
        dateBirth.setDate(dateBirth.getDate() - dayOfYear);
        this.YearOfBirth=dateBirth;
    }
    else
    {
        var fullYears = Math.floor(demo_row.ridagemn/12);
        var months = demo_row.ridagemn % 12;
        
    }
    var name=names.generateName(this.seqn,this.sex);
    this.fname=name.fname;
    this.lname=name.lname;
    return this;
}

function NHANESData(dbServer,suffix)
{
    this.dbConn=dbServer;
    this.patient_list=[];
    this.suffix=suffix;
    var self=this;
    this.load_demographics= function()
    {
        return new Promise(function(resolve,reject)
        {
            var demo_table = "demo" + self.suffix;
            var limits = " LIMIT 1000 ";
            self.dbConn.query("SELECT * FROM "+demo_table+ limits,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    var curPatient=new PatientData(rows[rowIdx]);
                    if(!curPatient.infant)
                    {
                        self.patient_list.push(curPatient);
                        
                    }
                    resolve(self);
                }
            });// end query callback + statement
        }); // End new Promise
    }; // End load_demographics method
    
    this.load_demographics().then(()=>{
            console.log(JSON.stringify(this.patient_list[0]))
            console.log(this.patient_list.length)});
    return this;
}
var EHRconn = new EHRConnection(serverData);
var testPatientData=
                        {
                                    form_fname:'Promise'
                                    ,form_mname: ''
                                    ,form_lname:'Promise'
                                    ,form_sex:'Female'
                                    ,form_DOB:'2017-03-02'
                                    ,form_pubpid:'pubpid123'
                };
//EHRconn.login().then((data)=>{EHRconn.createPatient(testPatientData);});




function namesData()
{
    
    var basePath=process.cwd() + path.sep;
    var femaleNamesFile=basePath + "CommonNames-Female.csv";
    var maleNamesFile=basePath + "CommonNames-Male.csv";
    var lastNamesFile=basePath + "CommonNames-Last.csv";
    var self=this;
    this.loadFile=function(filename,target)
    {
        var filedata=fs.readFileSync(filename,"utf-8");
        var records=csv(filedata,{columns: true});
        for(var idx=0;idx<records.length;idx++)
        {
            var name=records[idx].Name.toLowerCase();
            name=name[0].toUpperCase() + name.substr(1);
            target.push(name);
        }
        return records;
    }
    this.lastNames=[];
    this.femaleNames=[];
    this.maleNames=[];
    this.loadFile(lastNamesFile,this.lastNames);
    this.loadFile(maleNamesFile,this.maleNames);
    this.loadFile(femaleNamesFile,this.femaleNames);
    
    this.generateName=function (seqn,gender)
    {
        var retVal={
            fname:""
            ,lname:""
        };
        var lastNameIdx= seqn % self.lastNames.length;
        retVal.lname=self.lastNames[lastNameIdx];
        var fnameArray;
        if(gender==="Male")
        {
            fnameArray=self.maleNames;
        }
        else
        {
            fnameArray=self.femaleNames;
        }
        
        var firstNameIdx = seqn % fnameArray.length;
        retVal.fname= fnameArray[firstNameIdx];
        return retVal;
    }
    return this;
    
}

var names= new namesData();

var NHANESconn= new NHANESData(dbConn,"_g")