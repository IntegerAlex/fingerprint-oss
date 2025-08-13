// Force dark mode and hide color mode toggle
(function() {
  'use strict';
  
  // Force dark mode
  document.documentElement.setAttribute('data-theme', 'dark');
  
  // Hide color mode toggle
  function hideColorModeToggle() {
    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.style.display = 'none';
    }
    
    // Also hide any other color mode related elements
    const colorModeElements = document.querySelectorAll('.colorModeToggle, [data-theme-toggle]');
    colorModeElements.forEach(el => {
      el.style.display = 'none';
    });
  }
  
  // Hide toggle immediately
  hideColorModeToggle();
  
  // Hide toggle after DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideColorModeToggle);
  } else {
    hideColorModeToggle();
  }
  
  // Hide toggle after a short delay to catch any late-rendered elements
  setTimeout(hideColorModeToggle, 100);
  setTimeout(hideColorModeToggle, 500);
  setTimeout(hideColorModeToggle, 1000);
})();
