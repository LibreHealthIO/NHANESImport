/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var path = require('path');
var fs = require('fs');
var csv=require('csv-parse/lib/sync');

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

module.exports = new namesData();