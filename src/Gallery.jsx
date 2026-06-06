import React, { useState, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const EDIT_MODE_ENABLED = import.meta.env.DEV;

function Gallery({ data, onSave }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('painting');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };
  const [viewMode, setViewMode] = useState('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: '50%', y: '50%' });

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory('all');
    setVisibleCount(20);
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    setIsCropping(false);
    setIsZoomed(false);
  };
  const closeModal = () => {
    setSelectedItem(null);
    setIsCropping(false);
    setIsZoomed(false);
  };

  const currentMainFilteredGallery = data.gallery.filter(item => {
    if (activeCategory === 'all') return item.isLiked;
    return item.isLiked && (item.category === activeCategory || (!item.category && activeCategory === 'life'));
  });

  const availableSubcategories = data.settings?.subcategories || ['直1', '直2', '橫1', '橫2'];

  const filteredGallery = currentMainFilteredGallery.filter(i => {
    if (activeSubcategory !== 'all' && i.subcategory !== activeSubcategory) return false;
    if (activeStatusFilter === 'flattened' && !i.isFlattened) return false;
    if (activeStatusFilter === 'mounted' && !i.isMounted) return false;
    if (activeStatusFilter === 'framed' && !i.isFramed) return false;
    if (activeStatusFilter === 'inscribed' && !i.isInscribed) return false;
    if (activeStatusFilter === 'favorite' && !i.isFavorite) return false;
    return true;
  });

  const currentIndex = selectedItem ? filteredGallery.findIndex(i => i.id === selectedItem.id) : -1;

  const navigateModal = (direction, e) => {
    e.stopPropagation();
    if (currentIndex === -1) return;
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0) newIndex = filteredGallery.length - 1;
    if (newIndex >= filteredGallery.length) newIndex = 0;
    setSelectedItem(filteredGallery[newIndex]);
    setIsEditing(false);
    setIsCropping(false);
    setIsZoomed(false);
  };

  const handleZoomMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x: `${x}%`, y: `${y}%` });
  };

  const startEdit = () => {
    setEditForm({ ...selectedItem });
    setIsEditing(true);
  };

  const startCrop = () => {
    setIsCropping(true);
    setIsEditing(false);
    setCrop(undefined);
    setCompletedCrop(null);
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, completedCrop.width, completedCrop.height
    );
    const base64Image = canvas.toDataURL('image/jpeg', 0.95);
    try {
      const response = await fetch('/api/saveImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedItem.url, base64: base64Image })
      });
      if (response.ok) {
        const newUrl = selectedItem.url.replace(/\?.*$/, '') + '?t=' + Date.now();
        const updatedItem = { ...selectedItem, url: newUrl };
        const newGallery = data.gallery.map(i => i.id === selectedItem.id ? updatedItem : i);
        if (onSave) onSave({ ...data, gallery: newGallery });
        setSelectedItem(updatedItem);
        setIsCropping(false);
      } else {
        alert("儲存裁切失敗！");
      }
    } catch (e) {
      console.error(e);
      alert("儲存發生錯誤！");
    }
  };

  const handleRestoreImage = async () => {
    if (!window.confirm("確定要放棄目前的裁切，從原始高畫質檔案重新還原這張照片嗎？")) return;
    try {
      const response = await fetch('/api/restoreImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedItem.url })
      });
      if (response.ok) {
        const newUrl = selectedItem.url.replace(/\?.*$/, '') + '?t=' + Date.now();
        const updatedItem = { ...selectedItem, url: newUrl };
        const newGallery = data.gallery.map(i => i.id === selectedItem.id ? updatedItem : i);
        if (onSave) onSave({ ...data, gallery: newGallery });
        setSelectedItem(updatedItem);
        alert("照片已成功恢復為原始狀態！");
      } else {
        const res = await response.json();
        alert("恢復失敗：" + (res.error || '未知錯誤'));
      }
    } catch (e) {
      console.error(e);
      alert("恢復發生錯誤！");
    }
  };

  const handleRotateImage = async () => {
    try {
      const response = await fetch('/api/rotateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedItem.url })
      });
      if (response.ok) {
        const newUrl = selectedItem.url.replace(/\?.*$/, '') + '?t=' + Date.now();
        const updatedItem = { ...selectedItem, url: newUrl };
        const newGallery = data.gallery.map(i => i.id === selectedItem.id ? updatedItem : i);
        if (onSave) onSave({ ...data, gallery: newGallery });
        setSelectedItem(updatedItem);
      } else {
        const res = await response.json();
        alert("旋轉失敗：" + (res.error || '未知錯誤'));
      }
    } catch (e) {
      console.error(e);
      alert("旋轉發生錯誤！");
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveModal = () => {
    const newGallery = data.gallery.map(i => i.id === editForm.id ? editForm : i);
    if (onSave) {
      onSave({ ...data, gallery: newGallery });
    }
    setSelectedItem(editForm);
    setIsEditing(false);
  };

  if (!data.gallery || data.gallery.length === 0) {
    return (
      <div className="gallery-container">
        <div className="empty-state">
          <h2>No items in gallery</h2>
          <p>Go to the Admin panel to add some pictures or videos.</p>
        </div>
      </div>
    );
  }



  const musicUrl = data.settings?.backgroundMusic 
    ? import.meta.env.BASE_URL + data.settings.backgroundMusic.replace(/^\//, '') 
    : import.meta.env.BASE_URL + 'music/Debussy_Clair_de_Lune.mp3';

  return (
    <div className="gallery-container">
      <audio ref={audioRef} loop src={musicUrl} />
      <div className="filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => handleCategoryChange('all')}>全部照片</button>
            <button className={`filter-btn ${activeCategory === 'life' ? 'active' : ''}`} onClick={() => handleCategoryChange('life')}>生活照片</button>
            <button className={`filter-btn ${activeCategory === 'painting' ? 'active' : ''}`} onClick={() => handleCategoryChange('painting')}>畫畫照片</button>
            <button 
              className="filter-btn" 
              onClick={toggleAudio}
              style={{ margin: 0, padding: '0.4rem 1rem', background: isPlayingMusic ? 'var(--primary-color)' : 'transparent', color: isPlayingMusic ? 'white' : 'var(--text-color)', border: '1px solid var(--primary-color)' }}
            >
              {isPlayingMusic ? '⏸️ 暫停音樂' : '🎵 播放背景音樂'}
            </button>
          </div>
          
          {availableSubcategories.length > 0 && (
            <div className="filters sub-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.3rem 0.5rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', width: 'fit-content' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginLeft: '0.5rem', marginRight: '0.5rem' }}>小分類：</span>
              <button 
                className={`filter-btn ${activeSubcategory === 'all' ? 'active' : ''}`} 
                style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} 
                onClick={() => { setActiveSubcategory('all'); setVisibleCount(20); }}
              >全部</button>
              {availableSubcategories.map(sub => (
                <button 
                  key={sub}
                  className={`filter-btn ${activeSubcategory === sub ? 'active' : ''}`} 
                  style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} 
                  onClick={() => { setActiveSubcategory(sub); setVisibleCount(20); }}
                >{sub}</button>
              ))}
            </div>
          )}
          <div className="filters status-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.3rem 0.5rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', width: 'fit-content' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginLeft: '0.5rem', marginRight: '0.5rem' }}>狀態：</span>
            <button className={`filter-btn ${activeStatusFilter === 'all' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('all'); setVisibleCount(20); }}>全部</button>
            <button className={`filter-btn ${activeStatusFilter === 'flattened' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('flattened'); setVisibleCount(20); }}>🗜️ 拓平</button>
            <button className={`filter-btn ${activeStatusFilter === 'mounted' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('mounted'); setVisibleCount(20); }}>📜 裱褙</button>
            <button className={`filter-btn ${activeStatusFilter === 'framed' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('framed'); setVisibleCount(20); }}>🖼️ 裝框</button>
            <button className={`filter-btn ${activeStatusFilter === 'inscribed' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('inscribed'); setVisibleCount(20); }}>✍️ 題字</button>
            <button className={`filter-btn ${activeStatusFilter === 'favorite' ? 'active' : ''}`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('favorite'); setVisibleCount(20); }}>❤️ 最愛</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.3rem', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <button 
            className="filter-btn" 
            style={{ margin: 0, padding: '0.4rem 1rem', background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'grid' ? 'white' : 'var(--text-color)', border: 'none' }}
            onClick={() => setViewMode('grid')}
          >
            🔲 格子
          </button>
          <button 
            className="filter-btn" 
            style={{ margin: 0, padding: '0.4rem 1rem', background: viewMode === 'timeline' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'timeline' ? 'white' : 'var(--text-color)', border: 'none' }}
            onClick={() => setViewMode('timeline')}
          >
            ⏳ 時間軸
          </button>
        </div>
      </div>

      <div style={{ padding: '0.5rem 0', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
        目前分類共顯示 {filteredGallery.length} 件作品 
        （{filteredGallery.filter(i => i.type === 'image').length} 張照片, {filteredGallery.filter(i => i.type === 'video').length} 部影片）
      </div>

      {filteredGallery.length === 0 ? (
        <div className="empty-state">
          <h2>No items in this category</h2>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="gallery-grid">
              {filteredGallery.slice(0, visibleCount).map(item => (
                <div key={item.id} className="gallery-item glass" onClick={() => openModal(item)} style={{ position: 'relative' }}>
                  {item.isFavorite && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '1.2rem', zIndex: 5, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} title="最愛">
                      ❤️
                    </div>
                  )}
                  {item.type === 'video' ? (
                    <video src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} muted loop playsInline onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
                  ) : (
                    <img src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} alt={item.title} loading="lazy" />
                  )}
                  <div className="item-overlay">
                    <h3 className="item-title">
                      {item.title}
                      {item.isFavorite && <span style={{ marginLeft: '0.5rem', color: '#ff6b6b' }} title="最愛">❤️</span>}
                    </h3>
                    <div className="item-meta" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
                      {item.isFlattened && <span className="tag" style={{ background: 'rgba(224, 242, 254, 0.9)', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.75rem', border: 'none' }}>🗜️ 拓平</span>}
                      {item.isMounted && <span className="tag" style={{ background: 'rgba(254, 243, 199, 0.9)', color: '#b45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.75rem', border: 'none' }}>📜 裱褙</span>}
                      {item.isFramed && <span className="tag" style={{ background: 'rgba(243, 232, 255, 0.9)', color: '#7e22ce', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.75rem', border: 'none' }}>🖼️ 裝框</span>}
                      {item.isInscribed && <span className="tag" style={{ background: 'rgba(220, 252, 231, 0.9)', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.75rem', border: 'none' }}>✍️ 題字</span>}
                      {item.date && <span>📅 {item.date}</span>}
                      {item.location && <span>📍 {item.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="timeline-container">
              {(() => {
                const sortedItems = [...filteredGallery].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                let lastMonth = '';
                let isLeft = true;

                return sortedItems.slice(0, visibleCount).map((item) => {
                  const dateObj = new Date(item.date);
                  const monthStr = isNaN(dateObj) ? '未知時間' : `${dateObj.getFullYear()} 年 ${String(dateObj.getMonth() + 1).padStart(2, '0')} 月`;
                  
                  const showHeader = monthStr !== lastMonth;
                  if (showHeader) {
                    lastMonth = monthStr;
                  }

                  const alignmentClass = isLeft ? 'left' : 'right';
                  isLeft = !isLeft;

                  return (
                    <React.Fragment key={item.id}>
                      {showHeader && (
                        <div className="timeline-month-header" style={{ width: '100%', float: 'left' }}>
                          <span>{monthStr}</span>
                        </div>
                      )}
                      <div className={`timeline-item ${alignmentClass}`}>
                        <div className="timeline-content glass" onClick={() => openModal(item)}>
                          <span className="timeline-date">{item.date}</span>
                          {item.type === 'video' ? (
                            <video className="timeline-media" src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} muted loop playsInline onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
                          ) : (
                            <img className="timeline-media" src={import.meta.env.BASE_URL + item.url.replace(/^\//, '')} alt={item.title} loading="lazy" />
                          )}
                          <h3 className="timeline-title">
                            {item.title}
                            {item.isFavorite && <span style={{ marginLeft: '0.5rem', color: '#ff6b6b' }} title="最愛">❤️</span>}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                            {item.isFlattened && <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>🗜️ 拓平</span>}
                            {item.isMounted && <span className="tag" style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>📜 裱褙</span>}
                            {item.isFramed && <span className="tag" style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>🖼️ 裝框</span>}
                            {item.isInscribed && <span className="tag" style={{ background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>✍️ 題字</span>}
                          </div>
                          <p className="timeline-desc">{item.description}</p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
              <div style={{ clear: 'both' }}></div>
            </div>
          )}
          {filteredGallery.length > visibleCount && (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
              <button 
                className="filter-btn active" 
                style={{ padding: '0.8rem 2.5rem', border: '1px solid var(--card-border)' }} 
                onClick={() => setVisibleCount(prev => prev + 20)}
              >
                載入更多 (Load More)
              </button>
            </div>
          )}
        </>
      )}

      {selectedItem && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-media">
              {filteredGallery.length > 1 && (
                <button className="nav-btn prev-btn" onClick={(e) => navigateModal('prev', e)}>&#10094;</button>
              )}
              {selectedItem.type === 'video' ? (
                <video src={import.meta.env.BASE_URL + selectedItem.url.replace(/^\//, '')} controls autoPlay />
              ) : isCropping ? (
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                  <img src={import.meta.env.BASE_URL + selectedItem.url.replace(/^\//, '')} alt={selectedItem.title} ref={imgRef} style={{ maxHeight: '80vh', objectFit: 'contain' }} />
                </ReactCrop>
              ) : (
                <div 
                  className={`zoom-wrapper ${isZoomed ? 'zoomed' : ''}`}
                  onClick={() => setIsZoomed(!isZoomed)}
                  onMouseMove={handleZoomMove}
                  onMouseLeave={() => setIsZoomed(false)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', overflow: 'hidden', cursor: isZoomed ? 'zoom-out' : 'zoom-in', position: 'relative' }}
                >
                  <img 
                    src={import.meta.env.BASE_URL + selectedItem.url.replace(/^\//, '')} 
                    alt={selectedItem.title} 
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
                      src={import.meta.env.BASE_URL + selectedItem.url.replace('/01/', '/01s/').replace('/02/', '/02s/').replace(/[^/]+(?=\?|$)/, selectedItem.title).replace(/^\//, '')}
                      alt={selectedItem.title + ' high-res'} 
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
              {filteredGallery.length > 1 && (
                <button className="nav-btn next-btn" onClick={(e) => navigateModal('next', e)}>&#10095;</button>
              )}
            </div>
            <div className="modal-info">
              <button className="close-btn" onClick={closeModal}>&times;</button>
              
              {isEditing ? (
                <div className="edit-form" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                  <h3 style={{ color: 'var(--text-color)' }}>✏️ 編輯相片資訊</h3>
                  <input type="text" name="title" value={editForm.title || ''} onChange={handleEditChange} className="form-control" placeholder="標題" />
                  <textarea name="description" value={editForm.description || ''} onChange={handleEditChange} className="form-control" rows="4" placeholder="照片說明"></textarea>
                  <input type="date" name="date" value={editForm.date || ''} onChange={handleEditChange} className="form-control" />
                  <input type="text" name="location" value={editForm.location || ''} onChange={handleEditChange} className="form-control" placeholder="地點" />
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isLiked" checked={!!editForm.isLiked} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      👁️ 公開顯示
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isFavorite" checked={!!editForm.isFavorite} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      ❤️ 最愛
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isFlattened" checked={!!editForm.isFlattened} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      🗜️ 拓平
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isMounted" checked={!!editForm.isMounted} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      📜 裱褙
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isFramed" checked={!!editForm.isFramed} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      🖼️ 裝框
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                      <input type="checkbox" name="isInscribed" checked={!!editForm.isInscribed} onChange={handleEditChange} style={{ width: '1.2rem', height: '1.2rem' }} />
                      ✍️ 題字
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                    <button className="btn" onClick={handleSaveModal}>💾 儲存</button>
                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 style={{ paddingRight: '2rem', display: 'flex', alignItems: 'center' }}>
                    {selectedItem.title}
                    {selectedItem.isFavorite && <span style={{ marginLeft: '0.8rem', fontSize: '1.5rem', color: '#ff6b6b' }} title="最愛">❤️</span>}
                  </h2>
                  <p style={{ marginTop: '1rem', lineHeight: '1.8' }}>{selectedItem.description}</p>
                  <div className="meta-tags" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    {selectedItem.date && <span className="tag">📅 {selectedItem.date}</span>}
                    {selectedItem.location && <span className="tag">📍 {selectedItem.location}</span>}
                    {selectedItem.isFlattened && <span className="tag" style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>🗜️ 拓平</span>}
                    {selectedItem.isMounted && <span className="tag" style={{ background: '#fef3c7', color: '#b45309', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>📜 裱褙</span>}
                    {selectedItem.isFramed && <span className="tag" style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>🖼️ 裝框</span>}
                    {selectedItem.isInscribed && <span className="tag" style={{ background: '#dcfce7', color: '#15803d', padding: '0.1rem 0.4rem', borderRadius: '4px', fontStyle: 'normal', fontSize: '0.8rem', border: 'none' }}>✍️ 題字</span>}
                  </div>
                  {EDIT_MODE_ENABLED && !isCropping && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={startEdit}
                        style={{ alignSelf: 'flex-start', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                      >
                        ✏️ 編輯 (Edit)
                      </button>
                      {selectedItem.type === 'image' && (
                        <>
                          <button 
                            className="btn btn-secondary" 
                            onClick={startCrop}
                            style={{ alignSelf: 'flex-start', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                          >
                            ✂️ 裁切 (Crop)
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={handleRotateImage}
                            style={{ alignSelf: 'flex-start', fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                          >
                            ↻ 旋轉
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            onClick={handleRestoreImage}
                            style={{ alignSelf: 'flex-start', fontSize: '0.9rem', padding: '0.4rem 0.8rem', color: '#ff6b6b', borderColor: '#ff6b6b' }}
                          >
                            🔄 恢復原圖
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {isCropping && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>請在照片上拖曳選取裁切範圍。</p>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn" onClick={handleSaveCrop}>💾 儲存裁切</button>
                        <button className="btn btn-secondary" onClick={() => setIsCropping(false)}>取消</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
