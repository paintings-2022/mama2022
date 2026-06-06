import React, { useEffect, useState } from 'react';
import 'aframe';

function VrGallery({ data }) {
  // Navigation states
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [specialFilter, setSpecialFilter] = useState('favorite'); // 'none', 'favorite', 'flattened', 'mounted', 'framed', 'inscribed'
  
  // Interactive state
  const [selectedItem, setSelectedItem] = useState(null);
  const [displayedItems, setDisplayedItems] = useState([]);

  // Initialize default category
  useEffect(() => {
    // Default is 'all', so we don't force it to the first category anymore
  }, [data]);

  // Filter gallery items whenever filters change
  useEffect(() => {
    if (!data?.gallery) return;

    let items = data.gallery.filter(item => item.type !== 'video');

    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }
    
    if (activeSubcategory !== 'all') {
      items = items.filter(item => item.subcategory === activeSubcategory);
    }

    if (specialFilter === 'favorite') items = items.filter(item => item.isFavorite);
    if (specialFilter === 'flattened') items = items.filter(item => item.isFlattened);
    if (specialFilter === 'mounted') items = items.filter(item => item.isMounted);
    if (specialFilter === 'framed') items = items.filter(item => item.isFramed);
    if (specialFilter === 'inscribed') items = items.filter(item => item.isInscribed);

    // Limit to 50 items to prevent VR from crashing or getting too crowded
    setDisplayedItems(items.slice(0, 50));
  }, [data, activeCategory, activeSubcategory, specialFilter]);

  // Radius of the cylinder based on number of items (approx)
  // If each image takes ~4.5 units of arc length
  const itemCount = Math.max(displayedItems.length, 8);
  const radius = Math.max((itemCount * 4.5) / (2 * Math.PI), 6);

  // Close modal handler
  const handleCloseModal = () => setSelectedItem(null);

  return (
    <div style={{ width: '100vw', height: 'calc(100vh - 60px)', position: 'relative', overflow: 'hidden' }}>
      
      {/* 2D VR Scene */}
      <a-scene embedded style={{ width: '100%', height: '100%' }}>
        <a-sky color="#2a2a2a"></a-sky>

        {/* Lighting */}
        <a-light type="ambient" color="#fff" intensity="0.7"></a-light>
        <a-light type="point" intensity="0.5" position="0 5 0"></a-light>

        {/* Floor */}
        <a-plane position="0 0 0" rotation="-90 0 0" width="200" height="200" color="#1a1a1a"></a-plane>

        {/* Gallery Items */}
        <a-entity position="0 2.5 0">
          {displayedItems.map((item, index) => {
            const angleDeg = (index / displayedItems.length) * 360;
            const angleRad = (angleDeg * Math.PI) / 180;
            
            const x = Math.sin(angleRad) * radius;
            const z = -Math.cos(angleRad) * radius;
            const rotationY = -angleDeg;

            let width = 4;
            let height = 3;
            if (item.subcategory?.includes('直')) {
              width = 3;
              height = 4;
            } else if (item.subcategory?.includes('橫')) {
              width = 4;
              height = 3;
            }

            return (
              <a-entity key={item.id} position={`${x} 0 ${z}`} rotation={`0 ${rotationY} 0`}>
                {/* Background Frame */}
                <a-plane width={width + 0.4} height={height + 0.4} color="#000" position="0 0 -0.05"></a-plane>

                {/* Clickable Image */}
                <a-image 
                  class="clickable"
                  src={`${import.meta.env.BASE_URL}${item.url ? item.url.replace(/^\/+/, '') : ''}`} 
                  width={width} 
                  height={height}
                  position="0 0 0"
                  onClick={() => setSelectedItem(item)}
                ></a-image>

                {/* Title */}
                <a-text 
                  value={item.title || 'Untitled'} 
                  align="center" 
                  position={`0 ${-(height / 2 + 0.6)} 0`} 
                  color="#FFF" 
                  scale="2 2 2"
                ></a-text>
              </a-entity>
            );
          })}
        </a-entity>

        {/* Camera with Raycaster for click events */}
        <a-camera position="0 1.6 0">
          <a-cursor color="#fff" raycaster="objects: .clickable"></a-cursor>
        </a-camera>
      </a-scene>
      
      {/* 🛗 Elevator Panel (Sidebar) */}
      <div className="glass" style={{
        position: 'absolute', top: 20, left: 20, zIndex: 9900, 
        padding: '1.5rem', borderRadius: '12px', width: '260px',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', color: '#333' }}>
          🛗 電梯導覽面板
        </h2>
        
        <div>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📍 樓層 (大分類)</label>
          <select 
            value={activeCategory} 
            onChange={(e) => { setActiveCategory(e.target.value); setActiveSubcategory('all'); }}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem', borderRadius: '4px', background: '#fff', color: '#333', border: '1px solid #ccc' }}
          >
            <option value="all">所有分類</option>
            {data?.settings?.categories?.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>🚪 展廳 (小分類)</label>
          <select 
            value={activeSubcategory} 
            onChange={(e) => setActiveSubcategory(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.2rem', borderRadius: '4px', background: '#fff', color: '#333', border: '1px solid #ccc' }}
          >
            <option value="all">所有展廳</option>
            {data?.settings?.subcategories?.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>✨ 特展過濾</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
            {['none', 'favorite', 'flattened', 'mounted', 'framed', 'inscribed'].map(f => {
              const labels = { none: '顯示全部', favorite: '❤️ 最愛', flattened: '🗜️ 拓平', mounted: '📜 裱褙', framed: '🖼️ 裝框', inscribed: '✍️ 提字' };
              return (
                <button 
                  key={f}
                  onClick={() => setSpecialFilter(f)}
                  style={{
                    padding: '0.6rem', textAlign: 'left', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer',
                    background: specialFilter === f ? '#333' : '#f0f0f0',
                    color: specialFilter === f ? '#fff' : '#333', fontWeight: specialFilter === f ? 'bold' : 'normal',
                    fontSize: '0.9rem'
                  }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
            💡 <b>操作提示：</b><br/>
            • 🖱️ <b>滑鼠拖曳</b>：轉頭環顧四周<br/>
            • 🖱️ <b>滑鼠左鍵</b>：點擊畫作可放大觀賞<br/>
            • ⌨️ <b>鍵盤走路</b>：按 <b>W</b>(前進)、<b>S</b>(後退)、<b>A</b>(向左)、<b>D</b>(向右) 可自由移動腳步靠近畫作。
          </p>
          <button 
            onClick={() => window.history.back()}
            style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', borderRadius: '8px', background: 'var(--danger)', color: '#fff', cursor: 'pointer', border: 'none' }}
          >
            ⬅️ 離開 VR 畫廊
          </button>
        </div>
      </div>

      {/* 2D Selected Image Overlay Modal */}
      {selectedItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', padding: '2rem'
        }} onClick={handleCloseModal}>
          
          <button onClick={handleCloseModal} style={{
            position: 'absolute', top: '2rem', right: '3rem',
            background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer'
          }}>✖</button>

          <img 
            src={`${import.meta.env.BASE_URL}${selectedItem.url ? selectedItem.url.replace(/^\/+/, '') : ''}`} 
            alt={selectedItem.title}
            style={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()} 
          />
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: '#fff' }}>
              {selectedItem.title || '無標題'}
              {selectedItem.isFavorite && <span style={{ color: '#ff4d4f', marginLeft: '0.5rem' }}>❤️</span>}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
              {selectedItem.date && <span>📅 {selectedItem.date}</span>}
              {selectedItem.location && <span>📍 {selectedItem.location}</span>}
              <span>📁 {selectedItem.category} - {selectedItem.subcategory}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              {selectedItem.isFlattened && <span className="status-badge status-flattened">🗜️ 拓平</span>}
              {selectedItem.isMounted && <span className="status-badge status-mounted">📜 裱褙</span>}
              {selectedItem.isFramed && <span className="status-badge status-framed">🖼️ 裝框</span>}
              {selectedItem.isInscribed && <span className="status-badge status-inscribed">✍️ 提字</span>}
            </div>

            {selectedItem.description && (
              <p style={{ marginTop: '1rem', lineHeight: '1.6', color: '#ddd' }}>{selectedItem.description}</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default VrGallery;
