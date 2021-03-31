
//
// if (req.params.length > 0) {
//     const { ObjectID } = req.params[0]
//     if (ObjectID) {
//         let result = undefined
//         cache.findVisitById(ObjectID)
//             .then((cached) => {
//                 if (cached.cacheHit) {
//                     result = cached.result
//                 }
//             });
//         if (result) {
//             return result
//         }
//     }
// }
//
// const cacheItem = (visit) => cache.cacheVisit(sanitize(visit))
// return await remoteActivityService.forwardV2(req)
//     .then((items) => {
//         if (items instanceof Array) {
//             items.map(cacheItem)
//         } else {
//             cacheItem(items)
//         }
//         return items
//     })
//     .catch(err => {
//         if (!err.response) {
//             req.reject(400, err.message)
//         } else {
//             req.reject(err.response.status, `${err.response.statusText}; ${err.message}`)
//         }
//     });

const executeWithCache = async (req, remoteServiceForward, cacheFinding, cachePersisting) => {
    if (req.params.length > 0) {
        const { ObjectID } = req.params[0]
        if (ObjectID) {
            let result = undefined
            cacheFinding(ObjectID)
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

    return await remoteServiceForward(req)
        .then((items) => {
            if (items instanceof Array) {
                items.map(cachePersisting)
            } else {
                cachePersisting(items)
            }
            return items
        })
        .catch(err => {
            if (!err.response) {
                req.reject(400, err.message)
            } else {
                req.reject(err.response.status, `${err.response.statusText}; ${err.message}`)
            }
        });
};

const executeWithoutCache = async (req, remoteServiceForward) => {
    return await remoteServiceForward(req)
        .catch(err => {
            if (!err.response) {
                req.reject(400, err.message)
            } else {
                req.reject(err.response.status, `${err.response.statusText}; ${err.message}`)
            }
        });
};

module.exports = {
    executeWithCache,
    executeWithoutCache,
}
