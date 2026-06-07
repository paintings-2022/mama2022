const fs = require('fs');

const path = 'src/Gallery.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. State changes
content = content.replace(
  "const [visibleCount, setVisibleCount] = useState(20);",
  "const [currentPage, setCurrentPage] = useState(1);\n  const [itemsPerPage, setItemsPerPage] = useState(20);"
);

// 2. Reset currentPage on filter changes
content = content.replace(
  "setActiveSubcategory('all');",
  "setActiveSubcategory('all');\n    setCurrentPage(1);"
);

content = content.replace(
  /setVisibleCount\(20\);/g,
  "setCurrentPage(1);"
);

content = content.replace(
  /const filteredGallery =/g,
  "const totalPages = Math.ceil((data?.gallery?.filter(item => {\n" +
  "    let passCategory = activeCategory === 'all' || item.category === activeCategory;\n" +
  "    let passSubcategory = activeSubcategory === 'all' || item.subcategory === activeSubcategory;\n" +
  "    let passStatus = true;\n" +
  "    if (activeStatusFilter === 'flattened') passStatus = !!item.isFlattened;\n" +
  "    if (activeStatusFilter === 'mounted') passStatus = !!item.isMounted;\n" +
  "    if (activeStatusFilter === 'framed') passStatus = !!item.isFramed;\n" +
  "    if (activeStatusFilter === 'inscribed') passStatus = !!item.isInscribed;\n" +
  "    if (activeStatusFilter === 'favorite') passStatus = !!item.isFavorite;\n" +
  "    return passCategory && passSubcategory && passStatus;\n" +
  "  }) || []).length / itemsPerPage) || 1;\n\n  const paginationControls = (\n" +
  "    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>\n" +
  "      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>\n" +
  "        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>每頁顯示：</span>\n" +
  "        <select \n" +
  "          className=\"form-control\" \n" +
  "          style={{ width: 'auto', padding: '0.2rem 0.5rem' }}\n" +
  "          value={itemsPerPage}\n" +
  "          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}\n" +
  "        >\n" +
  "          <option value={20}>20</option>\n" +
  "          <option value={50}>50</option>\n" +
  "          <option value={100}>100</option>\n" +
  "        </select>\n" +
  "      </div>\n" +
  "      <button \n" +
  "        className=\"btn btn-secondary\" \n" +
  "        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}\n" +
  "        disabled={currentPage === 1}\n" +
  "      >\n" +
  "        上一頁\n" +
  "      </button>\n" +
  "      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>\n" +
  "        <span>第</span>\n" +
  "        <select \n" +
  "          className=\"form-control\" \n" +
  "          value={currentPage} \n" +
  "          onChange={(e) => setCurrentPage(Number(e.target.value))}\n" +
  "          style={{ width: 'auto', padding: '0.2rem 0.5rem', textAlign: 'center' }}\n" +
  "        >\n" +
  "          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (\n" +
  "            <option key={page} value={page}>{page}</option>\n" +
  "          ))}\n" +
  "        </select>\n" +
  "        <span>/ {totalPages} 頁</span>\n" +
  "      </div>\n" +
  "      <button \n" +
  "        className=\"btn btn-secondary\" \n" +
  "        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}\n" +
  "        disabled={currentPage === totalPages}\n" +
  "      >\n" +
  "        下一頁\n" +
  "      </button>\n" +
  "    </div>\n" +
  "  );\n\n  const filteredGallery ="
);

// We need a better way to insert paginationControls.
// Let's insert {paginationControls} above the count text
content = content.replace(
  "<div style={{ padding: '0.5rem 0', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>",
  "{totalPages > 1 && paginationControls}\n      <div style={{ padding: '0.5rem 0', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>"
);

// 4. Update the slicing logic
content = content.replace(
  "filteredGallery.slice(0, visibleCount).map(item =>",
  "filteredGallery.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item =>"
);

content = content.replace(
  "sortedItems.slice(0, visibleCount).map((item)",
  "sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item)"
);

// 5. Remove 'Load More' block and insert the bottom pagination controls
const loadMoreRegex = /\{\s*filteredGallery\.length > visibleCount && \([\s\S]*?載入更多 \(Load More\)[\s\S]*?<\/button>\s*<\/div>\s*\)\s*\}/;
content = content.replace(
  loadMoreRegex,
  "{totalPages > 1 && paginationControls}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Gallery.jsx patched');
