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

var exports=module.exports ={};

exports.EHRConnection =  function(serverData)
{
    this.server_name=serverData.server_name;
    this.userid=serverData.userid;
    this.password=serverData.password;
    this.pid=null;
    this.encounter_info=[];
    this.dob=null;
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
                                ,form_status: patient.marital_status

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
                            self.encounter_info=[];
                            var setMyPatientPos=body.indexOf("function setMyPatient()");
                            var endMyPatientPos=body.indexOf("parent.left_nav.setPatientEncounter(",setMyPatientPos)
                            var patientInfo=body.substring(setMyPatientPos,endMyPatientPos);
                            var EncounterInfoPos=patientInfo.indexOf("var EncounterDateArray");
                            var EncounterInfoString=patientInfo.substring(EncounterInfoPos);
                            const DOB_Begin=" DOB: ";
                            const DOB_End=" Age:"
                            var DOBStartPos=patientInfo.indexOf(DOB_Begin);
                            var DOBFinishPos=patientInfo.indexOf(DOB_End);
                            var DOB_String=patientInfo.substring(DOBStartPos+DOB_Begin.length,DOBFinishPos);
                            self.DOB=DOB_String;
                            self.DOBParts=DOB_String.split("-");
                            eval(EncounterInfoString);
                            for(var idx=0;idx<EncounterDateArray.length;idx++)
                            {
                                var encounterInfo={};
                                encounterInfo.date=EncounterDateArray[idx];
                                encounterInfo.id=EncounterIdArray[idx]
                                encounterInfo.category=CalendarCategoryArray[idx];
                                self.encounter_info.push(encounterInfo);
                                
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
    
    
    this.createMedicationsLoop = function(medication,nxt)
    {
        var issue_url=self.server_name+"/interface/patient_file/summary/add_edit_issue.php?issue=0&thisenc=0&thispid="+self.pid;
        var form_data={
            form_type:2
            ,form_title:medication.drugName
            ,form_save:'Save'
        }
        console.log(self.pid+":"+medication.drugName);
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
    this.addMedicationsListLoop = function(MedicationInfo,next)
    {
        self.selectPatient(MedicationInfo.seqn).then(()=>{
                asyncLoop(MedicationInfo.drugList,self.createMedicationsLoop
                    ,function()
                    {
                        // don't go to the next patient/list until the current list is completed.
                        next();
                    });
                
            }).catch((err)=>{console.log(err); next();});
        
    };
    
    
    this.selectOrCreateEncounter = function()
    {
        return new Promise(function (resolve,reject) {
            var encounterSetURL=self.server_name+"/interface/patient_file/encounter/encounter_top.php?set_encounter=";
            if(self.encounter_info.length>0)
            {
                self.encDate=self.encounter_info[0].date;
                request({
                    url:encounterSetURL+self.encounter_info[0].id
                    ,jar: true
                    ,method: "GET"
                },
                function(err,req,body)
                {
                    resolve(self);
                });
            }
            else
            {
                // Need to create the Encounter
                var encounterNewURL=self.server_name+"/interface/forms/patient_encounter/save.php";
                var encDate="2016-12-31";
                self.encDate=encDate;
                request({
                    url:encounterNewURL
                    ,jar: true
                    ,method: "POST"
                    ,formData: {
                        mode: "new"
                        ,pc_catid: "9"
                        ,form_sensitivity: "normal"
                        ,form_referral_source:""
                        ,form_date: encDate
                        ,reason: "NHANES data"
                        ,form_onset_date: ""
                    }
                },
                function(err,req,body)
                {
                    resolve(self);
                });
                
            }
      
        });
    };
    
    this.createVitalsBP=function(measurementData,next)
    {
        var formData={Submit:"Save+Form"
                      ,activity:"1"
                      ,id:""
                      ,pid:self.pid
                      ,process:"true"};
        var vitalsSaveURL=self.server_name+"/interface/forms/vitals/save.php";
        if(self.itemCounter===0)
        {
            formData.weight=self.currentBPMData.weight*2.2; // NHANES data is metric, EHR data is English
            formData.height=self.currentBPMData.height/2.54;
            formData.pulse=self.currentBPMData.hr;
            formData.BMI=self.currentBPMData.bmi;
            formData.waist_circ=self.currentBPMData.waist/2.54;
            
        }
        formData.bps=measurementData.systolic;
        formData.bpd=measurementData.diastolic;
        
        formData.date=self.encDate+" "+"0"+(self.itemCounter)+":00"
        for(prop in formData)
        {
            if(formData[prop]===null)
            {
                formData[prop]="";
            }
        }
        request({
            url:vitalsSaveURL
            ,jar: true
            ,method: "POST"
            ,formData: formData
            }
            ,
            function(err,req,body)
            {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                }
                console.log("Vitals Post");
                self.itemCounter++;
                next();
                
            }
        );
    };
    
    this.addBPDataListLoop = function(BPInfo,next)
    {
        self.selectPatient(BPInfo.seqn).then(()=>{

            self.currentBPMData=BPInfo;
            self.itemCounter=0;
            self.selectOrCreateEncounter().then(()=>{
                console.log(BPInfo.seqn);
                if(BPInfo.bp_values.length===0)
                {
                    console.log("No BP Data");
                    console.log(JSON.stringify(self.currentBPMData));
                    BPInfo.bp_values.push({systolic:"",diastolic:""});
                }
                asyncLoop(BPInfo.bp_values,self.createVitalsBP,()=>{next();});
            });
            
        }).catch((err)=>{console.log(err); next();});
    };
    return this;
};
