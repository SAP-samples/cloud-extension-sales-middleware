const cds = require('@sap/cds')

module.exports = cds.service.impl (async function(){
    const { Visits, Drafts, Appendixes } = cds.entities ('sap.uc.salesmiddleware')
    const SalesCloudContact = await cds.connect.to('contact');
    const { Ratings } = await this.entities


    this.on ('READ', Ratings, async (req) => {
        //const tx = SalesCloudContact.transaction(req)
        //const response = await tx.get(`/CorporateAccountCustomerABCClassificationCodeCollection`)
        req.info({
            "code": 200,
            "message": `Project  Status Changed Successfully`,
            "numericSeverity": 1
        })
        return cds.run(SELECT.from(Ratings))
    })

    this.on ('getRatings', async (req) => {
        req.info({
            "code": 200,
            "message": `Get Rating action was called`
        })
        return 1000
    })

})