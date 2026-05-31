/**
 * VideoPlayer Component
 * Embeds a Google Drive video using the official preview URL with responsive sizing.
 *
 * @param {string} driveFileId - The Google Drive File ID
 * @param {string} [title]     - Optional title for the video
 */

export default function VideoPlayer({ driveFileId, title = 'Lesson Video' }) {
  if (!driveFileId) {
    return null;
  }

  const previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
  const viewUrl = `https://drive.google.com/file/d/${driveFileId}/view`;

  return (
    <div className="w-full">
      {/* Title bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          📹 Video bài giảng
        </h3>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
        >
          Mở bằng Google Drive
        </a>
      </div>

      {/* Fallback for small mobile screens (< sm) */}
      <div className="block sm:hidden w-full p-6 text-center rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-755/50 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-full text-primary-600 dark:text-primary-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white text-base">Xem video bài giảng</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Trình xem video trực tiếp có thể không tối ưu trên điện thoại. Hãy bấm nút bên dưới để mở trong ứng dụng Drive hoặc trình duyệt mới để xem mượt mà nhất.
          </p>
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-600 text-white font-semibold shadow-sm hover:bg-primary-700 transition-colors"
          >
            Mở video trong tab mới ↗
          </a>
        </div>
      </div>

      {/* 16:9 responsive iframe container for larger screens */}
      <div className="hidden sm:block relative w-full aspect-video min-h-[220px] sm:min-h-0 overflow-hidden rounded-2xl bg-gray-900 dark:bg-slate-800 shadow-lg ring-1 ring-gray-200 dark:ring-slate-700">
        <iframe
          src={previewUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ border: 'none' }}
        />
      </div>

      {/* Caption */}
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center">
        Nếu trình duyệt chặn cookie, bạn có thể hãy bấm “Mở bằng Google Drive” để xem trong tab riêng.
      </p>
    </div>
  );
}
