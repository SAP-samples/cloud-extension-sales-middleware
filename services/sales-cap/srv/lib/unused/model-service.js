const cds = require('@sap/cds')

module.exports = async (srv) => {
    srv.after('READ', 'Visits', (visits) => {

        visits.forEach((visit) => {
        });
    });

    // srv.on('READ', 'Risks', (req, next) => {
    //     req.query.SELECT.columns = req.query.SELECT.columns.filter(({ expand, ref }) => !(expand && ref[0] === 'bp'));
    //     return next();
    // });

    // const BupaService = await cds.connect.to('API_BUSINESS_PARTNER');
    // srv.on('READ', srv.entities.BusinessPartners, async (req) => {
    //     const res = await BupaService.tx(req).run(req.query.redirectTo(BupaService.entities.A_BusinessPartner))
    //     return res;
    // });
}