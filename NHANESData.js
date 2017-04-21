/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var path = require('path');
var fs = require('fs');
var asyncLoop = require('node-async-loop');
var csv=require('csv-parse/lib/sync');

var exports=module.exports ={};

function PatientData(demo_row)
{
    this.seqn=demo_row.seqn;
    
    if(demo_row.ridageyr===0)
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
    if(demo_row.dmdmartl===1)
    {
        this.marital_status="married";
    }
    else if(demo_row.dmdmartl===2)
    {
        this.marital_status="widowed";
    }
    else if(demo_row.dmdmartl===3)
    {
        this.marital_status="divorced";
    }
    else if(demo_row.dmdmartl===4)
    {
        this.marital_status="separated";
    }
    else if(demo_row.dmdmartl===5)
    {
        this.marital_status="single";
    }
    else
    {
        this.marital_status="";
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

exports.NHANESData=function(dbServer,suffix)
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
