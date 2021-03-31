using { sap.uc.salesmiddleware as db } from '../db/schema';

using { contact as ExternalContact } from './external/contact.csn';
service AccountsService @(path:'/accounts') @(impl:'./lib/accounts-service.js') {
    //Mashup Entity from Sales Cloud CorporateAccountCollection
    @Capabilities: {
        Readable : true,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity CorporateAccountCollection as projection on ExternalContact.CorporateAccountCollection;


    //action findAccountByObjectID(objectId: String) returns array of AccountCollection;
    //action findAccountByObjectID(objectId: String) returns AccountCollection;
    function CorporateAccountCustomerABCClassificationCodeCollection() returns array of {
       Code : String;
       Description : String;
    };
}
