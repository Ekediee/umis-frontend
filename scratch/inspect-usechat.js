const aiSdkReact = require('@ai-sdk/react');
console.log("Exports of @ai-sdk/react:", Object.keys(aiSdkReact));

// Since useChat is a React hook, we cannot call it outside a React component.
// But we can check if it is exported, or check other hooks.
