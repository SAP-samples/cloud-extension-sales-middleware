using { sap.uc.salesmiddleware as db } from '../db/schema';
using { managed, cuid } from '@sap/cds/common';


using { businessuser as ExternalBusinessUser } from './external/businessuser.csn';
service UserService @(path:'/user') @(impl:'./lib/user-service.js') {
    //@cds.autoexpose
    //@sap.persistence.skip
    //view BusinessUsers ( userId: String )
    //  as SELECT FROM ExternalBusinessUser.BusinessUsers WHERE UserID=:userId;

    type UserProfileDetails {
      id: String;
      name: String;
      companyName: String;
      department: String;
      email: String;
      jobName: String;
      location: String;
      phoneNumber: String;
    };
    // GET /user/Profile(userId='asdasd')
    function Profile (userId: String) returns UserProfileDetails;


    action data() returns String;
}
