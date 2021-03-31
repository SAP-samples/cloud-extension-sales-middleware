const logger = require('../logger/console')("External Activity")
const { HandlerEnum, ActionOnHandlers } = require('./entity-updater')

module.exports = async (cds) => {
    const srv = await cds.connect.to('activity')
    const {
        TasksCollection,
        TasksTextCollectionCollection,
        TasksInvolvedPartiesCollection,
        TasksAttachmentFolderCollection,
        TasksBTDReferenceCollection,
        VisitCollection,
    } = srv.entities

    logger.info(`External activity options: ${JSON.stringify(srv.options)}`)
    const updaters = {
        OnVisitCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
                'dataloader1_KUT',
                'Binary',
            ]),
            HandlerEnum.dateODataV2toV4([
                ['StartDateTime'],
                ['EndDateTime'],
                ['ActualStartDateTime'],
                ['EntityLastChangedOn'],
                ['CreationDateTime'],
                ['ReportedDateTime'],
                ['LastChangeDateTime'],
                ['ETag'],
                ['CreatedOn'],
                ['LastUpdatedOn'],
            ]),
        ]),
        OnTasksCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
                'dataloader1_KUT',
                'Binary',
            ]),
            HandlerEnum.dateODataV2toV4([
                ['ReportedDateTime'],
                ['LastChangeDateTime'],
                ['EntityLastChangedOn'],
                ['DueDateTime'],
                ['StartDateTime'],
                ['ETag'],
                ['LastUpdatedOn'],
                ['CompletionDateTime'],
                ['CreatedOn'],
                ['UpdatedOn'],
            ]),
        ]),
        OnVisitPartyCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
            ]),
            HandlerEnum.dateODataV2toV4([
                ['ETag'],
            ]),
        ]),
        OnVisitAttachmentCollection: ActionOnHandlers([
            HandlerEnum.updateByRemovingFieldsWithEmptyValue(),
            HandlerEnum.updateByRemovingFields([
            ]),
            HandlerEnum.dateODataV2toV4([
                ['ETag'],
            ]),
        ]),
    };

    const entityUpdaters = {
        VisitCollection: updaters.OnVisitCollection,
        TasksCollection: updaters.OnTasksCollection,
        VisitPartyCollection: updaters.OnVisitPartyCollection,
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
            return srv.tx(req).run(req.query)
                .then(updaters.OnVisitCollection);
        },

        findVisitsByObjectID: (objectId) => {
            const query = SELECT.one.from(VisitCollection)
                .where({ObjectID: objectId}).columns('*');


            return (req) => {
                return srv.tx(req).run(query)
                    .then(updaters.OnVisitCollection)
            }
        },

        findTasksByObjectID: (objectId) => {
            const query = SELECT.one.from(TasksCollection)
                .where({ObjectID: objectId})
                .columns('*');

            return (req) => {
                return srv.tx(req).run(query)
                    .then(updaters.OnTasksCollection)
            }
        },

        // findTasksTextByObjectID: (objectId) => {
        //     const query = SELECT.from(TasksTextCollectionCollection)
        //         .where({ParentObjectID: objectId}).columns('*')
        //
        //     return (req) => {
        //         return srv.tx(req).run(query)
        //             .then((result) => {
        //                 result.forEach(updaters.OnTasksTextCollectionCollection)
        //                 return result
        //             })
        //     }
        // },
    }
};
