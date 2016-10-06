'use strict';

var fs       = require('fs');
var app      = require('app');
var Tray     = require('tray');
var Menu     = require('menu');
var path     = require('path');
var request  = require('request');
var opener   = require('opener');
var moment   = require('moment');

var iconDull    = path.join(__dirname, 'icon.png');
var url         = 'https://packagist.org/packages/jaybizzle/crawler-detect.json';
var show        = 'all';
var tid, appIcon, stored;
var preferencesPath = app.getPath('userData')+'/settings.json';
var checked_daily = false;
var checked_monthly = false;
var checked_total = false;
var checked_all = false;

app.on('ready', function() {
    // Check if settings file exists. If not create it
    fs.exists(preferencesPath, function (exists) {
        if(exists) {
            fs.readFile(preferencesPath, 'utf8', function (err,data) {
                if (err) {
                    return console.log(err);
                }
                show = data;

                if(show == 'daily') {
                    checked_daily = true;
                } else if(show == 'monthly') {
                    checked_monthly = true;
                } else if(show == 'total') {
                    checked_total = true;
                } else {
                    checked_all = true;
                }
                initialiseMenu();
            });
        } else {
            savePreferences(show);
            initialiseMenu();
        }
    });
});

function initialiseMenu() {
    if (app.dock) app.dock.hide()
  
    appIcon = new Tray(iconDull);

    var contextMenu = Menu.buildFromTemplate(
    [{
        label: 'Daily installs',
        click: function() { changeDisplay('daily'); },
        type: 'radio',
        checked: checked_daily
    },
    {
        label: 'Monthly installs',
        click: function() { changeDisplay('monthly'); },
        type: 'radio',
        checked: checked_monthly
    },
    {
        label: 'Total installs',
        click: function() { changeDisplay('total'); },
        type: 'radio',
        checked: checked_total
    },
    {
        label: 'Show All',
        click: function() { changeDisplay('all'); },
        type: 'radio',
        checked: checked_all
    },
    {
        type: 'separator'
    },
    {
        label: 'Go to Packagist',
        click: function() { 

            opener('http://www.packagist.org');
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Quit',
        selector: 'terminate:'
    },
    {
        label: 'Version ' + app.getVersion(),
        type: 'normal',
        enabled: false
    }]);
    
    appIcon.setTitle('--');
    appIcon.setContextMenu(contextMenu);

    pingConsole();
}

function changeDisplay(display) {
    show = display;
    setTitle();
    savePreferences(display);
}

function setTitle() {
    if(show == 'all') {
        appIcon.setTitle(stored['package']['downloads']['daily'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' • ' + stored['package']['downloads']['monthly'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' • ' + stored['package']['downloads']['total'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    } else {
        appIcon.setTitle(stored['package']['downloads'][show].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    }
}

function pingConsole() {
    request(
    {
        url: url + '?' + Date.now(),
        json: true
    },
    function (error, response, body) {
        if (!error && response.statusCode === 200) {
            stored = body;

            setTitle();
        }
    });

    tid = setTimeout(pingConsole, 600000); // repeat myself (10 minutes)
}

function abortTimer() { // to be called when you want to stop the timer
    // clearTimeout(tid);
}

function savePreferences(text) {
    fs.writeFile(preferencesPath, text, function(err) {
        if(err) {
            return console.log(err);
        }
    }); 
}