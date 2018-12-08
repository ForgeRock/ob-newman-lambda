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


var applicationUuid = process.env.applicationUuid;
var originRegion = process.env.originRegion;
var institutionId = process.env.institutionId;
var domain = process.env.domain;
var monitoringUri = process.env.monitoringUri;

var applicationUsername = process.env.applicationUsername;
var applicationPassword = process.env.applicationPassword;

exports.convertExecutions = function(timings, executions) {
    console.log('convertExecutions()');

    var time = new Date(timings.started).toISOString()

    var requests = [];
    for(var i = 0; i < executions.length; i++) {
        if (executions[i].response != null) {
            requests.push(convertExecution(executions[i], time));
        }
    }
    var monitoringResult = {
        "applicationUuid": applicationUuid,
        "time": time,
        "originRegion": originRegion,
        "institutionId": institutionId,
        "requests" : requests
    }

    console.log('monitoringResult:');
    console.log(JSON.stringify(monitoringResult));
    return monitoringResult;
}

exports.postMonitoringResult =
    (postmanResult, monitoringResult) => {
        return new Promise((resolve, reject) => {

            console.log("rest::postMonitoringResult");
            var auth = 'Basic ' + Buffer.from(applicationUsername + ':' + applicationPassword).toString('base64');

            var options = {
                host: monitoringUri,
                path: "/api/requests",
                port: '443',
                //This is the only line that is new. `headers` is an object with the headers to request
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": auth
                },
                method: 'POST',

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
                    console.log(JSON.parse(output))
                    console.log("collection")
                    console.log(JSON.stringify(postmanResult.collection))
                    console.log(postmanResult.collection)
                    console.log(JSON.stringify(postmanResult.collection.info))

                    slack.send({
                        "text": "Monitoring result for '" + postmanResult.collection.name + "' on environment '" + postmanResult.environment.name + "'",
                        attachments: getAttachment(postmanResult)
                    });
                    resolve(res);
                });
            });

            req.on('error', function(err) {
                console.log('error: ' + err);

                slack.send({
                    attachments: [
                        {
                            "fallback": JSON.stringify(err),
                            "color": "#e59400",
                            "title":  "Yapily monitoring service failed to save the new result",
                            "text": JSON.stringify(err),
                            "thumb_url": "https://www.bing.com/th?id=AMMS_c4d30cdeaa288e1673500ed07a376e44&w=110&h=110&c=7&rs=1&qlt=95&cdv=1&pid=16.1",
                            "footer": "OBRI Monitoring API",
                            "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
                        }
                    ]
                });
                reject(err);

            });
            req.write(JSON.stringify(monitoringResult));

            req.end();
        })
};


function getAttachment(postmanResult) {
    var monitoringUriResult = "https://" + monitoringUri + "/#!institution/" + institutionId;
    var color;
    var icon;
    var attachement = [];

    var isError = postmanResult.run.failures.length == 0;
    if (isError) {
        color = "#2eb886";
        icon = "https://cdn2.iconfinder.com/data/icons/greenline/512/check-512.png";
        attachement.push(
            {
                "fallback": "Monitoring success!",
                "color": color,
                "title": "Monitoring success!",
                "title_link": "https://" + monitoringUri + "/#!institution/" + institutionId,
                "text": "Monitoring successfully executed with no failure.",
                "fields": getFields(postmanResult),
                "actions": [
                    {
                        "type": "button",
                        "name": "view_result",
                        "text": "View monitoring result",
                        "url": monitoringUriResult,
                        "style": "primary",
                    },
                ],
                "thumb_url": icon,
                "footer": "OBRI Monitoring API",
                "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
            }
        );
    } else {
        color = "#f44336";
        icon = "https://cdn0.iconfinder.com/data/icons/shift-free/32/Error-512.png";
        attachement.push(
            {
                "fallback": "Monitoring failed!",
                "color": color,
                "title": "Monitoring failed!",
                "title_link": "https://" + monitoringUri + "/#!institution/" + institutionId,
                "text": "Monitoring successfully executed but has some failures!",
                "fields": getFields(postmanResult),
                "actions": [
                    {
                        "type": "button",
                        "name": "view_result",
                        "text": "View monitoring result",
                        "url": monitoringUriResult,
                        "style": "primary",
                    },
                ],
                "thumb_url": icon,
                "footer": "OBRI Monitoring API",
                "footer_icon": "https://www.limestonebank.com/assets/content/uPUMtrSe/icon-onlinebanking-2x.png",
            }
        );
        for(var i = 0; i < postmanResult.run.failures.length; i++) {
            var failure = postmanResult.run.failures[i]
            var testName = failure.source.name;

            attachement.push({
                "fallback": "Test '" + testName + "' failed!",
                "color": color,
                "title":  "Test '" + testName + "' failed!",
                "text": failure.error.test + "\n" + failure.error.message,
            });
        }
    }
    console.log(JSON.stringify(attachement));
    return attachement;
}

function getFields(postmanResult) {
    var totalTime = postmanResult.run.timings.completed - postmanResult.run.timings.started;
    return [
    {
        "title": "Test results",
        "value": "",
        "short": false
    },
    {
        "title": "Succeed Requests (2xx)",
        "value": (postmanResult.run.stats.requests.total - postmanResult.run.stats.requests.failed) + "/" + postmanResult.run.stats.requests.total,
        "short": true
    },
    {
        "title": "Succeed Test",
        "value": (postmanResult.run.stats.assertions.total - postmanResult.run.stats.assertions.failed) + "/" + postmanResult.run.stats.assertions.total,
        "short": true
    },
    {
        "title": "Failed Requests",
        "value": postmanResult.run.stats.requests.failed + "/" + postmanResult.run.stats.requests.total,
        "short": true
    },
    {
        "title": "Failed Test",
        "value": postmanResult.run.stats.assertions.failed + "/" + postmanResult.run.stats.assertions.total,
        "short": true
    },
    {
        "title": "Stats",
        "value": "",
        "short": false
    },
    {
        "title": "total run duration",
        "value": (totalTime/1000) + "s",
        "short": true
    },
    {
        "title": "total run duration",
        "value": (totalTime/1000) + "s",
        "short": true
    },
    {
        "title": " total data received",
        "value": postmanResult.run.transfers.responseTotal + "B (approx)",
        "short": true
    }
    ,
    {
        "title": "Average response time",
        "value": Math.round(postmanResult.run.timings.responseAverage) + " ms",
        "short": true
    }];
}

function convertExecution(execution, time) {

    var duraction = 0;
    if (execution.response.responseTime) {
        duraction = execution.response.responseTime / 1000;
    }
    return {
        "time": time,
        "method": execution.request.method,
        "uriTemplate": getUriTemplate(execution),
        "response": {
            "code": execution.response.code,
            "size": execution.response.responseSize,
            "duration": "PT" + duraction + "S",
            "type": getType(execution),
            "details":execution.item.name
        }
    };
}

function getUriTemplate(execution) {
    for(var i = 0; i < execution.request.header.length; i++) {
        var header = execution.request.header[i];
        if (header.key == "x-postman-url-template") {
            return header.value.replace("https://", "");
        }
    }

    var uriTemplate = execution.request.url.host[0];
    for(var i = 1; i < execution.request.url.host.length; i++) {
        uriTemplate += "." + execution.request.url.host[i];
    }
    for(var i = 0; i < execution.request.url.path.length; i++) {
        uriTemplate += "/" + execution.request.url.path[i];
    }
    return uriTemplate;
}

function getType(execution) {
    if (200 <= execution.response.code && execution.response.code < 300) {
        return "SUCCESS"
    }
    return "ERROR";
}