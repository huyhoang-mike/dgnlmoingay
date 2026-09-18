/**
 * Sidebar Component
 * Navigation sidebar showing list of lessons with active state.
 */

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { getLessons } from '../api/client';

export default function Sidebar() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setError(null);
        const response = await getLessons();
        setLessons(response.data);
      } catch (err) {
        console.error('[DGNL] Failed to fetch lessons:', err);
        setError('Không thể tải danh sách bài học');
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  return (
    <aside className="w-72 min-h-screen bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="ĐGNL Mỗi Ngày"
            className="h-10 w-10 rounded-xl shadow-md"
          />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">ĐGNL Mỗi Ngày</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Học mỗi ngày, tiến mỗi ngày</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-4 mb-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Danh sách bài học
        </p>

        {loading ? (
          <div className="space-y-2 px-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 py-3 text-sm text-red-500 dark:text-red-400">
            <p>{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); getLessons().then(r => setLessons(r.data)).catch(() => setError('Không thể tải')).finally(() => setLoading(false)); }}
              className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              Thử lại
            </button>
          </div>
        ) : lessons.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
            Chưa có bài học nào. Thêm bài học qua API.
          </div>
        ) : (
          <ul className="space-y-1">
            {lessons.map((lesson, index) => (
              <li key={lesson.id}>
                <NavLink
                  to={`/lessons/${lesson.id}`}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 dark:bg-slate-700
                                   flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="truncate">{lesson.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <HiOutlineCheckCircle className="h-4 w-4" />
          <span>0 / {lessons.length} hoàn thành</span>
        </div>
      </div>
    </aside>
  );
}
