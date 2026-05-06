
import React, { useState } from 'react';
import { FAQ } from '../types';
import { ChevronDown, MessageSquare, Phone, Mail, Sparkles, Send } from 'lucide-react';
import { askHelpAssistant } from '../services/gemini';

const faqs: FAQ[] = [
  { question: "How do I join an event?", answer: "To join an event, click on the event you're interested in and hit the 'Join Event' button. You'll need to be logged in to your TimeMatter account." },
  { question: "Are events free?", answer: "Currently, most community-led events on TimeMatter are free. Some specialized workshops may have a nominal fee, which will be clearly indicated." },
  { question: "Can I host my own event?", answer: "Yes! If you're an organizer or represent a community group, you can sign up as an 'Organizer' and start creating events." },
  { question: "How do I cancel my attendance?", answer: "You can manage your event attendance in your profile dashboard. Simply find the event and click 'Withdraw'." }
];

const HelpCenter: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    const res = await askHelpAssistant(aiQuestion);
    setAiResponse(res);
    setIsAiLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
        <p className="text-gray-600 text-lg">Find answers, talk to our AI assistant, or reach out to us directly.</p>
      </div>

      {/* AI Assistant Box */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl shadow-emerald-200 mb-20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles size={24} className="text-emerald-200" />
            </div>
            <h2 className="text-2xl font-bold">Ask Our AI Assistant</h2>
          </div>
          <p className="text-emerald-100 mb-8 max-w-2xl">
            Have a specific question about our platform or aging gracefully? Our TimeMatter AI is here to help 24/7.
          </p>
          <form onSubmit={handleAskAI} className="relative mb-6">
            <input 
              type="text" 
              placeholder="e.g., How can I stay active at 70?" 
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-white/40 text-white backdrop-blur-md"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
            />
            <button 
              disabled={isAiLoading}
              className="absolute right-2 top-2 bottom-2 bg-white text-emerald-700 px-6 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2"
            >
              {isAiLoading ? 'Thinking...' : <><Send size={18} /> Ask</>}
            </button>
          </form>
          {aiResponse && (
            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-emerald-50 leading-relaxed italic">"{aiResponse}"</p>
            </div>
          )}
        </div>
        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full -ml-10 -mb-10"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* FAQs */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <MessageSquare className="text-emerald-600" /> Frequent Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl bg-white overflow-hidden shadow-sm">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-5 text-left font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  {faq.question}
                  <ChevronDown className={`transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-gray-600 border-t border-gray-50 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-gray-50 p-10 rounded-[2rem] border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Name</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-gray-400">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="john@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Subject</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Account Inquiry</option>
                <option>Event Hosting</option>
                <option>Reporting Issues</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-gray-400">Message</label>
              <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="How can we help you?"></textarea>
            </div>
            <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
              Submit Message
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2"><Phone size={16} className="text-emerald-500" /> +1 (800) 123-4567</div>
            <div className="flex items-center gap-2"><Mail size={16} className="text-emerald-500" /> support@timematter.club</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HelpCenter;
