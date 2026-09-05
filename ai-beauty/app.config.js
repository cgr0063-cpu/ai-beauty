const base = require('./app.base.json');

module.exports = () => {
  const projectId = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'e73fe7a7-6a61-472a-96d3-f88468b3339a';
  const expo = { ...base.expo, owner: 'cgrkrds-team' };
  if (projectId) {
    expo.extra = { ...(expo.extra || {}), eas: { projectId } };
  }
  return { expo };
};
