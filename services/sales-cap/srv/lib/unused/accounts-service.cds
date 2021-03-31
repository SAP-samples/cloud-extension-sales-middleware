using { sap.uc.salesmiddleware as db } from '../db/schema';

service AccountsService @(path:'/accounts') @(impl:'./lib/accounts-service.js') {
    entity Ratings as projection on db.Ratings;
    annotate Ratings with @odata.draft.enabled;

    action getRatings() returns Integer;

    //@requires_: 'authenticated-user'
    //action RatingsCollection(amount: Integer) returns String;
}

// Access control restrictions
annotate AccountsService.Ratings with @restrict:[
   { grant:'READ',   to:'any' },                 // everybody can read reviews
  //{ grant:'CREATE', to:'authenticated-user' },  // users must login to add reviews
  /////////////////////////////////////////////////
  //
  // Temporarily disabling this due to glitch in CAP Node.js runtime:
  // { grant:'UPDATE', to:'authenticated-user', where:'reviewer=$user' },
  // -> reenable it when the issue is fixed
  //   { grant:'UPDATE', to:'authenticated-user' },
  //
  ////////////////////////////////////////////////////
  //{ grant:'DELETE', to:'admin' },
];

annotate AccountsService with @restrict:[
  { grant:'getRatings', to:'any' },
];
