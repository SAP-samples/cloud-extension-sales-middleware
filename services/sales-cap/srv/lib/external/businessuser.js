const logger = require('../logger/console')("External BusinessUser")

// External Connection to Sales Cloud(C4C) to Business User API(https://api.sap.com/api/businessuser/overview)
module.exports = async (cds) => {
    const srv = await cds.connect.to('businessuser')
    const { BusinessUserCollection } = srv.entities
    logger.info(`External businessuser options: ${JSON.stringify(srv.options)}`)

    return {
        findUserById: (userId) => {
            const queryBuc = SELECT.from(BusinessUserCollection)
                .where({UserID: userId})
                .columns(
                    'ObjectID', 'BusinessPartnerFormattedName', 'CompanyName', 'DepartmentName', 'EmailURI'
                )
            return (req) => {
                return srv.tx(req).run(queryBuc).then(user => ({
                    id: user.ObjectID,
                    name: user.BusinessPartnerFormattedName,
                    companyName: user.CompanyName,
                    department: user.DepartmentName,
                    email: user.EmailURI
                }))
                    .catch(err => {
                        return req.reject(err);
                    });
            }
        },
        findUserByIdAsEmployee: (req, userId) => {
            const queryBuc = `BusinessUserCollection('${userId}')?$format=json&$expand=EmployeeBasicData`
            return srv.tx(req).run(queryBuc).then(user => {
                return {
                    id: user.ObjectID,
                    name: user.BusinessPartnerFormattedName,
                    companyName: user.CompanyName,
                    department: user.DepartmentName,
                    email: user.EmailURI,
                    jobName: user.EmployeeBasicData.JobName,
                    location: user.EmployeeBasicData.FormattedAddress,
                    phoneNumber: user.EmployeeBasicData.Mobile || user.EmployeeBasicData.Phone,
                }
            }).catch(err => {
                return req.reject(err);
            });
        },
    }
};
