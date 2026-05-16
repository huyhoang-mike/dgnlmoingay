import {
  HiOutlineBadgeCheck,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineExternalLink,
  HiOutlineStar,
} from 'react-icons/hi';
import { trackOpenMaterialDownload } from '../api/client';

export default function OpenMaterialCard({ material }) {
  const handleOpen = async () => {
    const driveWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
    try {
      await trackOpenMaterialDownload(material.id);
    } catch (error) {
      console.error('[DGNL] Failed to track material download:', error);
    } finally {
      if (driveWindow) {
        driveWindow.location.href = material.drive_url;
      } else {
        window.location.href = material.drive_url;
      }
    }
  };

  const description = material.description?.length > 180
    ? `${material.description.slice(0, 180)}...`
    : material.description;

  return (
    <article className="group rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {material.is_featured && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
            <HiOutlineStar className="h-3.5 w-3.5" /> Nổi bật
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
          <HiOutlineBadgeCheck className="h-3.5 w-3.5" /> Đã duyệt
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
          {material.file_type || 'pdf'}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="hidden sm:flex w-16 h-20 rounded-xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border border-emerald-100 dark:border-emerald-900/30 items-center justify-center flex-shrink-0 overflow-hidden">
          {material.preview_image_url ? (
            <img src={material.preview_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <HiOutlineDocumentText className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
            {material.title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3 whitespace-pre-line">
              {description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
            {material.category && <span>{material.category}</span>}
            {material.subject && <span>{material.subject}</span>}
            <span className="inline-flex items-center gap-1">
              <HiOutlineDownload className="h-3.5 w-3.5" /> {material.download_count || 0} lượt mở
            </span>
          </div>
          {material.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {material.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-50 dark:bg-slate-900 text-[11px] text-gray-500 dark:text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
            {material.source_name || 'ĐGNL Mỗi Ngày'}
          </p>
          {material.copyright_note && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{material.copyright_note}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all flex-shrink-0"
        >
          Mở Drive <HiOutlineExternalLink className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
