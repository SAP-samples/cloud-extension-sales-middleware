const logger = require('../logger/console')("ProductsRepository");

class ProductsRepository {
  constructor(productsAPIClient) {
    this.productsAPIClient = productsAPIClient;
  }

  findProductById(productUUID) {
    return this
      .getProductFromSalesCloud(productUUID)
      .catch(err => {
        logger.error(`Error: ${err.message}`);
        return Promise.reject(err);
      });
  }

  findProducts({ pagination }) {
    return this.productsAPIClient.fetchProducts({ pagination });
  }

  getProductsFromSalesCloud() {
    return this.productsAPIClient.fetchProducts();
  }

  getProductFromSalesCloud(productObjectID) {
    return this.productsAPIClient.findProductByObjectID(productObjectID);
  }
}

module.exports = {
  factory(productsAPIClient) {
    return new ProductsRepository(productsAPIClient);
  },
};
