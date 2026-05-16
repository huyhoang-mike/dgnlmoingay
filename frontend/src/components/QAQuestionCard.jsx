import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineChatAlt2,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlinePhotograph,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi';

export default function QAQuestionCard({ question }) {
  const isCourseOnly = question.visibility === 'course';
  const preview = question.body.length > 180 ? `${question.body.slice(0, 180)}...` : question.body;

  return (
    <Link
      to={`/hoi-dap/${question.id}`}
      className="group block rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-md transition-all"
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {question.is_pinned && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <HiOutlineStar className="h-3.5 w-3.5" /> Ghim
          </span>
        )}
        {question.is_priority && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            <HiOutlineBadgeCheck className="h-3.5 w-3.5" /> Học viên ưu tiên
          </span>
        )}
        {isCourseOnly ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            <HiOutlineLockClosed className="h-3.5 w-3.5" /> Trong khóa học
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
            Public SEO
          </span>
        )}
        {question.status === 'answered' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
            <HiOutlineShieldCheck className="h-3.5 w-3.5" /> Admin đã trả lời
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
        {question.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line mb-4">
        {preview}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
        {question.subject && <span>{question.subject}</span>}
        <span className="inline-flex items-center gap-1">
          <HiOutlineChatAlt2 className="h-3.5 w-3.5" /> {question.answer_count} trả lời
        </span>
        <span className="inline-flex items-center gap-1">
          <HiOutlineEye className="h-3.5 w-3.5" /> {question.view_count} lượt xem
        </span>
        {question.images?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <HiOutlinePhotograph className="h-3.5 w-3.5" /> {question.images.length} ảnh
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          {question.author?.picture ? (
            <img src={question.author.picture} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{question.author?.name}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {new Date(question.last_activity_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
          Xem trả lời <HiOutlineArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
