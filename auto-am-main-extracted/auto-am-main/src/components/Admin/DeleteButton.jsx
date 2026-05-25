'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteVehicle } from '@/utils/supabaseClient';
import { revalidateVehicles } from '@/app/actions';

export default function DeleteButton({ id }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Trash icon natively clicked! ID:", id);
    
    setIsDeleting(true);
    try {
      const success = await deleteVehicle(id);
      if (success) {
        await revalidateVehicles();
        router.refresh();
      }
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Erreur lors de la suppression: " + (error.message || JSON.stringify(error)));
      setIsDeleting(false);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className={`action-btn action-delete ${isDeleting ? 'loading' : ''}`}  
      title="Supprimer"
      style={{ opacity: isDeleting ? 0.5 : 1 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
