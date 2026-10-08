// Base URL of the Oltinde web app, which serves all of this app's data
// (/api/mobile/rpc), file uploads (/api/upload) and the AI advisor.
// Defaults to production; for local development point it at your computer's
// web server, e.g. in mobile/.env:
//   EXPO_PUBLIC_WEB_APP_URL=http://192.168.1.50:3000
export const WEB_APP_URL = (process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://oltinde.com').replace(/\/$/, '');
