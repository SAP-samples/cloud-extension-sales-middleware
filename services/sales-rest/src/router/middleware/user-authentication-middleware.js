const { isEmpty } = require('lodash');
const { FORBIDDEN } = require('http-status-codes');
const { JWTStrategy } = require('@sap/xssec');
const passport = require('passport');
const { authentication } = require('../../constants/constants');
const { securityErrors } = require('../../constants/errors');

const addUserAuthenticationMiddleware = (baseURL, router, userRepository) => {
  passport.use(new JWTStrategy(authentication.credentials));
  router.use(baseURL, passport.initialize());
  router.use(baseURL, passport.authenticate(authentication.strategy, { session: false }), (req, res, next) => {
    userRepository.findUserForAuthentication(req.authInfo.getEmail().toLowerCase())
      // eslint-disable-next-line consistent-return
      .then(userId => {
        if (isEmpty(userId)) {
          res.status(FORBIDDEN).json(securityErrors.FORBIDDEN);
          return Promise.reject(securityErrors.FORBIDDEN);
        }
        req.authInfo.salesCloudUserId = userId;
      })
      .then(() => next())
      .catch(err => next(err));
  });
};

module.exports = {
  addUserAuthenticationMiddleware,
};
