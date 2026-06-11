import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImagePlus, Loader2, Check, AlertCircle, Film, Image } from 'lucide-react';

interface BannerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (url: string, type: string) => void;
  currentBanner?: string | null;
  themeColor: string;
}

const ACCEPTED_IMG = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_GIF = ['image/gif'];
const ACCEPTED_VID = ['video/mp4', 'video/webm'];
const ALL_ACCEPTED = [...ACCEPTED_IMG, ...ACCEPTED_GIF, ...ACCEPTED_VID];
const MAX_SIZE = 20 * 1024 * 1024;

function detectMediaType(type: string): 'static' | 'gif' | 'video' {
  if (ACCEPTED_GIF.includes(type)) return 'gif';
  if (ACCEPTED_VID.includes(type)) return 'video';
  return 'static';
}

export function BannerUploadModal({ isOpen, onClose, onUploaded, currentBanner, themeColor }: BannerUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'static' | 'gif' | 'video'>('static');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setPreview(null);
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setDone(false);
    setPreviewType('static');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = useCallback((f: File) => {
    setError(null);
    if (!ALL_ACCEPTED.includes(f.type)) {
      setError('Use JPG, PNG, WEBP, GIF, MP4, or WEBM.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Banner must be under 20MB.');
      return;
    }
    setFile(f);
    const mt = detectMediaType(f.type);
    setPreviewType(mt);
    if (mt === 'video') {
      setPreview(URL.createObjectURL(f));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + Math.random() * 12, 90));
    }, 150);

    try {
      const { uploadBanner } = await import('../../api/upload');
      const res = await uploadBanner(file);
      clearInterval(interval);
      setUploadProgress(100);
      setDone(true);
      setTimeout(() => {
        onUploaded(res.bannerUrl, res.bannerType);
        handleClose();
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.error?.message || 'Upload failed.');
      setUploadProgress(0);
    }
    setIsUploading(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-3xl border border-edge overflow-hidden"
            style={{ background: 'rgba(14,14,14,0.95)', backdropFilter: 'blur(30px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-sm font-black tracking-[0.14em] text-ink uppercase">Profile Banner</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-3 hover:text-ink border border-edge hover:border-edge-hi transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6">
              {/* Drop zone / preview */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && inputRef.current?.click()}
                className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                  isDragging ? 'border-white/40 scale-[1.01]' : preview ? 'border-transparent' : 'border-edge-hi hover:border-white/30'
                }`}
                style={{
                  aspectRatio: '16 / 5',
                  background: preview ? 'transparent' : isDragging ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                }}
              >
                {preview ? (
                  <>
                    {previewType === 'video' ? (
                      <video src={preview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                      {previewType === 'video' ? <Film className="w-3 h-3 text-purple-400" /> : previewType === 'gif' ? <Film className="w-3 h-3 text-emerald-400" /> : <Image className="w-3 h-3 text-blue-400" />}
                      <span className="text-ink-2">{previewType === 'video' ? 'Video' : previewType === 'gif' ? 'Animated' : 'Static'}</span>
                    </div>

                    {/* File info */}
                    {file && (
                      <div className="absolute bottom-3 right-3 text-[9px] font-semibold text-ink-3 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                        {formatSize(file.size)}
                      </div>
                    )}

                    {/* Upload progress overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                              <motion.circle
                                cx="32" cy="32" r="28" fill="none" stroke={themeColor} strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={176}
                                animate={{ strokeDashoffset: 176 - (176 * uploadProgress / 100) }}
                                transition={{ duration: 0.3 }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {done ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <Check className="w-5 h-5 text-emerald-400" />
                                </motion.div>
                              ) : (
                                <span className="text-[10px] font-bold text-ink">{Math.round(uploadProgress)}%</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-ink-2 uppercase tracking-wider">
                            {done ? 'Done!' : 'Uploading...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 p-6 text-center h-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-edge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Upload className="w-5 h-5 text-ink-2" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Drop a banner here</p>
                      <p className="text-[10px] text-ink-3 mt-1">JPG, PNG, WEBP, GIF, MP4, WEBM · max 20MB</p>
                      <p className="text-[10px] text-ink-3 mt-0.5 flex items-center justify-center gap-1">
                        <Film className="w-3 h-3" /> Animated banners supported
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                  e.target.value = '';
                }}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-4 p-3 rounded-xl border border-red-500/20 text-xs text-red-400"
                  style={{ background: 'rgba(239,68,68,0.06)' }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div className="flex gap-2 mt-5">
                {preview && !done && (
                  <motion.button
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleUpload}
                    disabled={isUploading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold disabled:opacity-60"
                    style={{ background: '#FFFFFF', color: '#000000', boxShadow: '0 4px 20px rgba(255,255,255,0.12)' }}
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {isUploading ? 'Uploading...' : 'Set Banner'}
                  </motion.button>
                )}
                {preview && !isUploading && !done && (
                  <button onClick={resetState} className="px-4 py-3 rounded-xl text-xs font-bold text-ink-3 border border-edge hover:border-edge-hi transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
