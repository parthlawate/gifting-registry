import React, { useState } from 'react';
import { itemsAPI } from '../services/api';
import '../styles/UploadForm.css';

function UploadForm({ onUploadSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Generate previews
    const previewURLs = files.map(file => URL.createObjectURL(file));
    setPreviews(previewURLs);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      const result = await itemsAPI.upload(formData);
      setUploadResult(result);

      // Clear form
      setSelectedFiles([]);
      setPreviews([]);

      // Notify parent
      if (onUploadSuccess) {
        onUploadSuccess(result.item);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="upload-form">
      <h2>Upload Gift Items</h2>
      <p className="subtitle">Take photos of items to add them to your registry</p>

      <form onSubmit={handleUpload}>
        <div className="file-input-wrapper">
          <label htmlFor="file-input" className="file-input-label">
            <span>📸 Choose Photos</span>
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
          <p className="file-input-hint">
            You can select multiple photos at once
          </p>
        </div>

        {previews.length > 0 && (
          <div className="preview-container">
            <h3>Selected Photos ({previews.length})</h3>
            <div className="preview-grid">
              {previews.map((preview, index) => (
                <div key={index} className="preview-item">
                  <img src={preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="upload-btn"
          disabled={uploading || selectedFiles.length === 0}
        >
          {uploading ? 'Uploading & Analyzing...' : 'Upload & Auto-Tag'}
        </button>
      </form>

      {error && (
        <div className="message error">
          ❌ {error}
        </div>
      )}

      {uploadResult && (
        <div className="message success">
          <h3>✅ Upload Successful!</h3>
          <div className="ai-results">
            <h4>AI Analysis Results:</h4>
            <p><strong>Category:</strong> {uploadResult.aiAnalysis.category}</p>
            <p><strong>Age Range:</strong> {uploadResult.aiAnalysis.ageRanges.join(', ')}</p>
            <p><strong>Description:</strong> {uploadResult.aiAnalysis.description}</p>
            <p><strong>Keywords:</strong> {uploadResult.aiAnalysis.keywords.slice(0, 10).join(', ')}</p>
            {uploadResult.aiAnalysis.themes.length > 0 && (
              <p><strong>Themes:</strong> {uploadResult.aiAnalysis.themes.join(', ')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadForm;
