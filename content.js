// Global Variables Declared at the Top
let allProducts = [];
const materialsFound = new Set();
let isScanning = false;

// Cache for fetched product pages
const productCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('load', initFilter);

function initFilter() {
  console.log('Smart Clothing Filter: Initialized');
  
  // Inject CSS styles
  injectStyles();
  
  // Create and inject filter panel
  createFilterPanel();
  
  // Scan products on page
  scanProducts();
}

// Inject CSS styles directly
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
      }
      
      .filter-header {
        background: #333;
        color: white;
        padding: 12px 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 6px 6px 0 0;
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
      
      .cache-btn:active {
        background: #ffcc80;
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
// Wait for page to fully load

function createFilterPanel() {
  const panel = document.createElement('div');
  panel.id = 'smart-filter-panel';
  panel.innerHTML = `
    <div class="filter-header">
      <h3>Smart Filters</h3>
      <button id="filter-toggle">−</button>
    </div>
    <div class="filter-content">
      <div id="scan-status" class="scan-status">Ready to scan</div>
      
      <div class="cache-controls">
        <button id="clear-cache" class="cache-btn">Clear Cache</button>
        <button id="rescan" class="cache-btn">Rescan Products</button>
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
  document.getElementById('rescan').addEventListener('click', rescanProducts);
}

async function clearCache() {
  productCache.clear();
  await chrome.storage.local.remove('productCache');
  updateScanStatus('Cache cleared! Click "Rescan Products" to fetch fresh data.');
  console.log('Cache cleared');
}

async function rescanProducts() {
  // Reset everything
  allProducts = [];
  materialsFound.clear();
  
  // Clear material filters
  const materialContainer = document.getElementById('material-filters');
  if (materialContainer) {
    materialContainer.innerHTML = '';
  }
  
  // Clear results
  const resultsEl = document.getElementById('results-count');
  if (resultsEl) {
    resultsEl.style.display = 'none';
  }
  
  // Rescan
  await scanProducts();
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

// Initialize cache from storage on load
async function initCache() {
  try {
    const result = await chrome.storage.local.get('productCache');
    if (result.productCache) {
      const cached = JSON.parse(result.productCache);
      // Check if cache is still valid
      if (Date.now() - cached.timestamp < CACHE_EXPIRY) {
        cached.data.forEach(item => {
          productCache.set(item.url, item.data);
        });
        console.log(`Loaded ${productCache.size} cached products`);
      } else {
        // Clear expired cache
        chrome.storage.local.remove('productCache');
        console.log('Cache expired, starting fresh');
      }
    }
  } catch (error) {
    console.log('Could not load cache:', error);
  }
}

// Save cache to storage
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
    console.log(`Saved ${productCache.size} products to cache`);
  } catch (error) {
    console.log('Could not save cache:', error);
  }
}

async function scanProducts() {
  if (isScanning) return;
  isScanning = true;
  
  // Initialize cache first
  await initCache();
  
  updateScanStatus('Scanning products...');
  
  // Generic selectors - adjust based on target sites
  const productSelectors = [
    '.product-item',
    '[data-component-type="s-search-result"]', // Amazon
    '.product-card',
    '.grid-item',
    'article.product'
  ];
  
  let products = [];
  for (const selector of productSelectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      products = Array.from(found);
      break;
    }
  }
  
  console.log(`Found ${products.length} products`);
  
  let cacheHits = 0;
  let cacheMisses = 0;
  
  // Process products with deep scanning
  for (let i = 0; i < products.length; i++) {
    const productEl = products[i];
    updateScanStatus(`Scanning product ${i + 1}/${products.length}... (${cacheHits} cached, ${cacheMisses} fetched)`);
    
    const data = await extractProductDataDeep(productEl);
    if (data) {
      allProducts.push({ element: productEl, data });
      data.materials.forEach(m => materialsFound.add(m));
      
      // Track cache statistics
      if (data.fromCache) {
        cacheHits++;
      } else if (data.detailsFetched) {
        cacheMisses++;
      }
    }
    
    // Delay to avoid overwhelming the browser
    if (i % 10 === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Save cache periodically
      await saveCache();
    }
  }
  
  // Final cache save
  await saveCache();
  
  updateScanStatus(`Scan complete! Found ${allProducts.length} products (${cacheHits} from cache, ${cacheMisses} newly fetched)`);
  populateMaterialFilters();
  isScanning = false;
}

function extractProductData(element) {
  // Get all text content from product element
  const text = element.innerText.toLowerCase();
  
  // Extract materials
  const materials = [];
  const materialKeywords = ['cotton', 'polyester', 'wool', 'silk', 'linen', 
                           'leather', 'denim', 'spandex', 'nylon', 'rayon',
                           'cashmere', 'fleece', 'canvas'];
  
  materialKeywords.forEach(material => {
    if (text.includes(material)) {
      materials.push(material);
    }
  });
  
  // Extract waist size (e.g., "32W", "waist 34", "W32")
  const waistMatch = text.match(/(?:waist|w)\s*:?\s*(\d{2,3})|(\d{2,3})\s*w/i);
  const waist = waistMatch ? parseInt(waistMatch[1] || waistMatch[2]) : null;
  
  // Extract inseam (e.g., "32L", "inseam 30", "L32")
  const inseamMatch = text.match(/(?:inseam|length|l)\s*:?\s*(\d{2,3})|(\d{2,3})\s*l/i);
  const inseam = inseamMatch ? parseInt(inseamMatch[1] || inseamMatch[2]) : null;
  
  return {
    materials,
    waist,
    inseam,
    originalText: text
  };
}

// Deep scan: Fetch full product page for detailed info
async function extractProductDataDeep(element) {
  // First get basic data from the listing
  const basicData = extractProductData(element);
  
  // Try to find product link
  const linkSelectors = ['a[href*="/product"]', 'a[href*="/dp/"]', 'a.product-link', 'a'];
  let productLink = null;
  
  for (const selector of linkSelectors) {
    const link = element.querySelector(selector);
    if (link && link.href && link.href.includes('http')) {
      productLink = link.href;
      break;
    }
  }
  
  // If we found a link, check cache first, then fetch if needed
  if (productLink) {
    // Check cache first
    if (productCache.has(productLink)) {
      const cachedData = productCache.get(productLink);
      console.log(`Cache hit for ${productLink}`);
      return {
        materials: [...new Set([...basicData.materials, ...cachedData.materials])],
        waist: cachedData.waist || basicData.waist,
        inseam: cachedData.inseam || basicData.inseam,
        originalText: basicData.originalText,
        detailsFetched: true,
        fromCache: true
      };
    }
    
    // Cache miss - fetch the page
    try {
      const detailedData = await fetchProductDetails(productLink);
      
      // Store in cache
      productCache.set(productLink, detailedData);
      
      // Merge basic and detailed data
      return {
        materials: [...new Set([...basicData.materials, ...detailedData.materials])],
        waist: detailedData.waist || basicData.waist,
        inseam: detailedData.inseam || basicData.inseam,
        originalText: basicData.originalText,
        detailsFetched: true,
        fromCache: false
      };
    } catch (error) {
      console.log(`Could not fetch details for ${productLink}:`, error);
      return { ...basicData, detailsFetched: false, fromCache: false };
    }
  }
  
  return { ...basicData, detailsFetched: false, fromCache: false };
}

async function fetchProductDetails(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Get full page text
    const fullText = doc.body.innerText.toLowerCase();
    
    // Extract materials with more context
    const materials = [];
    const materialKeywords = ['cotton', 'polyester', 'wool', 'silk', 'linen', 
                             'leather', 'denim', 'spandex', 'nylon', 'rayon',
                             'cashmere', 'fleece', 'canvas', 'acrylic', 'viscose'];
    
    materialKeywords.forEach(material => {
      // Look for material composition patterns like "100% cotton" or "cotton blend"
      const pattern = new RegExp(`\\d+%?\\s*${material}|${material}\\s*blend|${material}\\s*\\d+%`, 'i');
      if (pattern.test(fullText) || fullText.includes(material)) {
        materials.push(material);
      }
    });
    
    // Look for detailed size information
    const waistMatch = fullText.match(/waist\s*:?\s*(\d{2,3})|w\s*(\d{2,3})|(\d{2,3})\s*inches?\s*waist/i);
    const waist = waistMatch ? parseInt(waistMatch[1] || waistMatch[2] || waistMatch[3]) : null;
    
    const inseamMatch = fullText.match(/inseam\s*:?\s*(\d{2,3})|length\s*:?\s*(\d{2,3})|(\d{2,3})\s*inches?\s*inseam/i);
    const inseam = inseamMatch ? parseInt(inseamMatch[1] || inseamMatch[2] || inseamMatch[3]) : null;
    
    return { materials, waist, inseam };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return { materials: [], waist: null, inseam: null };
  }
}

function updateScanStatus(message) {
  const statusEl = document.getElementById('scan-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function populateMaterialFilters() {
  const container = document.getElementById('material-filters');
  container.innerHTML = '';
  
  Array.from(materialsFound).sort().forEach(material => {
    const label = document.createElement('label');
    label.innerHTML = `
      <input type="checkbox" value="${material}" class="material-checkbox">
      ${material.charAt(0).toUpperCase() + material.slice(1)}
    `;
    container.appendChild(label);
  });
}

function applyFilters() {
  // Get selected materials
  const selectedMaterials = Array.from(
    document.querySelectorAll('.material-checkbox:checked')
  ).map(cb => cb.value);
  
  // Get size ranges
  const waistMin = parseInt(document.getElementById('waist-min').value) || 0;
  const waistMax = parseInt(document.getElementById('waist-max').value) || 999;
  const inseamMin = parseInt(document.getElementById('inseam-min').value) || 0;
  const inseamMax = parseInt(document.getElementById('inseam-max').value) || 999;
  
  // Get display mode
  const displayMode = document.querySelector('input[name="display-mode"]:checked').value;
  
  let matchCount = 0;
  const matchedProducts = [];
  
  allProducts.forEach(({ element, data }) => {
    let matches = true;
    
    // Filter by materials
    if (selectedMaterials.length > 0) {
      const hasMaterial = selectedMaterials.some(m => data.materials.includes(m));
      if (!hasMaterial) matches = false;
    }
    
    // Filter by waist
    if (data.waist !== null) {
      if (data.waist < waistMin || data.waist > waistMax) {
        matches = false;
      }
    }
    
    // Filter by inseam
    if (data.inseam !== null) {
      if (data.inseam < inseamMin || data.inseam > inseamMax) {
        matches = false;
      }
    }
    
    if (matches) {
      matchCount++;
      matchedProducts.push(element);
    }
    
    // Apply display mode
    element.classList.remove('filter-match', 'filter-no-match');
    
    if (displayMode === 'hide') {
      // Hide non-matching items
      if (matches) {
        element.style.display = '';
        element.style.opacity = '1';
      } else {
        element.style.display = 'none';
      }
    } else if (displayMode === 'highlight') {
      // Highlight matching items
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
      // Move matches to top
      element.style.display = '';
      element.style.opacity = '1';
      element.style.border = '';
      element.style.boxShadow = '';
    }
  });
  
  // If "move to top" mode, reorder DOM elements
  if (displayMode === 'top' && matchedProducts.length > 0) {
    const container = matchedProducts[0].parentElement;
    matchedProducts.forEach(el => {
      el.classList.add('filter-match');
      el.style.border = '2px solid #4CAF50';
      container.insertBefore(el, container.firstChild);
    });
  }
  
  // Update results count
  const resultsEl = document.getElementById('results-count');
  resultsEl.textContent = `Showing ${matchCount} of ${allProducts.length} products`;
  resultsEl.style.display = 'block';
  
  console.log(`Filtered: ${matchCount} matches found out of ${allProducts.length} products`);
}

function resetFilters() {
  // Uncheck all materials
  document.querySelectorAll('.material-checkbox').forEach(cb => cb.checked = false);
  
  // Clear inputs
  document.getElementById('waist-min').value = '';
  document.getElementById('waist-max').value = '';
  document.getElementById('inseam-min').value = '';
  document.getElementById('inseam-max').value = '';
  
  // Reset display mode
  document.querySelector('input[name="display-mode"][value="hide"]').checked = true;
  
  // Show all products and remove styling
  allProducts.forEach(({ element }) => {
    element.style.display = '';
    element.style.opacity = '1';
    element.style.border = '';
    element.style.boxShadow = '';
    element.classList.remove('filter-match', 'filter-no-match');
  });
  
  // Hide results count
  document.getElementById('results-count').style.display = 'none';
}