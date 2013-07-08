#!/usr/bin/env node
/*
Automatically grade files for the presence of specidfied HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var URL_DEFAULT = "";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioURL = function(data) {
    return cheerio.load(data);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(data, checksfile, loadFn) {
    $ = loadFn(data);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    return fn.bind({});
};

var printChecks = function(checkJson) {
    console.log(JSON.stringify(checkJson, null, 4));
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <url_address>', 'URL of html file', null, URL_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .parse(process.argv);
    
    if((program.file != HTMLFILE_DEFAULT) && program.url) {
        console.error("Cannot specify both --url and --file");
        process.exit(1);
    }
    var checkJson;
    if(program.url) {
	restler.get(program.url).on('complete', function(result) {
	    if(result instanceof Error) {
		console.error("Could not get url");
	    } else {
		checkJson = checkHtmlFile(result,program.checks,cheerioURL);
		printChecks(checkJson);
	    }
	});
    } else {
        checkJson = checkHtmlFile(program.file, program.checks, cheerioHtmlFile);
	printChecks(checkJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

