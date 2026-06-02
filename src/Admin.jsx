import React, { useState } from 'react';

function Admin({ data, onSave }) {
  const [items, setItems] = useState(data.gallery || []);
  const [editingItem, setEditingItem] = useState(null);

  // Sync state if data props change
  React.useEffect(() => {
    setItems(data.gallery || []);
  }, [data]);

  const handleSaveAll = () => {
    onSave({ gallery: items });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const startEdit = (item) => {
    setEditingItem({ ...item });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingItem(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = (e) => {
    e.preventDefault();
    if (editingItem.id) {
      // Update existing
      setItems(items.map(i => i.id === editingItem.id ? editingItem : i));
    } else {
      // Add new
      const newItem = { ...editingItem, id: Date.now().toString() };
      setItems([newItem, ...items]);
    }
    setEditingItem(null);
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  const addNew = () => {
    setEditingItem({
      id: '',
      type: 'image',
      category: 'life',
      url: '/picture/new.jpg',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: ''
    });
  };

  if (editingItem) {
    return (
      <div className="admin-container">
        <div className="login-box glass" style={{ maxWidth: '600px' }}>
          <h2>{editingItem.id ? 'Edit Item' : 'Add New Item'}</h2>
          <form onSubmit={saveEdit}>
            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Type</label>
                <select name="type" value={editingItem.type} onChange={handleEditChange} className="form-control">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Category</label>
                <select name="category" value={editingItem.category || 'life'} onChange={handleEditChange} className="form-control">
                  <option value="life">生活照片</option>
                  <option value="painting">畫畫照片</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>URL (e.g. /picture/1.jpg or /video/1.mp4)</label>
              <input type="text" name="url" value={editingItem.url} onChange={handleEditChange} className="form-control" required />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" name="title" value={editingItem.title} onChange={handleEditChange} className="form-control" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={editingItem.description} onChange={handleEditChange} className="form-control" rows="3" required></textarea>
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Date</label>
                <input type="date" name="date" value={editingItem.date} onChange={handleEditChange} className="form-control" />
              </div>
              <div style={{ flex: 1 }}>
                <label>Location</label>
                <input type="text" name="location" value={editingItem.location} onChange={handleEditChange} className="form-control" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button type="submit" className="btn">Save Item</button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{ alignItems: 'flex-start' }}>
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Manage Gallery</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={addNew}>+ Add New</button>
            <button className="btn btn-secondary" style={{ background: '#10b981' }} onClick={handleSaveAll}>💾 Save Changes to Disk</button>
          </div>
        </div>

        <div className="admin-list">
          {items.map(item => (
            <div key={item.id} className="admin-item glass">
              {item.type === 'video' ? (
                <video src={item.url} />
              ) : (
                <img src={item.url} alt={item.title} />
              )}
              <div className="admin-item-info">
                <h3 style={{ fontSize: '1.1rem' }}>
                  <span className="tag" style={{ marginRight: '0.5rem' }}>
                    {item.category === 'painting' ? '畫畫照片' : '生活照片'}
                  </span>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{item.date} • {item.location}</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{item.url}</p>
              </div>
              <div className="admin-item-actions">
                <button className="btn btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="empty-state glass">No items. Click Add New to start.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
