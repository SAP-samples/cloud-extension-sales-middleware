module.exports = {
  userControllers: [
    ...require('./user'),
  ],
  adminControllers: [
    ...require('./admin'),
  ],
  caiControllers: [
    ...require('./cai'),
  ],
};
