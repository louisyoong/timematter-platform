import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { supabase, BACKEND_URL, TM_TOKEN_KEY } from '../services/supabase';
import { UserRole } from '../types';
import { Heart, Calendar, User, ArrowRight } from 'lucide-react';

type ApiArticle = {
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

const formatDate = (iso: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-MY', { dateStyle: 'medium' });
  } catch { return iso; }
};

const Articles: React.FC = () => {
  const { currentUser } = useApp();
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrganizer =
    currentUser?.role === UserRole.ORGANIZER ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/articles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const json = await res.json();
        setArticles(json.articles ?? []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const goToArticle = (id: number) => {
    window.location.hash = `/article/${id}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-10 w-64 bg-gray-100 rounded-2xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 h-[400px] bg-gray-100 rounded-3xl animate-pulse" />
          <div className="lg:col-span-4 space-y-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TimeMatter Journal</h1>
          <p className="text-gray-600 text-lg">Knowledge and stories to inspire your golden years.</p>
        </div>
        <div className="py-24 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
          <p className="text-gray-400 font-medium mb-4">No articles yet.</p>
          {isOrganizer && (
            <a
              href="#/create-article"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
            >
              Submit First Article <ArrowRight size={16} />
            </a>
          )}
        </div>
      </div>
    );
  }

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TimeMatter Journal</h1>
        <p className="text-gray-600 text-lg">Knowledge and stories to inspire your golden years.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Featured Article */}
        <div
          className="lg:col-span-8 group cursor-pointer"
          onClick={() => goToArticle(featured.id)}
        >
          <div className="relative overflow-hidden rounded-3xl h-[400px] mb-6 shadow-lg bg-emerald-50">
            {featured.banner_image_url ? (
              <img
                src={featured.banner_image_url}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={featured.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-200 text-8xl font-black select-none">
                {featured.title.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">
                Featured
              </span>
              <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                {featured.title}
              </h2>
              <p className="text-gray-200 line-clamp-2 mb-4">{featured.content}</p>
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <span className="flex items-center gap-2"><User size={16} />{featured.author.name}</span>
                <span className="flex items-center gap-2"><Calendar size={16} />{formatDate(featured.published_at)}</span>
                <span className="flex items-center gap-2"><Heart size={16} />{featured.claps} claps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <h3 className="text-xl font-bold text-gray-900 border-b pb-2 border-emerald-500 w-fit">
            Latest Updates
          </h3>

          {rest.slice(0, 4).map((article) => (
            <div
              key={article.id}
              onClick={() => goToArticle(article.id)}
              className="group cursor-pointer flex gap-4"
            >
              {article.banner_image_url ? (
                <img
                  src={article.banner_image_url}
                  className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-all shrink-0"
                  alt={article.title}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-300 text-3xl font-black shrink-0 select-none">
                  {article.title.charAt(0)}
                </div>
              )}
              <div className="flex flex-col justify-between py-1 min-w-0">
                <h4 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <span className="text-xs text-gray-400">{formatDate(article.published_at)}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Heart size={12} className="text-emerald-400" /> {article.claps}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Submit article CTA */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white mt-4 shadow-xl shadow-emerald-200/50">
            <h4 className="text-xl font-bold mb-4">Write for us?</h4>
            <p className="text-emerald-100 text-sm mb-6">
              {isOrganizer
                ? 'Share your expertise with the TimeMatter community.'
                : 'Are you a healthcare professional? Sign up as an organizer to contribute.'}
            </p>
            {isOrganizer ? (
              <a
                href="#/create-article"
                className="w-full py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                Submit Article <ArrowRight size={18} />
              </a>
            ) : (
              <a
                href="#/signup"
                className="w-full py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                Become an Organizer <ArrowRight size={18} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Full grid */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => goToArticle(article.id)}
            className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group cursor-pointer"
          >
            <div className="h-56 overflow-hidden bg-emerald-50">
              {article.banner_image_url ? (
                <img
                  src={article.banner_image_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={article.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-emerald-200 text-6xl font-black select-none">
                  {article.title.charAt(0)}
                </div>
              )}
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                {article.title}
              </h3>
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">{article.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {article.author.profile_photo_url ? (
                    <img
                      src={article.author.profile_photo_url}
                      className="w-8 h-8 rounded-full object-cover"
                      alt={article.author.name}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {article.author.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-500">{article.author.name}</span>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                  <Heart size={14} className="text-emerald-400" /> {article.claps}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;
