import React, { useState, useEffect } from 'react';
import { JamClip, ClipCategory } from '../types';
import { X, Save, Tag, Music } from 'lucide-react';

interface EditClipModalProps {
  clip: JamClip | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clipId: string, updates: Partial<JamClip>) => void;
}

const CATEGORIES: ClipCategory[] = ['Riffs', 'Vocals', 'Drums', 'Synths', 'Other'];

const EditClipModal: React.FC<EditClipModalProps> = ({ clip, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ClipCategory>('Other');
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (clip) {
      setTitle(clip.title);
      setCategory(clip.category || 'Other');
      setTagsInput(clip.tags.join(', '));
    }
  }, [clip]);

  if (!isOpen || !clip) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    onSave(clip.id, {
      title,
      category,
      tags
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Clip Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Title</label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500"
                placeholder="Name your idea..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    category === cat 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Tags (comma separated)</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 dark:focus:border-orange-500"
                placeholder="funky, slow, sketch..."
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tagsInput.split(',').map(t => t.trim()).filter(t => t).map((tag, i) => (
                <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClipModal;