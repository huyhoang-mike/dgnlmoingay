/**
 * Register Page
 * Registration steps and payment information.
 */

import { Link } from 'react-router-dom';
import {
  HiOutlineCreditCard,
  HiOutlineMail,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlinePhone,
} from 'react-icons/hi';

const STEPS = [
  {
    icon: HiOutlineCreditCard,
    step: 1,
    title: 'Chuyển khoản học phí',
    desc: 'Chuyển khoản với nội dung "Họ và Tên - Email" theo thông tin bên dưới.',
    note: 'Ví dụ: Nguyễn Huy Hoàng - huyhoang.mike@gmail.com',
  },
  {
    icon: HiOutlineMail,
    step: 2,
    title: 'Nhận email kích hoạt',
    desc: 'Nếu học phí và email hợp lệ, bạn sẽ nhận được email thông báo kèm hướng dẫn sử dụng khóa học trong vòng 24h.',
  },
  {
    icon: HiOutlineUserGroup,
    step: 3,
    title: 'Tham gia cộng đồng',
    desc: 'Kết nối với anh để nhận hỗ trợ, thông tin cập nhật về ĐGNL và tài liệu bổ trợ qua group Messenger.',
  },
];

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 dark:from-primary-800 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Đăng ký khóa học
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Làm theo 3 bước đơn giản để bắt đầu hành trình ôn luyện ĐGNL.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Steps */}
        <div className="space-y-6 mb-12">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="flex gap-5 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <s.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                  Bước {s.step}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{s.desc}</p>
                {s.note && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 italic">{s.note}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bank Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Thông tin chuyển khoản
          </h2>
          <div className="max-w-sm mx-auto space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Ngân hàng</span>
              <span className="font-semibold text-gray-900 dark:text-white">TP BANK</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Số tài khoản</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white">0435 1047 435</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">Chủ tài khoản</span>
              <span className="font-semibold text-gray-900 dark:text-white">NGUYỄN HUY HOÀNG</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Học phí</span>
              <div className="text-right">
                <span className="text-sm text-gray-400 line-through mr-2">699,000₫</span>
                <span className="font-bold text-green-600 dark:text-green-400">599,000₫</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Liên hệ để được hỗ trợ
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Facebook
            </a>
            <a href="https://zalo.me" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors">
              Zalo
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 transition-colors">
              LinkedIn
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <HiOutlinePhone className="h-4 w-4" />
            <span>Hotline: 0355 912 940</span>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Trong trường hợp không nhận được email kích hoạt sau 24h, hãy liên hệ qua hotline.
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
