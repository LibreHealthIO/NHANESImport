/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var path = require('path');
var fs = require('fs');
var asyncLoop = require('node-async-loop');
var csv=require('csv-parse/lib/sync');
var names = require('./NamesData.js');

var exports=module.exports ={};

function getRace(demo_row)
{
    var raceMap={};
    raceMap[1]="Mexican American";
    raceMap[2]="Other Hispanic";
    raceMap[3]="Non-Hispanic White";
    raceMap[4]="Non-Hispanic Black";
    raceMap[6]="Non-Hispanic Asian";
    raceMap[7]="Other Race - Including Multi-Racial";
    if(raceMap.hasOwnProperty(demo_row.ridreth3))
    {
        return raceMap[demo_row.ridreth3];
    }
}
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
    if(demo_row.indfmin2===1)
    {
        // Annual 0-4999
        this.monthly_income=300;
    }
    else if(demo_row.indfmin2===2)
    {
        // Annual 5000-10000
        this.monthly_income=800;
    }
    else if(demo_row.indfmin2===3)
    {
        // Annual 10000-14999
        this.monthly_income=1000;
    }
    else if(demo_row.indfmin2===4)
    {
        // Annual 15000-19999
        this.monthly_income=1600;
    }
    else if(demo_row.indfmin2===5)
    {
        // Annual 20000-24999
        this.monthly_income=2000;
    }
    else if(demo_row.indfmin2===6)
    {
        // Annual 250000-34999
        this.monthly_income=2500;
    }
    else if(demo_row.indfmin2===7)
    {
        // Annual 350000-44999
        this.monthly_income=3500;
    }
    else if(demo_row.indfmin2===8)
    {
        // Annual 450000-54999
        this.monthly_income=4500;
    }    
    else if(demo_row.indfmin2===9)
    {
        // Annual 550000-64999
        this.monthly_income=5400;
    }
    else if(demo_row.indfmin2===10)
    {
        // Annual 650000-74999
        this.monthly_income=6200;
    }        
    else if(demo_row.indfmin2===12)
    {
        // Annual 20000+
        this.monthly_income=1700;
    }        
    else if(demo_row.indfmin2===13)
    {
        // Annual <20000
        this.monthly_income=1500;
    }
    else if(demo_row.indfmin2===14)
    {
        // Annual 750000-99999
        this.monthly_income=8200;
    }        
    else if(demo_row.indfmin2===15)
    {
        // Annual 100000+
        this.monthly_income=9000;
    }
    else
    {
        this.monthly_income="";
    }
    this.race=getRace(demo_row);
    var name=names.generateName(this.seqn, this.age ,this.sex);
    this.fname=name.fname;
    this.lname=name.lname;
    return this;
}
function problemEntry(code,description,NHANESQuestion,ageInfo,stillHave)
{
    this.code=code;
    this.description=description;
    this.ageInfo=ageInfo;
    this.stillHave=stillHave;
    return this;
}

var problemMap={};
function addProblemMap(NHANESCode,ICDCode,Description,NHANESQuestion,ageInfo,stillHave=null)
{
    problemMap[NHANESCode]=new problemEntry(ICDCode,Description,NHANESQuestion,ageInfo,stillHave);
}
addProblemMap('mcq010',"J45.20","Mild intermittent asthma, uncomplicated","Ever been told you have asthma",'mcq025','mcq035');
addProblemMap('mcq160b',"I50.9 ","Heart failure, unspecified","Ever told had congestive heart failure",'mcq180b');
addProblemMap('mcq160c',"I25.9 ","Chronic ischemic heart disease, unspecified","Ever told you had coronary heart disease",'mcq180c');
addProblemMap('mcq160d',"I20.9 ","Angina pectoris, unspecified","Ever told you had angina/angina pectoris",'mcq180d');
addProblemMap('mcq160e',"I25.2","Old myocardial infarction","Ever told you had heart attack",'mcq180e');
addProblemMap('mcq160f',"I63.9","Cerebral infarction, unspecified","Ever told you had a stroke",'mcq180f');
addProblemMap('mcq160g',"J43.9","Emphysema, unspecified","Ever told you had emphysema",'mcq180g');
addProblemMap('mcq160k',"J42","Unspecified chronic bronchitis","Ever told you had chronic bronchitis",'mcq180k','mcq170k');
addProblemMap('mcq160l',"K76.9","Liver disease, unspecified","Ever told you had any liver condition",'mcq180l','mcq170l');
addProblemMap('mcq160m',"E07.9","Disorder of thyroid, unspecified","Ever told you had thyroid problem",'mcq180m','mcq170m');
addProblemMap('mcq160n',"M10.9","Gout, unspecified","Doctor ever told you that you had gout?",'mcq180n');




var cancerMap={};
function addCancerMap(NHANESCode,ICDCode,Description,NHANES,ageInfo)
{
    cancerMap[NHANESCode]=new problemEntry(ICDCode,Description,NHANES,ageInfo);
}
addCancerMap(10,"C67.9","Malignant neoplasm of bladder, unspecified","Bladder",'mcq240a');
addCancerMap(11,"C96.9","Other and unspecified malignant neoplasms of lymphoid, hematopoietic and related tissue","Blood",'mcq240b');
addCancerMap(12,"C41.9","Malignant neoplasm of bone and articular cartilage, unspecified","Bone",'mcq240c');
addCancerMap(13,"C71.9","Malignant neoplasm of brain, unspecified","Brain",'mcq240d');
addCancerMap(14,"C50.919","Malignant neoplasm of unspecified site of unspecified female breast","Breast",'mcq240e'); // Need to add check/fix for male
addCancerMap(15,"C53.9","Malignant neoplasm of cervix uteri, unspecified","Cervix (cervical)",'mcq240f');
addCancerMap(16,"C18.9","Malignant neoplasm of colon, unspecified","Colon",'mcq240g'); 
addCancerMap(17,"C15.9","Malignant neoplasm of esophagus, unspecified","Esophagus (esophageal)"),'mcq240h'; 
addCancerMap(18,"C23","Malignant neoplasm of gallbladder","Gallbladder",'mcq240i'); 
addCancerMap(19,"C64.9","Malignant neoplasm of unspecified kidney, except renal pelvis","Kidney",'mcq240j'); 
addCancerMap(20,"C32.9","Malignant neoplasm of larynx, unspecified","Larynx/ windpipe",'mcq240k'); 
addCancerMap(21,"C95.90","Leukemia, unspecified not having achieved remission","Leukemia",'mcq240l'); 
addCancerMap(22,"C22.9","Malignant neoplasm of liver, not specified as primary or secondary","Liver",'mcq240m'); 
addCancerMap(23,"C34.90","Malignant neoplasm of unspecified part of unspecified bronchus or lung","Lung",'mcq240n'); 
addCancerMap(24,"C96.9","Malignant neoplasm of lymphoid, hematopoietic and related tissue, unspecified","Lymphoma/ Hodgkins disease",'mcq240o'); 
addCancerMap(25,"C43.9","Malignant melanoma of skin, unspecified","Melanoma",'mcq240p'); 
addCancerMap(26,"C06.9","Malignant neoplasm of mouth, unspecified","Mouth/tongue/lip",'mcq240q'); 
addCancerMap(27,"C72.9","Malignant neoplasm of central nervous system, unspecified","Nervous system",'mcq240r'); 
addCancerMap(28,"C56.9","Malignant neoplasm of unspecified ovary","Ovary (ovarian)",'mcq240s'); 
addCancerMap(29,"C25.9","Malignant neoplasm of pancreas, unspecified","Pancreas (pancreatic)",'mcq240t'); 
addCancerMap(30,"C61","Malignant neoplasm of prostate","Prostate",'mcq240u'); 
addCancerMap(31,"C20","Malignant neoplasm of rectum","Rectum (rectal)",'mcq240v'); 
addCancerMap(32,"C44.99","Other specified malignant neoplasm of skin, unspecified","Skin (non-melanoma)",'mcq240w'); 
addCancerMap(33,"C44.90","Unspecified malignant neoplasm of skin, unspecified","Skin (don't know what kind)",'mcq240x'); 
addCancerMap(34,"C49.9","Malignant neoplasm of connective and soft tissue, unspecified","Soft tissue (muscle or fat)",'mcq240y'); 
addCancerMap(35,"C16.9","Malignant neoplasm of stomach, unspecified","Stomach",'mcq240z'); 
addCancerMap(36,"C62.90","Malignant neoplasm of unspecified testis, unspecified whether descended or undescended","Testis (testicular)",'mcq240aa'); 
addCancerMap(37,"C73","Malignant neoplasm of thyroid gland","Thyroid",'mcq240bb'); 
addCancerMap(38,"C55","Malignant neoplasm of uterus, part unspecified","Uterus (uterine)",'mcq240cc'); 
addCancerMap(39,"C76.8","Malignant neoplasm of other specified ill-defined sites","Other",'mcq240dd'); 
addCancerMap(99,"C80.1","Malignant (primary) neoplasm, unspecified","Don't know",'mcq240dk');


function problemInfo(code,desc)
{
    this.code=code;
    this.description=desc;
    this.ageOfDiagnosis=null;
    this.active=true;
    return this;
}


function mcqCancerLookup(problemList,mcqData,mcqField)
{
    var cancerType=mcqData[mcqField];
    if(((cancerType>=10) && (cancerType<=39)) || (cancerType===99))
    {
        var mapEntry=cancerMap[cancerType];
        var problemData=new problemInfo(mapEntry.code,mapEntry.description)
        var ageData=mcqData[mapEntry.ageInfo];
        if(typeof(ageData)!== "undefined")
        {
            if((ageData>=0) && (ageData<=80))
            {
                problemData.ageOfDiagnosis=ageData;
            }
        }        
        problemList.push(problemData);
    }
}

var arthritisMap={};
function addArthritisMap(NHANESCode,ICDCode,Description,NHANES)
{
    arthritisMap[NHANESCode]=new problemEntry(ICDCode,Description,NHANES,"mcq180a");
}
addArthritisMap(1,"M19.90","Unspecified osteoarthritis, unspecified site","Osteoarthritis or degenerative arthritis");
addArthritisMap(2,"M05.9","Rheumatoid arthritis with rheumatoid factor, unspecified","Rheumatoid arthritis");
addArthritisMap(3,"L40.50","Arthropathic psoriasis, unspecified","Psoriatic arthritis");
addArthritisMap(4,"M13.88","Other specified arthritis, other site","Other");
addArthritisMap(9,"M13.10","Monoarthritis, not elsewhere classified, unspecified site","Don't know");
function mcqArthritisLookup(problemList,mcqData)
{
    if(mcqData['mcq160a']!==1)
    {
        return;
    }
    var arthritisType=arthritisMap[mcqData['mcq195']];
    
    var problemEntry=new problemInfo(arthritisType.code,arthritisType.description);
    var ageData=mcqData['mcq180a'];
    if(typeof(ageData)!== "undefined")
    {
        if((ageData>=0) && (ageData<=80))
        {
            problemEntry.ageOfDiagnosis=ageData;
        }
    }
    problemList.push(problemEntry);
}
function MCQData(mcq_row)
{
    this.seqn=mcq_row.seqn;
    this.problemList=[];
    for(var question in problemMap)
    {
        var mapEntry=problemMap[question];
        if(mcq_row[question]===1)  // 1 is Yes, 2 is No
        {
         
            
            var problemData={
                code: mapEntry.code
                ,description:mapEntry.description
                ,ageOfDiagnosis: null
                ,active: true
            };
            var ageData=mcq_row[mapEntry.ageInfo];
            if(typeof(ageData)!== "undefined")
            {
                if((ageData>=0) && (ageData<=80))
                {
                    problemData.ageOfDiagnosis=ageData;
                }
            }
            if(mapEntry.stillHave!==null)
            {
                if(mcq_row[mapEntry.stillHave]===2)
                {
                    problemData.active=false;
                }
            }
            this.problemList.push(problemData);
        }
    }
    mcqCancerLookup(this.problemList,mcq_row,'mcq230a');
    mcqCancerLookup(this.problemList,mcq_row,'mcq230b');
    mcqCancerLookup(this.problemList,mcq_row,'mcq230c');
    mcqArthritisLookup(this.problemList,mcq_row);
    
    
    
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

    function insuranceRowToName(data)
    {
        if(data["hiq031a"]===14)
        {
            return "Private Insurance";
        }
        if(data["hiq031b"]===15)
        {
            return "Medicare";
        }
        if(data["hiq031c"]===16)
        {
            return "Medi-Gap";
        }
        if(data["hiq031d"]===17)
        {
            return "Medicaid";
        }
        if(data["hiq031e"]===18)
        {
            return "SCHIP";
        }
        if(data["hiq031f"]===19)
        {
            return "Military Health Care";
        }
        if(data["hiq031g"]===20)
        {
            return "Indian Health Service";
        }
        if(data["hiq031h"]===21)
        {
            return "State-Sponsored Health Plan";
        }
        if(data["hiq031i"]===22)
        {
            return "Other Government Insurance";
        }        
        if(data["hiq031j"]===23)
        {
            return "Single Service Plan";
        }        
        if(data["hiq031j"]===40)
        {
            return "Unassigned";
        }        
    }

function insurance_data(row)
{
    this.seqn=row.seqn;
    this.insurance_type=insuranceRowToName(row);
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
            var limits = " LIMIT 50 ";
//            limits = "";
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

    function bp_reading(idx,row)
    {
        this.systolic=row['bpxsy'+idx];
        this.diastolic=row['bpxdi'+idx];
        return this;
    }

    function bpmx_data(seqn)
    {
        this.seqn = seqn;
        this.hr=null;
        this.bp_values=[];
        this.irregular=null;
        
        this.height=null;
        this.weight=null;
        this.bmi=null;
        this.waist=null;
        var self=this;
        
        this.set_bp_data = function(bprow)
        {
            self.hr=bprow['bpxpls'];
            self.irregular=(bprow['bpxpuls']===2);
            for(var idx=1;idx<=4;idx++)
            {
                var bpr=new bp_reading(idx,bprow);
                if(!(bpr.systolic===null))
                {
                    self.bp_values.push(bpr);                    
                }
            }
        };
        this.set_bm_data = function(bmrow)
        {
            self.weight=bmrow['bmxwt'];
            self.height=bmrow['bmxht'];
            self.bmi=bmrow['bmxbmi'];
            self.waist=bmrow['bmxwaist'];
        };
        return this;
    }
    this.bpx_data=[];
    this.load_bpx_data = function()
    {

        
        return new Promise(function(resolve,reject)
        {
            var entriesMap={};
            var tableBPX= "bpx" + self.suffix;            
            var tableBMX= "bmx" + self.suffix;
            var limit = " LIMIT 2 ";
            limit = "";
            var sqlBPSelect = " SELECT * FROM " + tableBPX + limit;
            var sqlBMSelect = " SELECT * FROM " + tableBMX + limit;
            self.dbConn.query(sqlBPSelect,[],function(err,BPXrows)
            {
                if(err)
                {
                    console.log(err);
                    reject(err);
                }
                self.dbConn.query(sqlBMSelect,[],function(err,BMXrows)
                {
                    if(err)
                    {
                        console.log(err);
                        reject(err);                        
                    }
                    for(var rowIdx=0;rowIdx<BPXrows.length;rowIdx++)
                    {
                        var curRow=BPXrows[rowIdx]
                        var entry=new bpmx_data(curRow.seqn);
                        entriesMap[curRow.seqn]=entry;
                        self.bpx_data.push(entry);
                        entry.set_bp_data(curRow);
                    }

                    for(rowIdx=0;rowIdx<BMXrows.length;rowIdx++)
                    {
                        var curRow=BMXrows[rowIdx];
                        
                        var entry;
                        if(curRow.seqn in entriesMap)
                        {
                            entry=entriesMap[curRow.seqn];
                        }
                        else
                        {
                            entry=new bpmx_data(curRow.seqn);
                            entriesMap[curRow.seqn]=entry;
                            self.bpx_data.push(entry);
                        }
                        entry.set_bm_data(curRow);
                    }
                    resolve(self);
                    
                    
                }); //END BM Query
            }); // END BP Query
        }); // End New Promise
    }


    function objLabData(seqn)
    {
        this.seqn=seqn;
        var self=this;
        this.AddProperties=function(row)
        {
            for(var prop in row)
            {
                if((prop!=="seqn") && (prop!=="id"))
                {
                    self[prop]=row[prop];
                }
            }
        }
        return this;
    }
    this.lab_data=[];
    this.load_lab_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            var entriesMap={};
            var tables=[];
            tables.push({table_name:"alb_cr"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"thyrod"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"trigly"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"tchol"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"hdl"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"biopro"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"cbc"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"glu"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"ghb"+self.suffix,processFunction:"AddProperties"});
            tables.push({table_name:"mgx"+self.suffix,processFunction:"AddProperties"});

            var load_table_data=function(tableInfo,next)
            {
                var selectSQL="SELECT * FROM "+tableInfo.table_name;
//                selectSQL += " LIMIT 1 "
                self.dbConn.query(selectSQL,[],function(err,rows)
                {
                    for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                    {
                        var curRow=rows[rowIdx]
                        
                        var entry;
                        if(curRow.seqn in entriesMap)
                        {
                            entry=entriesMap[curRow.seqn];
                        }
                        else
                        {
                            entry=new objLabData(curRow.seqn);
                            entriesMap[curRow.seqn]=entry;
                            self.lab_data.push(entry);
                        }
                        entry[tableInfo.processFunction](curRow);
                    }
                    next();
                });
            }; // End load_table_data
            asyncLoop(tables,load_table_data,function()
            {
                
                resolve(self);            
            });
        
        }); // End New Promise
    }

    this.insurance_data=[];
    this.load_insurance_data = function()
    {
        return new Promise(function(resolve,reject)
            {
                var selectSQL = " SELECT * FROM "+ "hiq"+self.suffix
                self.dbConn.query(selectSQL,[],function(err,rows)
                {
                    if(err)
                    {
                        reject(err);
                        return;
                    }
                    for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                    {
                        var curRow=rows[rowIdx];
                        self.insurance_data.push(new insurance_data(curRow));
                    }
                    resolve(self);
                });
            }
        );
    }
    
    this.socialObj = function (seqn)
    {
        this.seqn=seqn;
        return this;
    }
    
    this.load_social_table=function(table,setEntries)
    {
        return new Promise(function(resolve,reject)
        {
                var selectSQL = " SELECT * FROM "+ table+self.suffix
                self.dbConn.query(selectSQL,[],function(err,rows)
                {
                    if(err)
                    {
                        reject(err);
                        return;
                    }
                    for(var rowIdx=0;rowIdx<rows.length;rowIdx++)
                    {
                        var curRow=rows[rowIdx];
                        var curObj=null;
                        if(self.social_map.hasOwnProperty(curRow.seqn))
                        {
                            console.log("found existing?");
                            curObj=self.social_map[curRow.seqn];
                        }
                        else
                        {
                            console.log("Creating new");
                            curObj=new self.socialObj(curRow.seqn);
                            self.social_map[curRow.seqn]=curObj;
                            self.social_data.push(curObj);
                        }
                        setEntries(curObj,curRow);
                    }
                    resolve(self);
                });
        });// End New Promise
        
    }


    function smokingSocial(obj,row)
    {
        
        if(row.smq020===2)
        {
            obj.smoking="Never smoker";
        }
        else if(row.smq020===1)
        {
            if(row.smq040===1)
            {
                obj.smoking="Current every day smoker";
            } 
            else if(row.smq040===2)
            {
                obj.smoking="Current some day smoker";
            }
            else if(row.smq040===3)
            {
                obj.smoking="Former smoker";
            }
            else
            {
                obj.smoking="Smoker,current status unknown";
            }
        }
        else
        {
            obj.smoking="Unknown if ever smoked";
        }
    }
    function drugUseSocial(obj,row)
    {
        obj.recreational_drugs=[];
        if(row.duq200===1)
        {
            obj.recreational_drugs.push("marijuana");
        }
        if(row.duq240===1)
        {
            if(row.duq250===1)
            {
                obj.recreational_drugs.push("cocaine");
            }
            if(row.duq290===1)
            {
                obj.recreational_drugs.push("heroin");
            }
            if(row.duq330===1)
            {
                obj.recreational_drugs.push("methamphetamine");
            }
        }
        
    }
    function physicalActivitySocial(obj,row)
    {
        if((row.paq706!==null) &&(row.paq706>=0) &&(row.paq706<=7))
        {
            obj.daysActive=row.paq706;
        }
        if((row.paq610>=1) && (row.paq610<=7))
        {
            obj.daysVigorousActiveWork=row.paq610;
        }
        if((row.paq625!==null) &&(row.paq625>=1) && (row.paq625<=7))
        {
            obj.daysModerateActiveWork=row.paq625;
        }
        if((row.pad680!==null) && (row.pad680>=0) && (row.pad680<1440))
        {
            obj.minutesSedentary=row.pad680;
        }
    }
    function alcoholSocial(obj,row)
    {
        if(row.alq101===2)
        {
            if(row.alq110===2)
            {
                obj.alcohol="Never";
                return;
            }
            obj.alcohol="Rarely";
        }
        if(row.alq120q!==null)
        {
            if((row.alq120q!==777) && row.alq120q!==999)
            {
                obj.alcohol= row.alq120q +" days";
                if(row.alq120u===1)
                {
                    obj.alcohol+= "/week";
                }
                else if(row.alq120u===2)
                {
                    obj.alcohol+= "/month";
                }
                else if(row.alq120u===3)
                {
                    obj.alcohol+= "/year";
                }

            }
        }
        if(row.alq130!==null)
        {
            if((row.alq130!==777) && (row.alq130!==999))
            {
                obj.alcoholPerDay=row.alq130;
            }
        }
    }
    this.load_social_data = function()
    {
        return new Promise(function(resolve,reject)
        {
            self.social_data=[];
            self.social_map={};
            self.load_social_table("smq",smokingSocial)
                    .then(()=>{return self.load_social_table("duq",drugUseSocial);})
                    .then(()=>{return self.load_social_table("paq",physicalActivitySocial);})
                    .then(()=>{return self.load_social_table("alq",alcoholSocial);})
                    .then(()=>{resolve(self);});
            
        });// End New Promise
    };
    
    this.load_lab_table = function(lab_table_info)
    {
        return new Promise(function(resolve,reject)
        {
            
        });
    }
    return this;

};


