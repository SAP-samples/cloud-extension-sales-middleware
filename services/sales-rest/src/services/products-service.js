const { convertPaginatedResultsToResponseDTO } = require('../helpers/converters');

class ProductsService {
  constructor(productsRepository) {
    this.productsRepository = productsRepository;
  }

  findProductById(productId) {
    return this.productsRepository
      .findProductById(productId)
      .then(product => this._buildProductDetailsDTO(product));
  }

  findProducts({ pagination }) {
    return this.productsRepository
      .findProducts({ pagination })
      .then(productsResponse => convertPaginatedResultsToResponseDTO(productsResponse, this._buildProductsDTOs));
  }

  _buildProductsDTOs(products) {
    return products.map(product => ({
      id: product.ObjectID,
      name: `Product ${product.ProductID}`,
      description: product.Description,
      status: product.StatusText,
      divisionText: product.DivisionText,
    }));
  }

  _buildProductDetailsDTO(product) {
    return {
      id: product.ObjectID,
      name: `Product ${product.ProductID}`,
      description: product.Description,
      status: product.StatusText,
      divisionText: product.DivisionText,
    };
  }
}


module.exports = {
  factory(productsRepository) {
    return new ProductsService(productsRepository);
  },
};
