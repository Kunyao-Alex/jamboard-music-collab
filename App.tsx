import React, { useState, useEffect } from 'react';
import { Plus, Grid, Search, SlidersHorizontal, Radio, LogOut, Sun, Moon, User as UserIcon } from 'lucide-react';
import Recorder from './components/Recorder';
import ClipCard from './components/ClipCard';
import Auth from './components/Auth';
import ProfileModal from './components/ProfileModal';
import EditClipModal from './components/EditClipModal';
import ConfirmationModal from './components/ConfirmationModal';
import { JamClip, Comment, User, Theme } from './types';
import { analyzeAudioClip } from './services/geminiService';

// Mock Initial Data
const DEMO_USER_ID = 'u_demo';
const INITIAL_CLIPS: JamClip[] = [
  {
    id: 'c1',
    title: 'Funky Bass Line Idea',
    audioUrl: 'https://actions.google.com/sounds/v1/water/air_woosh_underwater.ogg', // Placeholder
    duration: 5,
    tags: ['Bass', 'Funky', 'Loop'],
    category: 'Riffs',
    createdAt: Date.now() - 10000000,
    userId: 'u2',
    user: { id: 'u2', name: 'Sarah Sutton', avatarUrl: '', email: 'sarah@example.com' },
    comments: [
      { id: 'cm1', userId: 'u3', userName: 'Dave Bradley', userAvatar: '', text: 'This is tight! I can put a beat over this.', timestamp: Date.now() - 5000000 }
    ],
    aiAnalysis: "A deep, resonant bass texture with a submerged, fluid quality."
  },
  {
    id: 'c2',
    title: 'Morning Acoustic Riff',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg', // Placeholder
    duration: 12,
    tags: ['Acoustic', 'Chill', 'Morning'],
    category: 'Riffs',
    createdAt: Date.now() - 3600000,
    userId: DEMO_USER_ID,
    user: { id: DEMO_USER_ID, name: 'Jacob Le', avatarUrl: 'https://picsum.photos/50/50', email: 'jacob@demo.com' },
    comments: [],
  }
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Initialize clips from local storage or fallback to initial
  const [clips, setClips] = useState<JamClip[]>(() => {
    try {
      const stored = localStorage.getItem('jamboard_clips');
      return stored ? JSON.parse(stored) : INITIAL_CLIPS;
    } catch (e) {
      console.error("Failed to parse stored clips", e);
      return INITIAL_CLIPS;
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Modal states
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingClip, setEditingClip] = useState<JamClip | null>(null);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Check for session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('jamboard_session_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Check system preference for theme if not manually set (though we default to dark for now)
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Save clips to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('jamboard_clips', JSON.stringify(clips));
    } catch (e) {
      console.error("Failed to save clips to storage (likely quota exceeded)", e);
    }
  }, [clips]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('jamboard_session_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jamboard_session_user');
    setIsRecording(false);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('jamboard_session_user', JSON.stringify(updatedUser));
    
    // Also update this user in the 'database' and existing clips
    const storedUsersStr = localStorage.getItem('jamboard_users');
    if (storedUsersStr) {
      const users: (User & { password: string })[] = JSON.parse(storedUsersStr);
      const updatedUsers = users.map(u => u.email === updatedUser.email ? { ...u, ...updatedUser } : u);
      localStorage.setItem('jamboard_users', JSON.stringify(updatedUsers));
    }

    // Update local clips to reflect new avatar/name
    setClips(prev => prev.map(c => 
      c.userId === updatedUser.id ? { ...c, user: updatedUser } : c
    ));
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSaveRecording = async (blob: Blob, duration: number) => {
    if (!user) return;

    try {
      const audioUrl = await blobToBase64(blob);
      
      const newClip: JamClip = {
        id: `c${Date.now()}`,
        title: `New Idea #${clips.length + 1}`,
        audioUrl, 
        audioBlob: blob,
        duration,
        tags: ['New', 'Untagged'],
        category: 'Other', 
        createdAt: Date.now(),
        userId: user.id,
        user: user,
        comments: [],
      };

      setClips(prev => [newClip, ...prev]);
      setIsRecording(false);
      setEditingClip(newClip);
    } catch (error) {
      console.error("Failed to process audio for storage", error);
      alert("Failed to save audio. Recording might be too long for local storage.");
    }
  };

  const handleUpdateClip = (clipId: string, updates: Partial<JamClip>) => {
    setClips(prev => prev.map(c => c.id === clipId ? { ...c, ...updates } : c));
  };

  const handleDeleteClip = (clipId: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Clip',
      message: 'Are you sure you want to delete this clip? This action is irreversible.',
      onConfirm: () => {
        setClips(prev => prev.filter(c => c.id !== clipId));
      }
    });
  };

  const handleDeleteComment = (clipId: string, commentId: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment? This action is irreversible.',
      onConfirm: () => {
        setClips(prev => prev.map(c => {
          if (c.id === clipId) {
            return {
              ...c,
              comments: c.comments.filter(comment => comment.id !== commentId)
            };
          }
          return c;
        }));
      }
    });
  };

  const handleAnalyze = async (clipId: string) => {
    let clipToAnalyze = clips.find(c => c.id === clipId);
    if (!clipToAnalyze) return;

    setClips(prev => prev.map(c => c.id === clipId ? { ...c, isAnalyzing: true } : c));

    let blobToAnalyze = clipToAnalyze.audioBlob;
    if (!blobToAnalyze && clipToAnalyze.audioUrl.startsWith('data:')) {
       try {
         const res = await fetch(clipToAnalyze.audioUrl);
         blobToAnalyze = await res.blob();
       } catch (e) {
         console.error("Failed to reconstruct blob from URL", e);
       }
    }

    if (!blobToAnalyze) {
      if (!clipToAnalyze.audioUrl.startsWith('data:')) {
         alert("Cannot analyze remote demo clips without a backend proxy. Try recording your own!");
         setClips(prev => prev.map(c => c.id === clipId ? { ...c, isAnalyzing: false } : c));
         return;
      }
      return;
    }

    const { tags, description } = await analyzeAudioClip(blobToAnalyze);

    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          isAnalyzing: false,
          tags: [...new Set([...c.tags.filter(t => t !== 'Untagged'), ...tags])], 
          aiAnalysis: description
        };
      }
      return c;
    }));
  };

  const handleAddComment = (clipId: string, text: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: `cm${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      text,
      timestamp: Date.now(),
    };

    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return { ...c, comments: [...c.comments, newComment] };
      }
      return c;
    }));
  };

  const filteredClips = clips.filter(clip => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      clip.title.toLowerCase().includes(query) || 
      clip.tags.some(t => t.toLowerCase().includes(query));
    
    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'My Clips') return user && clip.userId === user.id;
    return clip.category === activeTab || clip.tags.some(t => t.toLowerCase() === activeTab.toLowerCase());
  });

  // Updated Logo Component matching the actual club logo
  const EFGHLogo = () => (
    <div className="flex items-center select-none h-8 gap-[1px]">
      {/* E: Constructed from 3 geometric bars */}
      <div className="flex flex-col justify-between h-[28px] w-[18px] mr-0.5 py-[1px]">
        <div className="h-[6px] w-full bg-slate-900 dark:bg-white"></div>
        <div className="h-[6px] w-full bg-slate-900 dark:bg-white"></div>
        <div className="h-[6px] w-full bg-slate-900 dark:bg-white"></div>
      </div>
      
      {/* F: Heavy font */}
      <span className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter -mt-1.5">
        F
      </span>
      
      {/* G: Vinyl Record */}
      <div className="relative w-9 h-9 flex items-center justify-center mx-0.5">
        {/* Main Disc */}
        <div className="absolute inset-0 bg-slate-900 dark:bg-white rounded-full shadow-sm"></div>
        {/* Reflection/Shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 opacity-50"></div>
        {/* Orange Center */}
        <div className="absolute w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center z-10">
          {/* White Dot */}
          <div className="w-1 h-1 bg-white rounded-full"></div>
        </div>
      </div>
      
      {/* H: Heavy font with Blue Square */}
      <div className="relative">
        <span className="text-4xl font-black text-slate-900 dark:text-white leading-none tracking-tighter -mt-1.5 block">
          H
        </span>
        {/* Blue Square Dot */}
        <div className="absolute top-0 -right-2 w-2.5 h-2.5 bg-blue-600"></div>
      </div>
    </div>
  );

  // If not logged in, show Auth screen
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <ProfileModal 
        user={user} 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onUpdate={handleUpdateProfile} 
      />

      <EditClipModal
        clip={editingClip}
        isOpen={!!editingClip}
        onClose={() => setEditingClip(null)}
        onSave={handleUpdateClip}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
      />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <EFGHLogo />
              <div className="hidden sm:block w-px h-8 bg-slate-300 dark:bg-slate-700 mx-3"></div>
              <span className="hidden sm:block text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                Original Music Club
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">{user.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Member</p>
                </div>
                
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden hover:border-orange-500 transition-colors"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">{user.name.charAt(0)}</div>
                  )}
                </button>

                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Log Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero / Action Area */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Club Jam Session</h1>
              <p className="text-slate-600 dark:text-slate-400">Capture, share, and collab on rough ideas.</p>
            </div>
            
            {!isRecording && (
              <button 
                onClick={() => setIsRecording(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                <span>New Idea</span>
              </button>
            )}
          </div>

          {isRecording && (
            <div className="mb-10">
              <Recorder 
                onSave={handleSaveRecording} 
                onCancel={() => setIsRecording(false)} 
              />
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="Search clips or tags..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
               {['All', 'Riffs', 'Vocals', 'Drums', 'Synths', 'My Clips'].map((t) => (
                 <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 border rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm ${
                    activeTab === t
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  }`}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>

          {/* Feed */}
          <div className="grid grid-cols-1 gap-6">
            {filteredClips.length > 0 ? (
              filteredClips.map(clip => (
                <ClipCard 
                  key={clip.id} 
                  clip={clip} 
                  currentUser={user}
                  onAnalyze={handleAnalyze}
                  onAddComment={handleAddComment}
                  onEdit={setEditingClip}
                  onDeleteClip={handleDeleteClip}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                <Grid className="mx-auto text-slate-400 dark:text-slate-700 mb-4" size={48} />
                <h3 className="text-xl font-medium text-slate-600 dark:text-slate-500">No clips found</h3>
                <p className="text-slate-500 dark:text-slate-600 mt-2">Try adjusting your search or record something new!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Floating Status or Hint */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 p-4 rounded-lg shadow-xl dark:shadow-2xl max-w-xs hidden md:block animate-in fade-in slide-in-from-bottom-6 duration-700">
           <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                <Radio className="text-orange-600 dark:text-orange-400" size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Pro Tip</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Use "Ask AI" on your clips to automatically generate vibe tags and technical descriptions.</p>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}