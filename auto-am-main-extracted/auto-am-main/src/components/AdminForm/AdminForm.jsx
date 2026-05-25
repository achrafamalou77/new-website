'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addVehicle, updateVehicle, uploadVehicleImage } from '@/utils/supabaseClient';
import { revalidateVehicles } from '@/app/actions';
import MediaDropzone from '../MediaDropzone/MediaDropzone';
import imageCompression from 'browser-image-compression';
import styles from './AdminForm.module.css';

export default function AdminForm({ initialData = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    make: initialData?.make || '',
    model: initialData?.model || '',
    trim: initialData?.trim || '',
    year: initialData?.year || '',
    price: initialData?.price || '',
    bodyType: initialData?.bodyType || 'SUV',
    engineSize: initialData?.engineSize || '',
    fuel: initialData?.fuel || 'Essence',
    transmission: initialData?.transmission || 'Automatique',
    mileage: initialData?.mileage || '',
    color: initialData?.color || '',
    condition: initialData?.condition || 'Neuf',
    driveType: initialData?.driveType || 'FWD',
    doors: initialData?.doors || '4',
    cylinders: initialData?.cylinders || '',
    vin: initialData?.vin || '',
    description: initialData?.description || '',
    features: initialData?.features?.join(', ') || '',
    availability: initialData?.availability || 'Disponible',
    is_sold: initialData?.is_sold || false,
  });
  const [imagesToUpload, setImagesToUpload] = useState([]);
  const [existingImages, setExistingImages] = useState(initialData?.images || []);

  const moveImageLeft = (index) => {
    if (index === 0) return;
    const newArr = [...existingImages];
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
    setExistingImages(newArr);
  };

  const moveImageRight = (index) => {
    if (index === existingImages.length - 1) return;
    const newArr = [...existingImages];
    [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
    setExistingImages(newArr);
  };

  const removeExistingImage = (index) => {
    const newArr = existingImages.filter((_, i) => i !== index);
    setExistingImages(newArr);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:", formData);

    setLoading(true);
    setSuccess(false);

    try {
      const imageUrls = [...existingImages];
      for (const file of imagesToUpload) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        const url = await uploadVehicleImage(compressedFile);
        imageUrls.push(url);
      }

      const featuresArray = formData.features
        ? formData.features.split(',').map(f => f.trim()).filter(Boolean)
        : (initialData?.features || []);

      const vehiclePayload = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        trim: formData.trim.trim(),
        year: Number(formData.year) || 2024,
        price: Number(formData.price) || 0,
        bodyType: formData.bodyType,
        engineSize: formData.engineSize,
        fuel: formData.fuel,
        transmission: formData.transmission,
        mileage: Number(formData.mileage) || 0,
        color: formData.color,
        condition: formData.condition,
        driveType: formData.driveType,
        doors: Number(formData.doors) || 4,
        cylinders: Number(formData.cylinders) || 0,
        vin: formData.vin,
        description: formData.description,
        features: featuresArray,
        images: imageUrls.length > 0 ? imageUrls : ['/images/cars/placeholder.jpg'],
        featured: initialData?.featured || false,
        availability: formData.availability,
        is_sold: formData.is_sold,
      };

      if (initialData) {
        await updateVehicle(initialData.id, vehiclePayload);
        await revalidateVehicles();
        setSuccess(true);
        router.refresh();
        router.push('/admin/inventory');
      } else {
        await addVehicle(vehiclePayload);
        await revalidateVehicles();
        setSuccess(true);
        setFormData(prev => ({...prev, make: '', model: '', trim: '', year: '', price: '', description: '', features: '', vin: '', engineSize: '', cylinders: ''}));
        setImagesToUpload([]);
        router.refresh();
      }
    } catch (error) {
      console.log("Supabase Response:", error);
      alert("Erreur: " + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>

      {success && (
        <div style={{ padding: '16px 32px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', fontWeight: '600', borderBottom: '1px solid #16a34a' }}>
          🚀 Véhicule {initialData ? "modifié" : "ajouté"} avec succès !
        </div>
      )}

      {initialData && existingImages.length > 0 && (
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Images Actuelles ({existingImages.length})</h3>
          <p style={{ color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '16px' }}>
            La première image est l'image principale (couverture) du véhicule. Vous pouvez réorganiser l'ordre avec les flèches.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '8px' }}>
            {existingImages.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: '160px', height: '110px', borderRadius: '12px', overflow: 'hidden', border: i === 0 ? '3px solid var(--color-primary)' : '2px solid var(--color-border)', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                <img src={url} alt={`Vehicle image ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                <div style={{ position: 'absolute', bottom: '6px', left: '6px', right: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => moveImageLeft(i)} disabled={i === 0} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '4px', cursor: i === 0 ? 'not-allowed' : 'pointer', padding: '4px 8px', opacity: i === 0 ? 0.3 : 1 }}>&larr;</button>
                  <button type="button" onClick={() => removeExistingImage(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>X</button>
                  <button type="button" onClick={() => moveImageRight(i)} disabled={i === existingImages.length - 1} style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '4px', cursor: i === existingImages.length - 1 ? 'not-allowed' : 'pointer', padding: '4px 8px', opacity: i === existingImages.length - 1 ? 0.3 : 1 }}>&rarr;</button>
                </div>
                {i === 0 && <span style={{ position: 'absolute', top: 0, left: 0, background: 'var(--color-primary)', color: '#fff', fontSize: '0.65rem', padding: '4px 8px', fontWeight: '800', borderBottomRightRadius: '8px' }}>PRINCIPALE</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.formSection} style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <h3 className={styles.sectionTitle}>Ajouter de nouvelles images</h3>
      </div>
      <MediaDropzone files={imagesToUpload} setFiles={setImagesToUpload} />

      {/* SECTION: Informations Principales */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Informations Principales</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Marque *</label>
            <input type="text" name="make" value={formData.make} onChange={handleChange} placeholder="Ex: MG" required />
          </div>
          <div className={styles.field}>
            <label>Modèle *</label>
            <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Ex: ZS" required />
          </div>
          <div className={styles.field}>
            <label>Finition / Trim</label>
            <input type="text" name="trim" value={formData.trim} onChange={handleChange} placeholder="Ex: Luxury, R-Line, GR Sport" />
          </div>
          <div className={styles.field}>
            <label>Année *</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="2024" required />
          </div>
          <div className={styles.field}>
            <label>Prix (DA) *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="4500000" required />
          </div>
          <div className={styles.field}>
            <label>Condition</label>
            <select name="condition" value={formData.condition} onChange={handleChange}>
              <option value="Neuf">Neuf</option>
              <option value="Occasion">Occasion</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Disponibilité</label>
            <select name="availability" value={formData.availability} onChange={handleChange}>
              <option value="Disponible">Disponible en Algérie</option>
              <option value="Sur Commande">Sur Commande</option>
            </select>
          </div>
          <div className={styles.field} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '12px', background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <input type="checkbox" id="is_sold" name="is_sold" checked={formData.is_sold} onChange={e => setFormData(prev => ({ ...prev, is_sold: e.target.checked }))} style={{ width: '22px', height: '22px', cursor: 'pointer' }} />
            <label htmlFor="is_sold" style={{ margin: 0, cursor: 'pointer', fontSize: '1.05rem', color: '#ef4444' }}>Marquer comme VENDU (Désactive les contacts pour ce véhicule)</label>
          </div>
        </div>
      </div>

      {/* SECTION: Spécifications Techniques */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Spécifications Techniques</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Carrosserie</label>
            <select name="bodyType" value={formData.bodyType} onChange={handleChange}>
              <option value="SUV">SUV</option>
              <option value="Berline">Berline</option>
              <option value="Coupé">Coupé</option>
              <option value="Cabriolet">Cabriolet</option>
              <option value="Citadine">Citadine</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Monospace">Monospace</option>
              <option value="Break">Break</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Carburant</label>
            <select name="fuel" value={formData.fuel} onChange={handleChange}>
              <option value="Essence">Essence</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybride">Hybride</option>
              <option value="Électrique">Électrique</option>
              <option value="GPL">GPL</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Boîte de vitesse</label>
            <select name="transmission" value={formData.transmission} onChange={handleChange}>
              <option value="Automatique">Automatique</option>
              <option value="Manuelle">Manuelle</option>
              <option value="CVT">CVT</option>
              <option value="DCT">Double embrayage (DCT)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Transmission</label>
            <select name="driveType" value={formData.driveType} onChange={handleChange}>
              <option value="FWD">Traction avant (FWD)</option>
              <option value="RWD">Propulsion (RWD)</option>
              <option value="AWD">Intégrale (AWD)</option>
              <option value="4WD">4x4 (4WD)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Moteur</label>
            <input type="text" name="engineSize" value={formData.engineSize} onChange={handleChange} placeholder="Ex: 1.5L Turbo" />
          </div>
          <div className={styles.field}>
            <label>Cylindres</label>
            <input type="number" name="cylinders" value={formData.cylinders} onChange={handleChange} placeholder="4" />
          </div>
          <div className={styles.field}>
            <label>Kilométrage</label>
            <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="0 pour neuf" />
          </div>
          <div className={styles.field}>
            <label>Portes</label>
            <select name="doors" value={formData.doors} onChange={handleChange}>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Couleur</label>
            <input type="text" name="color" value={formData.color} onChange={handleChange} placeholder="Noir Obsidienne" />
          </div>
        </div>
      </div>

      {/* SECTION: Détails */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Détails & Équipements</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Numéro de châssis (VIN)</label>
            <input type="text" name="vin" value={formData.vin} onChange={handleChange} placeholder="Ex: WAUZZZ4H8NN000001" />
          </div>
          <div className={styles.field}>
            <label>Équipements (séparés par des virgules)</label>
            <input type="text" name="features" value={formData.features} onChange={handleChange} placeholder="Toit ouvrant, Caméra 360, Cuir" />
          </div>
        </div>
        <div className={styles.field} style={{ marginTop: '20px' }}>
          <label>Description complète</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Décrivez le véhicule en détail pour attirer les acheteurs..."
            style={{ width: '100%', padding: '12px 16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical' }}
          />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={`btn-outline ${styles.cancelBtn}`}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Enregistrement...' : (initialData ? 'Modifier le véhicule' : 'Ajouter le véhicule')}
        </button>
      </div>

    </form>
  );
}
