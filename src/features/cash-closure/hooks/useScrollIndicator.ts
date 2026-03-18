import { useEffect, useRef, useState } from 'react';

export function useScrollIndicator() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      
      // Show top shadow if scrolled down
      setShowTopShadow(scrollTop > 0);
      
      // Show bottom shadow if not at bottom (with 1px tolerance)
      setShowBottomShadow(scrollTop + clientHeight < scrollHeight - 1);
    };

    // Check initial state
    handleScroll();

    // Listen to scroll events
    element.addEventListener('scroll', handleScroll);
    
    // Also check on resize (content might change)
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  return { scrollRef, showTopShadow, showBottomShadow };
}
