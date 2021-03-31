const axios = require('axios');

const logger = require('../logger/console')("External Contact")
const { HandlerEnum, ActionOnHandlers } = require('./entity-updater')

module.exports = async (cds) => {
    const srv = await cds.connect.to('contact')
    const { CorporateAccountCollection, ContactCollection } = srv.entities

    logger.info(`External contact options: ${JSON.stringify(srv.options)}`)
    // const credentials = srv.options.credentials
    // const createRestAPIClient = () => axios.create({
    //     auth: { username: credentials.username, password: credentials.password },
    //     xsrfHeaderName: 'x-csrf-token',
    // });

    const updaters = {
        OnCorporateAccountCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
                'mul1',
                // 'CorporateAccountAddress',
                // 'CorporateAccountAttachmentFolder',
                // 'CorporateAccountHasContactPerson',
                // 'CorporateAccountIdentification',
                // 'CorporateAccountInternationalVersion',
                // 'CorporateAccountSalesData',
                // 'CorporateAccountSkills',
                // 'CorporateAccountTaxNumber',
                // 'CorporateAccountTeam',
                // 'CorporateAccountTextCollection',
                // 'CorporateAccountVisitingHours',
                // 'CorporateAccountVisitingInformationDetails',
                // 'OwnerEmployeeBasicData',
                // 'ParentAccount',
                // 'POBoxIndicator',
                // 'SalesSupportBlockingIndicator',
                // 'LegalCompetenceIndicator',
            ]),
            HandlerEnum.dateODataV2toV4([
                ['NextVisitingDate', 'YYYY-MM-DD'],
                ['ChangedOn'],
                ['CreationOn'],
                ['EntityLastChangedOn'],
                ['ETag'],
            ]),
        ]),
        OnContactCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
                // 'ContactAttachmentFolder',
                // 'ContactInternationalVersion',
                // 'ContactIsContactPersonFor',
                // 'ContactOwnerEmployeeBasicData',
                // 'ContactPersonalAddress',
                // 'ContactTextCollection',
                // 'CorporateAccount',
                // 'EmailInvalidIndicator',
            ]),
            HandlerEnum.dateODataV2toV4( [
                ['CreationOn'],
                ['ChangedOn'],
                ['EntityLastChangedOn'],
                ['ETag'],
                ['BirthDate', 'YYYY-MM-DD'],
            ]),
        ]),
    };

    const entityUpdaters = {
        CorporateAccountCollection: updaters.OnCorporateAccountCollection,
        ContactCollection: updaters.OnContactCollection,
    };

    return {
        forwardV2: (req) => {
            const queryBuc = req._.req.url
            const key = queryBuc.match(/([A-Za-z0-9]{1,})/g)[0]
            const entityUpdater = entityUpdaters[key]
            return srv.tx(req).run(queryBuc)
                .then((items) => {
                    if (items instanceof Array) {
                        items.map(entityUpdater)
                    } else {
                        entityUpdater(items)
                    }
                    return items;
                });
        },

        forward: (req) => {
            return srv.tx(req).run(req.query);
        },

        findAccountByObjectID: (objectId) => {
            const query = SELECT.one.from(CorporateAccountCollection)
                .where({ObjectID: objectId}).columns('*')

            return (req) => {
                return srv.tx(req).run(query)
                    .then(updaters.OnCorporateAccountCollection)
            }
        },
        findContactByObjectID: (objectId) => {
            const query = SELECT.one.from(ContactCollection)
                .where({ObjectID: objectId}).columns('*')

            return (req) => {
                return srv.tx(req).run(query)
                    .then(updaters.OnContactCollection)
            }
        },
        getCorporateAccountCustomerABCClassificationCodeCollection: (req) => {
            return srv.tx(req).run('CorporateAccountCustomerABCClassificationCodeCollection')
                .then((items) => {
                    if (items) {
                        return items.map((r) => {
                            return { Code: r.Code, Description: r.Description }
                        })
                    }
                    return []
                });
        },
    }
};
