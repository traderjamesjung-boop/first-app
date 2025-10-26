import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  Video, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: Home },
    { name: '문제 풀이', href: '/study', icon: BookOpen },
    { name: '문제 목록', href: '/questions', icon: GraduationCap },
    { name: '강의', href: '/courses', icon: Video },
    { name: '전자책', href: '/ebooks', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <GraduationCap className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  형법 마스터
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium flex items-center"
                >
                  <item.icon className="h-4 w-4 mr-1" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/profile"
                className="text-gray-700 hover:text-primary-600 flex items-center"
              >
                <User className="h-5 w-5 mr-1" />
                <span className="text-sm">{user?.name}</span>
              </Link>
              <Link
                to="/settings"
                className="text-gray-700 hover:text-primary-600"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-2 inline" />
                  {item.name}
                </Link>
              ))}
              <div className="border-t pt-2 mt-2">
                <Link
                  to="/profile"
                  className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-2 inline" />
                  프로필
                </Link>
                <Link
                  to="/settings"
                  className="text-gray-700 hover:bg-gray-100 block px-3 py-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-2 inline" />
                  설정
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-gray-100 block w-full text-left px-3 py-2 rounded-md"
                >
                  <LogOut className="h-4 w-4 mr-2 inline" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2025 형법 마스터. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
