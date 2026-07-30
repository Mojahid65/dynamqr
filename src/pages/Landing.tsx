import { Link } from 'react-router-dom';
import { ArrowRight, QrCode, Smartphone, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '../components/ThemeProvider';

const Landing = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Navbar */}
      <nav className="absolute top-0 w-full p-4 md:p-6 z-20 flex justify-between items-center max-w-7xl mx-auto left-0 right-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-primary-container p-2 rounded-2xl shrink-0">
            <QrCode className="w-5 h-5 md:w-6 md:h-6 text-on-primary-container" />
          </div>
          <span className="text-lg md:text-xl font-bold text-foreground">DynamQR</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Button asChild variant="ghost" className="rounded-full font-medium hidden sm:inline-flex">
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild variant="default" className="rounded-full font-medium text-sm md:text-base px-4 md:px-6">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* M3 Expressive Background Blobs */}
      <div className="absolute top-0 left-1/4 w-[30rem] md:w-[50rem] h-[30rem] md:h-[50rem] bg-primary/20 rounded-full blur-[80px] md:blur-[120px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-[25rem] md:w-[40rem] h-[25rem] md:h-[40rem] bg-tertiary/20 rounded-full blur-[60px] md:blur-[100px] -z-10 mix-blend-screen" />

      {/* Hero Content */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-4 md:px-6 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container/50 border border-outline-variant text-on-secondary-container text-xs md:text-sm font-medium mb-2 md:mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            Material You Design is here
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-[1.1] md:leading-[1.1]">
            Dynamic QR Codes, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Beautifully Simple.</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed px-2">
            Create, manage, and track your QR codes with an expressive, modern interface. Update destinations anytime without changing the code.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-6 md:pt-8 w-full px-4 sm:px-0">
            <Button asChild size="lg" className="rounded-full w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-medium group shadow-lg">
              <Link to="/register">
                Start Creating Free
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="tonal" size="lg" className="rounded-full w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-medium border border-outline-variant">
              <a href="https://play.google.com/store/apps/details?id=com.dynamqr.mojahidx.in" target="_blank" rel="noopener noreferrer">
                <Smartphone className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Download App
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="py-6 md:py-8 text-center text-on-surface-variant text-xs md:text-sm relative z-10 border-t border-outline-variant/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} DynamQR. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/developer" className="hover:text-primary transition-colors">Developers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
