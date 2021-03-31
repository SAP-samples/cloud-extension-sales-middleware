const { salesCloud: { credentials }, logger } = require('../../constants/constants');
const {
  createAPIClient, getResultsFromODataResponse, getTopParameterValue, getSkipParameterValue, getCountFromODataResponse,
} = require('../../helpers/odata');
const { createPaginationDataFrom } = require('../../helpers/pagination');

const productsApiClient = createAPIClient();

class ProductsAPIClient {
  fetchProducts({ pagination }) {
    const top = getTopParameterValue(pagination);
    const skip = getSkipParameterValue(pagination);

    logger.info('Fetching products from Sales Cloud');
    return productsApiClient
      .get(`${credentials.standardBaseURL}/ProductCollection?$skip=${skip}&$top=${top}&$inlinecount=allpages`)
      .then(response => ({
        results: getResultsFromODataResponse(response.data),
        paginationData: createPaginationDataFrom({ pagination, totalItems: getCountFromODataResponse(response) }),
      }));
  }

  findProductByObjectID(productObjectID) {
    logger.info(`Fetching product ${productObjectID} from Sales Cloud`);
    return productsApiClient
      .get(`${credentials.standardBaseURL}/ProductCollection('${productObjectID}')`)
      .then(productResponse => getResultsFromODataResponse(productResponse.data));
  }
}

module.exports = {
  factory: () => new ProductsAPIClient(),
};
