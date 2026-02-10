/**
 * Batch processing tool for Cloudflare Browser Rendering API
 * Supports Deno, Node.js, and modern browsers
 */

import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

/**
 * Batch processor
 */
class BatchProcessor {
  /**
   * Initialize batch processor
   * @param {Object} config - Configuration object
   * @param {string} config.accountId - Cloudflare account ID
   * @param {string} config.apiToken - API token
   * @param {number} [config.maxWorkers=3] - Maximum concurrency
   */
  constructor(config) {
    this.client = new CloudflareBrowserRenderingClient({
      accountId: config.accountId,
      apiToken: config.apiToken
    });
    this.maxWorkers = config.maxWorkers || 3;
    this.results = [];

    // Detect runtime environment
    this.isDeno = typeof Deno !== 'undefined';
    this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
    this.isBrowser = typeof window !== 'undefined';
  }

  /**
   * Delay function
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>}
   */
  async _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async _ensureDir(dirPath) {
    if (this.isDeno) {
      try {
        await Deno.mkdir(dirPath, { recursive: true });
      } catch (e) {
        if (!(e instanceof Deno.errors.AlreadyExists)) {
          throw e;
        }
      }
    } else if (this.isNode) {
      const fs = await import('fs/promises');
      const path = await import('path');
      await fs.mkdir(path.resolve(dirPath), { recursive: true });
    }
  }

  /**
   * Write file
   * @param {string} filePath - File path
   * @param {Uint8Array|Buffer|Blob|string} data - Data
   */
  async _writeFile(filePath, data) {
    if (this.isDeno) {
      if (typeof data === 'string') {
        await Deno.writeTextFile(filePath, data);
      } else {
        await Deno.writeFile(filePath, data);
      }
    } else if (this.isNode) {
      const fs = await import('fs/promises');
      if (typeof data === 'string') {
        await fs.writeFile(filePath, data, 'utf-8');
      } else {
        await fs.writeFile(filePath, data);
      }
    } else if (this.isBrowser) {
      // Browser environment creates download link
      const blob = data instanceof Blob ? data : new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generate timestamp
   * @returns {string}
   */
  _getTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[:.]/g, '').slice(0, -5);
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL
   * @returns {string}
   */
  _getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/\./g, '_');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Batch capture web page screenshots
   * @param {Array<string>} urls - URL list
   * @param {string} outputDir - Output directory
   * @param {Object} [options] - Options
   * @param {Object} [options.viewport] - Viewport configuration
   * @param {boolean} [options.fullPage=true] - Full page screenshot
   * @param {number} [options.delay=1000] - Request interval (milliseconds)
   * @returns {Promise<Array>} Processing results list
   */
  async batchScreenshots(urls, outputDir, options = {}) {
    await this._ensureDir(outputDir);
    const results = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`Processing ${i + 1}/${urls.length}: ${url}`);

      try {
        // 生成文件名
        const domain = this._getDomain(url);
        const timestamp = this._getTimestamp();
        const filename = `${domain}_${timestamp}.png`;
        const filepath = `${outputDir}/${filename}`;

        // Take screenshot
        const screenshot = await this.client.screenshot(url, {
          viewport: options.viewport,
          fullPage: options.fullPage !== false
        });

        // 保存文件
        await this._writeFile(filepath, screenshot);

        const result = {
          url,
          status: 'success',
          filepath,
          filename,
          timestamp
        };

        results.push(result);

        // 延迟处理
        if (options.delay > 0 && i < urls.length - 1) {
          await this._delay(options.delay);
        }
      } catch (error) {
        const result = {
          url,
          status: 'error',
          error: error.message,
          timestamp: this._getTimestamp()
        };
        results.push(result);
      }
    }

    // Save results to JSON file
    const resultsFile = `${outputDir}/screenshot_results.json`;
    await this._writeFile(resultsFile, JSON.stringify(results, null, 2));

    // Save results to CSV file
    const csvFile = `${outputDir}/screenshot_results.csv`;
    const csvContent = [
      'URL,Status,FilePath,FileName,Timestamp,Error',
      ...results.map(r => `${r.url},"${r.status}","${r.filepath || ''}","${r.filename || ''}","${r.timestamp}","${r.error || ''}"`)
    ].join('\n');
    await this._writeFile(csvFile, csvContent);

    console.log(`Batch screenshots complete! Results saved in ${outputDir}`);
    console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);

    return results;
  }

  /**
   * Batch generate PDFs
   * @param {Array<string>} urls - URL list
   * @param {string} outputDir - Output directory
   * @param {Object} [options] - Options
   * @param {Object} [options.pdfOptions] - PDF options configuration
   * @param {number} [options.delay=1000] - Request interval (milliseconds)
   * @returns {Promise<Array>} Processing results list
   */
  async batchPdfs(urls, outputDir, options = {}) {
    await this._ensureDir(outputDir);
    const results = [];

    // Default PDF options
    const defaultPdfOptions = {
      format: 'a4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    };

    const pdfOptions = { ...defaultPdfOptions, ...options.pdfOptions };

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`Generating PDF ${i + 1}/${urls.length}: ${url}`);

      try {
        // 生成文件名
        const domain = this._getDomain(url);
        const timestamp = this._getTimestamp();
        const filename = `${domain}_${timestamp}.pdf`;
        const filepath = `${outputDir}/${filename}`;

        // Generate PDF
        const pdf = await this.client.pdf(url, pdfOptions);

        // 保存文件
        await this._writeFile(filepath, pdf);

        const result = {
          url,
          status: 'success',
          filepath,
          filename,
          timestamp,
          sizeBytes: pdf.length || pdf.size
        };

        results.push(result);

        // 延迟处理
        if (options.delay > 0 && i < urls.length - 1) {
          await this._delay(options.delay);
        }
      } catch (error) {
        const result = {
          url,
          status: 'error',
          error: error.message,
          timestamp: this._getTimestamp()
        };
        results.push(result);
      }
    }

    // Save results
    const resultsFile = `${outputDir}/pdf_results.json`;
    await this._writeFile(resultsFile, JSON.stringify(results, null, 2));

    const csvFile = `${outputDir}/pdf_results.csv`;
    const csvContent = [
      'URL,Status,FilePath,FileName,Timestamp,SizeBytes,Error',
      ...results.map(r => `${r.url},"${r.status}","${r.filepath || ''}","${r.filename || ''}","${r.timestamp}","${r.sizeBytes || ''}","${r.error || ''}"`)
    ].join('\n');
    await this._writeFile(csvFile, csvContent);

    console.log(`Batch PDF generation complete! Results saved in ${outputDir}`);
    console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);

    return results;
  }

  /**
   * Batch extract web page content
   * @param {Array<string>} urls - URL list
   * @param {string} outputDir - Output directory
   * @param {Object} [options] - Options
   * @param {string} [options.contentType='html'] - Content type (html, markdown)
   * @param {string} [options.waitForSelector] - Wait for specific element
   * @param {number} [options.delay=500] - Request interval (milliseconds)
   * @returns {Promise<Array>} Processing results list
   */
  async batchExtractContent(urls, outputDir, options = {}) {
    await this._ensureDir(outputDir);
    const results = [];
    const contentType = options.contentType || 'html';

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`Extracting content ${i + 1}/${urls.length}: ${url}`);

      try {
        // 生成文件名
        const domain = this._getDomain(url);
        const timestamp = this._getTimestamp();
        const extension = contentType === 'html' ? 'html' : 'md';
        const filename = `${domain}_${timestamp}.${extension}`;
        const filepath = `${outputDir}/${filename}`;

        // Extract content
        let content;
        if (contentType === 'html') {
          content = await this.client.content(url, {
            waitForSelector: options.waitForSelector
          });
        } else {
          content = await this.client.markdown(url, {
            waitForSelector: options.waitForSelector
          });
        }

        // 保存文件
        await this._writeFile(filepath, content);

        const result = {
          url,
          status: 'success',
          filepath,
          filename,
          timestamp,
          contentType,
          sizeChars: content.length
        };

        results.push(result);

        // 延迟处理
        if (options.delay > 0 && i < urls.length - 1) {
          await this._delay(options.delay);
        }
      } catch (error) {
        const result = {
          url,
          status: 'error',
          error: error.message,
          timestamp: this._getTimestamp()
        };
        results.push(result);
      }
    }

    // Save results
    const resultsFile = `${outputDir}/${contentType}_results.json`;
    await this._writeFile(resultsFile, JSON.stringify(results, null, 2));

    const csvFile = `${outputDir}/${contentType}_results.csv`;
    const csvContent = [
      'URL,Status,FilePath,FileName,Timestamp,ContentType,SizeChars,Error',
      ...results.map(r => `${r.url},"${r.status}","${r.filepath || ''}","${r.filename || ''}","${r.timestamp}","${r.contentType || ''}","${r.sizeChars || ''}","${r.error || ''}"`)
    ].join('\n');
    await this._writeFile(csvFile, csvContent);

    console.log(`Batch content extraction complete! Results saved in ${outputDir}`);
    console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'error').length}`);

    return results;
  }
}

// Export batch processor
export { BatchProcessor };

// Usage example
if (import.meta.main) {
  // Initialize batch processor
  const processor = new BatchProcessor({
    accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID'),
    apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN'),
    maxWorkers: 3
  });

  // Example URL list
  const urls = [
    'https://example.com',
    'https://cloudflare.com',
    'https://github.com'
  ];

  try {
    // Batch screenshots
    // const results = await processor.batchScreenshots(urls, './screenshots', {
    //   viewport: { width: 1920, height: 1080 },
    //   delay: 2000
    // });

    // Batch PDF generation
    // const results = await processor.batchPdfs(urls, './pdfs', {
    //   delay: 2000
    // });

    // Batch extract HTML content
    const results = await processor.batchExtractContent(urls, './content', {
      contentType: 'html',
      delay: 1000
    });

    console.log('Batch processing complete!');
  } catch (error) {
    console.error('Batch processing error:', error);
  }
}