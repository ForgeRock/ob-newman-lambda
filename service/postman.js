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


var https = require('https');
var slack = require('./slack.js');
var fs = require('fs');

var environmentId = process.env.environmentId;
var collectionId = process.env.collectionId;
var postmanApiKey = process.env.postmanApiKey;


exports.getEnvironment = (environmentFilePath) => {
    return new Promise((resolve, reject) => {
        console.log("rest::getEnvironment");

        var options = {
            host: 'api.getpostman.com',
            path: "/environments/" + environmentId,
            port: '443',
            //This is the only line that is new. `headers` is an object with the headers to request
            headers: {'X-Api-Key': postmanApiKey}
        }
        console.log("Send request to :" + JSON.stringify(options))

        var req = https.request(options, function (res) {
            var output = '';
            console.log(options.host + ':' + res.statusCode);
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                output += chunk;
            });

            res.on('end', function () {
                var environment = JSON.parse(output);
                try {
                    fs.writeFileSync(environmentFilePath, JSON.stringify(environment))
                    resolve(res.statusCode, environment);
                } catch (err) {
                    console.log("Couldn't write the environment into a file");
                    console.error(err)
                    slack.send({
                        attachments: [
                            {
                                "fallback": JSON.stringify(err),
                                "color": "#e59400",
                                "title": "Couldn't save the environment into file",
                                "text": JSON.stringify(err),
                                "thumb_url": "https://tse3.mm.bing.net/th?id=OIP.BDR1EMZ45E4Xa-EBTIT0_QHaHv&pid=Api",
                                "footer": "OBRI Monitoring API",
                                "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                            }
                        ]
                    });
                    reject("Couldn't save the environment into file");

                }
            });
        });

        req.on('error', function (err) {
            console.log('error: ' + err.message);
            slack.send({
                attachments: [
                    {
                        "fallback": JSON.stringify(err),
                        "color": "#e59400",
                        "title": "Failed to download environment ID '" + environmentId + "' from Postman API",
                        "text": JSON.stringify(err),
                        "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                        "footer": "OBRI Monitoring API",
                        "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                    }
                ]
            });
            reject(err);
        });

        req.end();
    });
};

exports.getCollection = (collectionFilePath) => {
    return new Promise((resolve, reject) => {
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
                var collection = JSON.parse(output);
                try {
                    fs.writeFileSync(collectionFilePath, JSON.stringify(collection))
                    resolve(res.statusCode, collection);
                } catch (err) {
                    console.log("Couldn't write the collection into a file");
                    console.error(err)
                    slack.send({
                        attachments: [
                            {
                                "fallback": JSON.stringify(err),
                                "color": "#e59400",
                                "title": "Couldn't save the collection into file",
                                "text": JSON.stringify(err),
                                "thumb_url": "https://tse3.mm.bing.net/th?id=OIP.BDR1EMZ45E4Xa-EBTIT0_QHaHv&pid=Api",
                                "footer": "OBRI Monitoring API",
                                "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                            }
                        ]
                    });
                    reject("Couldn't save the collection into file");

                }
            });
        });

        req.on('error', function(err) {
            console.log('error: ' + err.message);
            slack.send({
                attachments: [
                    {
                        "fallback": JSON.stringify(err),
                        "color": "#e59400",
                        "title":  "Failed to download collection ID : '" + collectionId + "' from Postman API",
                        "text": JSON.stringify(err),
                        "thumb_url": "https://www.getpostman.com/img/v2/logo-glyph.png",
                        "footer": "OBRI Monitoring API",
                        "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                    }
                ]
            });
            reject(err);
        });

        req.end();
    });

};