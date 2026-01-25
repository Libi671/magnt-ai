'use client';

import { useEffect } from 'react';
import { fbEvents } from './FacebookPixel';

export default function LandingPageTracker() {
  useEffect(() => {
    // אירוע 1: צפייה בדף הנחיתה (לפני התחברות)
    fbEvents.viewLandingPage();
  }, []);

  return null;
}
