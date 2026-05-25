'use client';

import { useState } from 'react';
import styles from './MediaDropzone.module.css';

export default function MediaDropzone({ files, setFiles }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (newFiles) => {
    const newFilesArray = Array.from(newFiles);
    setFiles(prev => [...prev, ...newFilesArray]);
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, index) => index !== idx));
  };

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Photos du véhicule</h3>
      
      <div 
        className={`${styles.dropzone} ${dragActive ? styles.active : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          className={styles.input} 
          onChange={handleChange} 
          id="media-upload"
        />
        <label htmlFor="media-upload" className={styles.label}>
          <div className={styles.icon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <p className={styles.text}>
            <strong>Cliquez pour uploader</strong> ou glissez-déposez vos images ici.
          </p>
          <p className={styles.subtext}>PNG, JPG, WEBP jusqu&apos;à 5MB</p>
        </label>
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, idx) => (
            <div key={idx} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button 
                type="button" 
                onClick={() => removeFile(idx)}
                className={styles.removeBtn}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
