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
var newman = require('newman');
var fs = require('fs');
var postman = require('./postman.js');
var monitoring = require('./monitoring.js');
var slack = require('./slack.js');


postman.getEnvironment(function(statusCode, environment) {
    // I could work with the result html/json here.  I could also just return it
    console.log("Environment result : (" + statusCode + ")" + JSON.stringify(environment));
    postman.getCollection(function(statusCode, collection) {
        // I could work with the result html/json here.  I could also just return it
        console.log("Collection result : (" + statusCode + ")" + JSON.stringify(collection));
        console.log("Run newman");
        try {
            fs.writeFileSync("./collection.json", JSON.stringify(collection))
            fs.writeFileSync("./environment.json", JSON.stringify(environment))
        } catch (err) {
            console.log("Couldn't write the env or collection into a file");
            console.error(err)
        }

        // call newman.run to pass `options` object and wait for callback
        newman.run({
            collection: './collection.json',
            environment: './environment.json',
            reporters: 'cli'
        }, function (err, postmanResult) {
            console.log('Postman summary:');
            console.log(JSON.stringify(postmanResult));
            if (err) {
                console.log("Received an error from newman");
                console.error(err)
                slack.hook.send({
                    attachments: [
                        {
                            "fallback": err.help,
                            "color": "#e59400",
                            "title":  "Newman failed to execute '" + collection.collection.info.name + "' on environment '" + environment.environment.name + "'",
                            "text": err.help,
                            "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                            "footer": "OBRI Monitoring API",
                            "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                        }
                    ]
                });
            } else {
                var requests = [];
                var executions = postmanResult.run.executions;
                var monitoringResult = monitoring.convertExecutions(postmanResult.run.timings, executions);
                console.log('monitoringResult:');
                console.log(JSON.stringify(monitoringResult));
                monitoring.postMonitoringResult(collection, environment, postmanResult, monitoringResult);
                console.log('collection run complete!');
            }
        });
    });
});
