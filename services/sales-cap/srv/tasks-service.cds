using { sap.uc.salesmiddleware as db } from '../db/schema';

using { activity as ExternalActivity } from './external/activity.csn';
service TasksService @(path:'/tasks') @(impl:'./lib/tasks-service.js') {

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
    entity TasksInvolvedPartiesCollection as projection on ExternalActivity.TasksInvolvedPartiesCollection;
    define type TasksInvolvedPartiesType: Association to many TasksInvolvedPartiesCollection;


    //Entity from Sales Cloud TasksTextCollectionCollection
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
    entity TasksTextCollection as projection on ExternalActivity.TasksTextCollectionCollection;
    define type TasksTextType: Association to many TasksTextCollection;

    //Entity from Sales Cloud TasksAttachmentFolderCollection
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
    entity TasksAttachmentFolderCollection as projection on ExternalActivity.TasksAttachmentFolderCollection;
    define type TasksAttachmentFolderType: Association to many TasksAttachmentFolderCollection;

    //Entity from Sales Cloud TasksBTDReferenceCollection
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
    entity TasksBTDReferenceCollection as projection on ExternalActivity.TasksBTDReferenceCollection;
    define type TasksBTDReferenceType: Association to many TasksBTDReferenceCollection;


    //Entity from Sales Cloud TaskCollection
    @Capabilities: {
        Readable : true,
        Insertable : false,
        Deletable  : false,
        Updatable  : false
    }
    @cds.autoexpose
    @cds.persistence.exists
    @mashup
    entity TasksCollection as projection on ExternalActivity.TasksCollection {
        *,
        TasksBTDReference: TasksBTDReferenceType,
        TasksAttachmentFolder: TasksAttachmentFolderType,
        TasksTextCollection: TasksTextType,
        TasksInvolvedParties: TasksInvolvedPartiesType
    };

    //action findTasksTextByObjectID(objectId: String) returns TasksTextCollection;
}
