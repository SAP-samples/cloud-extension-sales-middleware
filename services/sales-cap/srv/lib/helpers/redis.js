const {
  flatten, isNull, isUndefined, isEmpty, replace,
} = require('lodash');
const {
  values: { EMPTY_STRING }, cache: { keys: { separator, namespace } },
} = require('../constants/constants');

const flattenPipelineResponse = (pipelineResult) => flatten(pipelineResult)
  .filter(result => !isNull(result) && !isUndefined(result));

const buildCacheKeyFrom = ({
  id = EMPTY_STRING, type = EMPTY_STRING, userId = EMPTY_STRING, date = EMPTY_STRING, page = EMPTY_STRING, pageSize = EMPTY_STRING,
}) => [type, userId, id, date, page, pageSize].filter(keyToken => keyToken !== EMPTY_STRING).join(separator);

/**
 * This function asynchronously scans for all the keys in the given redis client and aggregates them into an array.
 * If no key matches, an empty array is returned.
 *
 * @param redis - the redis client to use.
 * @param pattern - the pattern to scan for.
 * @returns {Promise<string[]>} - an asynchronous array of strings, representing the keys matching the pattern.
 */
const findKeys = (redis, pattern) => new Promise((resolve, reject) => {
  const stream = redis.scanStream({
    match: `${namespace}${separator}${pattern}`,
    count: 100,
  });
  const foundKeys = [];
  stream.on('data', (keys = []) => {
    if (!isEmpty(keys)) {
      foundKeys.push(...keys.map(key => replace(key, namespace, EMPTY_STRING)));
    }
  });
  stream.on('error', (err) => reject(err));
  stream.on('end', () => resolve(foundKeys));
});

const transformNumericResponseToBoolean = (numericResponse) => numericResponse !== 0;

/**
 * Splits a given cache key into the constituent components, removing the first two elements (namespace and locale).
 *
 * @param cacheKey - the key to split into components.
 * @returns {string[]} - an array of constituent components for this cache key.
 */
const splitKeyIntoComponents = (cacheKey = EMPTY_STRING) => cacheKey.split(separator).slice(2);

module.exports = {
  flattenPipelineResponse,
  findKeys,
  buildCacheKeyFrom,
  splitKeyIntoComponents,
  transformNumericResponseToBoolean,
};
