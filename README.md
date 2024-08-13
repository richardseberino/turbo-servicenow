# ServiceNow Turbonomic App

This is the code that is deployed in ServiceNow to communicate with the Turbonomic ServiceNow probe. This ServiceNow application provides ITSM capabilities.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

We need to have node and npm running. Recomended versions:

node: v8.9.4
npm: 6.5.0

The run the commands below to install the dependencies.

```
npm install karma-jasmine karma-chrome-launcher jasmine-core --save-dev
npm install karma --save-dev
npm install typescript
```

### Executing

Here is how we run a watcher to generate JS from the Typescript files:

```
npm run dev
```

To stop it:
```
ps aux | grep -E '[t]sc --watch' | awk '{print $2}' | xargs kill 
```

And here is how we run the Jasmine unit tests using Karma and a headless chrome browser.

```
node_modules/karma/bin/karma start
```

End with an example of getting some data out of the system or using it for a little demo

## Deploying to ServiceNowApp
1. Copy dist/business-logic/ to ServiceNowApp Studio
2. Copy dist/turbonomic/ to ServiceNowApp Studio
3. Copy src/real to ServiceNowApp Studio

## Built With

* [Maven](https://maven.apache.org/) - Dependency Management

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Anshuman Biswas** - *Initial work* - [ServiceNow](https://git.turbonomic.com/turbonomic/servicenow)
* **Alex Petrean**

See also the list of [contributors](https://git.turbonomic.com/turbonomic/servicenow) who participated in this project.
