import React, { useState } from 'react';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

function Admin({ data, onSave }) {
  const [items, setItems] = useState(data.gallery || []);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('painting');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  if (import.meta.env.PROD) {
    return (
      <div className="admin-container" style={{ alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '1rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>🔒 後台管理已隱藏</h2>
          <p style={{ color: 'var(--text-muted)' }}>為了確保安全，線上展示版本已停用後台功能。</p>
          <p style={{ color: 'var(--text-muted)' }}>如需新增或編輯照片，請在本機執行 <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>npm run dev</code>。</p>
        </div>
      </div>
    );
  }

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

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleDeploy = async () => {
    if (!window.confirm('確定要將目前的變更推送到 GitHub 並上線嗎？\n這會自動幫您 commit 並 push。')) {
      return;
    }
    try {
      const response = await fetch('/api/deploy', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('🚀 成功推送到 GitHub！\n\nGitHub Actions 正在為您打包網頁，大約 1~2 分鐘後，您的畫廊就會在 https://paintings-2022.github.io/mama2022/ 上線更新囉！');
      } else {
        alert('發布失敗：\n' + result.error);
      }
    } catch (err) {
      console.error(err);
      alert('發布失敗，請確認開發伺服器正在執行中。');
    }
  };

  const toggleLike = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, isLiked: !item.isLiked } : item));
  };

  const moveItem = (item, direction) => {
    const filtered = items.filter(i => activeCategory === 'all' || i.category === activeCategory);
    const filteredIndex = filtered.findIndex(i => i.id === item.id);
    let targetFilteredIndex = -1;
    
    if (direction === 'up' && filteredIndex > 0) {
      targetFilteredIndex = filteredIndex - 1;
    } else if (direction === 'down' && filteredIndex < filtered.length - 1) {
      targetFilteredIndex = filteredIndex + 1;
    } else if (direction === 'top' && filteredIndex > 0) {
      targetFilteredIndex = 0;
    } else if (direction === 'bottom' && filteredIndex < filtered.length - 1) {
      targetFilteredIndex = filtered.length - 1;
    }

    if (targetFilteredIndex !== -1) {
      const newItems = [...items];
      
      if (direction === 'top' || direction === 'bottom') {
        const absoluteCurrentIndex = newItems.findIndex(i => i.id === item.id);
        const [movedItem] = newItems.splice(absoluteCurrentIndex, 1);
        
        const targetItem = filtered[targetFilteredIndex];
        const absoluteTargetIndex = newItems.findIndex(i => i.id === targetItem.id);
        
        if (direction === 'top') {
          newItems.splice(absoluteTargetIndex, 0, movedItem);
        } else {
          newItems.splice(absoluteTargetIndex + 1, 0, movedItem);
        }
      } else {
        const itemToSwap = filtered[targetFilteredIndex];
        const indexA = items.findIndex(i => i.id === item.id);
        const indexB = items.findIndex(i => i.id === itemToSwap.id);
        [newItems[indexA], newItems[indexB]] = [newItems[indexB], newItems[indexA]];
      }
      
      setItems(newItems);
      
      // Auto-follow across pages
      const newPage = Math.floor(targetFilteredIndex / itemsPerPage) + 1;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
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
      location: '',
      isLiked: false
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
                <input type="text" name="location" value={editingItem.location || ''} onChange={handleEditChange} className="form-control" />
              </div>
            </div>
            <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                id="isLiked" 
                name="isLiked" 
                checked={!!editingItem.isLiked} 
                onChange={e => setEditingItem(prev => ({ ...prev, isLiked: e.target.checked }))} 
                style={{ width: '1.2rem', height: '1.2rem' }}
              />
              <label htmlFor="isLiked" style={{ marginBottom: 0, cursor: 'pointer' }}>👁️ 公開顯示 (Visible to public)</label>
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

  const filteredItems = items.filter(i => activeCategory === 'all' || i.category === activeCategory);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-container" style={{ alignItems: 'flex-start' }}>
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Manage Gallery</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={addNew}>+ Add New</button>
            <button className="btn btn-secondary" style={{ background: '#10b981' }} onClick={handleSaveAll}>💾 Save Changes to Disk</button>
            <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={handleDeploy}>🚀 發布到 GitHub (上線)</button>
          </div>
        </div>

        <div className="category-filters" style={{ marginBottom: '2rem', justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <button className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => handleCategoryChange('all')}>全部照片 (All)</button>
          <button className={`filter-btn ${activeCategory === 'life' ? 'active' : ''}`} onClick={() => handleCategoryChange('life')}>生活照片 (Life)</button>
          <button className={`filter-btn ${activeCategory === 'painting' ? 'active' : ''}`} onClick={() => handleCategoryChange('painting')}>畫畫照片 (Painting)</button>
        </div>

        <div className="admin-list">
          {paginatedItems.map((item, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <div key={item.id} className="admin-item glass">
              {item.type === 'video' ? (
                <video src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} />
              ) : (
                <img src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} alt={item.title} />
              )}
              <div className="admin-item-info">
                <h3 style={{ fontSize: '1.1rem' }}>
                  <span className="tag" style={{ marginRight: '0.5rem' }}>
                    {item.category === 'painting' ? '畫畫照片' : '生活照片'}
                  </span>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{item.date} • {item.location}</p>
                <p>{item.description}</p>
              </div>
              <div className="admin-item-actions">
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem' }} 
                  onClick={() => moveItem(item, 'top')} 
                  disabled={globalIndex === 0}
                  title="移至最頂部"
                >⏫</button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem' }} 
                  onClick={() => moveItem(item, 'up')} 
                  disabled={globalIndex === 0}
                  title="往上移一格"
                >⬆️</button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem' }} 
                  onClick={() => moveItem(item, 'down')} 
                  disabled={globalIndex === filteredItems.length - 1}
                  title="往下移一格"
                >⬇️</button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.6rem' }} 
                  onClick={() => moveItem(item, 'bottom')} 
                  disabled={globalIndex === filteredItems.length - 1}
                  title="移至最底部"
                >⏬</button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => toggleLike(item.id)}
                  title={item.isLiked ? "隱藏" : "公開顯示"}
                  style={{ padding: '0.4rem 0.8rem', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {item.isLiked ? <EyeIcon /> : <EyeOffIcon />}
                </button>
                <button className="btn btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
            );
          })}
          {items.length === 0 && (
            <div className="empty-state glass">No items. Click Add New to start.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一頁
            </button>
            <span>第 {currentPage} 頁 / 共 {totalPages} 頁</span>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
