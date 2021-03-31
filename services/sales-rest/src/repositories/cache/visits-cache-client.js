const { isEmpty } = require('lodash');
const moment = require('moment');
const { flattenPipelineResponse, findKeys, splitKeyIntoComponents } = require('../../helpers/redis');
const {
  cache: { keys: { expiration, formats, search } },
  values,
} = require('../../constants/constants');
const { buildCacheKeyFrom } = require('../../helpers/redis');
const { buildFormattedTime } = require('../../helpers/time');
const { splitAt } = require('../../helpers/utils');
const { createDateFrom } = require('./../../helpers/odata');
const logger = require('../../logger/console')("VisitsCacheClient");

class VisitsCacheClient {
  constructor(cache) {
    this.cache = cache;
  }

  _getVisitIdsBy(visitsSetKey) {
    return this
      .cache
      .smembers(visitsSetKey)
      .then(visitIds => {
        if (isEmpty(visitIds)) {
          return { cacheHit: false, result: [] };
        }
        return { cacheHit: true, result: visitIds.filter(visitId => visitId !== values.NO_VISITS) };
      });
  }

  findVisitsBy({ userId, date }) {
    const visitsSetKey = this._buildVisitsSetKey(userId, date);
    return this._getVisitIdsBy(visitsSetKey)
      .then(visitIds => {
        if (visitIds.cacheHit) {
          logger.info(`Fetching cached visits from userSetKey: ${visitsSetKey}`);
          return this
            ._getVisitsFromCache(visitIds.result)
            .then(visits => ({ result: visits, cacheHit: true }));
        }
        return { cacheHit: false, result: [] };
      });
  }

  _getVisitsFromCache(visitIds) {
    return visitIds
      .reduce((pipeline, visitId) => pipeline.hgetall(this._buildVisitKey(visitId)), this.cache.pipeline())
      .exec()
      .then(flattenPipelineResponse);
  }

  findVisitById(visitId) {
    return this
      .cache
      .hgetall(this._buildVisitKey(visitId))
      .then(visit => {
        if (isEmpty(visit)) {
          return { result: {}, cacheHit: false };
        }
        return { result: visit, cacheHit: true };
      });
  }

  cacheVisits({ userId, date, visits }) {
    // eslint-disable-next-line no-new
    new Promise((resolve, reject) => {
      const pipeline = this.cache.pipeline();
      const userVisitDateKey = this._buildVisitsSetKey(userId, date);

      pipeline
        .sadd(userVisitDateKey, [values.NO_VISITS, ...visits.map(visit => visit.ObjectID)])
        .expire(userVisitDateKey, expiration.visit);
      visits
        .forEach(visit => {
          const visitKey = this._buildVisitKey(visit.ObjectID);
          pipeline
            .hset(visitKey, visit)
            .expire(visitKey, expiration.visit);
        });
      pipeline
        .exec()
        .then(resolve)
        .catch(reject);
    });
    return visits;
  }

  deleteFromCache(visitId) {
    return this
      .findVisitById(visitId)
      .then(cachedVisit => {
        if (!cachedVisit.cacheHit) {
          return Promise.resolve();
        }
        const visit = cachedVisit.result;
        const userVisitSetKey = this._buildVisitsSetKey(visit.Owner, createDateFrom(visit.StartDateTime));
        logger.info(`Deleted visit from cache with ID: ${visitId}`);
        return this
          .cache
          .pipeline()
          .del(this._buildVisitKey(visitId)) // delete visit object
          .srem(userVisitSetKey, visitId) // delete visit from user set
          .exec();
      });
  }

  addNewVisitInCache(visitODataResponse) {
    return new Promise((resolve, reject) => {
      const userVisitDateKey = this._buildVisitsSetKey(visitODataResponse.Owner, createDateFrom(visitODataResponse.StartDateTime));
      this
        .cache
        .exists(userVisitDateKey)
        .then(existsUserSetKey => {
          if (existsUserSetKey === 0) {
            logger.info(`Visit not cached. UserSetKey not found for visitId: ${visitODataResponse.ObjectID}`);
            resolve(false);
          } else {
            logger.info(`add new visit in cache with id:${visitODataResponse.ObjectID}`);
            const visitCacheKey = this._buildVisitKey(visitODataResponse.ObjectID);
            const pipeline = this
              .cache
              .pipeline()
              .sadd(userVisitDateKey, visitODataResponse.ObjectID)
              .expire(userVisitDateKey, expiration.visit);
            pipeline
              .hset(visitCacheKey, visitODataResponse)
              .expire(visitCacheKey, expiration.visit);
            pipeline
              .exec()
              .then(resolve)
              .catch(reject);
          }
        });
    });
  }

  cacheVisit(visitId, visit) {
    const visitCacheKey = this._buildVisitKey(visitId);
    this
      .cache
      .hgetall(visitCacheKey)
      .then(cachedVisit => {
        if (isEmpty(cachedVisit)) {
          // eslint-disable-next-line no-new
          new Promise((resolve, reject) => {
            const pipeline = this
              .cache
              .pipeline()
              .hset(visitCacheKey, visit)
              .expire(visitCacheKey, expiration.visit);
            pipeline
              .exec()
              .then(resolve)
              .catch(reject);
          });
        }
      });
    return visit;
  }

  updateCachedVisit(oldVisit, newVisit) {
    return this._updateCachedVisit(oldVisit, newVisit)
      .then(() => logger.info(`Visit ${newVisit.ObjectID} successfully updated in cache.`));
  }

  updateVisitInCache(updatedVisit) {
    return this
      .findVisitById(updatedVisit.ObjectID)
      .then(cachedVisit => {
        if (cachedVisit.cacheHit) {
          logger.info(`Updated visit found in cache: ${updatedVisit.ObjectID}`);
          return this.updateCachedVisit(cachedVisit.result, updatedVisit);
        }
        logger.info(`Updated visit not found in cache: ${updatedVisit.ObjectID}`);
        return false;
      });
  }

  _updateCachedVisit(cachedVisit, updatedVisit) {
    const pipeline = this
      .cache
      .pipeline()
      .hset(this._buildVisitKey(updatedVisit.ObjectID), updatedVisit);

    const isOwnerChanged = cachedVisit.Owner !== updatedVisit.Owner;
    const isStartTimeChanged = cachedVisit.StartDateTime !== updatedVisit.StartDateTime;
    if (isOwnerChanged || isStartTimeChanged) {
      return this
        ._moveVisitCacheEntryToNewKeyIfPresent(pipeline, cachedVisit, updatedVisit)
        .then(() => pipeline.exec());
    }
    return pipeline.exec();
  }

  _buildVisitsSetKeySearchPattern(userId) {
    return buildCacheKeyFrom({
      userId,
      date: search.all,
      type: 'userVisits',
    });
  }

  _belongsToUserVisitSetTimeInterval(visitStartDate, visitSetKey) {
    const [, , dateWithTimezone] = splitKeyIntoComponents(visitSetKey);
    // The key format is 2020-02-20+0X00 for UTC+X
    const [date, timezone] = splitAt(dateWithTimezone, 10);
    const newKeyDate = moment(date).utcOffset(timezone);

    return visitStartDate.isBetween(newKeyDate.startOf('day'), newKeyDate.endOf('day'));
  }

  /**
   * Given an owner or start time difference between the {@param cachedVisit} and the {@param updatedVisit}, this method
   * will remove the cached visit from the current userVisit set and move it to the appropriate one (as per updatedVisit's state).
   * As the userVisits cache key contains timezone offsets (e.g. userVisits/u1234/2001-02-01+0003), the cache update
   * algorithm will proceed as follows:
   *  - search for all the old keys and the new using a match-all pattern for the date component.
   *  - in a redis pipeline (i.e. atomically):
   *  - for all the old keys found, remove the visit id from the set (SREM has remove-if-present semantics)
   *  - for all the new keys found, parse the date (with timezone) part and check if the visit would fit in the day interval
   *    - if the visit fits in the day interval
   *       - add visit id to the respective set
   *  - if the key fits none of the new sets
   *    - delete visit entry from cache
   *
   * @param pipeline - the pipeline to execute the modifying operations within
   * @param cachedVisit - the visit state persisted in the cache
   * @param updatedVisit - the visit state coming from ACE
   * @returns {Promise<void>} - an empty promise
   */
  _moveVisitCacheEntryToNewKeyIfPresent(pipeline, cachedVisit, updatedVisit) {
    return Promise
      .all([
        findKeys(this.cache, this._buildVisitsSetKeySearchPattern(cachedVisit.Owner)),
        findKeys(this.cache, this._buildVisitsSetKeySearchPattern(updatedVisit.Owner)),
      ])
      .then(([oldUserVisitsSetKeys, newUserVisitsSetKeys]) => {
        oldUserVisitsSetKeys.forEach(userVisitsKey => pipeline.srem(userVisitsKey, updatedVisit.ObjectID));

        const updatedVisitStartDate = createDateFrom(updatedVisit.StartDateTime);
        const isVisitAddedToAnyNewSet = newUserVisitsSetKeys
          .reduce((visitAddedToNewSetInPreviousSteps, newVisitsSetKey) => {
            if (this._belongsToUserVisitSetTimeInterval(updatedVisitStartDate, newVisitsSetKey)) {
              logger.info(`Adding visit ${updatedVisit.ObjectID} to ${newVisitsSetKey}.`);
              pipeline.sadd(newVisitsSetKey, updatedVisit.ObjectID);
              return true;
            }
            return visitAddedToNewSetInPreviousSteps;
          }, false);

        if (!isVisitAddedToAnyNewSet) {
          logger.info(`No target userVisits sets were found, removing ${updatedVisit.ObjectID} from cache.`);
          pipeline.del(this._buildVisitKey(updatedVisit.ObjectID));
        }
      });
  }

  _buildVisitsSetKey(userId, date) {
    return this._buildUserVisitSetKeyWithFormat(userId, date, formats.dateWithTimezone);
  }

  _buildUserVisitSetKeyWithFormat(userId, date, dateFormat) {
    return buildCacheKeyFrom({
      userId,
      date: buildFormattedTime({ date, format: dateFormat }),
      type: 'userVisits',
    });
  }

  _buildVisitKey(visitId) {
    return buildCacheKeyFrom({
      type: 'visits',
      id: visitId,
    });
  }
}

module.exports = {
  factory: (cache) => new VisitsCacheClient(cache),
};
