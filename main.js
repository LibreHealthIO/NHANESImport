/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var https=require("https");
var $={};
require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

     $ = require("jquery")(window);
});

function processNHANESComponent(year,data)
{
    $("body").html(data);
    var links=$("a[href^='/Nchs/Nhanes/']");
    links.each(function(index){
        console.log($(this).attr("href"))
    });
    
}

function getNHANESComponents(year)
{
    var baseURL="/nchs/nhanes/search/datapage.aspx?Component=(COMPNAME)&CycleBeginYear="+year.toString();
    var componentList=["Demographics","Dietary","Examination","Laboratory","Questionnaire"]; // Ignoring Limited Access/Non-Public data for now.
    for(var compIdx=0;compIdx<componentList.length;compIdx++)
    {
        var url=baseURL.replace("(COMPNAME)",componentList[compIdx]);
        var requestParameters = {
            host: "wwwn.cdc.gov",
            port: 443,
            path: url
        }
        var req=https.get(requestParameters, function(res)
        {
            var contents="";
            res.setEncoding("utf8");
            res.on("data",function(data){ contents+=data;});
            res.on("end",function(){processNHANESComponent(year,contents)});
        } );
        req.end();
    }
}

function getNHANES(year)
{
    getNHANESComponents(year);
}

function process_data()
{
    getNHANES(2011);
}


process_data();