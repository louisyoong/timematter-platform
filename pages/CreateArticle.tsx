import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { UserRole } from '../types';
import {
  ShieldAlert, ImagePlus, X, ArrowLeft, Send, CheckCircle2,
} from 'lucide-react';

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const CreateArticle: React.FC = () => {
  const { currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().split('T')[0]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerBase64, setBannerBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const bannerRef = useRef<HTMLInputElement>(null);

  const isOrganizer =
    currentUser?.role === UserRole.ORGANIZER ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  if (!currentUser || !isOrganizer) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-xl font-bold text-gray-700">Organizers Only</p>
          <p className="mt-2 text-sm text-gray-400">You need an organizer account to submit articles.</p>
          <a href="#/articles" className="mt-6 inline-block text-sm text-emerald-600 font-bold hover:underline">
            ← Back to Articles
          </a>
        </div>
      </div>
    );
  }

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setError('');
    const base64 = await toBase64(file);
    setBannerBase64(base64);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Article content is required.'); return; }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          publishedAt,
          bannerImage: bannerBase64 ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Failed to submit article.'); return; }
      setSuccess(true);
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Submitted!</h2>
          <p className="text-sm text-gray-500 mb-8">Your article has been published to the TimeMatter Journal.</p>
          <div className="flex gap-3 justify-center">
            <a
              href="#/articles"
              className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
            >
              View Articles
            </a>
            <button
              onClick={() => {
                setSuccess(false);
                setTitle(''); setContent('');
                setBannerPreview(null); setBannerBase64(null);
                setPublishedAt(new Date().toISOString().split('T')[0]);
              }}
              className="px-6 py-3 border border-gray-200 text-sm font-semibold text-gray-600 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Write Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-20">
      {/* Back */}
      <button
        onClick={() => { window.location.hash = '/articles'; }}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Articles
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit an Article</h1>
        <p className="mt-1 text-sm text-gray-500">Share your knowledge with the TimeMatter community.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        {/* Banner image */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Banner Photo</label>
          <input
            ref={bannerRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={handleBannerChange}
          />
          {bannerPreview ? (
            <div className="relative rounded-2xl overflow-hidden h-56 bg-gray-100 group">
              <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setBannerPreview(null); setBannerBase64(null); if (bannerRef.current) bannerRef.current.value = ''; }}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors"
              >
                <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-xl transition-opacity">
                  Change Photo
                </span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="w-full h-44 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
            >
              <ImagePlus size={32} />
              <span className="text-sm font-semibold">Click to upload banner image</span>
              <span className="text-xs">JPEG or PNG, max 5MB</span>
            </button>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 5 Ways to Stay Active After 60"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* Published date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Publish Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Article Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="Write your article here…"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-y leading-relaxed"
          />
          <p className="mt-1 text-xs text-gray-400">{content.length} characters</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing…</>
          ) : (
            <><Send size={16} /> Publish Article</>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateArticle;
