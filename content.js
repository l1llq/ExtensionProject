// ============================================
// GLOBAL VARIABLES
// ============================================
let allProducts = [];
const materialsFound = new Set();
let isScanning = false;
let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

// Cache for fetched product pages
const productCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Material keywords
const materialKeywords = [
  'cotton', 'polyester', 'wool', 'silk', 'linen', 
  'leather', 'denim', 'spandex', 'nylon', 'rayon',
  'cashmere', 'fleece', 'canvas', 'acrylic', 'viscose',
  'elastane', 'modal', 'bamboo', 'tencel'
];

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('load', initFilter);

function initFilter() {
  console.log('Smart Clothing Filter: Initialized');
  
  injectStyles();
  createFilterPanel();
  initializeMaterialCheckboxes();
  scanCurrentPage();
}

// ============================================
// CSS INJECTION
// ============================================
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #smart-filter-panel {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 300px;
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: Arial, sans-serif;
      cursor: move;
    }
    
    .filter-header {
      background: #333;
      color: white;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 6px 6px 0 0;
      cursor: move;
    }
    
    .filter-header h3 {
      margin: 0;
      font-size: 16px;
    }
    
    #filter-toggle {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    }
    
    .filter-content {
      padding: 15px;
      max-height: 600px;
      overflow-y: auto;
      display: none;
    }
    
    .scan-status {
      background: #e3f2fd;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 15px;
      color: #1976d2;
      text-align: center;
      line-height: 1.4;
    }
    
    .progress-bar-container {
      width: 100%;
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 15px;
      display: none;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50, #45a049);
      width: 0%;
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: bold;
    }
    
    .scan-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .scan-btn {
      flex: 1;
      padding: 8px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .scan-btn:hover {
      background: #1976D2;
    }
    
    .scan-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .cache-controls {
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .cache-btn {
      flex: 1;
      padding: 6px 8px;
      background: #fff3e0;
      border: 1px solid #ff9800;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .cache-btn:hover {
      background: #ffe0b2;
    }
    
    .filter-section {
      margin-bottom: 20px;
    }
    
    .filter-section h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    #material-filters {
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 8px;
    }
    
    #material-filters label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      cursor: pointer;
    }
    
    #material-filters input[type="checkbox"] {
      margin-right: 8px;
      cursor: pointer;
    }
    
    .filter-section input[type="number"] {
      width: calc(50% - 8px);
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      margin-right: 8px;
    }
    
    .filter-section input[type="number"]:last-child {
      margin-right: 0;
    }
    
    .filter-display-options {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    
    .filter-display-options label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    
    .filter-display-options input[type="radio"] {
      margin-right: 8px;
      cursor: pointer;
    }
    
    #apply-filters, #reset-filters {
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    #apply-filters {
      background: #4CAF50;
      color: white;
    }
    
    #apply-filters:hover {
      background: #45a049;
    }
    
    #reset-filters {
      background: #f0f0f0;
      color: #333;
    }
    
    #reset-filters:hover {
      background: #e0e0e0;
    }
    
    .results-count {
      display: none;
      background: #e8f5e9;
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      color: #2e7d32;
      margin-top: 8px;
    }
    
    .filter-match {
      transition: all 0.3s ease;
    }
    
    .filter-no-match {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// UI CREATION
// ============================================
function createFilterPanel() {
  const panel = document.createElement('div');
  panel.id = 'smart-filter-panel';
  panel.innerHTML = `
    <div class="filter-header" id="filter-header">
      <h3>Smart Filters</h3>
      <button id="filter-toggle">+</button>
    </div>
    <div class="filter-content">
      <div id="scan-status" class="scan-status">Ready to scan</div>
      
      <div class="progress-bar-container" id="progress-container">
        <div class="progress-bar" id="progress-bar">0%</div>
      </div>
      
      <div class="scan-controls">
        <button id="scan-current" class="scan-btn">Scan Current Page</button>
        <button id="scan-all" class="scan-btn">Scan All Results</button>
      </div>
      
      <div class="cache-controls">
        <button id="clear-cache" class="cache-btn">Clear Cache</button>
      </div>
      
      <div class="filter-section">
        <h4>Materials</h4>
        <div id="material-filters"></div>
      </div>
      <div class="filter-section">
        <h4>Waist Size</h4>
        <input type="number" id="waist-min" placeholder="Min">
        <input type="number" id="waist-max" placeholder="Max">
      </div>
      <div class="filter-section">
        <h4>Inseam Length</h4>
        <input type="number" id="inseam-min" placeholder="Min">
        <input type="number" id="inseam-max" placeholder="Max">
      </div>
      
      <div class="filter-display-options">
        <label>
          <input type="radio" name="display-mode" value="hide" checked>
          Hide non-matching items
        </label>
        <label>
          <input type="radio" name="display-mode" value="highlight">
          Highlight matching items
        </label>
        <label>
          <input type="radio" name="display-mode" value="top">
          Move matches to top
        </label>
      </div>
      
      <button id="apply-filters">Apply Filters</button>
      <button id="reset-filters">Reset</button>
      <div id="results-count" class="results-count"></div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Event listeners
  document.getElementById('filter-toggle').addEventListener('click', togglePanel);
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('clear-cache').addEventListener('click', clearCache);
  document.getElementById('scan-current').addEventListener('click', () => scanCurrentPage());
  document.getElementById('scan-all').addEventListener('click', () => scanAllPages());
  
  // Make draggable
  const header = document.getElementById('filter-header');
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
}

// ============================================
// DRAGGING FUNCTIONALITY
// ============================================
function dragStart(e) {
  const panel = document.getElementById('smart-filter-panel');
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;
  
  if (e.target === document.getElementById('filter-header') || 
      e.target.closest('#filter-header')) {
    isDragging = true;
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    
    const panel = document.getElementById('smart-filter-panel');
    panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }
}

function dragEnd() {
  isDragging = false;
}

function togglePanel() {
  const content = document.querySelector('.filter-content');
  const btn = document.getElementById('filter-toggle');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    btn.textContent = '−';
  } else {
    content.style.display = 'none';
    btn.textContent = '+';
  }
}

// ============================================
// INITIALIZE MATERIAL CHECKBOXES
// ============================================
function initializeMaterialCheckboxes() {
  const container = document.getElementById('material-filters');
  container.innerHTML = '';
  
  materialKeywords.sort().forEach(material => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" value="${material}" class="material-checkbox">
      ${material.charAt(0).toUpperCase() + material.slice(1)}
    `;
    container.appendChild(label);
  });
}

// ============================================
// CACHE MANAGEMENT
// ============================================
async function initCache() {
  try {
    const result = await chrome.storage.local.get('productCache');
    if (result.productCache) {
      const cached = JSON.parse(result.productCache);
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        cached.data.forEach(item => {
          productCache.set(item.url, item.data);
        });
        console.log(`Loaded ${productCache.size} cached products`);
      } else {
        chrome.storage.local.remove('productCache');
        console.log('Cache expired, starting fresh');
      }
    }
  } catch (error) {
    console.log('Could not load cache:', error);
  }
}

async function saveCache() {
  try {
    const cacheData = {
      timestamp: Date.now(),
      data: Array.from(productCache.entries()).map(([url, data]) => ({
        url,
        data
      }))
    };
    await chrome.storage.local.set({ productCache: JSON.stringify(cacheData) });
  } catch (error) {
    console.log('Could not save cache:', error);
  }
}

async function clearCache() {
  productCache.clear();
  await chrome.storage.local.remove('productCache');
  updateScanStatus('Cache cleared!');
  console.log('Cache cleared');
}

// ============================================
// PRODUCT SCANNING
// ============================================
async function scanCurrentPage() {
  if (isScanning) return;
  
  allProducts = [];
  materialsFound.clear();
  
  await initCache();
  await scanProducts(false);
}

async function scanAllPages() {
  if (isScanning) return;
  
  if (!confirm('This will scan ALL pages of results. This may take several minutes. Continue?')) {
    return;
  }
  
  allProducts = [];
  materialsFound.clear();
  
  await initCache();
  await scanProducts(true);
}

async function scanProducts(scanAll) {
  isScanning = true;
  
  const scanCurrentBtn = document.getElementById('scan-current');
  const scanAllBtn = document.getElementById('scan-all');
  scanCurrentBtn.disabled = true;
  scanAllBtn.disabled = true;
  
  updateScanStatus('Finding products...');
  showProgressBar(0);
  
  const productSelectors = [
    '[data-component-type="s-search-result"]', // Amazon
    '.s-result-item[data-asin]',
    '.product-item',
    '.product-card',
    '.grid-item',
    'article.product'
  ];
  
  let products = [];
  for (const selector of productSelectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      products = Array.from(found).filter(el => {
        // Filter out ads and sponsored items
        const isAd = el.querySelector('[data-component-type="sp-sponsored-result"]');
        return !isAd;
      });
      break;
    }
  }
  
  console.log(`Found ${products.length} products on current page`);
  
  let totalProducts = products.length;
  let processedCount = 0;
  
  // If scanning all, try to find pagination and estimate total
  if (scanAll) {
    const paginationInfo = document.querySelector('.s-pagination-item.s-pagination-selected');
    if (paginationInfo) {
      const totalPagesEl = document.querySelector('.s-pagination-item:not(.s-pagination-disabled):last-of-type');
      if (totalPagesEl) {
        const estimatedPages = parseInt(totalPagesEl.textContent) || 1;
        totalProducts = products.length * estimatedPages;
        updateScanStatus(`Scanning all results (~${estimatedPages} pages, ~${totalProducts} products)...`);
      }
    }
  }
  
  for (let i = 0; i < products.length; i++) {
    const productEl = products[i];
    
    const progress = Math.round(((processedCount + 1) / totalProducts) * 100);
    showProgressBar(progress);
    updateScanStatus(`Scanning product ${processedCount + 1}/${totalProducts}...`);
    
    const data = await extractProductDataDeep(productEl);
    if (data) {
      allProducts.push({ element: productEl, data });
      data.materials.forEach(m => {
        if (materialKeywords.includes(m)) {
          materialsFound.add(m);
        }
      });
    }
    
    processedCount++;
    
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      await saveCache();
    }
  }
  
  // If scanning all, try to go to next page
  if (scanAll) {
    const nextButton = document.querySelector('.s-pagination-next:not(.s-pagination-disabled)');
    if (nextButton) {
      await saveCache();
      updateScanStatus('Moving to next page...');
      nextButton.click();
      
      // Wait for page load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Continue scanning
      isScanning = false;
      await scanProducts(true);
      return;
    }
  }
  
  await saveCache();
  
  hideProgressBar();
  updateScanStatus(`Scan complete! Found ${allProducts.length} products with ${materialsFound.size} material types`);
  
  scanCurrentBtn.disabled = false;
  scanAllBtn.disabled = false;
  isScanning = false;
  
  // Auto-apply if filters are set
  if (document.querySelector('.material-checkbox:checked') || 
      document.getElementById('waist-min').value ||
      document.getElementById('waist-max').value) {
    applyFilters();
  }
}

function extractProductData(element) {
  const text = element.innerText.toLowerCase();
  
  const materials = [];
  
  materialKeywords.forEach(material => {
    // Use word boundaries to match whole words only
    const regex = new RegExp(`\\b${material}\\b`, 'i');
    if (regex.test(text)) {
      materials.push(material);
    }
  });
  
  const waistMatch = text.match(/(?:waist|w)\s*:?\s*(\d{2,3})|(\d{2,3})\s*w\b/i);
  const waist = waistMatch ? parseInt(waistMatch[1] || waistMatch[2]) : null;
  
  const inseamMatch = text.match(/(?:inseam|length|l)\s*:?\s*(\d{2,3})|(\d{2,3})\s*l\b/i);
  const inseam = inseamMatch ? parseInt(inseamMatch[1] || inseamMatch[2]) : null;
  
  return {
    materials,
    waist,
    inseam,
    originalText: text
  };
}

async function extractProductDataDeep(element) {
  const basicData = extractProductData(element);
  
  const linkSelectors = ['a[href*="/dp/"]', 'a[href*="/product"]', 'a.product-link', 'a'];
  let productLink = null;
  
  for (const selector of linkSelectors) {
    const link = element.querySelector(selector);
    if (link && link.href && link.href.includes('http')) {
      productLink = link.href;
      break;
    }
  }
  
  if (productLink) {
    if (productCache.has(productLink)) {
      const cachedData = productCache.get(productLink);
      return {
        materials: [...new Set([...basicData.materials, ...cachedData.materials])],
        waist: cachedData.waist || basicData.waist,
        inseam: cachedData.inseam || basicData.inseam,
        originalText: basicData.originalText,
        detailsFetched: true,
        fromCache: true
      };
    }
    
    try {
      const detailedData = await fetchProductDetails(productLink);
      productCache.set(productLink, detailedData);
      
      return {
        materials: [...new Set([...basicData.materials, ...detailedData.materials])],
        waist: detailedData.waist || basicData.waist,
        inseam: detailedData.inseam || basicData.inseam,
        originalText: basicData.originalText,
        detailsFetched: true,
        fromCache: false
      };
    } catch (error) {
      return { ...basicData, detailsFetched: false, fromCache: false };
    }
  }
  
  return { ...basicData, detailsFetched: false, fromCache: false };
}

async function fetchProductDetails(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const fullText = doc.body.innerText.toLowerCase();
    
    const materials = [];
    
    materialKeywords.forEach(material => {
      const regex = new RegExp(`\\b${material}\\b|\\d+%?\\s*${material}|${material}\\s*blend`, 'i');
      if (regex.test(fullText)) {
        materials.push(material);
      }
    });
    
    const waistMatch = fullText.match(/waist\s*:?\s*(\d{2,3})|w\s*(\d{2,3})|(\d{2,3})\s*inches?\s*waist/i);
    const waist = waistMatch ? parseInt(waistMatch[1] || waistMatch[2] || waistMatch[3]) : null;
    
    const inseamMatch = fullText.match(/inseam\s*:?\s*(\d{2,3})|length\s*:?\s*(\d{2,3})|(\d{2,3})\s*inches?\s*inseam/i);
    const inseam = inseamMatch ? parseInt(inseamMatch[1] || inseamMatch[2] || inseamMatch[3]) : null;
    
    return { materials, waist, inseam };
  } catch (error) {
    return { materials: [], waist: null, inseam: null };
  }
}

function updateScanStatus(message) {
  const statusEl = document.getElementById('scan-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function showProgressBar(percent) {
  const container = document.getElementById('progress-container');
  const bar = document.getElementById('progress-bar');
  container.style.display = 'block';
  bar.style.width = percent + '%';
  bar.textContent = percent + '%';
}

function hideProgressBar() {
  const container = document.getElementById('progress-container');
  container.style.display = 'none';
}

// ============================================
// FILTERING
// ============================================
function applyFilters() {
  const selectedMaterials = Array.from(
    document.querySelectorAll('.material-checkbox:checked')
  ).map(cb => cb.value);
  
  const waistMin = parseInt(document.getElementById('waist-min').value) || 0;
  const waistMax = parseInt(document.getElementById('waist-max').value) || 999;
  const inseamMin = parseInt(document.getElementById('inseam-min').value) || 0;
  const inseamMax = parseInt(document.getElementById('inseam-max').value) || 999;
  
  const displayMode = document.querySelector('input[name="display-mode"]:checked').value;
  
  let matchCount = 0;
  const matchedProducts = [];
  
  allProducts.forEach(({ element, data }) => {
    let matches = true;
    
    if (selectedMaterials.length > 0) {
      const hasMaterial = selectedMaterials.some(m => data.materials.includes(m));
      if (!hasMaterial) matches = false;
    }
    
    if (data.waist !== null) {
      if (data.waist < waistMin || data.waist > waistMax) {
        matches = false;
      }
    }
    
    if (data.inseam !== null) {
      if (data.inseam < inseamMin || data.inseam > inseamMax) {
        matches = false;
      }
    }
    
    if (matches) {
      matchCount++;
      matchedProducts.push(element);
    }
    
    element.classList.remove('filter-match', 'filter-no-match');
    
    if (displayMode === 'hide') {
      if (matches) {
        element.style.display = '';
        element.style.opacity = '1';
      } else {
        element.style.display = 'none';
      }
    } else if (displayMode === 'highlight') {
      element.style.display = '';
      if (matches) {
        element.classList.add('filter-match');
        element.style.border = '3px solid #4CAF50';
        element.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
      } else {
        element.classList.add('filter-no-match');
        element.style.opacity = '0.3';
        element.style.border = '';
        element.style.boxShadow = '';
      }
    } else if (displayMode === 'top') {
      element.style.display = '';
      element.style.opacity = '1';
      element.style.border = '';
      element.style.boxShadow = '';
    }
  });
  
  if (displayMode === 'top' && matchedProducts.length > 0) {
    const container = matchedProducts[0].parentElement;
    matchedProducts.forEach(el => {
      el.classList.add('filter-match');
      el.style.border = '2px solid #4CAF50';
      container.insertBefore(el, container.firstChild);
    });
  }
  
  const resultsEl = document.getElementById('results-count');
  resultsEl.textContent = `Showing ${matchCount} of ${allProducts.length} products`;
  resultsEl.style.display = 'block';
  
  console.log(`Filtered: ${matchCount} matches found out of ${allProducts.length} products`);
}

function resetFilters() {
  document.querySelectorAll('.material-checkbox').forEach(cb => cb.checked = false);
  
  document.getElementById('waist-min').value = '';
  document.getElementById('waist-max').value = '';
  document.getElementById('inseam-min').value = '';
  document.getElementById('inseam-max').value = '';
  
  document.querySelector('input[name="display-mode"][value="hide"]').checked = true;
  
  allProducts.forEach(({ element }) => {
    element.style.display = '';
    element.style.opacity = '1';
    element.style.border = '';
    element.style.boxShadow = '';
    element.classList.remove('filter-match', 'filter-no-match');
  });
  
  document.getElementById('results-count').style.display = 'none';
}