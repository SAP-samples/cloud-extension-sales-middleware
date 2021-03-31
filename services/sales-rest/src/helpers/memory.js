const { get } = require('lodash');

const MEMORY_KEYS = [
  'userId',
  'visitsDate',
  'templates',
  'timeZone',
];

const MAP_MEMORY_KEY_TO_KEYWORD = {
  userId: 'userId',
  visitsDate: 'visitsDate',
  templates: 'templates',
  timeZone: 'timeZone',
};

const extractValuesFromMemory = memory => Object.keys(memory)
  .filter(key => MEMORY_KEYS.includes(key))
  .reduce((obj, key) => {
    const mappedKey = MAP_MEMORY_KEY_TO_KEYWORD[key];
    return {
      ...obj,
      [mappedKey]: get(memory, `${key}`) || get(memory, `${key}`, ''),
    };
  }, {});

module.exports = {
  MEMORY_KEYS,
  extractValuesFromMemory,
};
