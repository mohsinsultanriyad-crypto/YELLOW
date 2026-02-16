
import React, { useState, useRef } from 'react';
import { User, SitePost } from '../types';
import { Image as ImageIcon, Send, MoreHorizontal, Trash2, AlertCircle, Mic, Sparkles, Loader2 } from 'lucide-react';
import { translations, Language } from '../translations';
import { GoogleGenAI } from "@google/genai";

interface SiteFeedProps {
  user: User;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
  language?: Language;
}

const SiteFeed: React.FC<SiteFeedProps> = ({ user, posts, setPosts, language = 'en' }) => {
  const [content, setContent] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  
  const t = translations[language];

  const handlePost = () => {
    if (!content.trim()) return;
    const newPost: SitePost = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.id,
      authorName: user.name,
      content,
      timestamp: Date.now(),
      imageUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/${Math.random()}/600/400` : undefined
    };
    setPosts([newPost, ...posts]);
    setContent('');
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setContent(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  };

  const handleGeminiPolish = async () => {
    if (!content.trim()) return;
    setIsPolishing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a professional construction site manager. I will provide a rough site update. Please rewrite it to be professional, concise, and clear. 
      Keep it in the same language as the input: "${content}". 
      Return ONLY the polished text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const polishedText = response.text;
      if (polishedText) setContent(polishedText.trim());
    } catch (err) {
      console.error("Gemini failed:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setPostToDelete(null);
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t.feed}</h1>
      </header>

      {/* Create Post */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-4">
        <div className="relative">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.voicePlaceholder}
            className="w-full bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 resize-none min-h-[120px]"
          />
          {content.length > 10 && (
            <button 
              onClick={handleGeminiPolish}
              disabled={isPolishing}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isPolishing ? t.polishing : t.geminiPolish}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors">
              <ImageIcon size={20} />
            </button>
            <button 
              onClick={startListening}
              className={`flex items-center gap-2 p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}
              title={t.voiceButton}
            >
              <Mic size={20} />
            </button>
          </div>
          <button 
            onClick={handlePost}
            disabled={!content.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
          >
            Post
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map(post => {
          const canDelete = user.role === 'admin' || user.id === post.authorId;
          
          return (
            <div key={post.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                    <img src={`https://picsum.photos/seed/${post.authorId}/100`} alt="avatar" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{post.authorName}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {new Date(post.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canDelete && (
                    <button 
                      onClick={() => setPostToDelete(post.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button className="text-gray-400">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
              <div className="px-4 pb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {post.content}
                </p>
              </div>
              {post.imageUrl && (
                <div className="w-full aspect-[3/2] bg-gray-100">
                  <img src={post.imageUrl} alt="post content" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-white rounded-[2rem] p-6 space-y-6 text-center shadow-2xl animate-in zoom-in duration-200">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Delete Post?</h3>
              <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => handleDeletePost(postToDelete)} className="w-full bg-red-600 text-white font-black py-4 rounded-2xl">Delete Now</button>
              <button onClick={() => setPostToDelete(null)} className="w-full bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteFeed;
