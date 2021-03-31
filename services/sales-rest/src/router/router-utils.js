const registerRoutes = (applicationContainer, basePath, router, routes) => {
  routes.forEach(r => {
    applicationContainer.factory({ [r.name]: r.handlerFactory });
    router[r.method.toLowerCase()](`${basePath}${r.path}`, applicationContainer.get(r.name));
  });
};

module.exports = {
  registerRoutes,
};
