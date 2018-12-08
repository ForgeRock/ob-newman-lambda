# Open Banking postman monitoring lambda hook

# Compile the nodejs project


# Configuring the lambda

You will need to setup environment variables to the lambda.
The environments variables you need to provide:

* ``originRegion`` : the postman monitoring region
* ``institutionId`` :  the monitoring institution ID
* ``domain`` : Your service domain
* ``monitoringUri`` :the monitoring uri service
* ``applicationUsername`` : the monitoring application ID
* ``applicationPassword`` :  the monitoring application secret
* ``environmentId`` : the environment ID
* ``collectionId`` : the collection ID
* ``postmanApiKey`` : the postman API key, to allow the lambda to call your postman collection
* ``applicationUuid`` : The application uuid
* ``slackWebHook`` : the slack hook

#Setup a cron

We personally took the decision of setting up a cron triggering event for the lambda. 