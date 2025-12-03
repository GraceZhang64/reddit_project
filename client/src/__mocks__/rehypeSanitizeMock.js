const rehypeSanitize = () => () => {};

// Mock the default schema
const defaultSchema = {
  attributes: {
    '*': ['className', 'id']
  },
  tagNames: ['p', 'div', 'span', 'a', 'strong', 'em']
};

module.exports = rehypeSanitize;
module.exports.default = rehypeSanitize;
module.exports.defaultSchema = defaultSchema;
