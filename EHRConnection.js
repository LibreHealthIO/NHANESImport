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

var labDataMap={};
function addLabDataMapEntry(description,NHANESVariable,units,range)
{
    var entry={
        units:units
        ,ranges: range
        ,variable:NHANESVariable
    };
    labDataMap[description]=entry;
}
function rangeData(low,high)
{
    this.low=low;
    this.high=high;
    return this;
}
addLabDataMapEntry("TSH","lbxtsh1","uIU/ml",{normal:new rangeData(0.5,5)});
addLabDataMapEntry("Creatinine","lbxscr","mg/dL",{normal:new rangeData(0.8,1.3)});
addLabDataMapEntry("BUN","lbxsbu","mg/dL",{normal:new rangeData(8,21)});
addLabDataMapEntry("Urine Albumin/Creatinine Ratio","urdact","mg/g",{male: new rangeData(0,17),female:new rangeData(0,25), microalbuminuria: new rangeData(30,300), macroalbuminuria: new rangeData(300,9999999)});
addLabDataMapEntry("HDL","lbdhdd","mg/dL",{normal:new rangeData(40,80)});
addLabDataMapEntry("LDL","lbdldl","mg/dL",{normal:new rangeData(85,125)});
addLabDataMapEntry("Trigylcerides","lbxtr","mg/dL",{normal:new rangeData(50,150)});
addLabDataMapEntry("Total Cholesterol","lbxtc","mg/dL",{normal:new rangeData(0,200)});
addLabDataMapEntry("WBC","lbxwbcsi","1000 cells/uL",{normal:new rangeData(4,10)});
addLabDataMapEntry("Hemoglobin","lbxhgb","g/dL",{male: new rangeData(13,17),female:new rangeData(12,15)});
addLabDataMapEntry("Hematocrit","lbxhct","%",{male: new rangeData(40,52),female:new rangeData(36,47)});
addLabDataMapEntry("Platelet Count","lbxpltsi","1000 cells/uL",{normal:new rangeData(150,400)});
addLabDataMapEntry("Glycohemoglobin","lbxgh","%",{normal:new rangeData(0,6.5)});
addLabDataMapEntry("Fasting Blood Glucose","lbxglu","mg/dL",{normal:new rangeData(65,110)});
addLabDataMapEntry("Fasting Blood Insulin","lbxin","uU/mL",{normal:new rangeData(0,25)});
addLabDataMapEntry("Combined Grip Strength","mgdcgsz","kg",{none:new rangeData(0,0)});


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
                        console.log("EHR Login completed");
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
                        reject(patient_search_url+"\n"+"Unable to find id for SEQN:"+seqn);
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
                            const Gender_Begin="var patientGender='";
                            var DOBStartPos=patientInfo.indexOf(DOB_Begin);
                            var DOBFinishPos=patientInfo.indexOf(DOB_End);
                            var DOB_String=patientInfo.substring(DOBStartPos+DOB_Begin.length,DOBFinishPos);
                            var GenderStartPos=patientInfo.indexOf(Gender_Begin);
                            var GenderEndPos=patientInfo.indexOf("';",GenderStartPos);
                            var GenderString=patientInfo.substring(GenderStartPos+Gender_Begin.length,GenderEndPos);
                            self.Gender=GenderString;
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
    
    this.createLabOrder = function()
    {
        return new Promise(function (resolve,reject)
        {
            var createLabOrderURL=self.server_name+"/interface/patient_file/encounter/load_form.php?formname=procedure_order";
            var form_data=
                {
                    form_provider_id:"1"
                    ,form_lab_id:"1"
                    ,form_date_ordered: "2016-12-31"
                    ,form_date_collected:" 2016-12-31+00:00"
                    ,form_order_priority:""
                    ,form_order_status:""
                    ,form_clinical_hx:""
                    ,form_patient_instructions:""
                    ,"form_proc_order_title[0]":"Procedure"
                    ,"form_proc_type_desc[0]":"NHANES Lab Panel"
                    ,"form_proc_type[0]":"1"
                    ,"form_proc_type_diag[0]":""
                    ,procedure_type_names:"procedure"
                    ,bn_save:"Save"
                }
            request({
                        url:createLabOrderURL
                        ,jar: true
                        ,method: "POST"
                        ,formData: form_data
                    },
                    function(err,req,body)
                    {
                        if(err)
                        {
                            console.log(err);
                            reject(err);
                        }
                        else
                        {
                            console.log("Created Procedure");
                            resolve(self);
                        }

                    }
                    );
            
        });
    };
    

    this.populateLabOrder = function(LabData)
    {
        return new Promise(function (resolve,reject)
        {
            var url=self.server_name+"/interface/orders/orders_results.php?review=1"
            request({
                        url:url
                        ,jar: true
                        ,method: "GET"
                    },
                    function(err,req,body)
                    {
                        if(err)
                        {
                            reject(err);
                        }
                        var $=cheerio.load(body);
                        var form=$("form");
                        var postURL=self.server_name+"/interface/orders/"+form.attr("action");
                        var dataTable=form.find("table").eq(1);
                        var firstRow=dataTable.find("tr.detail");
                        var dataRows=dataTable.find("tr.detail[bgcolor='"+firstRow.attr('bgcolor')+"']");
                        var labValuesFormData={
                            "form_date_report[0]":"2016-12-31 00:00"
                            ,"form_date_collected[0]":"2016-12-31 00:00"
                            ,"form_report_status[0]":"review"
                            ,"form_specimen_num[0]":""
                            ,"form_submit":"Sign Results"
                            
                        };
                        
                        dataRows.each(function(idx,elem)
                        {

                            var curDataRow=dataRows.eq(idx);
                            var label=curDataRow.find("input[name^='form_result_text']");
                            var result=curDataRow.find("input[name^='form_result_result']");
                            var units=curDataRow.find("input[name^='form_result_units']");
                            var code=curDataRow.find("input[name^='form_result_code']");
                            var abn=curDataRow.find("select[name^='form_result_abnormal']");
                            var range=curDataRow.find("input[name^='form_result_range']");
                            var form_line=curDataRow.find("input[name^='form_line']");
                            

                            var labelContent=label.attr("value");
                            var normalRange=null;
                            var mapEntry=labDataMap[labelContent];
                            if(mapEntry.ranges.hasOwnProperty('normal'))
                            {
                                normalRange=mapEntry.ranges['normal'];
                            }
                            else if(mapEntry.ranges.hasOwnProperty('none'))
                            {
                                normalRange=null;
                            }                            
                            else
                            {
                                normalRange=mapEntry.ranges[self.Gender.toLowerCase()];
                                // Otherwise male/female specific
                            }
                            var rangeString=""
                            var NHANESresult=LabData[mapEntry.variable];
                            var ResultStatus="";
                            if(typeof(NHANESresult)==="undefined")
                            {
                                NHANESresult="";
                            }
                            if(NHANESresult===null)
                            {
                                NHANESresult="";
                            }
                            if(normalRange!==null)
                            {
                                rangeString=normalRange.low + " - " +normalRange.high;

                                if((NHANESresult!==""))
                                {
                                    if(NHANESresult<normalRange.low)
                                    {
                                        ResultStatus="low"
                                    }
                                    else if(NHANESresult>normalRange.high)
                                    {
                                        ResultStatus="high"
                                    }
                                    else
                                    {
                                        ResultStatus="no";
                                    }
                                }
                            }
                            console.log(labelContent+":"+JSON.stringify(normalRange));

                            labValuesFormData[label.attr("name")]=labelContent;
                            labValuesFormData[units.attr("name")]=mapEntry.units;
                            labValuesFormData[result.attr("name")]=NHANESresult;
                            labValuesFormData[code.attr("name")]=code.attr("value");
                            labValuesFormData[abn.attr("name")]=ResultStatus;
                            labValuesFormData[range.attr("name")]=rangeString;
                            labValuesFormData[form_line.attr("name")]=form_line.attr("value");
                            
                        });
                        for(var prop in labValuesFormData)
                        {
                            if(labValuesFormData[prop]===null)
                            {
                                labValuesFormData[prop]="";
                            }
                        }
                        console.log(JSON.stringify(labValuesFormData));
                        console.log(postURL);
                        request({
                                    url:postURL
                                    ,jar: true
                                    ,method: "POST"
                                    ,formData: labValuesFormData
                                    },
                                    function(err,req,body){
/*                                        if(err)
                                        {
                                            console.log(err);
                                            rejest(err);
                                        }
                                        console.log(body);
*/                                        resolve(self);
                                    }
                                ); // End POST request
                    }); // End GET request
        });
    };
    
    this.addLabDataListLoop = function(LabData,next)
    {
        self.selectPatient(LabData.seqn).then(()=>{
            self.selectOrCreateEncounter().then(()=>{
                console.log(LabData.seqn);
                    self.createLabOrder().then(()=>{
                    self.populateLabOrder(LabData).then(()=>{
                        next();                        
                    });

               });
            });// end select/CreateEncounter
        }).catch((err)=>{console.log(err); next();}); // end select patient

    };
    
    this.getDemographicsFull = function()
    {
        return new Promise(function(resolve,reject)
        {
            var DemoFullURL=self.server_name+"/interface/patient_file/summary/demographics_full.php";
            request({
                                    url:DemoFullURL
                                    ,jar: true
                                    ,method: "GET"
            },
            function(err,req,body)
            {
                if(err)
                {
                    reject(err);
                    return;
                }
                var $=cheerio.load(body);
                resolve($);
            });
        });
    }
    
    this.setDemoInfo=function(DemoInfo,$)
    {
        return new Promise(function(resolve,reject)
        {
            var form=$("form");
            var postData={};
            var formArray=form.serializeArray();
            for(var inputIdx=0;inputIdx<formArray.length;inputIdx++)
            {
                var input=formArray[inputIdx];
                postData[input.name]=input.value;
            }
            
            for(var demoInfoIdx=0;demoInfoIdx<DemoInfo.length;demoInfoIdx++)
            {
                var curInfo=DemoInfo[demoInfoIdx];
                var elemSelector=curInfo.type+"[name=\""+curInfo.name+"\"]";
                var element=form.find(elemSelector);
                var formValue="";
                if(curInfo.type==="select")
                {
                    var options=element.find("option")
                    options.each(function(idx,elem)
                    {
                        var tag=options.eq(idx);
                                
                        if(tag.text().indexOf(curInfo.value)===0)
                        {
                            formValue=tag.attr("value");
                        }
                    })
                }
                else if(curInfo.type==="input")
                {
                    formValue=curInfo.value;
                }
                postData[curInfo.name]=formValue;
            }

            
            request(
                    {
                        url:self.server_name+"/interface/patient_file/summary/demographics_save.php"
                        ,jar: true
                        ,method: "POST"
                        ,formData: postData
                    },
                function(err,req,body)
                {
                    resolve(self);
  
                }
            );
        });
    };
    this.addInsuranceInfo = function(data,next)
    {
        var DemoInfo=[
            {name: "i0provider", type: "select", value: data.insurance_type}
        ];
        console.log(JSON.stringify(data));
        self.selectPatient(data.seqn)
                .then(()=>{return self.getDemographicsFull();})
                .then(($)=>{return self.setDemoInfo(DemoInfo,$);})
                .then(()=>{ next();})
                .catch((err)=>{console.log(err);next()});
    };
    
    this.addInsuranceDataLoop = function(InsuranceData)
    {
        return new Promise(function(resolve,reject)
        {
            asyncLoop(InsuranceData
                        ,self.addInsuranceInfo
                        ,function(){console.log("Done");resolve(self);});
            
        });
    };
    
    this.updateDemographics=function(data,next)
    {
        var DemoInfo=[
            {name: "form_monthly_income",type:"input", value:data.monthly_income }
            ,{name: "form_ethnicity",type:"select", value:data.race }
            
        ]
        console.log(JSON.stringify(DemoInfo));
        self.selectPatient(data.seqn)
            .then(()=>{return self.getDemographicsFull();})
            .then(($)=>{return self.setDemoInfo(DemoInfo,$);})
            .then(()=>{ next();})
            .catch((err)=>{console.log(err);next()});
    }
    
    this.updateDemographicsLoop = function(Data)
    {
        return new Promise(function(resolve,reject)
        {
            asyncLoop(Data
                        ,self.updateDemographics
                        ,function(){console.log("Done");resolve(self);});
            
        });
    };

    this.getHistoryFull = function()
    {
        return new Promise(function(resolve,reject)
        {
            var DemoFullURL=self.server_name+"/interface/patient_file/history/history_full.php";
            request({
                                    url:DemoFullURL
                                    ,jar: true
                                    ,method: "GET"
            },
            function(err,req,body)
            {
                if(err)
                {
                    reject(err);
                    return;
                }
                var $=cheerio.load(body);
                resolve($);
            });
        });
        
    }
    
    this.updateHistoryInfo=function(HistoryInfo,$)
    {
        return new Promise(function(resolve,reject)
        {
            var form=$("form");
            var postData={};
            var formArray=form.serializeArray();
            for(var inputIdx=0;inputIdx<formArray.length;inputIdx++)
            {
                var input=formArray[inputIdx];
                postData[input.name]=input.value;
            }
            console.log(JSON.stringify(HistoryInfo));
            for(var Idx=0;Idx<HistoryInfo.length;Idx++)
            {
                var curInfo=HistoryInfo[Idx];
                var elemSelector=curInfo.type+"[name=\""+curInfo.name+"\"]";
                var element=form.find(elemSelector);
                var formValue="";
                if(curInfo.type==="select")
                {
                    var options=element.find("option")
                    options.each(function(idx,elem)
                    {
                        var tag=options.eq(idx);
                                
                        if(tag.text().indexOf(curInfo.value)===0)
                        {
                            formValue=tag.attr("value");
                        }
                    })
                    console.log(formValue);
                }
                else if(curInfo.type==="input")
                {
                    formValue=curInfo.value;
                }
                postData[curInfo.name]=formValue;
            }
            
            request(
                    {
                        url:self.server_name+"/interface/patient_file/history/history_save.php"
                        ,jar: true
                        ,method: "POST"
                        ,formData: postData
                    },
                function(err,req,body)
                {
                    resolve(self);
  
                }
            );
        });
    };
    this.updateSocial=function(data,next)
    {
        var HistoryInfo=[];
        console.log(data.seqn)
        if(data.hasOwnProperty("smoking"))
        {
            HistoryInfo.push({name: "form_tobacco",type:"select", value:data.smoking });        
        }
        if(data.hasOwnProperty("recreational_drugs"))
        {
            if(data.recreational_drugs.length>0)
            {
                HistoryInfo.push({name: "form_recreational_drugs",type:"input", value:data.recreational_drugs.join() });        
            }
        }
        if(data.hasOwnProperty("alcohol"))
        {
            var alcohol=data.alcohol;
            if(data.hasOwnProperty("alcoholPerDay"))
            {
                alcohol+=","+data.alcoholPerDay + " drinks per day";
            }
            HistoryInfo.push({name: "form_alcohol",type:"input", value:alcohol });        
        }
        var exercise_patterns=null;
        if(data.hasOwnProperty("daysActive"))
        {
            exercise_patterns=data.daysActive + " days active per week";            
        }
        if(data.hasOwnProperty("daysVigorousActiveWork"))
        {
            if(exercise_patterns===null)
            {
                exercise_patterns="";
            }
            else
            {
                exercise_patterns+=",";
            }
            exercise_patterns+=data.daysVigorousActiveWork + " days per week of vigorous work activity";            
        }
        if(data.hasOwnProperty("daysModerateActiveWork"))
        {
            if(exercise_patterns===null)
            {
                exercise_patterns="";
            }
            else
            {
                exercise_patterns+=",";
            }
            exercise_patterns+=data.daysModerateActiveWork + " days per week of moderate work activity";            
        }
        if(data.hasOwnProperty("minutesSedentary"))
        {
            if(exercise_patterns===null)
            {
                exercise_patterns="";
            }
            else
            {
                exercise_patterns+=",";
            }
            exercise_patterns+=data.minutesSedentary + " minutes sedentary per day";            
        }
        
        
        if(exercise_patterns!==null)
        {
            HistoryInfo.push({name: "form_exercise_patterns",type:"input", value:exercise_patterns });        
        }
        self.selectPatient(data.seqn)
            .then(()=>{return self.getHistoryFull()})
            .then(($)=>{return self.updateHistoryInfo(HistoryInfo,$);})
            .then(()=>{ next();})
            .catch((err)=>{console.log(err);next()});
        
    }
    this.updateSocialLoop = function(Data)
    {
        return new Promise(function(resolve,reject)
        {
            console.log(JSON.stringify(Data));
            asyncLoop(Data
                        ,self.updateSocial
                        ,function(){console.log("Done");resolve(self);});
            
        });
        
    }
    return this;
};
