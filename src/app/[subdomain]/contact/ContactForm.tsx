'use client';

import { useState } from 'react';
import { submitContactForm } from '@/app/actions/public-cars';

export default function ContactForm({ agencyId }: { agencyId: string }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      setStatus({ success: false, message: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      await submitContactForm(formData, agencyId);
      setStatus({ success: true, message: 'Votre message a été envoyé avec succès ! Nous vous recontacterons sous peu.' });
      setFormData({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      setStatus({ success: false, message: 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status && (
        <div className={`p-4 rounded-xl text-sm ${status.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {status.message}
        </div>
      )}

      <div>
        <label className="block text-gray-300 font-bold mb-2 text-sm">Nom Complet *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-[#121824] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
          placeholder="Votre nom"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 font-bold mb-2 text-sm">Numéro de Téléphone *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-[#121824] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="Ex: 0560 00 31 06"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 font-bold mb-2 text-sm">Adresse Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-[#121824] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
            placeholder="Ex: contact@email.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-gray-300 font-bold mb-2 text-sm">Votre Message *</label>
        <textarea
          rows={5}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full bg-[#121824] border border-[#1e293b] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors resize-none"
          placeholder="Décrivez votre besoin ou posez votre question..."
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <span>Envoi en cours...</span>
        ) : (
          <>
            <span>Envoyer le Message</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
