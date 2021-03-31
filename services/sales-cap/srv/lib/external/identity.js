const logger = require('../logger/console')("External Identity")

module.exports = async (cds) => {
    const srv = await cds.connect.to('identity')
    logger.info(`External identity options: ${JSON.stringify(srv.options)}`)

    return {

    }
};
