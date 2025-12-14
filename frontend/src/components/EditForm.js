import React, { useState } from 'react';
import { itemsAPI } from '../services/api';
import '../styles/EditForm.css';

function EditForm({ item, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    age_ranges: item.age_ranges || [],
    category: item.category || '',
    keywords: item.keywords || [],
    location: item.location || '',
    availability: item.availability || 'available',
    themes: item.themes || [],
    condition: item.condition || '',
    notes: item.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await itemsAPI.update(item.item_id, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAgeRangeToggle = (ageRange) => {
    const newAgeRanges = formData.age_ranges.includes(ageRange)
      ? formData.age_ranges.filter(a => a !== ageRange)
      : [...formData.age_ranges, ageRange];

    setFormData({ ...formData, age_ranges: newAgeRanges });
  };

  const handleThemeToggle = (theme) => {
    const newThemes = formData.themes.includes(theme)
      ? formData.themes.filter(t => t !== theme)
      : [...formData.themes, theme];

    setFormData({ ...formData, themes: newThemes });
  };

  const handleKeywordsChange = (e) => {
    const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k);
    setFormData({ ...formData, keywords });
  };

  const ageRanges = ['baby', 'young-child', 'older-child', 'teen', 'adult', 'any-age'];
  const themes = ['educational', 'creative', 'outdoor', 'indoor', 'tech', 'cooking', 'reading', 'music', 'art', 'science', 'animals', 'vehicles'];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="edit-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Item</h2>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              <option value="toys">Toys</option>
              <option value="games-puzzles">Games & Puzzles</option>
              <option value="books">Books</option>
              <option value="kitchen">Kitchen</option>
              <option value="home-decor">Home Decor</option>
              <option value="electronics">Electronics</option>
              <option value="clothing-accessories">Clothing & Accessories</option>
              <option value="stationery-craft">Stationery & Craft</option>
              <option value="sports-outdoors">Sports & Outdoors</option>
              <option value="collectibles">Collectibles</option>
              <option value="wellness-beauty">Wellness & Beauty</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Age Ranges (select multiple)</label>
            <div className="checkbox-group">
              {ageRanges.map((age) => (
                <label key={age} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.age_ranges.includes(age)}
                    onChange={() => handleAgeRangeToggle(age)}
                  />
                  {age}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Themes (select multiple)</label>
            <div className="checkbox-group">
              {themes.map((theme) => (
                <label key={theme} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.themes.includes(theme)}
                    onChange={() => handleThemeToggle(theme)}
                  />
                  {theme}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Keywords (comma-separated)</label>
            <input
              type="text"
              value={formData.keywords.join(', ')}
              onChange={handleKeywordsChange}
              placeholder="red, wooden, educational, lego"
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., living room shelf, attic box 3"
            />
          </div>

          <div className="form-group">
            <label>Availability</label>
            <select
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="gifted">Gifted</option>
            </select>
          </div>

          <div className="form-group">
            <label>Condition</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            >
              <option value="">Not specified</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="gently-used">Gently Used</option>
              <option value="vintage">Vintage</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special information about this item..."
              rows="3"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditForm;
