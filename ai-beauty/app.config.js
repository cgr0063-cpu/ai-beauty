const base = require('./app.json');

module.exports = () => {
  const projectId = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  const expo = { ...base.expo };
  if (projectId) {
    expo.extra = { ...(expo.extra || {}), eas: { projectId } };
  }
  return { expo };
};
