using { sap.uc.salesmiddleware as db } from '../db/schema';

using { contact as ExternalContact } from './external/contact.csn';
service ContactsService @(path:'/contacts') @(impl:'./lib/contacts-service.js') {
    //Mashup Entity from Sales Cloud ContactCollection
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
    entity ContactCollection as projection on ExternalContact.ContactCollection;

    //action findContactByObjectID(objectId: String) returns ContactCollection;
}
