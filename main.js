/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var https=require("https");
var path = require('path');
var request = require('request');
var fs = require('fs');
var mysql=require('mysql');

var dbConn = mysql.createConnection({
        host: 'localhost',
        user : 'root',
        password : 'mydbpwd',
        database : 'nhanes'
    });

dbConn.connect();

const url = require('url');

var $={};
require("jsdom").env("", function(err, window) {
    if (err) {
        console.error(err);
        return;
    }

     $ = require("jquery")(window);
});

function stripFileName(fn)
{
    var loc=fn.lastIndexOf("/")+1;
    return fn.substring(loc);
}
function getNHANESFile(year,sURL)
{
    var cwd = process.cwd();
    var yearPath=cwd + path.sep + "datafiles"+ path.sep + year+ path.sep;
    var nhanes = url.parse(sURL);
    var urlPathName=nhanes.path;
    var filename = yearPath + stripFileName(urlPathName);
    request("https://wwwn.cdc.gov/"+sURL).pipe(fs.createWriteStream(filename));
}

function processNHANESFiles(year,label,document,sasfile)
{
        getNHANESFile(year,document);
        getNHANESFile(year,sasfile);
        dbConn.query("INSERT INTO filelist(year,document,sasfile,description) VALUES (?,?,?,?)",[year,stripFileName(document),stripFileName(sasfile),label],function(err,res){
            if(err) throw err;
            console.log("Insert complete for:"+label);
        });
    
}
function processNHANESComponent(year,data)
{
    $("body").html(data);
    var grid=$("#GridView1");
    var rows=grid.find("tbody > tr");
    rows.each(function(index){
        var cells=$(this).find("td");
        var label=cells.eq(0);
        var doc=cells.eq(1).find("a");
        var contents=cells.eq(2).find("a");
        processNHANESFiles(year,label.text(),doc.attr("href"),contents.attr("href"));
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

function createCSVFromXPT(path,filename)
{
    console.log(path+filename);
}


function parseCodeBook(path,filename)
{
    fs.readFile(path+filename, 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      console.log(data);
    });    
}
function parseNHANES(year)
{
    var yearPath=process.cwd() + path.sep + "datafiles"+ path.sep + year+ path.sep;
    dbConn.query("SELECT * FROM filelist WHERE year=?",[year],function(err,rows)
    {
        for(var fileIdx=0;fileIdx<rows.length;fileIdx++)
        {
            var curRow=rows[fileIdx];
//            console.log(JSON.stringify(rows[fileIdx]));
            createCSVFromXPT(yearPath,curRow.sasfile);
            parseCodeBook(yearPath,curRow.document);
        }
        
    });
}

function process_data()
{
//    getNHANES(2011);
    parseNHANES(2011);
}

process_data();
