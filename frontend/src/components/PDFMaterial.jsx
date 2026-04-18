/**
 * PDFMaterial Component
 *
 * Displays study material as a download / open-in-Drive card.
 *
 * The previous version embedded a Google Drive iframe preview, but the
 * embedded viewer is small, slow on mobile, and looks unprofessional —
 * so we now show only the metadata + action buttons. Students click
 * "Mở trong Drive" or "Tải xuống" to view the PDF in a real viewer.
 *
 * @param {string} driveFileId - Google Drive File ID for the PDF
 * @param {string} [title]     - Display title for the material
 */

import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineExternalLink } from 'react-icons/hi';

export default function PDFMaterial({ driveFileId, title = 'Tài liệu bài học' }) {
  if (!driveFileId) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-6 text-center">
        <HiOutlineDocumentText className="mx-auto h-10 w-10 text-gray-300 dark:text-slate-600" />
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Chưa có tài liệu PDF</p>
      </div>
    );
  }

  const viewUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <HiOutlineDocumentText className="h-6 w-6 text-red-500 dark:text-red-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{title}</h4>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Tài liệu PDF · Mở trong Google Drive để xem toàn màn hình
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                     rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <HiOutlineExternalLink className="h-4 w-4" />
          Mở trong Drive
        </a>
        <a
          href={downloadUrl}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5
                     rounded-lg bg-primary-600 text-sm font-medium text-white
                     hover:bg-primary-700 transition-colors shadow-sm"
        >
          <HiOutlineDownload className="h-4 w-4" />
          Tải xuống
        </a>
      </div>
    </div>
  );
}
