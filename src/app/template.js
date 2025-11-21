// File: app/template.js
'use client';

import { motion } from 'framer-motion';

/**
 * The Template component.
 *
 * Templates in Next.js wrap each page and persist across routes, but unlike layouts,
 * they create a new instance for each page navigation. This allows for page transitions.
 *
 * This component adds a fade-in and slide-up animation to every page transition using Framer Motion.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The page content.
 * @returns {JSX.Element} The rendered Template component.
 */
export default function Template({ children }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ease: 'easeInOut', duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
