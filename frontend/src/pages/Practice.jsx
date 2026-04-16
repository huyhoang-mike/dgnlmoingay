/**
 * Practice Page (Luyện đề)
 * Displays practice exam sections.
 */

import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlinePlay,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const EXAM_SECTIONS = [
  {
    group: 'Đề thi mới V-ACT 2025 — ĐHQG TP.HCM',
    badge: 'CẤU TRÚC MỚI',
    badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    items: [
      { key: 'vact_ct2_2025', name: 'Đề chính thức Đợt 2 — 2025', hasVideo: true },
      { key: 'vact_ct1_2025', name: 'Đề chính thức Đợt 1 — 2025', hasVideo: true },
      { key: 'vact_mh_2025', name: 'Đề minh họa ĐHQG 2025', hasVideo: true },
    ],
  },
  {
    group: '8 Đề V-ACT theo cấu trúc mới 2025',
    badge: 'VIDEO CHI TIẾT',
    badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    items: [
      { key: 'vact_2019_d1', name: 'Đề chính thức 2019 — Đợt 1', hasVideo: true },
      { key: 'vact_2021_d1', name: 'Đề chính thức 2021 — Đợt 1', hasVideo: true },
      { key: 'vact_2022_d1', name: 'Đề chính thức 2022 — Đợt 1', hasVideo: true },
      { key: 'vact_2022_d2', name: 'Đề chính thức 2022 — Đợt 2', hasVideo: true },
      { key: 'vact_2023_d1', name: 'Đề chính thức 2023 — Đợt 1', hasVideo: true },
    ],
  },
  {
    group: 'Đề chính thức các năm khác',
    items: [
      { key: 'ct_2020_d1', name: 'Đề chính thức 2020 — Đợt 1', hasVideo: false },
    ],
  },
];

export default function Practice() {
  const { isEnrolled } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-4">
            GIAI ĐOẠN 2
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Khóa học Luyện đề 2026
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Luyện tập với kho 100+ đề thi thử chuẩn cấu trúc, quản lý thời gian, kiểm tra lỗ hổng kiến thức. Mỗi đề sẽ đi kèm hướng dẫn giải dễ hiểu và video giải thích chi tiết.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {EXAM_SECTIONS.map((section) => (
          <div key={section.group} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {section.group}
              </h2>
              {section.badge && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${section.badgeColor}`}>
                  {section.badge}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <Link
                  key={item.key}
                  to={`/luyen-de/${item.key}`}
                  className="group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                    <HiOutlineDocumentText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {item.hasVideo && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <HiOutlinePlay className="h-3 w-3" /> Video bài giải
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <HiOutlineDocumentText className="h-3 w-3" /> Đáp án
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEnrolled && (
                      <HiOutlineLockClosed className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                    )}
                    <HiOutlineArrowRight className="h-4 w-4 text-gray-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {!isEnrolled && (
          <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              🔒 Đăng ký khóa học để truy cập đầy đủ đề thi và video bài giải.
            </p>
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Đăng ký ngay <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
