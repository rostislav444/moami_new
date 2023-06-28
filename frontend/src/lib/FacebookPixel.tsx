export const pageView = () => {
  window.fbq('track', 'PageView', {
    page_path: window.location.pathname,
  });
}

export const event = (name: string, options = {}) => {
  window.fbq('track', name, options);
}