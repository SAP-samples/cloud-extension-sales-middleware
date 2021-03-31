const cds = require('@sap/cds')
const logger = require('./logger/console')("CAP ContactsService")
const cache = require('./cache/contacts-cache-client')
const { sanitize } = require('./helpers/utils');

module.exports = cds.service.impl (async (srv) => {
    const { remoteContactService } = await require('./external')

    // const _findContactByObjectID = (ObjectID, req) => {
    //     return cache.findContactByUUID(ObjectID)
    //         .then((cached) => {
    //             if (cached.cacheHit) {
    //                 return cached.result
    //             }
    //             return remoteContactService.findContactByObjectID(ObjectID)(req)
    //                 .then(item => cache.populateInCache(sanitize(item))).catch(err => {
    //                     req.reject(400, err.message)
    //                 })
    //         })
    // };
    //
    // srv.on('findContactByObjectID', async (req) => {
    //     return await _findContactByObjectID(req.data.objectId, req);
    // })

    srv.on ('READ', 'ContactCollection',async (req) => {
        if (req.params.length > 0) {
            const { ObjectID } = req.params[0]
            if (ObjectID) {
                let result = undefined
                cache.findContactByUUID(ObjectID)
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
    })
})
