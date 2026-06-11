import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ImagePlus, Loader2, Check, AlertCircle } from 'lucide-react';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (url: string) => void;
  currentAvatar?: string | null;
  themeColor: string;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export function AvatarUploadModal({ isOpen, onClose, onUploaded, currentAvatar, themeColor }: AvatarUploadModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
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
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED.includes(f.type)) {
      setError('Please use PNG, JPG, or WEBP format.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setError('Image must be under 5MB.');
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
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

    // Simulate smooth progress
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 120);

    try {
      const { uploadAvatar } = await import('../../api/upload');
      const res = await uploadAvatar(file);
      clearInterval(interval);
      setUploadProgress(100);
      setDone(true);
      setTimeout(() => {
        onUploaded(res.avatarUrl);
        handleClose();
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.error?.message || 'Upload failed.');
      setUploadProgress(0);
    }
    setIsUploading(false);
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
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-3xl border border-edge overflow-hidden"
            style={{ background: 'rgba(14,14,14,0.95)', backdropFilter: 'blur(30px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-sm font-black tracking-[0.14em] text-ink uppercase">Profile Picture</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-3 hover:text-ink border border-edge hover:border-edge-hi transition-colors" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview / Drop Zone */}
            <div className="px-6 pb-6">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && inputRef.current?.click()}
                className={`relative w-full aspect-square max-w-[280px] mx-auto rounded-full border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center ${
                  isDragging ? 'border-white/40 scale-[1.02]' : preview ? 'border-transparent' : 'border-edge-hi hover:border-white/30'
                }`}
                style={{
                  background: preview ? 'transparent' : isDragging ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  boxShadow: preview ? `0 0 60px ${themeColor}22, 0 0 120px ${themeColor}11` : undefined,
                }}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    {/* Upload progress overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <div className="relative w-20 h-20">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                            <motion.circle
                              cx="40" cy="40" r="35" fill="none" stroke={themeColor} strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={220}
                              animate={{ strokeDashoffset: 220 - (220 * uploadProgress / 100) }}
                              transition={{ duration: 0.3 }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {done ? (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                                <Check className="w-6 h-6 text-emerald-400" />
                              </motion.div>
                            ) : (
                              <span className="text-xs font-bold text-ink">{Math.round(uploadProgress)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : currentAvatar ? (
                  <>
                    <img src={currentAvatar} alt="Current" className="w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <ImagePlus className="w-8 h-8 text-ink-2" strokeWidth={1.5} />
                      <span className="text-[10px] font-bold text-ink-2 uppercase tracking-wider">Replace</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-edge" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <Upload className="w-6 h-6 text-ink-2" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">Drop an image here</p>
                      <p className="text-[10px] text-ink-3 mt-1">or click to browse · PNG, JPG, WEBP · max 5MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) processFile(f);
                  e.target.value = '';
                }}
              />

              {/* Error */}
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

              {/* Actions */}
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
                    {isUploading ? 'Uploading...' : 'Upload Avatar'}
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
