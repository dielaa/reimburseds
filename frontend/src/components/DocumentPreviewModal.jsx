import { useEffect, useState } from "react";
import { FaTimes, FaDownload, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import api, { DOCUMENT_TYPE_LABELS } from "../services/api";

function guessIsImage(name = "", type = "") {
  if (type.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp)$/i.test(name);
}

function guessIsPdf(name = "", type = "") {
  if (type === "application/pdf") return true;
  return /\.pdf$/i.test(name);
}

export default function DocumentPreviewModal({ reimbursementId, doc, onClose, isPaymentProof = false }) {
  const [url, setUrl] = useState(null);
  const [contentType, setContentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!doc) return;
    let active = true;
    let objectUrl = null;

    const timer = setTimeout(() => {
      if (!active) return;
      setLoading(true);
      setError("");
      setUrl(null);

      const endpoint = isPaymentProof
        ? `/reimbursements/${reimbursementId}/payment-proof/download`
        : `/reimbursements/${reimbursementId}/documents/${doc.id}/download`;

      api
        .get(endpoint, { responseType: "blob" })
        .then((res) => {
          if (!active) return;
          const type = res.data.type || res.headers?.["content-type"] || "";
          objectUrl = window.URL.createObjectURL(res.data);
          setUrl(objectUrl);
          setContentType(type);
        })
        .catch(() => {
          if (active) setError("Gagal memuat dokumen. Coba lagi.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [doc, reimbursementId, isPaymentProof]);

  if (!doc) return null;

  const isImage = guessIsImage(doc.original_name, contentType);
  const isPdf = guessIsPdf(doc.original_name, contentType);

  const handleDownload = () => {
    if (!url) return;
    const link = window.document.createElement("a");
    link.href = url;
    link.download = doc.original_name || "dokumen";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{doc.original_name}</p>
            <p className="text-xs text-gray-400">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleDownload}
              disabled={!url}
              title="Unduh"
              className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            >
              <FaDownload size={16} />
            </button>
            <button onClick={onClose} title="Tutup" className="text-gray-400 hover:text-gray-600">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4 min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <FaSpinner className="animate-spin" size={24} />
              <p className="text-sm">Memuat dokumen...</p>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-2 text-red-500">
              <FaExclamationTriangle size={24} />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && !error && url && isImage && (
            <img src={url} alt={doc.original_name} className="max-w-full max-h-[70vh] object-contain rounded" />
          )}
          {!loading && !error && url && isPdf && (
            <iframe title={doc.original_name} src={url} className="w-full h-[70vh] rounded border border-gray-200 bg-white" />
          )}
          {!loading && !error && url && !isImage && !isPdf && (
            <div className="flex flex-col items-center gap-3 text-gray-500">
              <p className="text-sm">Pratinjau tidak tersedia untuk tipe file ini.</p>
              <button
                onClick={handleDownload}
                className="h-10 px-5 rounded-md bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
              >
                Unduh untuk melihat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
