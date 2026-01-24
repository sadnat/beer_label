import { useState, useEffect } from 'react';
import { api, Plan } from '../../services/api';

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: 0,
    max_projects: 5,
    max_exports_per_month: 10,
    features: [''],
    is_active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: apiError } = await api.getAdminPlans();
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setPlans(data.plans);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price_monthly: 0,
      max_projects: 5,
      max_exports_per_month: 10,
      features: [''],
      is_active: true,
    });
  };

  const openEditModal = (plan: Plan) => {
    setEditPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      max_projects: plan.max_projects,
      max_exports_per_month: plan.max_exports_per_month,
      features: plan.features.length > 0 ? plan.features : [''],
      is_active: plan.is_active,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreate(true);
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const { data, error: apiError } = await api.createPlan({
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
    });

    if (apiError) {
      alert(apiError);
    } else if (data) {
      setPlans([...plans, data.plan]);
      setShowCreate(false);
      resetForm();
    }
    setIsCreating(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlan) return;

    setIsEditing(true);

    const { data, error: apiError } = await api.updatePlan(editPlan.id, {
      name: formData.name,
      description: formData.description,
      price_monthly: formData.price_monthly,
      max_projects: formData.max_projects,
      max_exports_per_month: formData.max_exports_per_month,
      features: formData.features.filter(f => f.trim() !== ''),
      is_active: formData.is_active,
    });

    if (apiError) {
      alert(apiError);
    } else if (data) {
      setPlans(plans.map(p => p.id === editPlan.id ? data.plan : p));
      setEditPlan(null);
      resetForm();
    }
    setIsEditing(false);
  };

  const togglePlanActive = async (plan: Plan) => {
    const { data, error: apiError } = await api.updatePlan(plan.id, { is_active: !plan.is_active });
    if (apiError) {
      alert(apiError);
    } else if (data) {
      setPlans(plans.map(p => p.id === plan.id ? data.plan : p));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        {error}
        <button onClick={loadPlans} className="ml-4 underline">Réessayer</button>
      </div>
    );
  }

  const renderForm = (onSubmit: (e: React.FormEvent) => Promise<void>, submitLabel: string, isSubmitting: boolean) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
        {!editPlan && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
              pattern="[a-z0-9-]+"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prix mensuel (EUR)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max projets (-1 = illimité)</label>
          <input
            type="number"
            value={formData.max_projects}
            onChange={(e) => setFormData({ ...formData, max_projects: parseInt(e.target.value, 10) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max exports/mois (-1 = illimité)</label>
          <input
            type="number"
            value={formData.max_exports_per_month}
            onChange={(e) => setFormData({ ...formData, max_exports_per_month: parseInt(e.target.value, 10) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fonctionnalités</label>
        <div className="space-y-2">
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(index, e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Ex: Export PDF"
              />
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            + Ajouter une fonctionnalité
          </button>
        </div>
      </div>

      {editPlan && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Plan actif
          </label>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => { setEditPlan(null); setShowCreate(false); resetForm(); }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50"
        >
          {isSubmitting ? 'Enregistrement...' : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">{plans.length} plan{plans.length > 1 ? 's' : ''} configurés</p>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-sm overflow-hidden ${!plan.is_active ? 'opacity-60' : ''}`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.slug}</p>
                </div>
                {!plan.is_active && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    Inactif
                  </span>
                )}
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-800">
                  {plan.price_monthly === 0 ? 'Gratuit' : `${plan.price_monthly}€`}
                </span>
                {plan.price_monthly > 0 && <span className="text-gray-500">/mois</span>}
              </div>

              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-gray-600">
                    {plan.max_projects === -1 ? 'Projets illimités' : `${plan.max_projects} projets max`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="text-gray-600">
                    {plan.max_exports_per_month === -1 ? 'Exports illimités' : `${plan.max_exports_per_month} exports/mois`}
                  </span>
                </div>
              </div>

              {plan.features.length > 0 && (
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex gap-2">
              <button
                onClick={() => openEditModal(plan)}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg transition"
              >
                Modifier
              </button>
              <button
                onClick={() => togglePlanActive(plan)}
                className={`px-3 py-2 text-sm rounded-lg transition ${
                  plan.is_active
                    ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                    : 'bg-green-100 hover:bg-green-200 text-green-700'
                }`}
              >
                {plan.is_active ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Créer un plan</h2>
            </div>
            <div className="p-6">
              {renderForm(handleCreate, 'Créer le plan', isCreating)}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Modifier le plan "{editPlan.name}"</h2>
            </div>
            <div className="p-6">
              {renderForm(handleUpdate, 'Enregistrer', isEditing)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
