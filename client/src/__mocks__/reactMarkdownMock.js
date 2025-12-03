const React = require('react');

const ReactMarkdown = ({ children, ...props }) => {
  return React.createElement('div', {
    'data-testid': 'react-markdown',
    ...props
  }, children);
};

module.exports = ReactMarkdown;
