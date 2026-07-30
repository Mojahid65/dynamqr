import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';

export const AppRecommendation = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if dismissed before
    const isDismissed = localStorage.getItem('dynamqr-app-banner-dismissed');
    if (isDismissed) return;

    // Detect Android mobile device
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Only proceed if Android
    if (!isAndroid) return;

    // Show after 5 seconds to not annoy the user instantly
    const timer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('dynamqr-app-banner-dismissed', 'true');
  };

  const handleDownload = () => {
    setShow(false);
    localStorage.setItem('dynamqr-app-banner-dismissed', 'true'); // don't show again since they clicked it
    window.open('https://play.google.com/store/apps/details?id=com.dynamqr.mojahidx.in', '_blank', 'noopener,noreferrer');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-surface-container-high border border-outline-variant rounded-2xl p-4 shadow-xl flex items-start gap-4 max-w-sm w-full relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-foreground rounded-full hover:bg-surface-variant/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-primary/20 p-3 rounded-xl shrink-0 mt-1">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 pr-6">
          <h4 className="text-sm font-bold text-foreground mb-1">Get the DynamQR App</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
            For the best experience on mobile, try our official Android app. Fast, native, and built for you.
          </p>
          <Button onClick={handleDownload} size="sm" className="w-full rounded-full h-9 text-xs">
            Download from Play Store
          </Button>
        </div>
      </div>
    </div>
  );
};
