import React, { useState, useEffect } from 'react';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { ArrowLeft, Calendar, User as UserIcon, Heart } from 'lucide-react';

type Article = {
  id: number;
  title: string;
  content: string;
  banner_image_url?: string;
  published_at: string;
  claps: number;
  author: { id: number; name: string; profile_photo_url?: string };
};

const getToken = async (): Promise<string | null> => {
  const jwt = localStorage.getItem(TM_TOKEN_KEY);
  if (jwt) return jwt;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};

const getArticleId = (): string | null => {
  const hash = window.location.hash.replace('#', '');
  const match = hash.match(/\/article\/(.+)/);
  return match ? match[1] : null;
};

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-MY', { dateStyle: 'long' });
  } catch { return iso; }
};

const ArticleDetail: React.FC = () => {
  const articleId = getArticleId();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claps, setClaps] = useState(0);
  const [clapping, setClapping] = useState(false);
  const [hasClapped, setHasClapped] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    const clappedKey = `clapped_article_${articleId}`;
    setHasClapped(!!localStorage.getItem(clappedKey));

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/articles/${articleId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) { setError('Article not found.'); return; }
        const json = await res.json();
        setArticle(json.article);
        setClaps(json.article.claps ?? 0);
      } catch {
        setError('Unable to load article.');
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  const handleClap = async () => {
    if (clapping) return;
    setClapping(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/articles/${articleId}/clap`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setClaps(json.claps ?? claps + 1);
        setHasClapped(true);
        localStorage.setItem(`clapped_article_${articleId}`, '1');
      }
    } catch {
      // silently fail — optimistically update anyway
      setClaps((c) => c + 1);
      setHasClapped(true);
      localStorage.setItem(`clapped_article_${articleId}`, '1');
    } finally {
      setClapping(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-100 rounded-xl" />
        <div className="h-72 bg-gray-100 rounded-3xl" />
        <div className="h-8 w-3/4 bg-gray-100 rounded-xl" />
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-4 bg-gray-100 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 mb-4">{error || 'Article not found.'}</p>
        <button
          onClick={() => { window.location.hash = '/articles'; }}
          className="text-sm text-emerald-600 font-bold hover:underline"
        >
          ← Back to Articles
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
      {/* Back */}
      <button
        onClick={() => { window.location.hash = '/articles'; }}
        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Articles
      </button>

      {/* Banner */}
      {article.banner_image_url && (
        <div className="rounded-3xl overflow-hidden h-72 mb-8 shadow-lg">
          <img
            src={article.banner_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-5">
        {article.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-5 mb-8 pb-8 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          {article.author.profile_photo_url ? (
            <img
              src={article.author.profile_photo_url}
              alt={article.author.name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {article.author.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-800">{article.author.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar size={10} /> {formatDate(article.published_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px] mb-16">
        {article.content}
      </div>

      {/* Clap section */}
      <div className="flex flex-col items-center gap-3 py-10 border-t border-gray-100">
        <p className="text-sm text-gray-400">Did you find this helpful?</p>
        <button
          onClick={handleClap}
          disabled={clapping}
          className={`flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all shadow-sm ${
            hasClapped
              ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
              : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-md'
          } disabled:opacity-60`}
        >
          <Heart
            size={22}
            className={clapping ? 'animate-bounce' : ''}
          />
          {claps > 0 ? `${claps} Clap${claps !== 1 ? 's' : ''}` : 'Clap'}
        </button>
        {hasClapped && (
          <p className="text-xs text-emerald-500 font-medium">Thanks for clapping!</p>
        )}
      </div>
    </div>
  );
};

export default ArticleDetail;
