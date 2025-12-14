import React, { useState, useEffect } from 'react';
import { itemsAPI } from '../services/api';
import ItemCard from './ItemCard';
import EditForm from './EditForm';
import '../styles/ItemList.css';

function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await itemsAPI.getAll(filters);
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await itemsAPI.delete(item.item_id);
      loadItems();
    } catch (err) {
      alert('Failed to delete item');
      console.error(err);
    }
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    loadItems();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({
      ...filters,
      [filterName]: value || undefined,
    });
  };

  if (loading) {
    return <div className="loading">Loading items...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="item-list">
      <div className="list-header">
        <h2>📦 All Items ({items.length})</h2>

        <div className="filters">
          <select
            onChange={(e) => handleFilterChange('availability', e.target.value)}
            defaultValue=""
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="gifted">Gifted</option>
          </select>

          <select
            onChange={(e) => handleFilterChange('category', e.target.value)}
            defaultValue=""
          >
            <option value="">All Categories</option>
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

          <select
            onChange={(e) => handleFilterChange('age_range', e.target.value)}
            defaultValue=""
          >
            <option value="">All Ages</option>
            <option value="baby">Baby (0-2)</option>
            <option value="young-child">Young Child (3-6)</option>
            <option value="older-child">Older Child (7-12)</option>
            <option value="teen">Teen (13-17)</option>
            <option value="adult">Adult (18+)</option>
            <option value="any-age">Any Age</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="no-items">
          <p>No items found. Upload some photos to get started!</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <ItemCard
              key={item.item_id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingItem && (
        <EditForm
          item={editingItem}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}

export default ItemList;
