const data = (async (cds) => {
  return {
    remoteActivityService: await require('./activity')(cds),
    remoteContactService: await require('./contact')(cds),
    remoteIdentityService: await require('./identity')(cds),
    remoteBusinessUserService: await require('./businessuser')(cds),
  }
})(require('@sap/cds'))
module.exports = data;
