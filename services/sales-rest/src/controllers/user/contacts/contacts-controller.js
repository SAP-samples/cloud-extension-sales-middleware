const { getPaginationParamsFrom, getQueryParamsFrom } = require('../../../helpers/requests');

const contactControllerFactory = (contactsService) => (req, res) => {
  const { contactId } = req.params;
  return contactsService.findContactByUUID(contactId)
    .then(contact => res.json(contact));
};

const contactsControllerFactory = (contactsService) => (req, res) =>
  contactsService
    .findContacts({ filterParams: getQueryParamsFrom(req, ['name']), pagination: getPaginationParamsFrom(req) })
    .then(results => res.json(results));

module.exports = [{
  method: 'GET',
  path: '/contacts/:contactId',
  name: 'contactControllerFactory',
  handlerFactory: contactControllerFactory,
},
{
  method: 'GET',
  path: '/contacts/',
  name: 'contactsControllerFactory',
  handlerFactory: contactsControllerFactory,
}];
