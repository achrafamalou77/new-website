'use client';

import { useState } from 'react';
import { formatPrice } from '@/utils/formatPrice';
import { createOrder } from '@/utils/supabaseClient';
import styles from './ContactSidebar.module.css';

export default function ContactSidebar({ vehicle, hidePriceBox = false }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    message: `Je suis intéressé par la ${vehicle.make} ${vehicle.model}.`
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await createOrder({
        clientName: formData.clientName,
        phone: formData.phone,
        message: formData.message,
        vehicleId: vehicle.id,
        vehicleInterest: `${vehicle.make} ${vehicle.model}`,
        status: 'nouveau'
      });
      setSuccess(true);
      setFormData({ clientName: '', phone: '', message: '' });
    } catch (error) {
      alert("Erreur lors de l'envoi: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  const waMessage = `Bonjour, je suis intéressé par la ${vehicle.make} ${vehicle.model} affichée à ${formatPrice(vehicle.price)}. Est-elle toujours disponible ?`;
  const waUrl = `https://wa.me/213560003106?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className={styles.sidebar} id="contact-sidebar">
      {!hidePriceBox && (
        <div className={styles.priceBox}>
          <span className={styles.priceLabel}>Prix de vente</span>
          <div className={styles.priceValue}>{formatPrice(vehicle.price)}</div>
        </div>
      )}

      <div className={styles.contactBox}>
        <h3 className={styles.contactTitle}>Intéressé par ce véhicule ?</h3>
        <p className={styles.contactDesc}>
          Contactez-nous pour réserver un essai ou obtenir plus de détails.
        </p>

        {vehicle.is_sold ? (
          <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-muted)', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
            Ce véhicule a été vendu. Les réservations sont clôturées.
          </div>
        ) : success ? (
          <div style={{ padding: '16px', background: 'rgba(0, 255, 136, 0.1)', color: 'var(--color-disponible)', borderRadius: '8px', marginBottom: '16px', border: '1px solid rgba(0,255,136,0.2)' }}>
            <strong>Demande envoyée !</strong> Notre équipe vous contactera rapidement.
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} placeholder="Nom complet" required disabled={loading} />
            </div>
            <div className={styles.field}>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Numéro de téléphone" required disabled={loading} />
            </div>
            <div className={styles.field}>
              <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Votre message..." rows={3} disabled={loading}></textarea>
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer la Demande'}
            </button>
          </form>
        )}

        <div className={styles.divider}>
          <span>OU</span>
        </div>

        {vehicle.is_sold ? (
          <button disabled className={styles.whatsappBtn} style={{ background: '#333', cursor: 'not-allowed', boxShadow: 'none' }}>
            Véhicule Vendu
          </button>
        ) : (
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Contact via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
