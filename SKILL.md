---
name: cloudflare-browser-rendering
description: Use Cloudflare Browser Rendering REST API for web screenshots, PDF generation, content extraction, and structured data scraping. Suitable for automation tasks requiring browser rendering, such as web screenshots, PDF conversion, HTML content extraction, AI-driven data extraction, etc.
---

# Cloudflare Browser Rendering API Usage Guide

## Feature Overview

This skill provides complete usage guidance for the Cloudflare Browser Rendering REST API, supporting the following features:
- Web screenshots (support for full page, specific elements, custom viewports)
- PDF generation (support for custom formats, headers/footers, styles)
- HTML content extraction (get complete HTML after JavaScript rendering)
- Markdown conversion (convert web page content to Markdown format)
- AI-driven structured data extraction (using JSON Schema or natural language prompts)
- Element scraping (get information for specific CSS selectors)
- Snapshot function (capture screenshot and HTML content simultaneously)
- Link extraction (get all links from a page)

## Configuration Instructions

### First-Time Configuration

Before using this skill, users need to provide the following information:

1. **account_id**: Cloudflare Account ID
2. **api_token**: API Token with Browser Rendering permissions

### Get API Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** > **API Tokens**
3. Click **Create Token**
4. Select **Custom Token** template
5. Add permission: **Account** > **Browser Rendering** > **Edit**
6. Create and save the Token

### Configuration File Management

Configuration information is stored in the `assets/config.json` file:

- **Configuration Template**: `assets/config_template.json` - Template containing all configuration options
- **Actual Configuration**: `assets/config.json` - Copy from template and fill in actual credentials

When users provide credentials for the first time:
1. Read the `assets/config_template.json` template
2. Fill in the user-provided `account_id` and `api_token`
3. Save as `assets/config.json`
4. Subsequent uses will read configuration from `assets/config.json`

## API Basic Information

### Basic Information
- **Base URL**: `https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/`
- **Authentication**: Bearer Token
- **Request Method**: POST
- **Response Headers**: Includes `X-Browser-Ms-Used` (browser usage time in milliseconds)

### Authentication Setup
You need to create an API Token with Browser Rendering permissions and add it to the request header:
```
Authorization: Bearer <apiToken>
```

### JavaScript Client
This skill provides a cross-platform JavaScript client supporting Deno, Node.js, and modern browsers:
```javascript
import { CloudflareBrowserRenderingClient } from './scripts/browser-rendering-client.js';
import { loadConfig } from './scripts/config.js';

// Load credentials from config file
const config = await loadConfig();
const client = new CloudflareBrowserRenderingClient({
  accountId: config.account_id,
  apiToken: config.api_token
});
```

### Batch Processing Tool
Provides a utility class for batch processing multiple URLs:
```javascript
import { BatchProcessor } from './scripts/batch-processor.js';
import { loadConfig } from './scripts/config.js';

const config = await loadConfig();
const processor = new BatchProcessor({
  accountId: config.account_id,
  apiToken: config.api_token,
  maxWorkers: 3
});

// Batch screenshots
const results = await processor.batchScreenshots(urls, './screenshots', {
  viewport: { width: 1920, height: 1080 },
  delay: 2000
});
```

## Core Feature Usage

### 1. Web Screenshots
Use the `/screenshot` endpoint to capture web page screenshots:

**cURL Example**:
```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/screenshot' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "screenshotOptions": {
      "fullPage": true
    }
  }'
```

**JavaScript Example**:
```javascript
// Basic screenshot
const screenshot = await client.screenshot('https://example.com');

// Custom options
const customScreenshot = await client.screenshot('https://example.com', {
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  fullPage: true,
  waitForSelector: '#main-content',
  timeout: 60000
});
```

### 2. PDF Generation
Use the `/pdf` endpoint to convert web pages to PDF:

**cURL Example**:
```bash
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/pdf' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "pdfOptions": {
      "format": "a4",
      "printBackground": true,
      "displayHeaderFooter": true,
      "margin": {
        "top": "100px",
        "bottom": "80px"
      }
    }
  }' \
  --output "output.pdf"
```

**JavaScript Example**:
```javascript
// Basic PDF generation
const pdf = await client.pdf('https://example.com');

// Custom options
const customPdf = await client.pdf('https://example.com', {
  format: 'a4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="text-align: center;">Report Title</div>',
  footerTemplate: '<div style="text-align: center;">Page <span class="pageNumber"></span></div>',
  margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
});
```

### 3. AI-Driven Data Extraction
Use the `/json` endpoint to extract structured data through AI:

**cURL Example**:
```bash
# Using natural language prompt
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/json' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "prompt": "Extract all product names and prices"
  }'

# Using JSON Schema to define output structure
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-rendering/json' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "response_format": {
      "type": "object",
      "properties": {
        "products": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "name": {"type": "string"},
              "price": {"type": "number"}
            }
          }
        }
      }
    }
  }'
```

**JavaScript Example**:
```javascript
// Extract data using natural language prompt
const data = await client.jsonExtract('https://example.com', {
  prompt: 'Extract all product names and prices'
});

// Define structure using JSON Schema
const structuredData = await client.jsonExtract('https://example.com', {
  responseFormat: {
    type: 'object',
    properties: {
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number' }
          },
          required: ['name', 'price']
        }
      }
    }
  }
});
```

## Advanced Configuration

### Performance Optimization
Improve speed by blocking unnecessary resources:
```json
{
  "url": "https://example.com",
  "rejectResourceTypes": ["image", "stylesheet", "font"]
}
```

### JavaScript-Heavy Page Handling
For SPAs or JavaScript-intensive pages:
```json
{
  "gotoOptions": {
    "waitUntil": "networkidle0"
  }
}
```

### Authenticated Page Handling
Use cookies to access pages requiring authentication:
```json
{
  "url": "https://example.com/dashboard",
  "cookies": [
    {
      "name": "session_id",
      "value": "your_session_token",
      "domain": "example.com"
    }
  ]
}
```

### Custom Styles and Scripts
Inject custom CSS and JavaScript:
```json
{
  "addScriptTag": [
    {
      "content": "document.body.style.backgroundColor = 'white';"
    }
  ],
  "addStyleTag": [
    {
      "content": "body { font-size: 16px; }"
    }
  ]
}
```

## Common Use Cases

### 1. Web Monitoring
Periodically take screenshots and compare visual changes:
- Use `/screenshot` to capture page screenshots
- Save `X-Browser-Ms-Used` header information to monitor performance
- Compare screenshot differences to detect page changes

### 2. Content Archiving
Save complete state of web pages:
- Use `/snapshot` to capture both HTML and screenshot simultaneously
- Store complete page content and visual state
- For historical records and legal compliance

### 3. Data Scraping
Extract data from complex web pages:
- Use `/scrape` to get specific element information
- Use `/json` to extract structured data through AI
- Handle dynamically rendered JavaScript content

### 4. Report Generation
Convert web pages to PDF reports:
- Use `/pdf` to generate high-quality PDFs
- Add custom headers and footers
- Control page format and styles

## Error Handling

API failures return:
```json
{
  "success": false,
  "errors": [
    {
      "code": "error_code",
      "message": "error_description"
    }
  ]
}
```

Common errors and solutions:
- **Timeout Error**: Increase `gotoOptions.timeout` value
- **Element Not Found**: Use `waitForSelector` to wait for loading
- **Authentication Failed**: Check API Token permissions
- **Network Error**: Check URL accessibility

## Best Practices

1. **Monitor Usage**: Pay attention to `X-Browser-Ms-Used` response header
2. **Optimize Performance**: Block unnecessary resource loading
3. **Handle Dynamic Content**: Use appropriate waiting strategies
4. **Error Retry**: Implement exponential backoff retry mechanism
5. **Data Caching**: Cache infrequently changing page content

## Reference Resources

- [Official Documentation](https://developers.cloudflare.com/browser-rendering/rest-api/)
- [API Reference](https://developers.cloudflare.com/api/resources/browser_rendering/)
- [Example Code](https://developers.cloudflare.com/browser-rendering/examples/)
