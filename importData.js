/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var request=require('request');
var j = request.jar()
var server;
function EHRLogin(serverName,userid,password,callback)
{
    server=serverName;
    var loginPage='/interface/main/main_screen.php?auth=login&site=default'
    request({
                followAllRedirects: true,
                url:server+loginPage,
                formData: {
                        new_login_session_management:1,
                        authProvider: 'Default',
                        authUser:userid,
                        clearPass:password,
                        languageChoice:1,
                    },
                jar: true,
                method: 'POST'  
            }
            ,callback);
}

console.log("Hello World!");

function createPatient(callback)
{
    var patient_create_form={
                form_cb_1:1
                ,form_fname:'Test'
                ,form_mname: ''
                ,form_lname:'TestAuto'
                ,form_sex:'Female'
                ,form_DOB:'2017-03-02'
                ,form_status: ''
                ,form_street: ''
                ,form_city: ''
                ,form_state: ''
                ,form_postal_code: ''
                ,form_ss: ''
                ,form_drivers_license: ''
                ,form_phone_cell: ''
                ,form_email: ''
                ,form_billing_note: ''
                ,form_providerID: ''
                ,form_ref_providerID: ''
                ,form_pharmacy_id:0
                ,form_phone_home: ''
                ,form_phone_biz: ''
                ,form_contact_relationship: ''
                ,form_phone_contact: ''
                ,form_mothersname: ''
                ,form_guardiansname: ''
                ,form_county: ''
                ,form_country_code: ''
                ,form_referral_source: ''
                ,form_allow_patient_portal: ''
                ,form_email_direct: ''
                ,form_hipaa_notice: ''
                ,form_hipaa_voice: ''
                ,form_hipaa_message: ''
                ,form_hipaa_mail: ''
                ,form_hipaa_allowsms: ''
                ,form_hipaa_allowemail: ''
                ,form_allow_imm_reg_use: ''
                ,form_allow_imm_info_share: ''
                ,form_allow_health_info_ex: ''
                ,form_vfc: ''
                ,form_deceased_date: ''
                ,form_deceased_reason: ''
                ,form_industry: ''
                ,form_occupation: ''
                ,form_em_name: ''
                ,form_em_street: ''
                ,form_em_city: ''
                ,form_em_state: ''
                ,form_em_postal_code: ''
                ,form_em_country: ''
                ,form_language: ''
                ,form_interpretter: ''
                ,form_ethnicity: ''
                ,form_family_size: ''
                ,form_financial_review: ''
                ,form_monthly_income: ''
                ,form_homeless: ''
                ,form_migrantseasonal: ''
                ,form_religion: ''
                ,i1provider: ''
                ,i1plan_name: ''
                ,i1effective_date: ''
                ,i1policy_number: ''
                ,i1group_number: ''
                ,i1subscriber_employer: ''
                ,i1subscriber_employer_street: ''
                ,i1subscriber_employer_city: ''
                ,form_i1subscriber_employer_state: ''
                ,i1subscriber_employer_postal_code: ''
                ,form_i1subscriber_employer_country: ''
                ,i1subscriber_fname: ''
                ,i1subscriber_mname: ''
                ,i1subscriber_lname: ''
                ,form_i1subscriber_relationship: ''
                ,i1subscriber_DOB: ''
                ,i1subscriber_ss: ''
                ,form_i1subscriber_sex: ''
                ,i1subscriber_street: ''
                ,i1subscriber_city: ''
                ,form_i1subscriber_state: ''
                ,i1subscriber_postal_code: ''
                ,form_i1subscriber_country: ''
                ,i1subscriber_phone: ''
                ,i1copay: ''
                ,i1accept_assignment:true
                ,i2provider: ''
                ,i2plan_name: ''
                ,i2effective_date: ''
                ,i2policy_number: ''
                ,i2group_number: ''
                ,i2subscriber_employer: ''
                ,i2subscriber_employer_street: ''
                ,i2subscriber_employer_city: ''
                ,form_i2subscriber_employer_state: ''
                ,i2subscriber_employer_postal_code: ''
                ,form_i2subscriber_employer_country: ''
                ,i2subscriber_fname: ''
                ,i2subscriber_mname: ''
                ,i2subscriber_lname: ''
                ,form_i2subscriber_relationship: ''
                ,i2subscriber_DOB: ''
                ,i2subscriber_ss: ''
                ,form_i2subscriber_sex: ''
                ,i2subscriber_street: ''
                ,i2subscriber_city: ''
                ,form_i2subscriber_state: ''
                ,i2subscriber_postal_code: ''
                ,form_i2subscriber_country: ''
                ,i2subscriber_phone: ''
                ,i2copay: ''
                ,i2accept_assignment:true
                ,i3provider: ''
                ,i3plan_name: ''
                ,i3effective_date: ''
                ,i3policy_number: ''
                ,i3group_number: ''
                ,i3subscriber_employer: ''
                ,i3subscriber_employer_street: ''
                ,i3subscriber_employer_city: ''
                ,form_i3subscriber_employer_state: ''
                ,i3subscriber_employer_postal_code: ''
                ,form_i3subscriber_employer_country: ''
                ,i3subscriber_fname: ''
                ,i3subscriber_mname: ''
                ,i3subscriber_lname: ''
                ,form_i3subscriber_relationship: ''
                ,i3subscriber_DOB: ''
                ,i3subscriber_ss: ''
                ,form_i3subscriber_sex: ''
                ,i3subscriber_street: ''
                ,i3subscriber_city: ''
                ,form_i3subscriber_state: ''
                ,i3subscriber_postal_code: ''
                ,form_i3subscriber_country: ''
                ,i3subscriber_phone: ''
                ,i3copay: ''
                ,i3accept_assignment:true

    }
    const patient_save_page="/interface/new/new_comprehensive_save.php";
    request({
        followAllRedirects: true,
        jar:true,
        url: server+patient_save_page,
        method: 'POST',
        formData:
                {
                                    form_fname:'Test'
                                    ,form_mname: ''
                                    ,form_lname:'TestAuto2'
                                    ,form_sex:'Female'
                                    ,form_DOB:'2017-03-02'
                }
//        formData: patient_create_form
    },callback);
}

EHRLogin("http://192.168.249.128/libreehr",'admin','pass',function(error,response,body){
    console.log("callback");
    if(error)
    {
        console.log(error);
    }else
    {
        console.log(response.statusCode);
        console.log(body);
        createPatient(function(error,response,body)
        {
            console.log('patient');
            console.log(body);
        });
    }
});