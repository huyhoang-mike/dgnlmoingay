/**
 * Navbar Component
 * Modern top navigation with dark/light toggle and Google login.
 * Inspired by GitHub Education's clean design.
 */

import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlineBell,
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
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isAdmin, isEnrolled, login, logout } = useAuth();

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    ...(!isEnrolled ? [{ to: '/dang-ky', label: 'Đăng ký' }] : []),
    { to: '/nen-tang', label: 'Nền tảng' },
    { to: '/luyen-de', label: 'Luyện đề' },
    { to: '/luyen-tap-chuyen-sau', label: 'Quiz' },
    { to: '/thuc-chien', label: 'Thực chiến' },
    ...(!isEnrolled ? [{ to: '/hoc-thu', label: 'Học thử' }] : []),
    { to: '/hoi-dap', label: 'Hỏi đáp' },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loginError, setLoginError] = useState(null);
  const navigate = useNavigate();

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!isAuthenticated) return;
    if (!silent) {
      setNotificationsLoading(true);
      setNotificationsError(null);
    }
    try {
      const res = await listNotifications({ limit: 12, offset: 0 });
      setNotifications(res.data?.items || []);
      setUnreadCount(res.data?.unread_count || 0);
      setNotificationsError(null);
    } catch (error) {
      if (!silent) setNotificationsError('Không thể tải thông báo.');
    } finally {
      if (!silent) setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications({ silent: true });
    } else {
      setShowNotifications(false);
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
            <img
              src="/favicon.svg"
              alt="ĐGNL Mỗi Ngày"
              className="h-9 w-9 rounded-xl shadow-md"
            />
            <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
              ĐGNL Mỗi Ngày
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
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

            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={async () => {
                    const next = !showNotifications;
                    setShowProfile(false);
                    setShowNotifications(next);
                    if (next) await loadNotifications();
                  }}
                  className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Thông báo"
                >
                  <HiOutlineBell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-gray-200 dark:ring-slate-700 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Thông báo</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              try {
                                await markAllNotificationsRead();
                                setUnreadCount(0);
                                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                              } catch (error) {
                                setNotificationsError('Không thể cập nhật trạng thái.');
                              }
                            }}
                            className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-auto">
                        {notificationsLoading ? (
                          <div className="p-6 flex items-center justify-center">
                            <div className="inline-block w-6 h-6 border-2 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" />
                          </div>
                        ) : notificationsError ? (
                          <div className="p-4 text-sm text-red-600 dark:text-red-400">{notificationsError}</div>
                        ) : notifications.length === 0 ? (
                          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Chưa có thông báo nào.</div>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={async () => {
                                setShowNotifications(false);
                                try {
                                  if (!n.is_read) await markNotificationRead(n.id);
                                  setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
                                  if (!n.is_read) setUnreadCount((c) => Math.max(0, c - 1));
                                } catch (error) {
                                  // Ignore mark-read failures; still allow navigation.
                                }
                                if (n.url) {
                                  if (/^https?:\/\//i.test(n.url)) {
                                    window.location.href = n.url;
                                  } else {
                                    navigate(n.url);
                                  }
                                }
                              }}
                              className={`w-full text-left px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-slate-700 transition-colors ${
                                n.is_read
                                  ? 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700'
                                  : 'bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100/60 dark:hover:bg-primary-900/20'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.is_read && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{n.title}</p>
                                  {n.body && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.body}</p>
                                  )}
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    setShowProfile(!showProfile);
                  }}
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
            {navLinks.map((link) => (
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
