const { getPaginationParamsFrom } = require('../../../helpers/requests');

const productControllerFactory = (productsService) => (req, res) => {
  const { productId } = req.params;
  return productsService.findProductById(productId)
    .then(product => res.json(product));
};
const productsControllerFactory = (productsService) => (req, res) =>
  productsService.findProducts({ pagination: getPaginationParamsFrom(req) })
    .then(results => res.json(results));

module.exports = [{
  method: 'GET',
  path: '/products/:productId',
  name: 'productControllerFactory',
  handlerFactory: productControllerFactory,
},
{
  method: 'GET',
  path: '/products/',
  name: 'productsControllerFactory',
  handlerFactory: productsControllerFactory,
},
];
