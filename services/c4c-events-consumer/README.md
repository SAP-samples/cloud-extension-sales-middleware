# Sales for Customer(C4C) Event Consumer 
Is a Kyma serverless function using [CloudEvents](https://cloudevents.io/) to receive events over
[KNative](https://knative.dev/docs/eventing/) Message Broker (Kafka or Nats).
All these technologies are part of Kyma, so no integration of mention tech required.
AS current function is processing events coming from SAP Sales Cloud(C4C) system.


## Local Starting

Make sure that you have following environment variables:
````env
CONFIGURATION={"credentials":{"password":"********","username":"********"},"csrfConfig":{"tokenUrl":"https://myXXXXXX.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi/"}}
ENABLE_CACHING=true
redis_host=localhost
redis_password=
redis_port=6379
````
