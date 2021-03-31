
const validateSelectedVisitRequirements = (req) => {
  const { memory, language } = req.body.conversation;
  const { displayedVisits, selectedVisit } = memory;
  const templates = memory.templates[language];
  return new Promise(((resolve, reject) => {
    if (!selectedVisit || (typeof selectedVisit.index === 'undefined')) {
      reject(templates.noSelectedVisit);
    } if (!displayedVisits || displayedVisits.length === 0) {
      reject(templates.noVisits);
    } if (selectedVisit.index >= displayedVisits.length) {
      reject(templates.invalidVisitSelection);
    }
    resolve('valid');
  }));
};

module.exports = {
  validateSelectedVisitRequirements,
};
