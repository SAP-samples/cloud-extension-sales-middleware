const _getNextPage = (totalItems, currentPageNumber, pageSize) => {
  const numberOfPages = Math.ceil(totalItems / pageSize);
  if (currentPageNumber < (numberOfPages - 1)) {
    return Number(currentPageNumber) + 1;
  }
  return null;
};

const createPaginationDataFrom = ({ pagination, totalItems }) => {
  const currentPageNumber = Number(pagination.page);
  const pageSize = Number(pagination.size);
  return {
    pageSize,
    totalItems: Number(totalItems),
    currentPageNumber,
    nextPage: _getNextPage(totalItems, currentPageNumber, pageSize),
  };
};
module.exports = { createPaginationDataFrom };
