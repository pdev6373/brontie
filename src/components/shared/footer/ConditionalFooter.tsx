'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter: React.FC = () => {
  const pathname = usePathname();
  const shouldShow = 
    pathname === '/' || 
    pathname === '/products' ||
    pathname === '/how-it-works' ||
    pathname === '/about' ||
    pathname === '/benefits' ||
    pathname === '/contact' ||
    pathname === '/featured' ||
    pathname === '/term-condition' ||
    pathname === '/cookie-policy' ||
    pathname === '/privacy-policy';
;
  if (!shouldShow) return null;
  return <Footer />;
};

export default ConditionalFooter; 