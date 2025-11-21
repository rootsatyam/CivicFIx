import { Outfit } from 'next/font/google';
import "./globals.css";
import MobileNav from './components/MobileNav';
import type { Metadata } from 'next';

const outfit = Outfit({ subsets: ["latin"] });

/**
 * Metadata for the application.
 * Used by Next.js to generate the `<head>` section of the HTML.
 */
export const metadata: Metadata = {
  title: "CivicFix",
  description: "Report Problems. Build a Better City.",
};

/**
 * The Root Layout component.
 *
 * This component wraps every page in the application. It provides:
 * - The global font (Outfit).
 * - A fixed background image with a dark overlay for a consistent visual theme.
 * - The `MobileNav` component for navigation on small screens.
 * - The basic HTML structure (`html`, `body`).
 *
 * @component
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content of the page being rendered.
 * @returns {JSX.Element} The rendered RootLayout component.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} pb-20 md:pb-0 relative min-h-screen`}>
        
        {/* --- MASTER BACKGROUND LAYER --- */}
        {/* This sits behind EVERY page. Fixed position prevents mobile cropping. */}
        <div className="fixed inset-0 z-[-1]">
          <img 
            src="/city-issues-bg.jpg" 
            alt="City Background" 
            className="w-full h-full object-cover"
          />
          {/* Global Dark Overlay - Unifies the look */}
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]"></div>
        </div>

        {/* --- PAGE CONTENT --- */}
        {children}
        
        {/* --- MOBILE NAVIGATION --- */}
        <MobileNav />
        
      </body>
    </html>
  );
}