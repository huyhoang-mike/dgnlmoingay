/**
 * Footer Component
 * Minimal footer with contact info and social links.
 */

import {
  FaComments,
  FaFacebookF,
  FaLinkedinIn,
  FaPhoneAlt,
  FaYoutube,
} from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                <img
                  src="/favicon.svg"
                  alt="ĐGNL Mỗi Ngày"
                  className="h-5 w-5 brightness-0 invert"
                />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ĐGNL Mỗi Ngày
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Ôn tập Đánh Giá Năng Lực V-ACT toàn diện và chuẩn cấu trúc đề mới.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Khóa học
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/nen-tang', label: 'Nền tảng' },
                { href: '/luyen-de', label: 'Luyện đề' },
                { href: '/thuc-chien', label: 'Luyện đề thực chiến' },
                { href: '/hoc-thu', label: 'Học thử miễn phí' },
                { href: '/dang-ky', label: 'Đăng ký khóa học' },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.facebook.com/huyhoang.mike/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <FaFacebookF className="h-3.5 w-3.5" />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://zalo.me/0355912940"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <FaComments className="h-3.5 w-3.5" />
                  Zalo
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@dgnlmoingay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <FaYoutube className="h-3.5 w-3.5" />
                  YouTube
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FaPhoneAlt className="h-3.5 w-3.5" />
                0355 912 940
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/huyhoang-mike/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <FaLinkedinIn className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} ĐGNL Mỗi Ngày. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
