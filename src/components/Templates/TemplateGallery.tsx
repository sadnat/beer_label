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
    { id: 'nature', label: 'Nature' },
    { id: 'vintage', label: 'Retro' },
    { id: 'bold', label: 'Audacieux' },
  ];

  const getCategoryColor = (category: Template['category']): string => {
    switch (category) {
      case 'classic': return 'bg-amber-600';
      case 'modern': return 'bg-gray-600';
      case 'craft': return 'bg-orange-700';
      case 'minimal': return 'bg-gray-400';
      case 'nature': return 'bg-green-600';
      case 'vintage': return 'bg-amber-800';
      case 'bold': return 'bg-red-600';
      default: return 'bg-gray-600';
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

  const renderTemplatePreview = (template: Template) => {
    switch (template.id) {
      case 'classic':
        return (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2">
            <div className="w-3/4 h-3/4 border-2 border-amber-600 flex flex-col items-center justify-center p-2">
              <div className="w-full h-1 bg-amber-600 mb-2" />
              <div className="text-xs font-bold text-gray-800">BEER NAME</div>
              <div className="text-[8px] text-gray-500 mt-1">Style</div>
              <div className="w-8 h-px bg-amber-600 my-2" />
              <div className="text-[8px] text-gray-600">5.5%</div>
            </div>
          </div>
        );
      case 'modern':
        return (
          <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-[6px] text-gray-500 tracking-widest mb-2">BRASSERIE</div>
            <div className="text-sm font-bold text-white">GOLDEN</div>
            <div className="text-sm text-white font-light">ALE</div>
            <div className="w-6 h-0.5 bg-amber-500 my-2" />
            <div className="text-xs text-amber-500 font-bold">5.5%</div>
          </div>
        );
      case 'craft':
        return (
          <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-amber-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[6px] text-amber-800 tracking-wider">CRAFT</div>
                <div className="text-xs font-bold text-amber-800">BEER</div>
              </div>
            </div>
            <div className="text-[8px] text-gray-600 mt-2 italic">Golden Ale</div>
          </div>
        );
      case 'minimal':
        return (
          <div className="w-full h-full bg-white flex flex-col items-center justify-center">
            <div className="text-sm font-bold text-gray-800">GOLDEN ALE</div>
            <div className="w-6 h-px bg-gray-800 my-2" />
            <div className="text-[8px] text-gray-600">5.5%</div>
          </div>
        );
      case 'houblon-botanique':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#f5f0e1' }}>
            <div className="text-[6px] tracking-wider" style={{ color: '#2d5a27' }}>BRASSERIE</div>
            <div className="flex items-center gap-1 my-1">
              <svg width="14" height="18" viewBox="0 0 35 45" className="opacity-80">
                <path d="M 0 40 Q 5 30 3 20 Q 8 25 12 18 Q 10 12 8 5 Q 14 10 18 8 Q 15 3 15 0 Q 20 5 22 3 Q 22 10 25 15 Q 28 10 30 12 Q 28 20 30 25 Q 33 22 35 28 Q 30 32 32 38 Q 25 35 20 40 Q 22 42 18 45 Q 15 42 12 44 Q 10 40 5 42 Z" fill="#6b8e23" stroke="#2d5a27" strokeWidth="1"/>
              </svg>
              <div className="text-[10px] font-bold" style={{ color: '#2d5a27' }}>HOUBLON</div>
              <svg width="14" height="18" viewBox="0 0 35 45" className="opacity-80" style={{ transform: 'scaleX(-1)' }}>
                <path d="M 0 40 Q 5 30 3 20 Q 8 25 12 18 Q 10 12 8 5 Q 14 10 18 8 Q 15 3 15 0 Q 20 5 22 3 Q 22 10 25 15 Q 28 10 30 12 Q 28 20 30 25 Q 33 22 35 28 Q 30 32 32 38 Q 25 35 20 40 Q 22 42 18 45 Q 15 42 12 44 Q 10 40 5 42 Z" fill="#6b8e23" stroke="#2d5a27" strokeWidth="1"/>
              </svg>
            </div>
            <div className="text-[7px] italic" style={{ color: '#6b8e23' }}>IPA</div>
          </div>
        );
      case 'ecusson-vintage':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#1c1710' }}>
            <div className="text-[5px] px-2 py-0.5 mb-1" style={{ background: '#d4a843', color: '#1c1710' }}>DEPUIS 1892</div>
            <svg width="40" height="50" viewBox="-70 -90 140 210" className="mb-1">
              <path d="M -70 -90 L 70 -90 L 70 30 Q 70 90 0 120 Q -70 90 -70 30 Z" fill="transparent" stroke="#d4a843" strokeWidth="4"/>
            </svg>
            <div className="text-[10px] font-bold" style={{ color: '#d4a843' }}>RESERVE</div>
            <div className="text-[6px]" style={{ color: '#c9b38a' }}>Barley Wine</div>
          </div>
        );
      case 'sommet-alpin':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#1a2332' }}>
            <div className="text-[6px] tracking-wider" style={{ color: '#8fb8de' }}>BRASSERIE DES CIMES</div>
            <div className="text-sm font-bold text-white mt-1">SOMMET</div>
            <div className="text-sm font-bold" style={{ color: '#8fb8de' }}>ALPIN</div>
            <svg width="100%" height="30" viewBox="0 0 140 40" preserveAspectRatio="none" className="absolute bottom-0 left-0">
              <path d="M 0 40 L 20 15 L 35 25 L 55 5 L 70 20 L 85 8 L 100 22 L 120 12 L 140 40 Z" fill="#5b8a72"/>
              <path d="M 10 40 L 15 35 L 20 40 Z M 30 40 L 34 33 L 38 40 Z M 100 40 L 104 33 L 108 40 Z M 115 40 L 119 34 L 123 40 Z" fill="#3d6b52"/>
            </svg>
          </div>
        );
      case 'epis-dor':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#faf5eb' }}>
            <div className="text-[5px] tracking-wider" style={{ color: '#8b6914' }}>BRASSERIE DU TERROIR</div>
            <div className="flex items-center gap-1 my-1">
              <svg width="10" height="30" viewBox="0 0 12 60" className="opacity-70">
                <path d="M 12 0 Q 8 -8 0 -10 Q 4 -4 3 0 Q 4 4 0 10 Q 8 8 12 0 Z M 12 20 Q 8 12 0 10 Q 4 16 3 20 Q 4 24 0 30 Q 8 28 12 20 Z" fill="#c8952e" transform="translate(0,15)"/>
              </svg>
              <div className="w-12 h-12 rounded-full border border-amber-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[9px] font-bold" style={{ color: '#8b6914' }}>EPIS</div>
                  <div className="text-[7px] italic" style={{ color: '#c8952e' }}>D'OR</div>
                </div>
              </div>
              <svg width="10" height="30" viewBox="0 0 12 60" className="opacity-70" style={{ transform: 'scaleX(-1)' }}>
                <path d="M 12 0 Q 8 -8 0 -10 Q 4 -4 3 0 Q 4 4 0 10 Q 8 8 12 0 Z M 12 20 Q 8 12 0 10 Q 4 16 3 20 Q 4 24 0 30 Q 8 28 12 20 Z" fill="#c8952e" transform="translate(0,15)"/>
              </svg>
            </div>
            <div className="text-[6px] italic" style={{ color: '#8b6914' }}>Blonde de Garde</div>
          </div>
        );
      case 'art-deco':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: '#0d1b2a' }}>
            <div className="absolute inset-2 border border-amber-500/60" />
            <svg width="50" height="20" viewBox="-60 -35 120 55" className="absolute top-1">
              <path d="M -60 20 L -40 -20 L -20 -30 L 0 -35 L 20 -30 L 40 -20 L 60 20" fill="#d4af37" opacity="0.3"/>
            </svg>
            <div className="text-[6px] tracking-widest" style={{ color: '#d4af37' }}>BRASSERIE</div>
            <div className="text-sm font-bold mt-1" style={{ color: '#d4af37' }}>GRANDE</div>
            <div className="text-sm font-bold" style={{ color: '#d4af37' }}>EPOQUE</div>
            <div className="text-[6px] italic mt-1" style={{ color: '#8a7a50' }}>Triple Blonde</div>
          </div>
        );
      case 'tropicale':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#ff6b35' }}>
            <div className="w-8 h-8 rounded-full absolute top-3 left-1/2 -translate-x-1/2" style={{ background: '#ffd700' }} />
            <svg width="30" height="35" viewBox="-35 -30 70 110" className="absolute top-2 right-2 opacity-60">
              <path d="M 0 80 L 3 60 L 5 30 L 4 0 Q 4 -5 8 -10 Q 20 -15 35 -8 Q 20 -12 10 -8 Q 15 -18 28 -22 Q 15 -20 6 -14 Q 4 -20 -2 -30 Q -5 -20 -4 -14 Q -15 -20 -28 -22 Q -15 -18 -6 -8 Q -20 -12 -35 -8 Q -4 -5 -4 0 L -3 30 L -1 60 Z" fill="#1a4a3a"/>
            </svg>
            <div className="text-sm text-white font-bold mt-8" style={{ fontFamily: 'cursive' }}>TROPICALE</div>
            <div className="text-[7px]" style={{ color: '#ffd700' }}>Fruit Punch IPA</div>
            <svg width="100%" height="15" viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute bottom-0">
              <path d="M 0 10 Q 15 0 30 10 Q 45 20 60 10 Q 75 0 90 10 L 100 10 L 100 20 L 0 20 Z" fill="#00897b" opacity="0.6"/>
            </svg>
          </div>
        );
      case 'gothique':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
            <svg width="30" height="12" viewBox="-15 -15 30 30" className="mb-1">
              <path d="M -3 -12 L 3 -12 L 3 -3 L 12 -3 L 12 3 L 3 3 L 3 12 L -3 12 L -3 3 L -12 3 L -12 -3 L -3 -3 Z" fill="#8b0000" stroke="#c0c0c0" strokeWidth="0.5"/>
            </svg>
            <div className="text-[10px] font-bold" style={{ color: '#c0c0c0' }}>GOTHIQUE</div>
            <div className="text-[7px] font-bold tracking-wider" style={{ color: '#8b0000' }}>MEDIEVALE</div>
            <svg width="16" height="16" viewBox="-12 -15 24 27" className="mt-1 opacity-60">
              <path d="M 0 -15 Q 3 -10 5 -12 Q 8 -8 12 -5 Q 8 -2 10 2 Q 6 0 5 3 L 3 3 L 3 10 L 5 10 L 5 12 L -5 12 L -5 10 L -3 10 L -3 3 L -5 3 Q -6 0 -10 2 Q -8 -2 -12 -5 Q -8 -8 -5 -12 Q -3 -10 0 -15 Z" fill="#c0c0c0"/>
            </svg>
          </div>
        );
      case 'forge-industrielle':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: '#2c2c2c' }}>
            <svg width="45" height="45" viewBox="-30 -30 60 60" className="absolute top-2 left-0 opacity-20">
              <path d="M -5 -28 L 5 -28 L 5 -23 L 12 -23 L 15 -28 L 20 -23 L 16 -18 L 20 -12 L 26 -13 L 28 -5 L 22 -2 L 23 5 L 28 7 L 26 15 L 20 14 L 16 20 L 20 24 L 14 28 L 10 23 L 5 25 L 5 28 L -5 28 L -5 25 L -10 23 L -14 28 L -20 24 L -16 20 L -20 14 L -26 15 L -28 7 L -23 5 L -22 -2 L -28 -5 L -26 -13 L -20 -12 L -16 -18 L -20 -23 L -15 -28 L -12 -23 L -5 -23 Z" fill="none" stroke="#ff8c00" strokeWidth="2"/>
            </svg>
            <div className="w-full h-0.5 absolute top-8" style={{ background: '#ff8c00' }} />
            <div className="text-[6px] tracking-widest" style={{ color: '#ff8c00' }}>FORGE</div>
            <div className="text-sm font-bold" style={{ color: '#ff8c00' }}>METAL</div>
            <div className="text-[10px] font-bold tracking-widest text-white">NOIR</div>
            <div className="w-full h-0.5 absolute bottom-8" style={{ background: '#ff8c00' }} />
            <div className="text-[8px] font-bold absolute bottom-2" style={{ color: '#ff8c00' }}>11.0%</div>
          </div>
        );
      case 'port-maritime':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#f0ece4' }}>
            <div className="text-[5px] font-bold text-white px-3 py-0.5 mb-1" style={{ background: '#c9362c' }}>PORT MARITIME</div>
            <div className="text-[10px] font-bold" style={{ color: '#1a3a5c' }}>LE PHARE</div>
            <svg width="30" height="30" viewBox="-35 -35 70 60" className="my-1">
              <circle cx="0" cy="0" r="25" fill="none" stroke="#1a3a5c" strokeWidth="3"/>
              <path d="M 0 -20 Q 5 -20 5 -15 Q 5 -10 0 -10 Q -5 -10 -5 -15 Q -5 -20 0 -20 Z M -1.5 -10 L -1.5 15 Q -12 13 -18 5 L -14 5 L -22 -5 M 1.5 -10 L 1.5 15 Q 12 13 18 5 L 14 5 L 22 -5 M -8 -7 L 8 -7" fill="none" stroke="#1a3a5c" strokeWidth="2"/>
            </svg>
            <div className="text-[6px]" style={{ color: '#c9362c' }}>Biere de Mer</div>
          </div>
        );
      case 'neon-electrique':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ background: '#0a0a1a' }}>
            <div className="absolute inset-2 border" style={{ borderColor: '#00ffff', boxShadow: '0 0 6px #00ffff' }} />
            <svg width="16" height="30" viewBox="-15 -50 35 100" className="mb-1">
              <path d="M 5 -50 L -15 -5 L 0 -5 L -10 50 L 20 5 L 5 5 Z" fill="#ffff00" style={{ filter: 'drop-shadow(0 0 4px #ffff00)' }}/>
            </svg>
            <div className="text-sm font-bold" style={{ color: '#00ffff', textShadow: '0 0 6px #00ffff' }}>NEON</div>
            <div className="text-[7px] font-bold" style={{ color: '#ff00ff', textShadow: '0 0 4px #ff00ff' }}>ELECTRIQUE</div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gray-600 flex items-center justify-center">
            <div className="text-xs text-gray-300">{template.name}</div>
          </div>
        );
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
          <div className="flex items-center gap-2 flex-wrap">
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
                <div className="aspect-[3/4] relative overflow-hidden">
                  {renderTemplatePreview(template)}
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
