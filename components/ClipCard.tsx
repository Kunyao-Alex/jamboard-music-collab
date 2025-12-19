import React, { useState } from 'react';
import { JamClip, User } from '../types';
import Waveform from './Waveform';
import { MessageCircle, Download, Sparkles, Tag, User as UserIcon, Edit2, Trash2, X } from 'lucide-react';

interface ClipCardProps {
  clip: JamClip;
  currentUser: User | null;
  onAnalyze: (clipId: string) => void;
  onAddComment: (clipId: string, text: string) => void;
  onEdit: (clip: JamClip) => void;
  onDeleteClip: (clipId: string) => void;
  onDeleteComment: (clipId: string, commentId: string) => void;
}

const ClipCard: React.FC<ClipCardProps> = ({ 
  clip, 
  currentUser, 
  onAnalyze, 
  onAddComment, 
  onEdit, 
  onDeleteClip,
  onDeleteComment 
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isOwner = currentUser?.id === clip.userId;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(clip.id, commentText);
      setCommentText('');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = clip.audioUrl;
    a.download = `${clip.title.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-orange-400/50 dark:hover:border-orange-500/50 transition-all duration-300 shadow-md hover:shadow-lg group">
      {/* Header */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
               {clip.user.avatarUrl ? (
                 <img src={clip.user.avatarUrl} alt={clip.user.name} className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="text-slate-400 dark:text-slate-500" size={24} />
               )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                {clip.title}
                {clip.category && (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800">
                    {clip.category}
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                by {clip.user.name} • {new Date(clip.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(clip);
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Edit Clip"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClip(clip.id);
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete Clip"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" 
              title="Download Stem"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Waveform */}
        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 mb-4 border border-transparent dark:border-slate-800">
          <Waveform 
            audioUrl={clip.audioUrl} 
            waveColor="rgba(148, 163, 184, 0.5)" 
            progressColor="#f97316" /* Orange-500 */
          />
        </div>

        {/* Tags & AI */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {clip.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-200 dark:border-slate-600 flex items-center gap-1">
              <Tag size={12} /> {tag}
            </span>
          ))}
          
          <button
            onClick={() => onAnalyze(clip.id)}
            disabled={clip.isAnalyzing || !!clip.aiAnalysis}
            className={`
              px-3 py-1 text-xs rounded-full border flex items-center gap-1.5 transition-all
              ${clip.aiAnalysis 
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-300 cursor-default' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-500/10 dark:to-purple-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer'}
              ${clip.isAnalyzing ? 'animate-pulse opacity-70' : ''}
            `}
          >
            <Sparkles size={12} className={clip.aiAnalysis ? 'text-orange-500' : 'text-blue-500'} />
            {clip.isAnalyzing ? 'Listening...' : clip.aiAnalysis ? 'AI Analyzed' : 'Ask AI'}
          </button>
        </div>

        {/* AI Analysis Result */}
        {clip.aiAnalysis && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-orange-200 dark:border-orange-500/20 text-sm text-slate-700 dark:text-slate-300 italic">
             "{clip.aiAnalysis}"
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50">
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <MessageCircle size={18} />
            {clip.comments.length} Comments
          </button>
          
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
             <span>{Math.floor(clip.duration)}s duration</span>
             <span>•</span>
             <span>44.1kHz</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 border-t border-slate-200 dark:border-slate-700">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
            {clip.comments.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-600 text-sm py-2">No comments yet. Start the jam!</p>
            ) : (
              clip.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group/comment">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 overflow-hidden">
                    {comment.userAvatar ? (
                        <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover"/>
                    ) : comment.userName.charAt(0)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-300">{comment.userName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-600">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      {currentUser?.id === comment.userId && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteComment(clip.id, comment.id);
                          }}
                          className="opacity-0 group-hover/comment:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                          title="Delete comment"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{comment.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment or feedback..."
              className="flex-grow bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-500"
            />
            <button 
              type="submit"
              disabled={!commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClipCard;