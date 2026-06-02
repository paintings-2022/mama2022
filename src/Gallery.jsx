import React, { useState } from 'react';

function Gallery({ data }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const openModal = (item) => setSelectedItem(item);
  const closeModal = () => setSelectedItem(null);

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

  const filteredGallery = data.gallery.filter(item => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory || (!item.category && activeCategory === 'life'); // fallback to life if no category
  });

  return (
    <div className="gallery-container">
      <div className="category-filters">
        <button 
          className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          全部照片 (All)
        </button>
        <button 
          className={`filter-btn ${activeCategory === 'life' ? 'active' : ''}`}
          onClick={() => setActiveCategory('life')}
        >
          生活照片 (Life)
        </button>
        <button 
          className={`filter-btn ${activeCategory === 'painting' ? 'active' : ''}`}
          onClick={() => setActiveCategory('painting')}
        >
          畫畫照片 (Painting)
        </button>
      </div>

      {filteredGallery.length === 0 ? (
        <div className="empty-state">
          <h2>No items in this category</h2>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredGallery.map(item => (
          <div key={item.id} className="gallery-item glass" onClick={() => openModal(item)}>
            {item.type === 'video' ? (
              <video src={item.url} muted loop onMouseEnter={(e) => e.target.play()} onMouseLeave={(e) => e.target.pause()} />
            ) : (
              <img src={item.url} alt={item.title} loading="lazy" />
            )}
            <div className="item-overlay">
              <h3 className="item-title">{item.title}</h3>
              <div className="item-meta">
                <span>{item.date}</span>
                <span>{item.location}</span>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {selectedItem && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>&times;</button>
            <div className="modal-media">
              {selectedItem.type === 'video' ? (
                <video src={selectedItem.url} controls autoPlay />
              ) : (
                <img src={selectedItem.url} alt={selectedItem.title} />
              )}
            </div>
            <div className="modal-info">
              <h2>{selectedItem.title}</h2>
              <p>{selectedItem.description}</p>
              <div className="meta-tags">
                {selectedItem.date && <span className="tag">📅 {selectedItem.date}</span>}
                {selectedItem.location && <span className="tag">📍 {selectedItem.location}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
