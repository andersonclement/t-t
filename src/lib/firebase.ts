import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

/*
// App Check Initialization
// Note: You must enable App Check in the Firebase Console and provide your reCAPTCHA Enterprise site key.
if (typeof window !== 'undefined') {
  // Use a placeholder key or environment variable if available
  const siteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY || '6Lc_PLACEHOLDER_KEY_FOLLOW_INSTRUCTIONS';
  
  // Initialize App Check
  // In development, you can use the debug provider:
  // if (import.meta.env.DEV) { (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true; }
  
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("App Check failed to initialize. Check your site key and Firebase Console configuration.");
  }
}
*/

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
