const { isUndefined } = require('lodash');

const generatePayload = (memory, properties) => {
  const payload = {
    replies: [],
    conversation: { memory: { ...memory } },
  };
  if (!isUndefined(properties)) {
    properties.forEach(object => {
      Object.defineProperty(payload.conversation.memory, object.key, {
        value: object.value,
        writable: true,
        enumerable: true,
      });
    });
  }
  return payload;
};

const flattenArray = arr => arr.reduce((a, b) => a.concat(b), []);

const changeArrayElementPosition = (arr, fromIndex, toIndex) => {
  const element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
  return arr;
};

const splitAt = (toBeSplit, index) => [toBeSplit.slice(0, index), toBeSplit.slice(index)];

const sanitize = (entity) => {
  Object.keys(entity).forEach(field => {
    const value = entity[field];
    if (value === undefined || value === null || value === '' || value.__deferred) {
      delete entity[field]
    }
    if (value instanceof Array) {
      value.forEach((elem) => {
        sanitize(elem)
        if (elem.__metadata) {
          delete elem.__metadata
        }
      })
    }
  });
  return entity
}

module.exports = {
  generatePayload,
  flattenArray,
  changeArrayElementPosition,
  splitAt,
  sanitize,
};
