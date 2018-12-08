var SlackWebhook = require('slack-webhook')

var slackWebHook = 'https://hooks.slack.com/services/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';
exports.hook = new SlackWebhook(slackWebHook, {
    defaults: {
        username: 'Bot',
        channel: '#obri-master-monitorin',
        icon_emoji: ':robot_face:'
    }
})

