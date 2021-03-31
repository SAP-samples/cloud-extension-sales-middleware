const cds = require('@sap/cds')
const logger = require('./logger/console')("CAP CacheService")
const cache = require('./cache/manager-cache-client')

module.exports = cds.service.impl (async (srv) => {

    srv.on ('Clearing', async (req) => {
        cache.removeAllKeys();
    })
})
