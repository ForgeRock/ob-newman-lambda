/*
 *  The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 *  You can obtain a copy of the License at https://forgerock.org/cddlv1-0/. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 *  information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2018 ForgeRock AS.
 */

var newman = require('newman');
var fs = require('fs');
let AWS = require('aws-sdk');
var slack = require('./service/slack.js');

var postman = require('./service/postman.js');
var monitoring = require('./service/monitoring.js');
var slack = require('./service/slack.js');

var collectionFilePath = "/tmp/collection.json";
var environmentFilePath = "/tmp/environment.json";


exports.handler = async (event) => {
    try {
        console.log("Start the postman monitoring lambda.");
        console.log("Download the environment");

        await Promise.all([postman.getCollection(collectionFilePath),  postman.getEnvironment(environmentFilePath)])
            .then(function(values) {
                console.log(values);
                console.log("File saved. We can now run newman");
            });

        var postmanResult;
        await runNewman()
            .then(function(result) {
                postmanResult = result
             });

        var monitoringResult = monitoring.convertExecutions(postmanResult.run.timings, postmanResult.run.executions);

        console.log('monitoringResult converted:');
        console.log(JSON.stringify(monitoringResult));
        console.log('We now send the monitoring result to the monitoring service');

        await monitoring.postMonitoringResult(postmanResult, monitoringResult)
            .then(function(values) {
            console.log(values);
            console.log("Send successfully to monitoring service");
        });;
        console.log('Wait on slack promises');
        await Promise.all(slack.promises())
            .then(function(values) {
                console.log(values);
                console.log("Slack messages completed");
            });
        console.log('Post monitoring completed!');

    }
    catch (err) {
        console.log(err);
        return err;
    }
    console.log("Lambda completed")
}


runNewman = () => {
    return new Promise((resolve, reject) => {

        newman.run({
            collection: collectionFilePath,
            environment: environmentFilePath,
            reporters: 'cli'
        }).on('start', function (err, args) {
            console.debug('Start newman run');
        }).on('done', function (err, postmanResult) {
            console.log('collection run complete!');

            console.log('Postman summary:');
            console.log(JSON.stringify(postmanResult));
            if (err) {
                console.log("Received an error from newman");
                console.error(err)
                slack.send({
                    attachments: [
                        {
                            "fallback": err.help,
                            "color": "#e59400",
                            //"title":  "Newman failed to execute '" + collection.collection.info.name + "' on environment '" + environment.environment.name + "'",
                            "text": err.help,
                            "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                            "footer": "OBRI Monitoring API",
                            "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                        }
                    ]
                });
                reject(err);
            } else {
                console.log("We convert the postman result into the monitoring input");
                resolve(postmanResult);
            }
        });
    })
}