export const pageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView', {
      page_path: window.location.pathname,
    });
  }
};

export const event = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', name, options);
  }
};

declare global {
  interface Window {
    fbq: any;
  }
} 