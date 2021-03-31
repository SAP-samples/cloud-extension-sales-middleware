const cds = require('@sap/cds')
const logger = require('./logger/console')("CAP UsersService")

module.exports = cds.service.impl (async (srv) => {
    const { remoteBusinessUserService } = await require('./external')

    srv.on ('Profile', async (req) => {
        const { userId } = req.data
        if (userId === undefined | userId === '') {
            req.reject("Value of userId parameter wasn't specified!")
        }
        return remoteBusinessUserService.findUserByIdAsEmployee(req, userId)
    })


    srv.on ('data', async (req, next) => {
        logger.info(`Params: ${JSON.stringify(req.params)}`)
        logger.info(`Data: ${JSON.stringify(req.data)}`)
        logger.info(`Express Params: ${JSON.stringify(req._.req.params)}`)
        return `${req._.req.params.id}`
    })
})
