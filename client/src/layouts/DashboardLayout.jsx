import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  LayoutDashboard, 
  QrCode, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Fingerprint
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Create QR', href: '/create', icon: QrCode },
    { name: 'Profile Settings', href: '/profile', icon: User },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const avatarUrl = user?.avatarUrl 
    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${API_URL}${user.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'U')}&background=f1f5f9&color=0f172a`;

  return (
    <div className="min-h-screen bg-brand-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-brand-200 px-lg py-xl flex-shrink-0">
        {/* Branding Logo */}
        <div className="flex items-center gap-sm mb-xl">
          <div className="p-xs bg-brand-900 text-white rounded-lg">
            <Fingerprint size={20} />
          </div>
          <span className="font-semibold text-lg tracking-tight">Qube</span>
          <span className="text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-mono font-medium">SaaS</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-md px-md py-sm rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-premium'
                    : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900'
                }`}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile footer card */}
        <div className="border-t border-brand-200 pt-md flex flex-col gap-sm">
          <div className="flex items-center gap-sm px-xs">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border border-brand-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-900 truncate">
                {user?.name || 'Developer'}
              </p>
              <p className="text-[10px] text-brand-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-md px-md py-sm rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-lg py-md bg-white border-b border-brand-200">
          <div className="flex items-center gap-sm">
            <div className="p-xs bg-brand-900 text-white rounded-lg">
              <Fingerprint size={18} />
            </div>
            <span className="font-semibold text-md tracking-tight">Qube</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-sm text-brand-600 hover:text-brand-900 rounded-lg hover:bg-brand-50"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-brand-200 px-lg py-md flex flex-col gap-sm shadow-premium animate-fade-in">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-md px-md py-sm rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-900 text-white'
                        : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900'
                    }`}
                  >
                    <Icon size={16} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-brand-200 pt-sm flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full object-cover border border-brand-200"
                />
                <span className="text-xs font-medium text-brand-900 truncate max-w-[120px]">
                  {user?.name || user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-xs text-xs font-medium text-red-600 px-sm py-xs rounded hover:bg-red-50"
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main content grid */}
        <main className="flex-1 overflow-y-auto px-lg py-xl md:px-xl">
          <div className="max-w-5xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
