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

var cancerMap={};
function addCancerMap(NHANESCode,ICDCode,Description,NHANES)
{
    cancerMap[NHANESCode]=new problemEntry(ICDCode,Description,NHANES);
}
addCancerMap(10,"C67.9","Malignant neoplasm of bladder, unspecified","Bladder");
addCancerMap(11,"C96.9","Other and unspecified malignant neoplasms of lymphoid, hematopoietic and related tissue","Blood");
addCancerMap(12,"C41.9","Malignant neoplasm of bone and articular cartilage, unspecified","Bone");
addCancerMap(13,"C71.9","Malignant neoplasm of brain, unspecified","Brain");
addCancerMap(14,"C50.919","Malignant neoplasm of unspecified site of unspecified female breast","Breast"); // Need to add check/fix for male
addCancerMap(15,"C53.9","Malignant neoplasm of cervix uteri, unspecified","Cervix (cervical)");
addCancerMap(16,"C18.9","Malignant neoplasm of colon, unspecified","Colon"); 
addCancerMap(17,"C15.9","Malignant neoplasm of esophagus, unspecified","Esophagus (esophageal)"); 
addCancerMap(18,"C23","Malignant neoplasm of gallbladder","Gallbladder"); 
addCancerMap(19,"C64.9","Malignant neoplasm of unspecified kidney, except renal pelvis","Kidney"); 
addCancerMap(20,"C32.9","Malignant neoplasm of larynx, unspecified","Larynx/ windpipe"); 
addCancerMap(21,"C95.90","Leukemia, unspecified not having achieved remission","Leukemia"); 
addCancerMap(22,"C22.9","Malignant neoplasm of liver, not specified as primary or secondary","Liver"); 
addCancerMap(23,"C34.90","Malignant neoplasm of unspecified part of unspecified bronchus or lung","Lung"); 
addCancerMap(24,"C96.9","Malignant neoplasm of lymphoid, hematopoietic and related tissue, unspecified","Lymphoma/ Hodgkins disease"); 
addCancerMap(25,"C43.9","Malignant melanoma of skin, unspecified","Melanoma"); 
addCancerMap(26,"C06.9","Malignant neoplasm of mouth, unspecified","Mouth/tongue/lip"); 
addCancerMap(27,"C72.9","Malignant neoplasm of central nervous system, unspecified","Nervous system"); 
addCancerMap(28,"C56.9","Malignant neoplasm of unspecified ovary","Ovary (ovarian)"); 
addCancerMap(29,"C25.9","Malignant neoplasm of pancreas, unspecified","Pancreas (pancreatic)"); 
addCancerMap(30,"C61","Malignant neoplasm of prostate","Prostate"); 
addCancerMap(31,"C20","Malignant neoplasm of rectum","Rectum (rectal)"); 
addCancerMap(32,"C44.99","Other specified malignant neoplasm of skin, unspecified","Skin (non-melanoma)"); 
addCancerMap(33,"C44.90","Unspecified malignant neoplasm of skin, unspecified","Skin (don't know what kind)"); 
addCancerMap(34,"C49.9","Malignant neoplasm of connective and soft tissue, unspecified","Soft tissue (muscle or fat)"); 
addCancerMap(35,"C16.9","Malignant neoplasm of stomach, unspecified","Stomach"); 
addCancerMap(36,"C62.90","Malignant neoplasm of unspecified testis, unspecified whether descended or undescended","Testis (testicular)"); 
addCancerMap(37,"C73","Malignant neoplasm of thyroid gland","Thyroid"); 
addCancerMap(38,"C55","Malignant neoplasm of uterus, part unspecified","Uterus (uterine)"); 
addCancerMap(39,"C76.8","Malignant neoplasm of other specified ill-defined sites","Other"); 
addCancerMap(99,"C80.1","Malignant (primary) neoplasm, unspecified","Don't know");

function mcqCancerLookup(problemList,mcqData)
{
    if(((mcqData>=10) && (mcqData<=39)) || (mcqData===99))
    {
        problemList.push(cancerMap[mcqData]);
    }
}
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
    mcqCancerLookup(this.problemList,mcq_row['mcq230a']);
    mcqCancerLookup(this.problemList,mcq_row['mcq230b']);
    mcqCancerLookup(this.problemList,mcq_row['mcq230c']);

    
    
    
    return this;
    
}


var HTNDiagnosis=new problemEntry("I10","Essential (primary) hypertension","Told had high blood pressure - 2+ times or Being Precribed");
var BorderlineHTNDiagnosis=new problemEntry("R03.0","Elevated blood-pressure reading, without diagnosis of hypertension","Borderline Hypertension");
var HighCholDiagnosis=new problemEntry("E78.00","Pure hypercholesterolemia, unspecified","Doctor told you - high cholesterol level");
function BPQData(bpq_row)
{
    this.seqn=bpq_row.seqn;
    this.problemList=[];
    if((bpq_row['bpq030']===1) || (bpq_row['bpq040a']===1)|| (bpq_row['bpq050a']===1))
    {
        // If answer to 2+ times told or taking prescribed med for HBP, then considering diagnosis to be positive for HTN
        this.problemList.push(HTNDiagnosis);
    }
    else if (bpq_row['bpq057']===1)
    {
        // In other cases, if no clear indication of true HTN, then if answer to borderline question is yes, then assign just borderline
        this.problemList.push(BorderlineHTNDiagnosis);
    } // If 'bpq020(Ever told you had high blood pressure)' is yes, and no other factors are 'yes' then no diagnosis added
    
    if(bpq_row['bpq080']===1)
    {
        this.problemList.push(HighCholDiagnosis);
    }
    return this;
}

var DiabetesDiagnosis=new problemEntry("E11.9","Type 2 diabetes mellitus without complications","Doctor told you have diabetes");
var DiabetesRetinopathyDiagnosis=new problemEntry("E11.319","Type 2 diabetes mellitus with unspecified diabetic retinopathy without macular edema","Diabetes affected eyes/had retinopathy");
function DIQdata(row)
{
    this.seqn=row.seqn;
    this.problemList=[];
    if(row['diq010']===1)
    {
        if(row['diq080']!==1)
        {
            this.problemList.push(DiabetesDiagnosis)        
        }
        else
        {
            this.problemList.push(DiabetesRetinopathyDiagnosis);
        }
    }
    return this;
}

CKDDiagnosis=new problemEntry("N18.9","Chronic kidney disease, unspecified","Ever told you had weak/failing kidneys")
DialysisDiagnosis=new problemEntry("Z99.2","Dependence on renal dialysis","Received dialysis in past 12 months")
function KIQ_Udata(row)
{
    this.seqn=row.seqn;
    this.problemList=[];
    if(row['kiq022']===1)
    {
        this.problemList.push(CKDDiagnosis);
    }
    if(row['kiq025']===1)
    {
        this.problemList.push(DialysisDiagnosis);
    }
    
    return this;
}

function drugData(row)
{
    this.drugName=row['rxddrug'];
    this.drugCode=row['rxdrugid'];
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
            limits = "";
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
    }; // End load_mcq_data method

    this.bpq_data=[];
    this.load_bpq_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var bpq_table = "bpq" + self.suffix;
            var limits = "";
            var sqlSelect = " SELECT * FROM "+bpq_table + limits;
            self.dbConn.query(sqlSelect,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    self.bpq_data.push(new BPQData(rows[rowIdx]));
                }
                resolve(self);
            }); // end query callback
        }); //End New Promise
    }; // End load_bpq_data method

    this.diq_data=[];
    this.load_diq_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var diq_table = "diq" + self.suffix;
            var limits = " LIMIT 100 ";
            limits="";
            var sqlSelect = " SELECT * FROM "+diq_table + limits;
            self.dbConn.query(sqlSelect,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    self.diq_data.push(new DIQdata(rows[rowIdx]));
                }
                resolve(self);
            }); // end query callback
        }); //End New Promise
    }; // End load_diq_data method

    this.kiq_u_data=[];
    this.load_kiq_u_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var table = "kiq_u" + self.suffix;
            var limits = " LIMIT 100 ";
            limits="";
            var sqlSelect = " SELECT * FROM "+table + limits;
            self.dbConn.query(sqlSelect,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    self.kiq_u_data.push(new KIQ_Udata(rows[rowIdx]));
                }
                resolve(self);
            }); // end query callback
        }); //End New Promise
    }; // End load_kiq_u_data method

    this.rxq_rx_data=[];
    this.load_rxq_rx_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var table = "rxq_rx" + self.suffix;
            var where = " WHERE rxduse=1 "
            var order = " ORDER BY seqn asc "
            var sqlSelect = " SELECT * FROM "+table + where + order;
            self.dbConn.query(sqlSelect,[],function(err,rows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                var lastSEQN=-1;
                var curPatientData={}
                for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                {
                    if(rows[rowIdx].seqn!==lastSEQN)
                    {
                        lastSEQN=rows[rowIdx].seqn;
                        curPatientData={};
                        curPatientData.seqn=lastSEQN;
                        curPatientData.drugList=[];
                        self.rxq_rx_data.push(curPatientData)
                    }
                    curPatientData.drugList.push(new drugData(rows[rowIdx]));

                }
                resolve(self);
            }); // end query callback

        }); // End New Promise
    }; // End load_rxq_rx_data;

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
