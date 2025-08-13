import React from 'react';
import { AnimatePresence } from 'framer-motion';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Client-side component that can safely use location
function AnimatedRoot({ children }) {
  const { useLocation } = require('@docusaurus/router');
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      {React.cloneElement(children, { 
        key: location.pathname 
      })}
    </AnimatePresence>
  );
}

// Default implementation, that you can customize
export default function Root({ children }) {
  return (
    <BrowserOnly fallback={<div>{children}</div>}>
      {() => <AnimatedRoot>{children}</AnimatedRoot>}
    </BrowserOnly>
  );
}
