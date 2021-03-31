const cds = require('@sap/cds')

const logger = require('./logger/console')("CAP TasksService")
const cache = require('./cache/tasks-cache-client')
const { sanitize } = require('./helpers/utils');

module.exports = cds.service.impl (async (srv) => {
    const { remoteActivityService } = await require('./external')

    // const _findTaskByObjectID = (taskObjectID, req) => {
    //     return cache.findTaskByObjectId(taskObjectID)
    //         .then((cached) => {
    //             if (cached.cacheHit) {
    //                 return cached.result
    //             }
    //             return remoteActivityService.findTasksByObjectID(taskObjectID)(req)
    //                 .then(item => cache.populateTaskInCache(sanitize(item))).catch(err => {
    //                     req.reject(400, err.message)
    //                 })
    //         });
    // };
    // const _findTaskTextByObjectID = (taskObjectID, req) => {
    //     return cache.findTaskByObjectId(taskObjectID)
    //         .then((cached) => {
    //             if (cached.cacheHit) {
    //                 return cached.result
    //             }
    //
    //             return remoteActivityService.findTasksTextByObjectID(taskObjectID)(req)
    //                 .then(item => cache.populateTaskInCache(sanitize(item))).catch(err => {
    //                     req.reject(400, err.message)
    //                 })
    //         })
    // };



    // srv.on ('findTasksTextByObjectID',async (req) => {
    //     return await _findTaskTextByObjectID(req.data.objectId, req)
    // })

    srv.on ('READ', 'TasksCollection',async (req) => {
        if (req.params.length > 0) {
             const { ObjectID } = req.params[0]
             if (ObjectID) {
                 let result = undefined
                 cache.findTaskByObjectId(ObjectID)
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

        const cacheItem = (item) => cache.populateTaskInCache(sanitize(item))
        return await remoteActivityService.forwardV2(req)
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
