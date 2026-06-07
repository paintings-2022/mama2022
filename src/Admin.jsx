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
  const [previewItem, setPreviewItem] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: '50%', y: '50%' });
  const [activeCategory, setActiveCategory] = useState('畫畫');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const dragRef = React.useRef({ isDragging: false, isMoved: false, startX: 0, startY: 0, zoomX: 50, zoomY: 50 });
  const [categories, setCategories] = useState(data.settings?.categories || ['生活', '畫畫']);
  const [subcategories, setSubcategories] = useState(data.settings?.subcategories || ['直1', '直2', '橫1', '橫2']);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [adminViewMode, setAdminViewMode] = useState('list');
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
    if (data.settings) {
      if (data.settings.categories) setCategories(data.settings.categories);
      if (data.settings.subcategories) setSubcategories(data.settings.subcategories);
    }
  }, [data]);

  const handleSaveAll = () => {
    onSave({ gallery: items, settings: { ...data.settings, categories, subcategories } });
    setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(true);
  };

  const toggleFavorite = (id) => {
    setItems(items.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
    setHasUnsavedChanges(true);
  };

  const handleInlineChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    setHasUnsavedChanges(true);
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
    setDraggedItemIndex(item.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    setDraggedItemIndex(null);
    const dataTransfer = e.dataTransfer.getData('application/json');
    if (!dataTransfer) return;
    try {
      const { id: sourceId } = JSON.parse(dataTransfer);
      if (sourceId === targetItem.id) return;
      
      const newItems = [...items];
      const sourceIndex = newItems.findIndex(i => i.id === sourceId);
      const targetIndex = newItems.findIndex(i => i.id === targetItem.id);
      
      if (sourceIndex === -1 || targetIndex === -1) return;
      
      const [movedItem] = newItems.splice(sourceIndex, 1);
      newItems.splice(targetIndex, 0, movedItem);
      
      setItems(newItems);
      setHasUnsavedChanges(true);
    } catch (err) {
      console.error(err);
    }
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
      setHasUnsavedChanges(true);
      
      // Auto-follow across pages
      const newPage = Math.floor(targetFilteredIndex / itemsPerPage) + 1;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }
  };

  const handleZoomMouseDown = (e) => {
    if (isZoomed) {
      dragRef.current = {
        isDragging: true,
        isMoved: false,
        startX: e.clientX,
        startY: e.clientY,
        zoomX: parseFloat(zoomPos.x) || 50,
        zoomY: parseFloat(zoomPos.y) || 50,
      };
      e.preventDefault();
    }
  };

  const handleZoomMouseMove = (e) => {
    if (isZoomed && dragRef.current.isDragging) {
      dragRef.current.isMoved = true;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const { width, height } = e.currentTarget.getBoundingClientRect();
      const scale = 2.5;
      
      const newX = dragRef.current.zoomX - (dx / width) * 100 / scale;
      const newY = dragRef.current.zoomY - (dy / height) * 100 / scale;
      
      setZoomPos({ x: `${Math.max(0, Math.min(100, newX))}%`, y: `${Math.max(0, Math.min(100, newY))}%` });
    }
  };

  const handleZoomMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  const handleZoomClick = (e) => {
    if (dragRef.current.isMoved) {
      dragRef.current.isMoved = false;
      return;
    }
    if (!isZoomed) {
      const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - left) / width) * 100;
      const y = ((e.clientY - top) / height) * 100;
      setZoomPos({ x: `${x}%`, y: `${y}%` });
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  const saveEdit = (e, shouldClose = true) => {
    if (e && e.preventDefault) e.preventDefault();
    let newItems;
    if (editingItem.id) {
      newItems = items.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      const newItem = { ...editingItem, id: Date.now().toString() };
      newItems = [newItem, ...items];
    }
    setItems(newItems);
    setIsDirty(false);
    if (shouldClose) {
      setEditingItem(null);
    }
    if (onSave) onSave({ ...data, gallery: newItems, settings: { ...data.settings, categories, subcategories } });
  };

  
  const saveCategories = (newCats, newItems = items) => {
    setCategories(newCats);
    if (onSave) onSave({ ...data, gallery: newItems, settings: { ...data.settings, categories: newCats, subcategories } });
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categories.includes(newCategoryName.trim())) {
      alert('大分類名稱已存在！');
      return;
    }
    saveCategories([...categories, newCategoryName.trim()]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (name) => {
    if (!window.confirm(`確定要刪除大分類「${name}」嗎？這不會刪除照片，但會清除這些照片的大分類標籤。`)) return;
    const newItems = items.map(i => i.category === name ? { ...i, category: '' } : i);
    saveCategories(categories.filter(s => s !== name), newItems);
    if (activeCategory === name) setActiveCategory('all');
  };

  const handleRenameCategory = () => {
    if (!editingCategory) return;
    if (!editingCategory.newName.trim() || editingCategory.oldName === editingCategory.newName) {
      setEditingCategory(null);
      return;
    }
    if (categories.includes(editingCategory.newName.trim())) {
      alert('此大分類名稱已存在！');
      setEditingCategory(null);
      return;
    }
    const newName = editingCategory.newName.trim();
    const oldName = editingCategory.oldName;
    const newItems = items.map(i => i.category === oldName ? { ...i, category: newName } : i);
    const newCats = categories.map(s => s === oldName ? newName : s);
    saveCategories(newCats, newItems);
    setEditingCategory(null);
    if (activeCategory === oldName) setActiveCategory(newName);
  };

  const saveSubcategories = (newSubcats, newItems = items) => {
    setSubcategories(newSubcats);
    if (onSave) onSave({ ...data, gallery: newItems, settings: { ...data.settings, categories, subcategories: newSubcats } });
  };

  const handleAddSubcategory = () => {
    if (!newSubcategoryName.trim()) return;
    if (subcategories.includes(newSubcategoryName.trim())) {
      alert('分類名稱已存在！');
      return;
    }
    saveSubcategories([...subcategories, newSubcategoryName.trim()]);
    setNewSubcategoryName('');
  };

  const handleDeleteSubcategory = (name) => {
    if (!window.confirm(`確定要刪除分類「${name}」嗎？這不會刪除照片，但會清除這些照片的分類標籤。`)) return;
    const newItems = items.map(i => i.subcategory === name ? { ...i, subcategory: '' } : i);
    setItems(newItems);
    saveSubcategories(subcategories.filter(s => s !== name), newItems);
    if (activeSubcategory === name) setActiveSubcategory('all');
  };

  const handleRenameSubcategory = () => {
    if (!editingSubcategory.newName.trim() || editingSubcategory.oldName === editingSubcategory.newName) {
      setEditingSubcategory(null);
      return;
    }
    if (subcategories.includes(editingSubcategory.newName.trim())) {
      alert('分類名稱已存在！');
      return;
    }
    const newName = editingSubcategory.newName.trim();
    const oldName = editingSubcategory.oldName;
    const newItems = items.map(i => i.subcategory === oldName ? { ...i, subcategory: newName } : i);
    setItems(newItems);
    const newSubcats = subcategories.map(s => s === oldName ? newName : s);
    saveSubcategories(newSubcats, newItems);
    setEditingSubcategory(null);
    if (activeSubcategory === oldName) setActiveSubcategory(newName);
  };

  const navigateEdit = (direction, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!editingItem) return;

    if (isDirty) {
      const confirmSave = window.confirm('您有尚未儲存的變更，請問要先儲存嗎？\n\n點「確定」儲存並前往下一張\n點「取消」留在原地繼續編輯');
      if (confirmSave) {
        saveEdit(null, false); // save but don't close yet
      } else {
        return; // stay
      }
    }

    const currentMainFilteredItems = items.filter(i => activeCategory === 'all' || i.category === activeCategory);
    const currentFilteredItems = currentMainFilteredItems.filter(i => activeSubcategory === 'all' || i.subcategory === activeSubcategory);
    const currentIndex = currentFilteredItems.findIndex(i => i.id === editingItem.id);
    if (currentIndex === -1) return; // cannot navigate if new unsaved item
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = currentFilteredItems.length - 1;
    if (newIndex >= currentFilteredItems.length) newIndex = 0;

    setEditingItem({ ...currentFilteredItems[newIndex] });
    setIsDirty(false);
    setIsZoomed(false);
  };

  const navigatePreview = (direction, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!previewItem) return;
    
    const currentMainFilteredItems = items.filter(i => activeCategory === 'all' || i.category === activeCategory);
    const currentFilteredItems = currentMainFilteredItems.filter(i => activeSubcategory === 'all' || i.subcategory === activeSubcategory);
    const currentIndex = currentFilteredItems.findIndex(i => i.id === previewItem.id);
    if (currentIndex === -1) return;
    
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = currentFilteredItems.length - 1;
    if (newIndex >= currentFilteredItems.length) newIndex = 0;

    setPreviewItem({ ...currentFilteredItems[newIndex] });
    setIsZoomed(false);
  };

  const cancelEdit = () => {
    if (isDirty) {
      if (!window.confirm('您有未儲存的變更，確定要放棄修改並離開嗎？')) {
        return;
      }
    }
    setEditingItem(null);
    setIsDirty(false);
    setIsZoomed(false);
  };

  const startEdit = (item) => {
    setEditingItem({ ...item });
    setIsDirty(false);
    setIsZoomed(false);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setIsDirty(true);
  };

  const addNew = () => {
    setEditingItem({
      id: '',
      type: 'image',
      category: activeCategory === 'all' ? (categories[0] || '') : activeCategory,
      subcategory: activeSubcategory === 'all' ? '' : activeSubcategory,
      url: '/picture/new.jpg',
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      isLiked: false,
      isFavorite: false
    });
    setIsDirty(true);
    setIsZoomed(false);
  };

  const currentMainFilteredItems = items.filter(i => activeCategory === 'all' || i.category === activeCategory);
  const availableSubcategories = subcategories;
  const filteredItems = currentMainFilteredItems.filter(i => {
    if (activeSubcategory !== 'all' && i.subcategory !== activeSubcategory) return false;
    if (activeStatusFilter === 'flattened' && !i.isFlattened) return false;
    if (activeStatusFilter === 'mounted' && !i.isMounted) return false;
    if (activeStatusFilter === 'framed' && !i.isFramed) return false;
    if (activeStatusFilter === 'inscribed' && !i.isInscribed) return false;
    if (activeStatusFilter === 'favorite' && !i.isFavorite) return false;
    return true;
  });
  
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const renderPreviewModal = () => {
    if (!previewItem) return null;
    const currentFilteredItems = filteredItems;
    return (
      <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.9)' }} onClick={() => { setPreviewItem(null); setIsZoomed(false); }}>
        <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', background: 'transparent', boxShadow: 'none', border: 'none' }}>
          <div className="modal-media" style={{ flex: '1', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: 0 }}>
            <button className="close-btn" style={{ top: '1rem', right: '2rem', color: 'white', zIndex: 50, background: 'rgba(255,255,255,0.2)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid rgba(255,255,255,0.5)' }} onClick={() => { setPreviewItem(null); setIsZoomed(false); }}>&times;</button>
            
            {currentFilteredItems.length > 1 && (
              <button className="nav-btn prev-btn" onClick={(e) => navigatePreview('prev', e)}>&#10094;</button>
            )}
            
            {previewItem.type === 'video' ? (
              <video src={import.meta.env.BASE_URL + previewItem.url.replace(/^\//, '')} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <div 
                className={`zoom-wrapper ${isZoomed ? 'zoomed' : ''}`}
                onClick={handleZoomClick}
                onMouseDown={handleZoomMouseDown}
                onMouseMove={handleZoomMouseMove}
                onMouseUp={handleZoomMouseUp}
                onMouseLeave={handleZoomMouseUp}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', overflow: 'hidden', cursor: isZoomed ? 'zoom-out' : 'zoom-in', position: 'relative' }}
              >
                <img 
                  src={import.meta.env.BASE_URL + previewItem.url.replace(/^\//, '')} 
                  alt={previewItem.title} 
                  className="zoom-image"
                  style={{
                    transformOrigin: isZoomed ? `${zoomPos.x} ${zoomPos.y}` : 'center center',
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transition: isZoomed ? 'none' : 'transform 0.3s ease',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    position: isZoomed ? 'absolute' : 'relative',
                    zIndex: 0
                  }}
                />
                {isZoomed && (
                  <img 
                    src={import.meta.env.BASE_URL + previewItem.url.replace('/01/', '/01s/').replace('/02/', '/02s/').replace(/[^/]+(?=\?|$)/, previewItem.title).replace(/^\//, '')}
                    alt={previewItem.title + ' high-res'} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                    style={{
                      transformOrigin: `${zoomPos.x} ${zoomPos.y}`,
                      transform: 'scale(2.5)',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                )}
              </div>
            )}

            {currentFilteredItems.length > 1 && (
              <button className="nav-btn next-btn" onClick={(e) => navigatePreview('next', e)}>&#10095;</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!editingItem) return null;
    const currentFilteredItems = filteredItems;
    
    return (
      <div className="modal-backdrop" onClick={cancelEdit}>
        <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'row' }}>
          
          <div className="modal-media" style={{ flex: '2', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentFilteredItems.length > 1 && editingItem.id && (
              <button className="nav-btn prev-btn" onClick={(e) => navigateEdit('prev', e)}>&#10094;</button>
            )}
            
            {editingItem.type === 'video' ? (
              <video src={import.meta.env.BASE_URL + editingItem.url.replace(/^\//, '')} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <div 
                className={`zoom-wrapper ${isZoomed ? 'zoomed' : ''}`}
                onClick={handleZoomClick}
                onMouseDown={handleZoomMouseDown}
                onMouseMove={handleZoomMouseMove}
                onMouseUp={handleZoomMouseUp}
                onMouseLeave={handleZoomMouseUp}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', overflow: 'hidden', cursor: isZoomed ? 'grab' : 'zoom-in', position: 'relative' }}
              >
                <img 
                  src={import.meta.env.BASE_URL + editingItem.url.replace(/^\//, '')} 
                  alt={editingItem.title} 
                  className="zoom-image"
                  style={{
                    transformOrigin: isZoomed ? `${zoomPos.x} ${zoomPos.y}` : 'center center',
                    transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
                    transition: isZoomed ? 'none' : 'transform 0.3s ease',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    position: isZoomed ? 'absolute' : 'relative',
                    zIndex: 0
                  }}
                />
                {isZoomed && (
                  <img 
                    src={import.meta.env.BASE_URL + editingItem.url.replace('/01/', '/01s/').replace('/02/', '/02s/').replace(/[^/]+(?=\?|$)/, editingItem.title).replace(/^\//, '')}
                    alt={editingItem.title + ' high-res'} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                    style={{
                      transformOrigin: `${zoomPos.x} ${zoomPos.y}`,
                      transform: 'scale(2.5)',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                )}
              </div>
            )}

            {currentFilteredItems.length > 1 && editingItem.id && (
              <button className="nav-btn next-btn" onClick={(e) => navigateEdit('next', e)}>&#10095;</button>
            )}
          </div>

          <div className="modal-info" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
            <style>
              {`
                .compact-edit .form-group { margin-bottom: 0.5rem; }
                .compact-edit .form-control { padding: 0.4rem 0.6rem; font-size: 0.9rem; }
                .compact-edit label { margin-bottom: 0.2rem; font-size: 0.8rem; }
              `}
            </style>
            <button className="close-btn" onClick={cancelEdit}>&times;</button>
            <div className="edit-form compact-edit" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%', overflowY: 'auto', paddingRight: '1rem' }}>
              <h3 style={{ color: 'var(--text-color)', margin: 0, fontSize: '1.2rem' }}>{editingItem.id ? '✏️ 編輯相片資訊' : '✨ 新增相片資訊'}</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>類型 (Type)</label>
                  <select name="type" value={editingItem.type} onChange={handleEditChange} className="form-control">
                    <option value="image">圖片 (Image)</option>
                    <option value="video">影片 (Video)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>大分類 (樓層)</label>
                  <select name="category" value={editingItem.category || ''} onChange={handleEditChange} className="form-control">
                    <option value="">未分類</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>小分類 (Subcat)</label>
                  <select name="subcategory" value={editingItem.subcategory || ''} onChange={handleEditChange} className="form-control">
                    <option value="">(無)</option>
                    {subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>檔案路徑 (URL)</label>
                <input type="text" name="url" value={editingItem.url} onChange={handleEditChange} className="form-control" required />
              </div>
              
              <div className="form-group">
                <label>標題 (Title)</label>
                <input type="text" name="title" value={editingItem.title} onChange={handleEditChange} className="form-control" required />
              </div>
              
              <div className="form-group">
                <label>說明 (Description)</label>
                <textarea name="description" value={editingItem.description} onChange={handleEditChange} className="form-control" rows="4" required></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>日期 (Date)</label>
                  <input type="date" name="date" value={editingItem.date} onChange={handleEditChange} className="form-control" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>地點 (Location)</label>
                  <input type="text" name="location" value={editingItem.location || ''} onChange={handleEditChange} className="form-control" />
                </div>
              </div>

              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isLiked" 
                    name="isLiked" 
                    checked={!!editingItem.isLiked} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isLiked: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isLiked" style={{ marginBottom: 0, cursor: 'pointer' }}>👁️ 公開顯示</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isFavorite" 
                    name="isFavorite" 
                    checked={!!editingItem.isFavorite} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isFavorite: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isFavorite" style={{ marginBottom: 0, cursor: 'pointer' }}>❤️ 標記為最愛</label>
                </div>
              </div>

              <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isFlattened" 
                    name="isFlattened" 
                    checked={!!editingItem.isFlattened} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isFlattened: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isFlattened" style={{ marginBottom: 0, cursor: 'pointer' }}>🗜️ 已拓平</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isMounted" 
                    name="isMounted" 
                    checked={!!editingItem.isMounted} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isMounted: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isMounted" style={{ marginBottom: 0, cursor: 'pointer' }}>📜 已裱褙</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isFramed" 
                    name="isFramed" 
                    checked={!!editingItem.isFramed} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isFramed: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isFramed" style={{ marginBottom: 0, cursor: 'pointer' }}>🖼️ 已裝框</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="isInscribed" 
                    name="isInscribed" 
                    checked={!!editingItem.isInscribed} 
                    onChange={e => {
                      setEditingItem(prev => ({ ...prev, isInscribed: e.target.checked }));
                      setIsDirty(true);
                    }} 
                    style={{ width: '1.2rem', height: '1.2rem' }}
                  />
                  <label htmlFor="isInscribed" style={{ marginBottom: 0, cursor: 'pointer' }}>✍️ 題字</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button type="button" className="btn" onClick={(e) => saveEdit(e, false)} disabled={!isDirty}>
                  💾 儲存 {isDirty ? '' : '(已儲存)'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>關閉</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!isManagingCategories) return null;
    return (
      <div className="modal-backdrop" onClick={() => setIsManagingCategories(false)}>
        <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '500px', height: 'auto', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', display: 'block', margin: 'auto' }}>
          
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>🗂️ 管理大分類 (樓層)</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="新增大分類..." 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button className="btn" style={{ width: 'auto' }} onClick={handleAddCategory}>新增</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            {categories.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>尚無大分類</p>}
            {categories.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: '#fbfbfb', border: '1px solid var(--card-border)' }}>
                {editingCategory && editingCategory.oldName === cat ? (
                  <input 
                    autoFocus
                    type="text" 
                    className="form-control" 
                    style={{ padding: '0.4rem' }}
                    value={editingCategory.newName} 
                    onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCategory();
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                    onBlur={handleRenameCategory}
                  />
                ) : (
                  <span style={{ fontWeight: 'bold' }}>{cat}</span>
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!editingCategory || editingCategory.oldName !== cat ? (
                    <>
                      <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.9rem' }} onClick={() => setEditingCategory({ oldName: cat, newName: cat })}>✏️</button>
                      <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.9rem' }} onClick={() => handleDeleteCategory(cat)}>🗑️</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0 1rem 0' }}></div>

          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>📁 管理小分類 (展廳)</h3>

          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="新增分類名稱..." 
              value={newSubcategoryName} 
              onChange={(e) => setNewSubcategoryName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory()}
            />
            <button className="btn" style={{ width: 'auto' }} onClick={handleAddSubcategory}>新增</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {subcategories.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>尚無分類</p>}
            {subcategories.map(sub => (
              <div key={sub} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem', background: '#fbfbfb', border: '1px solid var(--card-border)' }}>
                {editingSubcategory && editingSubcategory.oldName === sub ? (
                  <input 
                    autoFocus
                    type="text" 
                    className="form-control" 
                    style={{ padding: '0.4rem' }}
                    value={editingSubcategory.newName} 
                    onChange={(e) => setEditingSubcategory({ ...editingSubcategory, newName: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSubcategory();
                      if (e.key === 'Escape') setEditingSubcategory(null);
                    }}
                    onBlur={handleRenameSubcategory}
                  />
                ) : (
                  <span style={{ fontWeight: 'bold' }}>{sub}</span>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!editingSubcategory || editingSubcategory.oldName !== sub ? (
                    <>
                      <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.9rem' }} onClick={() => setEditingSubcategory({ oldName: sub, newName: sub })}>✏️</button>
                      <button className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.9rem' }} onClick={() => handleDeleteSubcategory(sub)}>🗑️</button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setIsManagingCategories(false)}>完成</button>
          </div>
        </div>
      </div>
    );
  };

  const paginationControls = totalPages > 1 ? (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
      <button 
        className="btn btn-secondary" 
        style={{ width: 'auto' }}
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
      >
        上一頁
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>第</span>
        <select 
          className="form-control" 
          value={currentPage} 
          onChange={(e) => setCurrentPage(Number(e.target.value))}
          style={{ width: 'auto', padding: '0.2rem 0.5rem', textAlign: 'center' }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <option key={page} value={page}>{page}</option>
          ))}
        </select>
        <span>頁 / 共 {totalPages} 頁</span>
      </div>
      <button 
        className="btn btn-secondary" 
        style={{ width: 'auto' }}
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
      >
        下一頁
      </button>
    </div>
  ) : null;

  return (
    <>
      {renderPreviewModal()}
      {renderEditModal()}
      {renderCategoryModal()}
      <div className="admin-container" style={{ alignItems: 'flex-start' }}>
      <div className="dashboard">
        <div className="dashboard-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h2>Admin Dashboard</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsManagingCategories(true)}>🏷️ 管理分類</button>
              <button className="btn" onClick={addNew}>Add New Item</button>
              <button 
                className={`btn ${hasUnsavedChanges ? '' : 'btn-secondary'}`} 
                style={hasUnsavedChanges ? { background: '#f59e0b', color: 'white', fontWeight: 'bold' } : { background: '#10b981' }} 
                onClick={handleSaveAll}
              >
                💾 {hasUnsavedChanges ? '⚠️ 有未儲存的變更，請點此儲存' : 'Save Changes to Disk'}
              </button>
              <button className="btn" style={{ background: '#3b82f6', color: 'white' }} onClick={handleDeploy}>🚀 發布到 GitHub (上線)</button>
            </div>
          </div>
          
          <div style={{ width: '100%' }}>
            
            <div className="filters" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <button className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveSubcategory('all'); setCurrentPage(1); }}>全部照片</button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  className={`filter-btn ${activeCategory === cat ? 'active' : ''}`} 
                  onClick={() => { setActiveCategory(cat); setActiveSubcategory('all'); setCurrentPage(1); }}
                >
                  {cat}
                </button>
              ))}
            </div>

            
            {availableSubcategories.length > 0 && (
              <div className="filters sub-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem', background: '#f4f1eb', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginRight: '0.5rem' }}>小分類：</span>
                <button 
                  className={`filter-btn ${activeSubcategory === 'all' ? 'active' : ''}`} 
                  style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} 
                  onClick={() => { setActiveSubcategory('all'); setCurrentPage(1); }}
                >全部</button>
                {availableSubcategories.map(sub => (
                  <button 
                    key={sub}
                    className={`filter-btn ${activeSubcategory === sub ? 'active' : ''}`} 
                    style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} 
                    onClick={() => { setActiveSubcategory(sub); setCurrentPage(1); }}
                  >{sub}</button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div className="filters status-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.5rem', marginTop: '0.5rem', background: '#eef2ff', borderRadius: '4px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginRight: '0.5rem' }}>狀態篩選：</span>
                <button className={`filter-btn ${activeStatusFilter === 'all' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('all'); setCurrentPage(1); }}>全部</button>
                <button className={`filter-btn ${activeStatusFilter === 'flattened' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('flattened'); setCurrentPage(1); }}>🗜️ 拓平</button>
                <button className={`filter-btn ${activeStatusFilter === 'mounted' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('mounted'); setCurrentPage(1); }}>📜 裱褙</button>
                <button className={`filter-btn ${activeStatusFilter === 'framed' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('framed'); setCurrentPage(1); }}>🖼️ 裝框</button>
                <button className={`filter-btn ${activeStatusFilter === 'inscribed' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('inscribed'); setCurrentPage(1); }}>✍️ 題字</button>
                <button className={`filter-btn ${activeStatusFilter === 'favorite' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem' }} onClick={() => { setActiveStatusFilter('favorite'); setCurrentPage(1); }}>❤️ 最愛</button>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="filter-btn" 
                  style={{ padding: '0.4rem 1rem', background: adminViewMode === 'list' ? 'var(--primary-color)' : 'transparent', color: adminViewMode === 'list' ? 'white' : 'var(--text-color)', border: '1px solid var(--primary-color)', borderRadius: '4px' }}
                  onClick={() => setAdminViewMode('list')}
                >
                  📋 列表模式
                </button>
                <button 
                  className="filter-btn" 
                  style={{ padding: '0.4rem 1rem', background: adminViewMode === 'grid' ? 'var(--primary-color)' : 'transparent', color: adminViewMode === 'grid' ? 'white' : 'var(--text-color)', border: '1px solid var(--primary-color)', borderRadius: '4px' }}
                  onClick={() => setAdminViewMode('grid')}
                >
                  🔲 網格排序
                </button>
              </div>
            </div>
          </div>
        </div>

        {paginationControls}

        <div className={adminViewMode === 'grid' ? 'admin-grid' : 'admin-list'}>
          {currentItems.map((item, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <div 
                key={item.id} 
                className={`admin-item glass ${draggedItemIndex === item.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item)}
                onDragEnd={() => setDraggedItemIndex(null)}
                style={{ cursor: 'grab', opacity: draggedItemIndex === item.id ? 0.5 : 1 }}
              >
              {item.type === 'video' ? (
                <video src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} onClick={() => setPreviewItem(item)} title="點擊放大預覽" />
              ) : (
                <img src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} alt={item.title} onClick={() => setPreviewItem(item)} title="點擊放大預覽" />
              )}
              <div className="admin-item-info">
                <h3 style={{ fontSize: '1.1rem' }}>
                  {item.title} 
                  {item.isLiked && <span title="公開顯示" style={{ marginLeft: '0.5rem' }}>👁️</span>}
                  {item.isFavorite && <span title="最愛" style={{ marginLeft: '0.5rem' }}>❤️</span>}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  
                    <select 
                      value={item.category || ''} 
                      onChange={(e) => handleInlineChange(item.id, 'category', e.target.value)}
                      style={{ padding: '0.2rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', width: '100px' }}
                    >
                      <option value="">未分類</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                  
                  <select 
                    value={item.subcategory || ''} 
                    onChange={(e) => handleInlineChange(item.id, 'subcategory', e.target.value)}
                    className="form-control"
                    style={{ padding: '0.1rem 0.3rem', width: 'auto', fontSize: '0.85rem', background: '#e3dfd5' }}
                  >
                    <option value="">(無小分類)</option>
                    {subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>

                  <span className="tag">{item.type}</span>
                  {item.date && <span className="tag">📅 {item.date}</span>}
                  {item.isFlattened && <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem' }}>🗜️ 拓平</span>}
                  {item.isMounted && <span className="tag" style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem' }}>📜 裱褙</span>}
                  {item.isFramed && <span className="tag" style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem' }}>🖼️ 裝框</span>}
                  {item.isInscribed && <span className="tag" style={{ background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem' }}>✍️ 題字</span>}
                </div>
                {adminViewMode === 'list' && (
                  <>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>{item.date} • {item.location}</p>
                    <p>{item.description}</p>
                  </>
                )}
              </div>
              <div className="admin-item-actions" style={{ flexDirection: adminViewMode === 'grid' ? 'row' : 'column', gap: '0.5rem', marginTop: adminViewMode === 'grid' ? 'auto' : 0 }}>
                {adminViewMode === 'list' && (
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => toggleLike(item.id)}
                    title={item.isLiked ? "隱藏" : "公開顯示"}
                    style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {item.isLiked ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => toggleFavorite(item.id)}
                    title={item.isFavorite ? "取消最愛" : "標記為最愛"}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.isFavorite ? '#e25555' : 'inherit' }}
                  >
                    {item.isFavorite ? '❤️' : '🤍'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            </div>
            );
          })}
          {items.length === 0 && (
            <div className="empty-state glass">No items. Click Add New to start.</div>
          )}
        </div>

        {paginationControls}
      </div>
    </div>
    </>
  );
}

export default Admin;
