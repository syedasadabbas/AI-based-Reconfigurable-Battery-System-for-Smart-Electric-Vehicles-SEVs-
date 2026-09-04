import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Battery, BarChart3, Zap, Car, BookOpen, Brain, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location === '/' || location === '/dashboard';
    return location === path;
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, testId: 'nav-dashboard' },
    { href: '/simulation', label: 'Simulation', icon: Zap, testId: 'nav-simulation' },
    { href: '/car-simulation', label: 'Car Sim', icon: Car, testId: 'nav-car-simulation' },
    { href: '/pack-analysis', label: 'Pack Analysis', icon: Battery, testId: 'nav-pack-analysis' },
    { href: '/ai-monitoring', label: 'AI Monitor', icon: Brain, testId: 'nav-ai-monitoring', variant: 'ai' },
    { href: '/research-summary', label: 'Research', icon: BookOpen, testId: 'nav-research-summary' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-blue-500/20 dark:border-blue-400/20 shadow-lg sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 sm:h-14">
          {/* Logo Section */}
          <Link href="/dashboard">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 dark:group-hover:shadow-blue-400/50 transition-all duration-300 group-hover:scale-110">
                <Battery className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm sm:text-base font-bold text-white leading-tight">Battery Simulator</h1>
                <p className="text-[9px] sm:text-[10px] text-blue-300 dark:text-blue-200 leading-tight">4-Cell Analysis System</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-xs font-medium h-8 px-3 transition-all duration-200 ${
                    isActive(item.href)
                      ? item.variant === 'ai'
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 shadow-md'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 shadow-md'
                      : item.variant === 'ai'
                        ? 'text-blue-200 dark:text-blue-300 hover:text-white dark:hover:text-white hover:bg-purple-600/20 dark:hover:bg-purple-500/20'
                        : 'text-blue-200 dark:text-blue-300 hover:text-white dark:hover:text-white hover:bg-blue-600/20 dark:hover:bg-blue-500/20'
                  }`}
                  data-testid={item.testId}
                >
                  <item.icon className="w-3.5 h-3.5 mr-1.5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          {/* Mobile Menu Toggle and Theme */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 w-9 p-0 text-blue-200 hover:text-white hover:bg-blue-600/20 dark:text-blue-300 dark:hover:text-white dark:hover:bg-blue-500/20"
                  data-testid="mobile-menu-toggle"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] sm:w-[320px] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border-l border-blue-500/20 dark:border-blue-400/20"
              >
                <SheetHeader>
                  <SheetTitle className="text-white dark:text-blue-100 flex items-center gap-2">
                    <Battery className="w-5 h-5 text-blue-400 dark:text-blue-300" />
                    Navigation Menu
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-2 mt-6">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={closeMobileMenu}>
                      <Button
                        variant={isActive(item.href) ? 'default' : 'ghost'}
                        className={`w-full justify-start text-base font-medium h-12 transition-all duration-200 ${
                          isActive(item.href)
                            ? item.variant === 'ai'
                              ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 text-white shadow-lg'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 text-white shadow-lg'
                            : 'text-blue-200 dark:text-blue-300 hover:text-white dark:hover:text-white hover:bg-blue-600/20 dark:hover:bg-blue-500/20'
                        }`}
                        data-testid={`${item.testId}-mobile`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
