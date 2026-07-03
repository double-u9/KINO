import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { MediaItem, MediaType } from '../../types';
import { X, ImagePlus, Trash2, ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Dropdown } from './dropdown';

export function MediaDetailModal({
  item,
  onClose,
}: {
  item: MediaItem;
  onClose: () => void;
}) {
  const updateMedia = useAppStore((s) => s.updateMedia);
  const deleteMedia = useAppStore((s) => s.deleteMedia);

  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<MediaType>(item.type);
  const [rating, setRating] = useState<number | ''>(item.rating ?? '');
  const [notes, setNotes] = useState(item.notes || '');
  const [coverBase64, setCoverBase64] = useState<string | null>(
    item.coverImageBase64 || null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    updateMedia(item.id, {
      title,
      type,
      rating: rating === '' ? null : Number(rating),
      notes,
      coverImageBase64: coverBase64,
    });
  }, [title, type, rating, notes, coverBase64, item.id, updateMedia]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setCoverBase64(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    deleteMedia(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col overflow-hidden rounded-3xl border border-edge"
        style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(48px)',
          WebkitBackdropFilter: 'blur(48px)',
          boxShadow:
            '0 48px 120px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1) inset',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover zone */}
        <div
          className="relative h-56 flex-shrink-0 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) processFile(f);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
        >
          {coverBase64 ? (
            <img
              src={coverBase64}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center border-b border-edge"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <ImagePlus
                className={`w-8 h-8 mb-2 transition-all duration-300 ${isDragging
                  ? 'text-ink scale-110'
                  : 'text-ink-3 group-hover:text-ink-2 group-hover:scale-105'
                  }`}
                strokeWidth={1.5}
              />
              <p className="text-xs text-ink-3 group-hover:text-ink-2 transition-colors font-medium">
                {isDragging ? 'Drop poster here' : 'Click or drop a cover poster'}
              </p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

          {coverBase64 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
              <span
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-ink border border-edge-hi"
                style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              >
                <ImagePlus className="w-3.5 h-3.5" /> Change Cover
              </span>
            </div>
          )}

          {item.imdbId && item.type !== 'music' && (
            <a
              href={`https://www.imdb.com/title/${item.imdbId}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-3 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold hover:opacity-80 transition-opacity text-ink border border-edge"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            >
              IMDb <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              updateMedia(item.id, { isFavorite: !item.isFavorite });
            }}
            className="absolute top-3 right-14 w-8 h-8 rounded-full flex items-center justify-center border transition-all"
            style={{
              background: item.isFavorite ? 'rgba(245,197,24,0.18)' : 'rgba(0,0,0,0.55)',
              borderColor: item.isFavorite ? 'rgba(245,197,24,0.55)' : 'rgba(255,255,255,0.18)',
              color: item.isFavorite ? '#F5C518' : 'rgba(239,239,239,0.45)',
              backdropFilter: 'blur(8px)',
              boxShadow: item.isFavorite ? '0 0 22px rgba(245,197,24,0.18)' : 'none',
            }}
            aria-label={item.isFavorite ? `Remove ${title} from favorites` : `Favorite ${title}`}
            title={item.isFavorite ? 'Remove favorite' : 'Mark as favorite'}
          >
            <Star className="w-4 h-4" fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border border-edge-hi text-ink-2 hover:text-ink hover:border-edge-max transition-all"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
          >
            <X className="w-4 h-4" />
          </button>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-ink outline-none border border-edge focus:border-edge-hi transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          <div className={`grid ${type === 'music' ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">Type</label>
              <Dropdown
                value={type}
                onChange={(v) => setType(v as MediaType)}
                options={[
                  { value: 'movie', label: 'Movie' },
                  { value: 'series', label: 'TV Series' },
                  { value: 'anime', label: 'Anime' },
                  { value: 'music', label: 'Music' },
                ]}
                className="w-full [&>button]:w-full [&>button]:justify-between"
              />
            </div>

            {type !== 'music' && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">Rating</label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-3" />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0–10"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium text-ink outline-none border border-edge focus:border-edge-hi transition-colors placeholder:text-ink-3"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">Personal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts, impressions, quotes..."
              rows={4}
              className="w-full resize-none px-4 py-2.5 rounded-xl text-sm text-ink outline-none border border-edge focus:border-edge-hi transition-colors placeholder:text-ink-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          <div className="pt-1 border-t border-edge">
            <motion.button
              onClick={handleDelete}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-edge hover:border-danger/40 hover:bg-danger/5 transition-all duration-200"
              style={{ color: '#F87171' }}
            >
              <Trash2 className="w-4 h-4" />
              Remove from Vault
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
