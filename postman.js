/*
 * Copyright 2013. Amazon Web Services, Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
**/

// Load the SDK and UUID
var https = require('https');
var slack = require('./slack.js');

var environmentId = process.env.environmentId;
var collectionId = process.env.collectionId;
var postmanApiKey = process.env.postmanApiKey;


exports.getEnvironment = function(onResult) {
    console.log("rest::getEnvironment");

    var options = {
        host: 'api.getpostman.com',
        path: "/environments/" + environmentId,
        port: '443',
        //This is the only line that is new. `headers` is an object with the headers to request
        headers: {'X-Api-Key': postmanApiKey}
    }
    console.log("Send request to :" + JSON.stringify(options))

    var req = https.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        console.log('error: ' + err.message);
        slack.hook.send({
            attachments: [
                {
                    "fallback": err.message,
                    "color": "#e59400",
                    "title":  "Failed to download environment ID '" + environmentId + "' from Postman API",
                    "text": err.message,
                    "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                    "footer": "OBRI Monitoring API",
                    "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                }
            ]
        });

    });

    req.end();
};

exports.getCollection = function(onResult) {
    console.log("rest::getCollection");

    var options = {
        host: 'api.getpostman.com',
        path: "/collections/" + collectionId,
        port: '443',
        //This is the only line that is new. `headers` is an object with the headers to request
        headers: {'X-Api-Key': postmanApiKey}
    }
    console.log("Send request to :" + JSON.stringify(options))

    var req = https.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        console.log('error: ' + err.message);
        slack.hook.send({
            attachments: [
                {
                    "fallback": err.message,
                    "color": "#e59400",
                    "title":  "Failed to download collection ID : '" + collectionId + "' from Postman API",
                    "text": err.message,
                    "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                    "footer": "OBRI Monitoring API",
                    "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                }
            ]
        });
    });

    req.end();
};