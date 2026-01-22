import React, { useState } from 'react';
import { TEMPLATES, Template } from '../../data/templates';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onSaveAsTemplate?: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveAsTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Template['category'] | 'all'>('all');
  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null);

  if (!isOpen) return null;

  const filteredTemplates = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory);

  const categories: { id: Template['category'] | 'all'; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'classic', label: 'Classique' },
    { id: 'modern', label: 'Moderne' },
    { id: 'craft', label: 'Artisanal' },
    { id: 'minimal', label: 'Minimal' },
  ];

  const getCategoryColor = (category: Template['category']): string => {
    switch (category) {
      case 'classic': return 'bg-amber-600';
      case 'modern': return 'bg-gray-600';
      case 'craft': return 'bg-orange-700';
      case 'minimal': return 'bg-gray-400';
      default: return 'bg-gray-600';
    }
  };

  const getPreviewBackground = (category: Template['category']): string => {
    switch (category) {
      case 'classic': return 'bg-white';
      case 'modern': return 'bg-gray-900';
      case 'craft': return 'bg-amber-50';
      case 'minimal': return 'bg-white';
      default: return 'bg-white';
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setConfirmTemplate(template);
  };

  const handleConfirmLoad = () => {
    if (confirmTemplate) {
      onSelectTemplate(confirmTemplate);
      setConfirmTemplate(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Galerie de Templates</h2>
            <p className="text-sm text-gray-400 mt-1">
              Choisissez un template pour demarrer rapidement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category filters */}
        <div className="px-6 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="group relative bg-gray-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-amber-500 transition-all"
              >
                {/* Preview thumbnail */}
                <div className={`aspect-[3/4] ${getPreviewBackground(template.category)} relative`}>
                  {/* Simple visual preview based on category */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {template.category === 'classic' && (
                      <div className="w-3/4 h-3/4 border-2 border-amber-600 flex flex-col items-center justify-center p-2">
                        <div className="w-full h-1 bg-amber-600 mb-2" />
                        <div className="text-xs font-bold text-gray-800">BEER NAME</div>
                        <div className="text-[8px] text-gray-500 mt-1">Style</div>
                        <div className="w-8 h-px bg-amber-600 my-2" />
                        <div className="text-[8px] text-gray-600">5.5%</div>
                      </div>
                    )}
                    {template.category === 'modern' && (
                      <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
                        <div className="text-[6px] text-gray-500 tracking-widest mb-2">BRASSERIE</div>
                        <div className="text-sm font-bold text-white">GOLDEN</div>
                        <div className="text-sm text-white font-light">ALE</div>
                        <div className="w-6 h-0.5 bg-amber-500 my-2" />
                        <div className="text-xs text-amber-500 font-bold">5.5%</div>
                      </div>
                    )}
                    {template.category === 'craft' && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-2 border-amber-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-[6px] text-amber-800 tracking-wider">CRAFT</div>
                            <div className="text-xs font-bold text-amber-800">BEER</div>
                          </div>
                        </div>
                        <div className="text-[8px] text-gray-600 mt-2 italic">Golden Ale</div>
                      </div>
                    )}
                    {template.category === 'minimal' && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-sm font-bold text-gray-800">GOLDEN ALE</div>
                        <div className="w-6 h-px bg-gray-800 my-2" />
                        <div className="text-[8px] text-gray-600">5.5%</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Template info */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${getCategoryColor(template.category)}`} />
                    <span className="text-sm font-medium text-white">{template.name}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{template.description}</p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-opacity">
                    Utiliser
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
          {onSaveAsTemplate && (
            <button
              onClick={onSaveAsTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Sauvegarder comme template
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmTemplate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Charger le template ?</h3>
            <p className="text-gray-400 mb-4">
              Charger le template "{confirmTemplate.name}" remplacera le contenu actuel de votre etiquette.
              Cette action ne peut pas etre annulee.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setConfirmTemplate(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLoad}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              >
                Charger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
