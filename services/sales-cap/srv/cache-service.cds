using { sap.uc.salesmiddleware as db } from '../db/schema';
using { managed, cuid } from '@sap/cds/common';

service CacheService @(path:'/cache') @(impl:'./lib/cache-service.js') {
    // GET /cache/Clearing
    action Clearing();
}