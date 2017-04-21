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
};
