'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: (...args: unknown[]) => void;
  }
}

export function FacebookPixel() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views on route change
    if (typeof window !== 'undefined' && window.fbq && FB_PIXEL_ID) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  if (!FB_PIXEL_ID) {
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Helper functions to track events
export const fbEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

// Custom event helper
const fbCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params);
  }
};

// אירועים למעקב - ראה FACEBOOK_PIXEL_EVENTS.md לתיעוד מלא
export const fbEvents = {
  // ========== אירוע 1: צפייה בדף הנחיתה (לפני התחברות) ==========
  viewLandingPage: () => {
    fbEvent('ViewContent', {
      content_name: 'Landing Page',
      content_category: 'Homepage'
    });
  },
  
  // ========== אירוע 2: PageView - אוטומטי בכל דף ==========
  // מטופל אוטומטית ב-FacebookPixel component
  
  // ========== אירוע 3: התחלת שיחה בצ'אט של עמוד הבית ==========
  initiateChat: () => {
    fbCustomEvent('InitiateChat', {
      content_name: 'Hero Chat',
      page: 'Landing Page'
    });
  },
  
  // ========== אירוע 4: התחברות למערכת ==========
  userLogin: () => {
    fbEvent('Lead', {
      content_name: 'User Login',
      content_category: 'Authentication'
    });
  },
  
  // ========== אירוע 5: יצירת אתגר חדש ==========
  createChallenge: (challengeTitle?: string) => {
    fbCustomEvent('CreateChallenge', {
      content_name: challengeTitle || 'New Challenge',
      value: 1
    });
  },
  
  // ========== אירוע 6: ביצוע/השלמת אתגר ==========
  completeChallenge: (challengeTitle?: string) => {
    fbEvent('CompleteRegistration', {
      content_name: challengeTitle || 'Challenge',
      status: 'completed'
    });
  },
  
  // ========== אירועים נוספים ==========
  // צפייה בתוכן כללי
  viewContent: (data?: { content_name?: string; content_category?: string }) => {
    fbEvent('ViewContent', data);
  },
  
  // ליד כללי
  lead: (data?: { content_name?: string; value?: number }) => {
    fbEvent('Lead', data);
  },
  
  // אירוע מותאם אישית
  custom: (eventName: string, params?: Record<string, unknown>) => {
    fbCustomEvent(eventName, params);
  },
};
