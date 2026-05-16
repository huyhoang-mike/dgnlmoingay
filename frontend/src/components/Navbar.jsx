/**
 * Navbar Component
 * Modern top navigation with dark/light toggle and Google login.
 * Inspired by GitHub Education's clean design.
 */

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineLockClosed,
} from 'react-icons/hi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/nen-tang', label: 'Nền tảng' },
  { to: '/luyen-de', label: 'Luyện đề' },
  { to: '/thuc-chien', label: 'Thực chiến' },
  { to: '/hoc-thu', label: 'Học thử' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, isEnrolled, login, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response) => {
    setLoginError(null);
    try {
      await login(response.credential);
    } catch (error) {
      console.error('[DGNL] Google login failed:', error);
      const msg = error?.response?.data?.detail || error?.message || 'Đăng nhập thất bại';
      setLoginError(msg);
      setTimeout(() => setLoginError(null), 5000);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
     ${isActive
       ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
       : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
     }`;

  return (
    <>
    {loginError && (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4">
        <div className="bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-xl shadow-lg text-sm text-center">
          ⚠️ {loginError}
        </div>
      </div>
    )}
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
              <img
                src="/favicon.svg"
                alt="ĐGNL Mỗi Ngày"
                className="h-5 w-5 brightness-0 invert"
              />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              ĐGNL Mỗi Ngày
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass} end={link.to === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: Theme + Auth */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <HiOutlineSun className="h-5 w-5" />
              ) : (
                <HiOutlineMoon className="h-5 w-5" />
              )}
            </button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <HiOutlineUser className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </button>

                {showProfile && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-200 dark:ring-slate-700 z-50 py-2">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                              <HiOutlineShieldCheck className="h-3 w-3" /> Admin
                            </span>
                          )}
                          {isEnrolled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              <HiOutlineBadgeCheck className="h-3 w-3" /> Đã đăng ký khóa học
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                              <HiOutlineLockClosed className="h-3 w-3" /> Chưa đăng ký
                            </span>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => { navigate('/admin'); setShowProfile(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <HiOutlineShieldCheck className="h-4 w-4" />
                          Quản lý học viên
                        </button>
                      )}
                      <button
                        onClick={() => { logout(); setShowProfile(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <HiOutlineLogout className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:block">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.error('[ĐGNL] Google login error')}
                  size="medium"
                  shape="pill"
                  text="signin"
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                />
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {mobileOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-700 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                   ${isActive
                     ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                     : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                   }`
                }
                end={link.to === '/'}
              >
                {link.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <div className="px-4 pt-3 border-t border-gray-100 dark:border-slate-700 mt-2">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.error('[DGNL] Google login error')}
                  width="100%"
                  size="large"
                  text="signin_with"
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
    </>
  );
}
