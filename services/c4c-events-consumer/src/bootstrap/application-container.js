const fnArgs = require('parse-fn-args');
const logger = require('../logger/console')("Application Container");

module.exports = () => {
  const dependencies = {};
  const factories = {};

  const appContainer = {
    factory: facts => {
      Object.keys(facts).forEach(factory => {
        factories[factory] = facts[factory];
        logger.info(`Factory: ${factory} injected.`);
      });
    },
    register: deps => {
      Object.keys(deps).forEach(dep => {
        dependencies[dep] = deps[dep];
        logger.info(`Dependency: ${dep} injected.`);
      });
    },
    get: name => {
      if (!dependencies[name]) {
        const factory = factories[name];
        dependencies[name] = factory && appContainer.inject(factory);
        if (!dependencies[name]) {
          throw new Error(`Cannot find module: ${name}`);
        }
      }
      return dependencies[name];
    },
    inject: factory => {
      const args = fnArgs(factory).map(dependency => appContainer.get(dependency));
      return factory(...args);
    },
    dependencies: () => dependencies,
  };

  // Inject the appContainer into it so others can require it as a dependency
  appContainer.register({ applicationContainer: appContainer });

  return appContainer;
};
