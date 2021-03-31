const cds = require('@sap/cds')

const logger = require('./logger/console')("CAP AccountsService")
const cache = require('./cache/accounts-cache-client')
const { sanitize } = require('./helpers/utils');

module.exports = cds.service.impl (async (srv) => {
    const { remoteContactService } = await require('./external')

    // const _findAccountByObjectID = (ObjectID, req) => {
    //     return cache.findAccountByObjectID(ObjectID)
    //         .then((cached) => {
    //             if (cached.cacheHit) {
    //                 return cached.result
    //             }
    //             return remoteContactService.findAccountByObjectID(ObjectID)(req)
    //                 .then(item => cache.populateInCache(sanitize(item)))
    //         })
    // };
    //
    // srv.on('findAccountByObjectID', async (req) => {
    //     return await _findAccountByObjectID(req.data.objectId, req).catch(err => {
    //         if (!err.response) {
    //             req.reject(400, err.message)
    //         } else {
    //             req.reject(err.response.status, `${err.response.statusText}; ${err.message}`)
    //         }
    //     });
    // });
    srv.on('CorporateAccountCustomerABCClassificationCodeCollection', async (req) => {
        return await remoteContactService.getCorporateAccountCustomerABCClassificationCodeCollection(req);
    });

    srv.on ('READ', 'CorporateAccountCollection',async (req) => {
        if (req.params.length > 0) {
            const { ObjectID } = req.params[0]
            if (ObjectID) {
                let result = undefined
                cache.findAccountByObjectID(ObjectID)
                    .then((cached) => {
                        if (cached.cacheHit) {
                            result = cached.result
                        }
                    });
                if (result) {
                    return result
                }
            }
        }

        const cacheItem = (item) => cache.populateInCache(sanitize(item))
        return await remoteContactService.forwardV2(req)
            .then((items) => {
                if (items instanceof Array) {
                    items.map(cacheItem)
                } else {
                    cacheItem(items)
                }
                return items
            }).catch(err => {
                if (!err.response) {
                    req.reject(400, err.message)
                } else {
                    req.reject(err.response.status, `${err.response.statusText}; ${err.message}`)
                }
            });
    });
})
