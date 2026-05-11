const React = require('react');
console.log('React version:', React.version);
console.log('forwardRef exists:', typeof React.forwardRef);
console.log('Keys of React:', Object.keys(React).filter(k => k.toLowerCase().includes('ref')));
