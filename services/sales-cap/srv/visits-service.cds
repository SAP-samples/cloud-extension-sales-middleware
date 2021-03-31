using { sap.uc.salesmiddleware as db } from '../db/schema';

using { activity as ExternalActivity } from './external/activity.csn';
service VisitsService @(path:'/visits') @(impl:'./lib/visits-service.js') {


    //Mashup Entity from Sales Cloud VisitPartyCollection
    @Capabilities: {
        Readable : false,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity VisitPartyCollection as projection on ExternalActivity.VisitPartyCollection;
    define type VisitPartyType: Association to many VisitPartyCollection;


    //Mashup Entity from Sales Cloud VisitAttachmentCollection
    @Capabilities: {
        Readable : false,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity VisitAttachmentCollection as projection on ExternalActivity.VisitAttachmentCollection;
    define type VisitAttachmentType: Association to many VisitAttachmentCollection;


    //Mashup Entity from Sales Cloud VisitAttachmentCollection
    @Capabilities: {
        Readable : false,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity VisitBTDReferenceCollection as projection on ExternalActivity.VisitBTDReferenceCollection;
    define type VisitBTDReferenceType: Association to many VisitBTDReferenceCollection;

    //Mashup Entity from Sales Cloud VisitTextCollectionCollection
    @Capabilities: {
        Readable : false,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity VisitTextCollection as projection on ExternalActivity.VisitTextCollectionCollection;
    define type VisitTextType: Association to many VisitTextCollection;

    //Mashup Entity from Sales Cloud VisitTextCollectionCollection
    @Capabilities: {
        Readable : false,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @sap.persistence.skip
    @cds.persistence.exists
    @mashup
    entity VisitWorklistItemCollection as projection on ExternalActivity.VisitWorklistItemCollection;
    define type VisitWorklistItemType: Association to many VisitWorklistItemCollection;

    //Mashup Entity from Sales Cloud VisitCollection
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
    entity VisitCollection as projection on ExternalActivity.VisitCollection {
        *,
        VisitParty : VisitPartyType,
        VisitAttachment: VisitAttachmentType,
        VisitBTDReference: VisitBTDReferenceType,
        VisitWorklistItem: VisitWorklistItemType,
        VisitTextCollection: VisitTextType
    };

}
