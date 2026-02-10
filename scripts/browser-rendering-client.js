/**
 * Cloudflare Browser Rendering API JavaScript Client
 * Supports Deno, Node.js, and modern browsers
 */

class CloudflareBrowserRenderingClient {
  /**
   * Initialize client
   * @param {Object} config - Configuration object
   * @param {string} config.accountId - Cloudflare account ID
   * @param {string} config.apiToken - API token (requires Browser Rendering permissions)
   * @param {string} [config.baseUrl] - Custom base URL
   */
  constructor(config) {
    this.accountId = config.accountId;
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl || `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/browser-rendering`;

    // Detect runtime environment
    this.isDeno = typeof Deno !== 'undefined';
    this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * Send API request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async _makeRequest(endpoint, data) {
    const url = `${this.baseUrl}/${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data)
      });

      const browserMsUsed = resp.headers.get('x-browser-ms-used');

      // PDF and screenshot endpoints return binary data
      if (endpoint === 'pdf' || endpoint === 'screenshot') {
        if (this.isDeno || this.isNode) {
          const arrayBuffer = await resp.arrayBuffer();
          const data = this.isNode ? Buffer.from(arrayBuffer) : new Uint8Array(arrayBuffer);
          return {
            data,
            browserMsUsed: browserMsUsed ? parseInt(browserMsUsed) : 0
          };
        } else {
          // Browser environment
          return {
            data: await resp.blob(),
            browserMsUsed: browserMsUsed ? parseInt(browserMsUsed) : 0
          };
        }
      }

      // Other endpoints return JSON
      const response = await resp.json();

      if (!response.success) {
        const errorMsg = response.errors?.map(e => `${e.code}: ${e.message}`).join(', ') || 'Unknown error';
        throw new Error(`API error: ${errorMsg}`);
      }

      return {
        data: response.result,
        browserMsUsed: browserMsUsed ? parseInt(browserMsUsed) : 0
      };
    } catch (error) {
      if (error.message.startsWith('API error:')) {
        throw error;
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Take web page screenshot
   * @param {string} url - Target web page URL
   * @param {Object} [options] - Options
   * @param {Object} [options.viewport] - Viewport configuration
   * @param {boolean} [options.fullPage=true] - Whether to capture full page
   * @param {string} [options.selector] - CSS selector to capture specific element
   * @param {Array} [options.cookies] - Cookie list
   * @param {string} [options.waitForSelector] - Wait for specific element to appear
   * @param {number} [options.timeout=30000] - Timeout (milliseconds)
   * @param {Array} [options.addScriptTag] - Inject custom JavaScript
   * @param {Array} [options.addStyleTag] - Inject custom styles
   * @returns {Promise<Uint8Array|Buffer|Blob>} Screenshot data
   */
  async screenshot(url, options = {}) {
    const data = {
      url,
      screenshotOptions: {
        fullPage: options.fullPage !== false
      },
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.viewport) {
      data.viewport = options.viewport;
    }

    if (options.selector) {
      data.selector = options.selector;
    }

    if (options.cookies) {
      data.cookies = options.cookies;
    }

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    if (options.addScriptTag) {
      data.addScriptTag = options.addScriptTag;
    }

    if (options.addStyleTag) {
      data.addStyleTag = options.addStyleTag;
    }

    const result = await this._makeRequest('screenshot', data);

    // Return raw binary data directly (API returns PNG data, not base64)
    return result.data;
  }

  /**
   * Decode base64 image data
   * @private
   * @param {string} base64Data - Base64 encoded image data
   * @returns {Uint8Array|Buffer|Blob} Decoded image data
   */
  _decodeBase64Image(base64Data) {
    const cleanData = base64Data.replace(/^data:image\/\w+;base64,/, '');

    if (this.isDeno) {
      return Uint8Array.from(atob(cleanData), c => c.charCodeAt(0));
    } else if (this.isNode) {
      return Buffer.from(cleanData, 'base64');
    } else {
      // Browser environment
      const byteCharacters = atob(cleanData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      return new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
    }
  }

  /**
   * Generate PDF
   * @param {string} url - Target web page URL
   * @param {Object} [options] - PDF options
   * @param {string} [options.format='a4'] - Page format
   * @param {boolean} [options.landscape=false] - Landscape orientation
   * @param {boolean} [options.printBackground=true] - Print background
   * @param {boolean} [options.displayHeaderFooter=false] - Display header and footer
   * @param {string} [options.headerTemplate] - Header HTML template
   * @param {string} [options.footerTemplate] - Footer HTML template
   * @param {Object} [options.margin] - Page margins
   * @param {Object} [options.viewport] - Viewport configuration
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<Uint8Array|Buffer|Blob>} PDF data
   */
  async pdf(url, options = {}) {
    const data = {
      url,
      pdfOptions: {
        format: options.format || 'a4',
        landscape: options.landscape || false,
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        timeout: options.timeout || 30000
      }
    };

    if (options.displayHeaderFooter) {
      if (options.headerTemplate) {
        data.pdfOptions.headerTemplate = options.headerTemplate;
      }
      if (options.footerTemplate) {
        data.pdfOptions.footerTemplate = options.footerTemplate;
      }
    }

    if (options.margin) {
      data.pdfOptions.margin = options.margin;
    }

    if (options.viewport) {
      data.viewport = options.viewport;
    }

    return (await this._makeRequest('pdf', data)).data;
  }

  /**
   * Get rendered HTML content
   * @param {string} url - Target web page URL
   * @param {Object} [options] - Options
   * @param {Array} [options.rejectResourceTypes] - Resource types to block
   * @param {Array} [options.allowResourceTypes] - Resource types to allow
   * @param {Array} [options.cookies] - Cookie list
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<string>} HTML content
   */
  async content(url, options = {}) {
    const data = {
      url,
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.rejectResourceTypes) {
      data.rejectResourceTypes = options.rejectResourceTypes;
    }

    if (options.allowResourceTypes) {
      data.allowResourceTypes = options.allowResourceTypes;
    }

    if (options.cookies) {
      data.cookies = options.cookies;
    }

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    const result = await this._makeRequest('content', data);
    return result.data;
  }

  /**
   * Convert web page to Markdown
   * @param {string} url - Target web page URL
   * @param {Object} [options] - Options
   * @param {Array} [options.rejectRequestPattern] - Regex patterns to block requests
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<string>} Markdown content
   */
  async markdown(url, options = {}) {
    const data = {
      url,
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.rejectRequestPattern) {
      data.rejectRequestPattern = options.rejectRequestPattern;
    }

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    const result = await this._makeRequest('markdown', data);
    return result.data;
  }

  /**
   * Extract structured data using AI
   * @param {string} url - Target web page URL
   * @param {Object} options - Options (must provide either prompt or responseFormat)
   * @param {string} [options.prompt] - Natural language prompt
   * @param {Object} [options.responseFormat] - JSON Schema to define output structure
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<Object>} Extracted structured data
   */
  async jsonExtract(url, options = {}) {
    if (!options.prompt && !options.responseFormat) {
      throw new Error('Must provide either prompt or responseFormat parameter');
    }

    const data = {
      url,
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.prompt) {
      data.prompt = options.prompt;
    }

    if (options.responseFormat) {
      data.response_format = options.responseFormat;
    }

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    const result = await this._makeRequest('json', data);
    return result.data;
  }

  /**
   * Scrape specific elements
   * @param {string} url - Target web page URL
   * @param {Array} elements - Array of CSS selectors
   * @param {Object} [options] - Options
   * @param {Array} [options.cookies] - Cookie list
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<Object>} Scraped element information
   */
  async scrape(url, elements, options = {}) {
    const data = {
      url,
      elements,
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.cookies) {
      data.cookies = options.cookies;
    }

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    const result = await this._makeRequest('scrape', data);
    return result.data;
  }

  /**
   * Get page snapshot (screenshot + HTML)
   * @param {string} url - Target web page URL
   * @param {Object} [options] - Options
   * @param {boolean} [options.fullPage=true] - Full page screenshot
   * @param {Object} [options.viewport] - Viewport configuration
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<Object>} Object containing screenshot and HTML
   */
  async snapshot(url, options = {}) {
    const data = {
      url,
      screenshotOptions: {
        fullPage: options.fullPage !== false
      },
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.viewport) {
      data.viewport = options.viewport;
    }

    const result = await this._makeRequest('snapshot', data);

    return {
      screenshot: this._decodeBase64Image(result.data.screenshot),
      html: result.data.content,
      browserMsUsed: result.browserMsUsed
    };
  }

  /**
   * Extract all links from page
   * @param {string} url - Target web page URL
   * @param {Object} [options] - Options
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.timeout=30000] - Timeout
   * @returns {Promise<Array>} List of links
   */
  async links(url, options = {}) {
    const data = {
      url,
      gotoOptions: {
        timeout: options.timeout || 30000
      }
    };

    if (options.waitForSelector) {
      data.waitForSelector = options.waitForSelector;
    }

    const result = await this._makeRequest('links', data);
    return result.data;
  }
}

// Export client class
export { CloudflareBrowserRenderingClient };

// Usage example
if (import.meta.main) {
  // Load credentials from config file
  const { loadConfig } = await import('./config.js');
  
  try {
    const config = await loadConfig();
    
    const client = new CloudflareBrowserRenderingClient({
      accountId: config.account_id,
      apiToken: config.api_token
    });

    // Example 1: Take web page screenshot
    console.log('Taking screenshot...');
    const screenshot = await client.screenshot('https://example.com', {
      viewport: { width: 1920, height: 1080 },
      fullPage: true
    });

    const fileHandlers = (await import('./config.js')).getFileHandlers();
    await fileHandlers.writeBinary('screenshot.png', screenshot);
    console.log('✅ Screenshot saved as screenshot.png');

    // Example 2: Generate PDF
    console.log('Generating PDF...');
    const pdf = await client.pdf('https://example.com', {
      format: 'a4',
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: '<div style="font-size: 10px; text-align: center;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });

    await fileHandlers.writeBinary('output.pdf', pdf);
    console.log('✅ PDF saved as output.pdf');

    // Example 3: Extract structured data
    console.log('Extracting data...');
    const data = await client.jsonExtract('https://example.com', {
      prompt: 'Extract all product names and prices'
    });

    console.log('Extracted data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Configuration file does not exist')) {
      console.log('\nPlease configure your Cloudflare API credentials first:');
      console.log('1. Get Account ID and API Token');
      console.log('2. Run configuration command or manually edit assets/config.json');
    }
  }
}