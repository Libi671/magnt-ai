'use client';

import { useEffect } from 'react';
import { fbEvents } from './FacebookPixel';

export default function LoginTracker() {
  useEffect(() => {
    // בדיקה אם כבר דיווחנו על התחברות בסשן הזה
    const hasTrackedLogin = sessionStorage.getItem('fb_login_tracked');
    
    if (!hasTrackedLogin) {
      // אירוע 4: התחברות למערכת
      fbEvents.userLogin();
      sessionStorage.setItem('fb_login_tracked', 'true');
    }
  }, []);

  return null;
}
