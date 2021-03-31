# Sales Middleware Rest
Middleware service using pure REST API top of SAP Sales Cloud (C4C) API's to proxy the calls.
Service is using Redis to cache most used data to reduce number of requests to C4C API,
as well for less frequently modified object on C4C are stored into MongoDB for longer, for shorter call.


## Local Starting

Make sure that you have following environment variables:
````env
CONFIGURATION={"credentials":{"password":"********","username":"********"},"csrfConfig":{"tokenUrl":"https://myXXXXXX.crm.ondemand.com/sap/c4c/odata/v1/c4codataapi/"}}
ENABLE_CACHING=true
redis_host=localhost
redis_password=
redis_port=6379
mongo_connectionString=mongodb://localhost:27017/sales
````
