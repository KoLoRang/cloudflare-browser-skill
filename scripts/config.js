/**
 * Cloudflare Browser Rendering API Configuration
 * For JavaScript client
 */

/**
 * Load configuration file
 * @returns {Promise<Object>} Configuration object
 */
export async function loadConfig() {
  const env = detectEnvironment();
  const fileHandlers = getFileHandlers();
  
  // Get configuration file paths
  let configPath, templatePath;
  
  if (env.isDeno) {
    const currentDir = new URL('.', import.meta.url).pathname;
    configPath = currentDir + '../assets/config.json';
    templatePath = currentDir + '../assets/config_template.json';
  } else if (env.isNode) {
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    configPath = join(__dirname, '..', 'assets', 'config.json');
    templatePath = join(__dirname, '..', 'assets', 'config_template.json');
  } else {
    throw new Error('Browser environment does not support file system operations');
  }
  
  try {
    // Try to read configuration file
    const configContent = await fileHandlers.readFile(configPath);
    const config = JSON.parse(configContent);
    
    // Validate required fields
    if (!config.account_id || !config.api_token) {
      throw new Error('Configuration file missing required fields: account_id or api_token');
    }
    
    // Check if using template default values
    if (config.account_id === 'your_cloudflare_account_id' || 
        config.api_token === 'your_api_token_with_browser_rendering_permission') {
      throw new Error('Please configure account_id and api_token first');
    }
    
    return config;
  } catch (error) {
    if (error.message.includes('No such file') || error.code === 'ENOENT') {
      throw new Error(
        'Configuration file does not exist. Please provide your Cloudflare API credentials:\n' +
        '1. Account ID\n' +
        '2. API Token (requires Browser Rendering permissions)\n\n' +
        'You can run: node scripts/setup-config.js to configure.'
      );
    }
    throw error;
  }
}

/**
 * Create configuration file
 * @param {string} accountId - Cloudflare Account ID
 * @param {string} apiToken - API Token
 * @returns {Promise<Object>}
 */
export async function createConfig(accountId, apiToken) {
  const env = detectEnvironment();
  const fileHandlers = getFileHandlers();
  
  // Get configuration file paths
  let configPath, templatePath;
  
  if (env.isDeno) {
    const currentDir = new URL('.', import.meta.url).pathname;
    configPath = currentDir + '../assets/config.json';
    templatePath = currentDir + '../assets/config_template.json';
  } else if (env.isNode) {
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    configPath = join(__dirname, '..', 'assets', 'config.json');
    templatePath = join(__dirname, '..', 'assets', 'config_template.json');
  } else {
    throw new Error('Browser environment does not support file system operations');
  }
  
  try {
    // Read template
    const templateContent = await fileHandlers.readFile(templatePath);
    const template = JSON.parse(templateContent);
    
    // Update credentials
    template.account_id = accountId;
    template.api_token = apiToken;
    
    // Save configuration file
    await fileHandlers.writeFile(configPath, JSON.stringify(template, null, 2));
    
    console.log('✅ Configuration file created: assets/config.json');
    console.log('⚠️  Do not commit this file to version control');
    
    return template;
  } catch (error) {
    throw new Error(`Failed to create configuration file: ${error.message}`);
  }
}

/**
 * Validate configuration
 * @param {Object} config - Configuration object
 * @returns {boolean} Is valid
 */
export function validateConfig(config) {
  if (!config.account_id || !config.api_token) {
    return false;
  }
  
  if (config.account_id === 'your_cloudflare_account_id' || 
      config.api_token === 'your_api_token_with_browser_rendering_permission') {
    return false;
  }
  
  return true;
}

/**
 * Default configuration
 */
export const defaultConfig = {
  // Viewport configuration
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2
  },

  // Page load options
  gotoOptions: {
    waitUntil: 'networkidle2',
    timeout: 30000
  },

  // Performance optimization configuration
  performanceOptimization: {
    rejectResourceTypes: ['font', 'image'],
    maxWorkers: 3,
    delayBetweenRequests: 1000
  },

  // Screenshot options
  screenshotOptions: {
    fullPage: true,
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    }
  },

  // PDF options
  pdfOptions: {
    format: 'a4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  },

  // Content extraction options
  contentExtraction: {
    rejectResourceTypes: ['image', 'stylesheet', 'font'],
    waitForSelector: null,
    timeout: 30000
  },

  // AI extraction default prompts
  aiExtraction: {
    defaultPrompts: {
      products: 'Extract all product information including name, price, description, and image URLs',
      articles: 'Extract article title, author, publish date, and main content',
      contact: 'Extract contact information including email, phone, address'
    }
  }
};

/**
 * Device configuration presets
 */
export const devicePresets = {
  mobile: {
    name: 'iPhone 12',
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3
    }
  },
  tablet: {
    name: 'iPad',
    viewport: {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2
    }
  },
  desktop: {
    name: 'Desktop',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    }
  },
  'desktop-hd': {
    name: 'Desktop HD',
    viewport: {
      width: 2560,
      height: 1440,
      deviceScaleFactor: 2
    }
  }
};

/**
 * Common error code mapping
 */
export const errorCodes = {
  '10000': {
    message: 'Authentication error',
    description: 'Invalid or expired API Token',
    solution: 'Check if API Token is correct, confirm Token has Browser Rendering permissions'
  },
  '10020': {
    message: 'Invalid request format',
    description: 'Request format error',
    solution: 'Validate JSON format, check required parameters, confirm correct parameter types'
  },
  '10030': {
    message: 'Page load timeout',
    description: 'Page load timeout',
    solution: 'Increase gotoOptions.timeout value, use waitForSelector to wait for specific elements'
  },
  '10031': {
    message: 'Navigation failed',
    description: 'Navigation failed',
    solution: 'Check if URL is correct, verify website SSL certificate'
  },
  '10040': {
    message: 'Element not found',
    description: 'Element not found',
    solution: 'Use waitForSelector to wait for element to load, check if CSS selector is correct'
  },
  '10050': {
    message: 'Rate limit exceeded',
    description: 'Request rate limit',
    solution: 'Reduce request frequency, implement exponential backoff retry'
  },
  '10051': {
    message: 'Browser time quota exceeded',
    description: 'Insufficient browser time quota',
    solution: 'Optimize page loading, block unnecessary resources, upgrade service plan'
  }
};

/**
 * Get error information
 * @param {string} code - Error code
 * @returns {Object} Error information
 */
export function getErrorInfo(code) {
  return errorCodes[code] || {
    message: 'Unknown error',
    description: 'Unknown error',
    solution: 'Please check error details and contact support'
  };
}

/**
 * Create retry delay (exponential backoff)
 * @param {number} attempt - Attempt number
 * @param {number} baseDelay - Base delay (milliseconds)
 * @returns {number} Delay time (milliseconds)
 */
export function getRetryDelay(attempt, baseDelay = 1000) {
  // Exponential backoff + random jitter
  const delay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return delay + jitter;
}

/**
 * Validate URL format
 * @param {string} url - URL
 * @returns {boolean} Is valid
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clean filename
 * @param {string} filename - Filename
 * @returns {string} Cleaned filename
 */
export function sanitizeFilename(filename) {
  return filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
}

/**
 * Format file size
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create progress bar
 * @param {number} current - Current progress
 * @param {number} total - Total progress
 * @param {number} [width=40] - Progress bar width
 * @returns {string} Progress bar string
 */
export function createProgressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}% (${current}/${total})`;
}

/**
 * Environment detection
 * @returns {Object} Environment information
 */
export function detectEnvironment() {
  return {
    isDeno: typeof Deno !== 'undefined',
    isNode: typeof process !== 'undefined' && process.versions && process.versions.node,
    isBrowser: typeof window !== 'undefined',
    isWebWorker: typeof WorkerGlobalScope !== 'undefined',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
  };
}

/**
 * Get environment-specific file handling functions
 * @returns {Object} File handling functions
 */
export function getFileHandlers() {
  const env = detectEnvironment();

  if (env.isDeno) {
    return {
      readFile: Deno.readTextFile,
      writeFile: Deno.writeTextFile,
      readBinary: Deno.readFile,
      writeBinary: Deno.writeFile,
      mkdir: (path) => Deno.mkdir(path, { recursive: true })
    };
  } else if (env.isNode) {
    return {
      readFile: async (path) => {
        const fs = await import('fs/promises');
        return fs.readFile(path, 'utf-8');
      },
      writeFile: async (path, data) => {
        const fs = await import('fs/promises');
        return fs.writeFile(path, data);
      },
      readBinary: async (path) => {
        const fs = await import('fs/promises');
        return fs.readFile(path);
      },
      writeBinary: async (path, data) => {
        const fs = await import('fs/promises');
        return fs.writeFile(path, data);
      },
      mkdir: async (path) => {
        const fs = await import('fs/promises');
        return fs.mkdir(path, { recursive: true });
      }
    };
  } else {
    // Browser environment
    return {
      readFile: () => Promise.reject(new Error('File reading not available in browser')),
      writeFile: () => Promise.reject(new Error('File writing not available in browser')),
      readBinary: () => Promise.reject(new Error('File reading not available in browser')),
      writeBinary: () => Promise.reject(new Error('File writing not available in browser')),
      mkdir: () => Promise.reject(new Error('Directory creation not available in browser'))
    };
  }
}

/**
 * Create URL-safe base64 string
 * @param {string} str - Input string
 * @returns {string} URL-safe base64 string
 */
export function base64UrlEncode(str) {
  if (typeof btoa !== 'undefined') {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64url');
  } else {
    throw new Error('Base64 encoding not available in current environment');
  }
}

/**
 * Decode URL-safe base64 string
 * @param {string} str - Base64 string
 * @returns {string} Decoded string
 */
export function base64UrlDecode(str) {
  if (typeof atob !== 'undefined') {
    str += '=='.substring(0, (4 - str.length % 4) % 4);
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf-8');
  } else {
    throw new Error('Base64 decoding not available in current environment');
  }
}
