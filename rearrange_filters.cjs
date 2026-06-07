const fs = require('fs');

let content = fs.readFileSync('src/Gallery.jsx', 'utf8');

// The original content had a bad structure, we will just locate the exact blocks.

const startToken = '<div className="filters" style={{ display: \'flex\', flexDirection: \'column\', gap: \'0.5rem\' }}>';
const endToken = '      {totalPages > 1 && paginationControls}';

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find bounds");
  process.exit(1);
}

// We will construct the new filters section.
const newFilters = `      <div className="filters" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={\`filter-btn \${activeCategory === 'all' ? 'active' : ''}\`} onClick={() => handleCategoryChange('all')}>全部照片</button>
          {data?.settings?.categories?.map(cat => (
            <button 
              key={cat}
              className={\`filter-btn \${activeCategory === cat ? 'active' : ''}\`} 
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
            <button 
              className="filter-btn" 
              onClick={toggleAudio}
              style={{ margin: 0, padding: '0.4rem 1rem', background: isPlayingMusic ? 'var(--primary-color)' : 'transparent', color: isPlayingMusic ? 'white' : 'var(--text-color)', border: '1px solid var(--primary-color)' }}
            >
              {isPlayingMusic ? '⏸️ 暫停音樂' : '🎵 播放背景音樂'}
            </button>
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

        {availableSubcategories.length > 0 && (
          <div className="filters sub-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.3rem 0.5rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', width: 'fit-content' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginLeft: '0.5rem', marginRight: '0.5rem' }}>小分類：</span>
            <button 
              className={\`filter-btn \${activeSubcategory === 'all' ? 'active' : ''}\`} 
              style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} 
              onClick={() => { setActiveSubcategory('all'); setCurrentPage(1); }}
            >全部</button>
            {availableSubcategories.map(sub => (
              <button 
                key={sub}
                className={\`filter-btn \${activeSubcategory === sub ? 'active' : ''}\`} 
                style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} 
                onClick={() => { setActiveSubcategory(sub); setCurrentPage(1); }}
              >{sub}</button>
            ))}
          </div>
        )}
        
        <div className="filters status-filters" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', padding: '0.3rem 0.5rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', width: 'fit-content' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', alignSelf: 'center', marginLeft: '0.5rem', marginRight: '0.5rem' }}>狀態：</span>
          <button className={\`filter-btn \${activeStatusFilter === 'all' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('all'); setCurrentPage(1); }}>全部</button>
          <button className={\`filter-btn \${activeStatusFilter === 'flattened' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('flattened'); setCurrentPage(1); }}>🗜️ 拓平</button>
          <button className={\`filter-btn \${activeStatusFilter === 'mounted' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('mounted'); setCurrentPage(1); }}>📜 裱褙</button>
          <button className={\`filter-btn \${activeStatusFilter === 'framed' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('framed'); setCurrentPage(1); }}>🖼️ 裝框</button>
          <button className={\`filter-btn \${activeStatusFilter === 'inscribed' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('inscribed'); setCurrentPage(1); }}>✍️ 題字</button>
          <button className={\`filter-btn \${activeStatusFilter === 'favorite' ? 'active' : ''}\`} style={{ padding: '0.2rem 0.8rem', fontSize: '0.9rem', margin: 0, border: 'none' }} onClick={() => { setActiveStatusFilter('favorite'); setCurrentPage(1); }}>❤️ 最愛</button>
        </div>
      </div>\n\n`;

content = content.substring(0, startIndex) + newFilters + content.substring(endIndex);

fs.writeFileSync('src/Gallery.jsx', content, 'utf8');
console.log('Fixed Gallery.jsx');
