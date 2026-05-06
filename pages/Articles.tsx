
import React from 'react';
import { useApp } from '../store/AppContext';
import { ThumbsUp, Calendar, User, ArrowRight } from 'lucide-react';

const Articles: React.FC = () => {
  const { articles, clapArticle } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TimeMatter Journal</h1>
        <p className="text-gray-600 text-lg">Knowledge and stories to inspire your golden years.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Featured Article */}
        <div className="lg:col-span-8 group cursor-pointer">
          <div className="relative overflow-hidden rounded-3xl h-[400px] mb-6 shadow-lg">
            <img src={articles[0].imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="featured" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
              <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-wider">Featured</span>
              <h2 className="text-3xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{articles[0].title}</h2>
              <p className="text-gray-200 line-clamp-2 mb-4">{articles[0].content}</p>
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <span className="flex items-center gap-2"><User size={16} /> {articles[0].author}</span>
                <span className="flex items-center gap-2"><Calendar size={16} /> {articles[0].date}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); clapArticle(articles[0].id); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-emerald-500 rounded-full transition-all text-white backdrop-blur-sm"
                >
                  <ThumbsUp size={16} /> {articles[0].claps} Claps
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Listing */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <h3 className="text-xl font-bold text-gray-900 border-b pb-2 border-emerald-500 w-fit">Latest Updates</h3>
          {articles.slice(1).map(article => (
            <div key={article.id} className="group cursor-pointer flex gap-4">
              <img src={article.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-all" alt="thumb" />
              <div className="flex flex-col justify-between py-1">
                <h4 className="font-bold text-gray-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{article.date}</span>
                  <button 
                    onClick={() => clapArticle(article.id)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    <ThumbsUp size={14} /> {article.claps}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white mt-4 shadow-xl shadow-emerald-200/50">
             <h4 className="text-xl font-bold mb-4">Write for us?</h4>
             <p className="text-emerald-100 text-sm mb-6">Are you a healthcare professional or have a story to share? We'd love to hear from you.</p>
             <button className="w-full py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
               Submit Article <ArrowRight size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Full Grid */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map(article => (
          <div key={article.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="h-56 overflow-hidden">
              <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="article" />
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold mb-4 line-clamp-2 group-hover:text-emerald-600 transition-colors">{article.title}</h3>
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">{article.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                    {article.author.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{article.author}</span>
                </div>
                <button 
                  onClick={() => clapArticle(article.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full font-bold text-sm hover:bg-emerald-100 transition-colors"
                >
                  <ThumbsUp size={16} /> {article.claps}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;
