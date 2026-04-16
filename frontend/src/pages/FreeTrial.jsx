/**
 * FreeTrial Page (Học thử miễn phí)
 * Shows free preview lessons and sample content.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlineArrowRight,
  HiOutlinePlay,
  HiOutlineDocumentText,
  HiOutlineBookOpen,
  HiOutlineStar,
} from 'react-icons/hi';
import { getLessons } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function FreeTrial() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, login } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    const fetchFreeLessons = async () => {
      try {
        const response = await getLessons({ free_only: true });
        setLessons(response.data);
      } catch (err) {
        console.error('[DGNL] Failed to fetch free lessons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFreeLessons();
  }, []);

  const handleGoogleSuccess = async (response) => {
    try { await login(response.credential); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 dark:from-green-700 dark:to-teal-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-4">
            <HiOutlineStar className="h-4 w-4 text-yellow-300" />
            MIỄN PHÍ
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Học thử miễn phí
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Trải nghiệm bài giảng và tài liệu mẫu trước khi đăng ký khóa học.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Free lessons list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : lessons.length > 0 ? (
          <div className="space-y-4 mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HiOutlineBookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
              Bài học miễn phí
            </h2>
            {lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className="group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-700 hover:shadow-md transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <HiOutlinePlay className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {lesson.title}
                  </h3>
                  {lesson.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {lesson.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {lesson.video_drive_id && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <HiOutlinePlay className="h-3 w-3" /> Video
                      </span>
                    )}
                    {lesson.pdf_drive_id && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                        <HiOutlineDocumentText className="h-3 w-3" /> PDF
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      FREE
                    </span>
                  </div>
                </div>
                <HiOutlineArrowRight className="h-5 w-5 text-gray-300 dark:text-slate-600 group-hover:text-green-500 transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 mb-10">
            <HiOutlineBookOpen className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Bài học miễn phí sẽ được cập nhật sớm. Hãy quay lại sau!
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-100 dark:border-slate-700 text-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Muốn truy cập đầy đủ?
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Đăng ký khóa học để truy cập tất cả bài giảng, tài liệu, và video bài giải chi tiết.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
            >
              Đăng ký khóa học <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
            {!isAuthenticated && (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {}}
                shape="pill"
                text="signin_with"
                theme={theme === 'dark' ? 'filled_black' : 'outline'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
