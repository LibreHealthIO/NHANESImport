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

var csv=require('csv-parse/lib/sync');

function EHRConnection(serverData)
{
    this.server_name=serverData.server_name;
    this.userid=serverData.userid;
    this.password=serverData.password;
    this.pid=null;
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
    this.createPatientLoop = function(patient,next)
    {
        console.log("Creating:"+patient.lname);
            var month = patient.DOB.getMonth() + 1;
            var day = patient.DOB.getDate();
            var DOBString = patient.DOB.getFullYear() + "-"+month + "-"+ day;
            var patientData={
                                form_fname:patient.fname
                                ,form_mname: ""
                                ,form_lname:patient.lname
                                ,form_sex:patient.sex
                                ,form_DOB:DOBString
                                ,form_pubpid:'pubpid123'
                                ,form_ss: patient.seqn

            };
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
                            }
                            next();
                        }    
                );
    };

    this.selectPatient = function(seqn)
    {
        var patient_search_url=self.server_name+ "/interface/main/finder/patient_select.php?popup=1&ss="+seqn;
        var patient_select=self.server_name+"/interface/patient_file/summary/demographics.php?set_pid=";
        return new Promise(function (resolve,reject) {
            request({
                    url:patient_search_url,
                    jar: true,
                    method: "GET"
                },
                function(err,req,body)
                {
                    var $ = cheerio.load(body);
                    if(err)
                    {
                        reject(err);
                    }
                    var id=$(".oneresult");
                    if(id.length===0)
                    {
                        reject("Unable to find id for SEQN:"+seqn);
                    }
                    pid=id.attr("id");
                    self.pid=pid;
                    request({
                            url: patient_select+pid
                            ,jar: true
                            ,method: "GET"
                        }
                        ,
                        function(err,req,body)
                        {
                            if(err)
                            {
                                reject(err);
                            }
                            
                            resolve(self);
                        }
                    ); // End Select Request
                    
                    // Handle Search html
                }
            );// End Search Request

        }); // End Promise
    }
    
    this.createIssuesLoop = function(ProblemEntry,nxt)
    {
        var issue_url=self.server_name+"/interface/patient_file/summary/add_edit_issue.php?issue=0&thisenc=0&thispid="+self.pid;
        var form_data={
            form_type:0
            ,form_title:ProblemEntry.description
            ,form_diagnosis:"ICD10:"+ProblemEntry.code
            ,form_save:'Save'
        }
        console.log(self.pid+":"+ProblemEntry.description);
        request({
                url:issue_url
                ,jar: true
                ,method: "POST"
                ,formData: form_data
            },
            function(err,req,body)
            {
                if(err)
                {
                    console.log(err);
                }
                nxt();
            }
        ); // End request
    };
    this.addProblemListLoop = function(ProblemInfo,next)
    {
        
        if(ProblemInfo.problemList.length>0)
        {
            self.selectPatient(ProblemInfo.seqn).then(()=>{
                console.log(self.pid+":"+ProblemInfo.problemList.length+":"+JSON.stringify(ProblemInfo.problemList));
                asyncLoop(ProblemInfo.problemList,self.createIssuesLoop
                    ,function()
                    {
                        // don't go to the next patient/list until the current list is completed.
                        next();
                    });
                
            });
        }
        else
        {
            next();
        }

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
        this.DOB=dateBirth;
    }
    else
    {
        var fullYears = Math.floor(demo_row.ridagemn/12);
        var months = demo_row.ridagemn % 12;
        
    }
    var name=names.generateName(this.seqn, this.age ,this.sex);
    this.fname=name.fname;
    this.lname=name.lname;
    return this;
}
function problemEntry(code,description,NHANESQuestion)
{
    this.code=code;
    this.description=description;
    return this;
}

var problemMap={};
function addProblemMap(NHANESCode,ICDCode,Description,NHANESQuestion)
{
    problemMap[NHANESCode]=new problemEntry(ICDCode,Description,NHANESQuestion);
}
addProblemMap('mcq010',"J45.20","Mild intermittent asthma, uncomplicated","Ever been told you have asthma");
addProblemMap('mcq160a',"M19.90","Unspecified osteoarthritis, unspecified site","Doctor ever said you had arthritis");
addProblemMap('mcq160b',"I50.9 ","Heart failure, unspecified","Ever told had congestive heart failure");
addProblemMap('mcq160c',"I25.9 ","Chronic ischemic heart disease, unspecified","Ever told you had coronary heart disease");
addProblemMap('mcq160d',"I20.9 ","Angina pectoris, unspecified","Ever told you had angina/angina pectoris");
addProblemMap('mcq160e',"I25.2","Old myocardial infarction","Ever told you had heart attack");
addProblemMap('mcq160f',"I63.9","Cerebral infarction, unspecified","Ever told you had a stroke");
addProblemMap('mcq160g',"J43.9","Emphysema, unspecified","Ever told you had emphysema");
addProblemMap('mcq160k',"J42","Unspecified chronic bronchitis","Ever told you had chronic bronchitis");
addProblemMap('mcq160l',"K76.9","Liver disease, unspecified","Ever told you had any liver condition");
addProblemMap('mcq160m',"E07.9","Disorder of thyroid, unspecified","Ever told you had thyroid problem");
addProblemMap('mcq160n',"M10.9","Gout, unspecified","Doctor ever told you that you had gout?");

function MCQData(mcq_row)
{
    this.seqn=mcq_row.seqn;
    this.problemList=[];
    for(var question in problemMap)
    {
        if(mcq_row[question]===1)  // 1 is Yes, 2 is No
        {
            this.problemList.push(problemMap[question]);
        }
    }
    
    console.log(JSON.stringify(this));
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
            var limits = " LIMIT 100 ";
            limits = "";
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
    
    
    this.mcq_data=[];
    this.load_mcq_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var mcq_table = "mcq" + self.suffix;
            var limits = " LIMIT 500 ";
            var sqlSelectMCQ = " SELECT * FROM "+mcq_table + limits;
            self.dbConn.query(sqlSelectMCQ,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    self.mcq_data.push(new MCQData(rows[rowIdx]));
                }
                resolve(self);
            }); // end query callback
        }); //End New Promise
    } // End load_mcq_data method

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
    
    this.generateName=function (seqn,age,gender)
    {
        var retVal={
            fname:""
            ,lname:""
        };
        var lastNameIdx= (seqn + age) % self.lastNames.length;
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
        
        var firstNameIdx = (seqn - age) % fnameArray.length;
        retVal.fname= fnameArray[firstNameIdx];
        return retVal;
    };
    return this;
    
}

var names= new namesData();

var NHANESconn= new NHANESData(dbConn,"_g");

function createPatients()
{
    NHANESconn.load_demographics().then(()=>{
            console.log(JSON.stringify(NHANESconn.patient_list[0]));
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

loadMCQProblemData();
//createPatients();