const cds = require('@sap/cds');
const { request } = require('express');

const { constants: { visitNoteFormatter }, values: { NEW_LINE } } = require('./constants/constants');
const { sanitize } = require('./helpers/utils');

const logger = require('./logger/console')("CAP VisitsService")
const cache = require('./cache/visits-cache-client')

const { replaceEmptyTagContentWith, decodeHTMLEntities, stripHTML } = require('./helpers/html-utils')
const { executeWithCache, executeWithoutCache } = require('./helper-servce')

module.exports = cds.service.impl (async (srv) => {
    const { remoteActivityService } = await require('./external')
    const accountsService = await cds.connect.to('AccountsService')


    // const _findVisitByObjectID = (ObjectID, req) => {
    //     return cache.findVisitById(ObjectID)
    //         .then((cached) => {
    //             if (cached.cacheHit) {
    //                 return sanitize(cached.result)
    //             }
    //             return remoteActivityService.findVisitsByObjectID(ObjectID)(req)
    //                 .then(item => cache.cacheVisit(sanitize(item)))
    //                 .catch(err => {
    //                     req.reject(400, err.message)
    //                 })
    //         });
    // };

    srv.on ('READ', 'VisitCollection', async (req) => {
        return executeWithCache(
            req,
            (req) => remoteActivityService.forwardV2(req),
            (objectId) => cache.findVisitById(objectId),
            (visit) => cache.cacheVisit(sanitize(visit)),
        );
    });

    srv.on ('READ', 'VisitPartyCollection', async (req) => {
        return executeWithoutCache(
            req,
            (req) => remoteActivityService.forwardV2(req)
        );
    });


})
