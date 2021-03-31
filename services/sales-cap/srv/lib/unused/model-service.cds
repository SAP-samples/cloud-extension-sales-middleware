using { sap.uc.salesmiddleware as db } from '../db/schema';

service ModelService {
    @readonly entity Visits as projection on db.Visits
        annotate Visits with @odata.draft.enabled;
    @readonly entity Drafts as projection on db.Drafts
        annotate Drafts with @odata.draft.enabled;
    @readonly entity Appendixes as projection on db.Appendixes
        annotate Appendixes with @odata.draft.enabled;
}