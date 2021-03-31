# SAP Sales Cloud Extension
Welcome to SAP Business Technology Platform "Sales Middleware" use case PoC.

The solution designed to connect devices to Sales Cloud/Sales for Customer (C4C) by consuming/displaying
data coming from C4C:
* Sales Management
* View of Monthly Sales
* View of Quarterly Sales
* Issue Management
    * Swipe Actions to quickly hide an Issue
    * Escalating an issue
* Tasks Management
    * Create a new Task for myself from scratch
    * Detail Page of an Issue with a Task created
* Visits Management
* ...


## Design Architecture Diagrams
Sales middleware use case running on SAP Business Technology Platform using Kyma Runtime(on top of K8S).

High Level Target Design which is including mobile application being out of scope of this use case,
but is included to show the full communication.

![](images/HL-SalesMiddleware-UseCase.png)

<br/><br/>
Bellow there is two diagrams showing different aproaches to extend functionality of SAP Cloud Sales:

- Sales service is using CAP framework to extend the Sales Cloud API.
  Using Redis for caching.
  
  ![](images/SalesMiddleware-CAP-UseCase.png)
  
- Sales service communication is build pure REST call to Sales Cloud.
  As well is having integration with MongoDB to keep some entities for longer period,
  and Redis for temporary caching.
  ![](images/SalesMiddleware-Rest-UseCase.png)

## Guidelines

* [Internal Use Case Components](./services).
* [Components Deployments](./deployment)

## Known Issues

## How to obtain support

[Create an issue](https://github.com/SAP-samples/cloud-extension-sales-middleware/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing

## License
Copyright (c) 2021 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.
