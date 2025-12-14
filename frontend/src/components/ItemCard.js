import React from 'react';
import '../styles/ItemCard.css';

function ItemCard({ item, onEdit, onDelete }) {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const primaryPhoto = item.photos?.find(p => p.is_primary) || item.photos?.[0];
  const photoUrl = primaryPhoto
    ? `${API_BASE_URL}/${primaryPhoto.file_path}`
    : '/placeholder.jpg';

  const statusColors = {
    available: '#4CAF50',
    reserved: '#FF9800',
    gifted: '#9E9E9E',
  };

  return (
    <div className="item-card">
      <div className="item-image-container">
        <img src={photoUrl} alt={item.ai_description || 'Item'} />
        <span
          className="availability-badge"
          style={{ backgroundColor: statusColors[item.availability] }}
        >
          {item.availability}
        </span>
      </div>

      <div className="item-details">
        <h3>{item.ai_description || 'Item'}</h3>

        <div className="item-meta">
          <div className="meta-item">
            <strong>Category:</strong> {item.category}
          </div>

          {item.age_ranges && item.age_ranges.length > 0 && (
            <div className="meta-item">
              <strong>Age:</strong> {item.age_ranges.join(', ')}
            </div>
          )}

          {item.location && (
            <div className="meta-item">
              <strong>Location:</strong> {item.location}
            </div>
          )}

          {item.condition && (
            <div className="meta-item">
              <strong>Condition:</strong> {item.condition}
            </div>
          )}
        </div>

        {item.keywords && item.keywords.length > 0 && (
          <div className="item-keywords">
            {item.keywords.slice(0, 8).map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
              </span>
            ))}
          </div>
        )}

        {item.themes && item.themes.length > 0 && (
          <div className="item-themes">
            {item.themes.map((theme, index) => (
              <span key={index} className="theme-tag">
                {theme}
              </span>
            ))}
          </div>
        )}

        {item.notes && (
          <div className="item-notes">
            <em>{item.notes}</em>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="item-actions">
            {onEdit && (
              <button onClick={() => onEdit(item)} className="btn-edit">
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(item)} className="btn-delete">
                🗑️ Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemCard;
