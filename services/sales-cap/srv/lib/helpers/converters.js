const { toUUID } = require('to-uuid');
const { isEmpty } = require('lodash');

const createPaginationResponse = paginationData => ({
  totalItems: paginationData.totalItems,
  currentPageNumber: paginationData.currentPageNumber,
  pageSize: paginationData.pageSize,
  nextPage: paginationData.nextPage,
});

const convertPaginatedResultsToResponseDTO = ({ results, paginationData }, dtoConverterFunction) => ({
  results: dtoConverterFunction(results),
  ...createPaginationResponse(paginationData),
});

const stringToUUID = (uuidString) => {
  if (!uuidString) {
    return null;
  }
  return toUUID(uuidString);
};

const uuidToString = (objectUUID) => {
  if (!objectUUID) {
    return objectUUID;
  }
  return objectUUID.replace(/-/g, '');
};

const isInteger = string => !isEmpty(string) && string.match(/^[0-9]+$/) != null;

const toIntegerOrNull = (stringNumber) => {
  if (isInteger(stringNumber)) {
    return Number(stringNumber);
  }
  return null;
};

const objectValuesToInteger = (keyValuesObject) => Object.keys(keyValuesObject)
  .reduce((acc, key) => ({
    ...acc,
    [key]:
    toIntegerOrNull(keyValuesObject[key]),
  }));

module.exports = {
  convertPaginatedResultsToResponseDTO,
  createPaginationResponse,
  stringToUUID,
  uuidToString,
  objectValuesToInteger,
};
