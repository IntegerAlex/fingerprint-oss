import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from '@docusaurus/router';

// Default implementation, that you can customize
export default function Root({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {React.cloneElement(children, { key: location.pathname })}
    </AnimatePresence>
  );
}
