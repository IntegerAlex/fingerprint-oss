import React from 'react';
import { AnimatePresence } from 'framer-motion';

// Default implementation, that you can customize
export default function Root({ children }) {
  return (
    <AnimatePresence mode="wait">
      {React.cloneElement(children, { key: location.pathname })}
    </AnimatePresence>
  );
}
