import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Avatar from '@radix-ui/react-avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Collapsible from '@radix-ui/react-collapsible';
import * as Separator from '@radix-ui/react-separator';
import { 
  LayoutDashboard, QrCode, Code2, BarChart3, Settings, Users, 
  Key, ShieldCheck, Bell, Search, ChevronDown, ChevronRight, 
  Menu, X, LogOut, Sparkles, Globe, ExternalLink,
  Plus
} from 'lucide-react';
import { useAuth } from './AuthProvider';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCampaignsOpen, setIsCampaignsOpen] = useState(true);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(true);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const userEmail = user?.email || 'developer@dynamqr.io';
  const userName = userEmail.split('@')[0].toUpperCase();
  const userInitials = userName.substring(0, 2);

  const navigationItems = [
    { name: 'Analytics Hub', href: '/analytics', icon: BarChart3, active: location.pathname === '/analytics' || location.pathname === '/demo' },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: location.pathname === '/dashboard' },
    { name: 'Create QR Code', href: '/create', icon: Plus, active: location.pathname === '/create', badge: 'New' },
    { name: 'Developer Portal', href: '/developer', icon: Code2, active: location.pathname === '/developer' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Header Trigger */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="size-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <QrCode className="size-4.5" />
          </div>
          <span>Dynam<span className="text-indigo-400">QR</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/50"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop + Mobile Slideover) */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-zinc-900/95 md:bg-zinc-900/40 border-r border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out backdrop-blur-xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
              <QrCode className="size-5" />
            </div>
            <span>Dynam<span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">QR</span></span>
          </Link>
          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Enterprise
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {/* Core Menu */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Platform</p>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    item.active
                      ? 'bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`size-4.5 ${item.active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500 text-white shadow-sm shadow-indigo-500/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <Separator.Root className="h-px bg-zinc-800/80 my-4" />

          {/* Collapsible Section: Campaigns & Assets */}
          <Collapsible.Root open={isCampaignsOpen} onOpenChange={setIsCampaignsOpen} className="space-y-1">
            <Collapsible.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors">
              <span>Campaign Management</span>
              {isCampaignsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Collapsible.Trigger>
            <Collapsible.Content className="space-y-1 pt-1 pl-2">
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Dynamic Links</span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <Globe className="size-4 text-zinc-500" />
                <span>Custom Domains</span>
              </Link>
              <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <Users className="size-4 text-zinc-500" />
                <span>Audience Segments</span>
              </Link>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Collapsible Section: Developer Tools */}
          <Collapsible.Root open={isDevToolsOpen} onOpenChange={setIsDevToolsOpen} className="space-y-1">
            <Collapsible.Trigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors">
              <span>Developer & API</span>
              {isDevToolsOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Collapsible.Trigger>
            <Collapsible.Content className="space-y-1 pt-1 pl-2">
              <Link to="/developer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <Key className="size-4 text-indigo-400" />
                <span>API Keys & Tokens</span>
              </Link>
              <Link to="/developer" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <Sparkles className="size-4 text-purple-400" />
                <span>Interactive Playground</span>
              </Link>
              <Link to="/api-docs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors">
                <ExternalLink className="size-4 text-zinc-500" />
                <span>REST API Docs</span>
              </Link>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>

        {/* User Card Footbar */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 transition-all text-left group">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar.Root className="size-9 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 flex-shrink-0">
                    <Avatar.Image 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                      alt={userName}
                      className="size-full object-cover" 
                    />
                    <Avatar.Fallback className="size-full flex items-center justify-center bg-indigo-600 font-bold text-xs text-white">
                      {userInitials}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {userName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {userEmail}
                    </p>
                  </div>
                </div>
                <ChevronDown className="size-4 text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                align="start" 
                sideOffset={8}
                className="w-64 rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl shadow-black/80 z-50 animate-in fade-in-80 zoom-in-95 text-zinc-200"
              >
                <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                  <p className="text-xs font-semibold text-zinc-400">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{userEmail}</p>
                </div>
                <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-zinc-800 hover:text-white cursor-pointer outline-none transition-colors">
                  <Settings className="size-4 text-zinc-400" />
                  <span>Account Settings</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-zinc-800 hover:text-white cursor-pointer outline-none transition-colors">
                  <ShieldCheck className="size-4 text-zinc-400" />
                  <span>Security & MFA</span>
                </DropdownMenu.Item>
                <Separator.Root className="h-px bg-zinc-800 my-1" />
                <DropdownMenu.Item 
                  onClick={() => signOut?.()}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer outline-none transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Header */}
        <header className="hidden md:flex items-center justify-between px-8 h-16 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search QR campaigns, shortcodes, or API keys..." 
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="relative p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
                  <Bell className="size-4.5" />
                  <span className="absolute top-2 right-2 size-2 bg-indigo-500 rounded-full animate-ping" />
                  <span className="absolute top-2 right-2 size-2 bg-indigo-500 rounded-full" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={8} className="w-80 rounded-xl bg-zinc-900 border border-zinc-800 p-3 shadow-2xl shadow-black z-50 text-zinc-200">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
                    <span className="text-sm font-bold text-white">Notifications</span>
                    <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-3 p-2 rounded-lg bg-zinc-800/40 border border-zinc-800/60">
                      <div className="size-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="text-xs space-y-0.5">
                        <p className="font-semibold text-zinc-200">API v1.3 Released</p>
                        <p className="text-zinc-400">Granular QR scopes and live interactive playground are now available.</p>
                        <p className="text-[10px] text-zinc-500">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <Link 
              to="/create" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-95 transition-all"
            >
              <Plus className="size-4" />
              <span>Create QR</span>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
export default AppShell;
