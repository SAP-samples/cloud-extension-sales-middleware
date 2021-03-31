
const cheerio = require('cheerio');
const striptags = require('striptags');
const htmlEntities = require('html-entities').AllHtmlEntities;

const replaceEmptyTagContentWith = ({ htmlString, tag, replaceText }) => {
  const $ = cheerio.load(htmlString);

  $(tag).each((index, item) => {
    if ($(item).text() === String.fromCharCode(160) || (!$(item).text())) {
      $(item).text(replaceText);
    }
  });
  return $.text();
};

const stripHTML = (content) => striptags(content);

const decodeHTMLEntities = (content) => htmlEntities.decode(content);

module.exports = {
  decodeHTMLEntities,
  replaceEmptyTagContentWith,
  stripHTML,
};
