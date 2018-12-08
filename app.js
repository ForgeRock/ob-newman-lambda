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
var postman = require('./service/postman.js');
var monitoring = require('./service/monitoring.js');
var slack = require('./service/slack.js');

console.log("Start the postman monitoring lambda.");
console.log("Download the environment");

postman.getEnvironment(function(statusCode, environment) {

    console.log("Environment result : (" + statusCode + ") ->" + JSON.stringify(environment));
    console.log("Download the collection");

    postman.getCollection(function(statusCode, collection) {
        console.log("Collection result : (" + statusCode + ") ->" + JSON.stringify(collection));
        console.log("We now save the collection and environment into file, for newman");

        try {
            fs.writeFileSync("./collection.json", JSON.stringify(collection))
            fs.writeFileSync("./environment.json", JSON.stringify(environment))
        } catch (err) {
            console.log("Couldn't write the env or collection into a file");
            console.error(err)
            slack.hook.send({
                attachments: [
                    {
                        "fallback": JSON.stringify(err),
                        "color": "#e59400",
                        "title":  "Couldn't save the environment or collection into file",
                        "text": JSON.stringify(err),
                        "thumb_url": "https://tse3.mm.bing.net/th?id=OIP.BDR1EMZ45E4Xa-EBTIT0_QHaHv&pid=Api",
                        "footer": "OBRI Monitoring API",
                        "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                    }
                ]
            });
            return;
        }

        console.log("File saved. We can now run newman");

        newman.run({
            collection: './collection.json',
            environment: './environment.json',
            reporters: 'cli'
        }, function (err, postmanResult) {
            console.log('collection run complete!');

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
                console.log("We convert the postman result into the monitoring input");
                var monitoringResult = monitoring.convertExecutions(postmanResult.run.timings, postmanResult.run.executions);

                console.log('monitoringResult converted:');
                console.log(JSON.stringify(monitoringResult));
                console.log('We now send the monitoring result to the monitoring service');

                monitoring.postMonitoringResult(collection, environment, postmanResult, monitoringResult);
                console.log('Lambda completed!');
            }
        });
    });
});
