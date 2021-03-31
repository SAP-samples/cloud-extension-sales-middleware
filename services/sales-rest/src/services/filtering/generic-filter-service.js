const { isEmpty } = require('lodash');

const filterByStatus = ({ items, itemStatuses, statusFilters }) => {
  if (isEmpty(statusFilters)) {
    return items;
  }
  const capitalizedStatusFilters = statusFilters.map(status => status.toUpperCase());
  return items.filter(item => capitalizedStatusFilters.includes(itemStatuses[item.Status]));
};

const filterByAccount = (items, accountId) => {
  if (isEmpty(accountId)) {
    return items;
  }
  return items
    .filter(item => item.account !== null)
    .filter(item => item.account.id === accountId);
};

module.exports = {
  filterByStatus, filterByAccount,
};
