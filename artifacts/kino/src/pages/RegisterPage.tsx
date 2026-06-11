import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clapperboard, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Number' },
];

export function RegisterPage() {
  const { register, error, isLoading, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !username.trim() || !password) return;
    await register(email.trim(), username.trim(), password);
  };

  const allPassed = PASSWORD_RULES.every((r) => r.test(password));

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.022]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border border-edge-hi mb-5"
            style={{
              background: 'rgba(255,255,255,0.06)',
              boxShadow: '0 0 40px rgba(255,255,255,0.04)',
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Clapperboard className="w-7 h-7 text-ink" strokeWidth={1.8} />
          </motion.div>
          <h1 className="text-xl font-black tracking-[0.16em] text-ink uppercase">
            KINO
          </h1>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-ink-3 uppercase mt-1">
            Create your vault
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger font-medium"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm font-medium text-ink outline-none border border-edge focus:border-edge-hi transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')); clearError(); }}
              placeholder="cinephile_42"
              autoComplete="username"
              maxLength={24}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium text-ink outline-none border border-edge focus:border-edge-hi transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
            <p className="text-[10px] text-ink-3">
              Letters, numbers, underscores, hyphens. 3–24 chars.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-ink-3">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-medium text-ink outline-none border border-edge focus:border-edge-hi transition-colors duration-200"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength indicators */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex flex-wrap gap-2 mt-2"
              >
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                        passed
                          ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5'
                          : 'text-ink-3 border-edge bg-transparent'
                      }`}
                    >
                      {passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                      {rule.label}
                    </span>
                  );
                })}
              </motion.div>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !email.trim() || !username.trim() || !allPassed}
            whileHover={{ scale: isLoading ? 1 : 1.01 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            style={{
              background: '#FFFFFF',
              color: '#000000',
              boxShadow: '0 4px 20px rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
            }}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>

        <p className="text-center text-sm text-ink-3 mt-8">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-ink font-semibold hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
