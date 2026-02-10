# Cloudflare Browser Rendering Skill

A complete Cloudflare Browser Rendering API skill supporting web screenshots, PDF generation, content extraction, and more.

## Features

- 🖼️ **Web Screenshots** - Support for full page, specific elements, and custom viewports
- 📄 **PDF Generation** - Convert web pages to high-quality PDF documents
- 📝 **Content Extraction** - Get complete HTML after JavaScript rendering
- 📋 **Markdown Conversion** - Convert web page content to Markdown format
- 🤖 **AI Data Extraction** - Extract structured data using AI (JSON Schema or natural language)
- 🔍 **Element Scraping** - Get information for specific CSS selectors
- 📸 **Snapshot Function** - Capture both screenshot and HTML content simultaneously
- 🔗 **Link Extraction** - Get all links from a page

## Environment Support

The JavaScript client supports multiple runtime environments:
- ✅ **Deno** - Modern JavaScript/TypeScript runtime
- ✅ **Node.js** - Server-side JavaScript (requires ES Modules)
- ✅ **Modern Browsers** - Frontend applications (requires CORS proxy)

## Quick Start

### 1. Configure API Credentials

Before using this skill, you need to configure your Cloudflare API credentials:

#### Get API Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** > **API Tokens**
3. Click **Create Token**
4. Select **Custom Token** template
5. Add permission: **Account** > **Browser Rendering** > **Edit**
6. Create and save the Token

#### Configure Credentials

**Method 1: Use Configuration Helper (Recommended)**

Run the configuration helper script and follow the prompts:

```bash
# Node.js environment
node scripts/setup-config.js

# Deno environment
deno run --allow-read --allow-write scripts/setup-config.js
```

**Method 2: Manual Configuration**

1. Copy the configuration template:
```bash
cp assets/config_template.json assets/config.json
```

2. Edit `assets/config.json` and fill in your credentials:
```json
{
  "account_id": "your_actual_account_id",
  "api_token": "your_actual_api_token",
  ...
}
```

**Method 3: Configure via Conversation**

On first use, simply provide your credentials to the AI:

```
Please configure Cloudflare Browser Rendering API for me
Account ID: abc123def456
API Token: your_token_here
```

The configuration file will be saved to `assets/config.json` and automatically loaded for subsequent use.

### 2. Usage Examples

After configuration, you can use it directly:

```
Please take a screenshot of https://example.com
```

```
Please convert https://blog.example.com/article to Markdown format
```

```
Please extract all product names and prices from https://shop.example.com
```



## Advanced Features

### 1. Authenticated Page Handling

```javascript
const screenshot = await client.screenshot('https://dashboard.example.com', {
  cookies: [
    {
      name: 'session_id',
      value: 'your_session_token',
      domain: 'example.com',
      path: '/'
    }
  ]
});
```

### 2. Performance Optimization

```javascript
// Block unnecessary resource loading
const content = await client.content('https://heavy-site.com', {
  rejectResourceTypes: ['image', 'stylesheet', 'font', 'media']
});
```

### 3. Custom Styles and Scripts

```javascript
const screenshot = await client.screenshot('https://example.com', {
  addScriptTag: [
    {
      content: `
        // Hide ads
        document.querySelector('.advertisement')?.remove();
        // Add watermark
        const watermark = document.createElement('div');
        watermark.textContent = 'CONFIDENTIAL';
        watermark.style.cssText = 'position:fixed;top:10px;right:10px;color:red;';
        document.body.appendChild(watermark);
      `
    }
  ],
  addStyleTag: [
    {
      content: 'body { background-color: white !important; }'
    }
  ]
});
```

### 4. Responsive Screenshots

```javascript
const devices = [
  { name: 'mobile', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'tablet', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1920, height: 1080, deviceScaleFactor: 1 }
];

for (const device of devices) {
  const screenshot = await client.screenshot('https://example.com', {
    viewport: device,
    fullPage: false
  });
  // Save screenshot...
}
```


## Error Handling

```javascript
try {
  const screenshot = await client.screenshot('https://example.com', {
    waitForSelector: '#main-content',
    timeout: 60000
  });
} catch (error) {
  if (error.message.includes('10030')) {
    console.error('Page load timeout, please increase timeout value');
  } else if (error.message.includes('10040')) {
    console.error('Element not found, please check selector');
  } else if (error.message.includes('10050')) {
    console.error('Rate limit exceeded, please reduce request frequency');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## Best Practices

1. **Monitor Usage** - Pay attention to the `browserMsUsed` field in API responses
2. **Optimize Performance** - Use `rejectResourceTypes` to block unnecessary resource loading
3. **Handle Dynamic Content** - Use `waitForSelector` to wait for specific elements to load
4. **Error Retry** - Implement exponential backoff retry mechanism
5. **Batch Processing** - Use `BatchProcessor` to handle multiple URLs
6. **Request Intervals** - Add appropriate delays when batch processing

## Configuration Options

### Viewport Configuration

```javascript
{
  viewport: {
    width: 1920,        // Viewport width
    height: 1080,       // Viewport height
    deviceScaleFactor: 2 // Device scale factor (for high-resolution screenshots)
  }
}
```

### Page Load Options

```javascript
{
  gotoOptions: {
    waitUntil: 'networkidle2', // Wait condition: load, domcontentloaded, networkidle0, networkidle2
    timeout: 30000              // Timeout (milliseconds)
  }
}
```

### PDF Options

```javascript
{
  pdfOptions: {
    format: 'a4',              // Page format: a4, a5, letter, etc.
    landscape: false,          // Landscape orientation
    printBackground: true,     // Print background
    displayHeaderFooter: true, // Display header and footer
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  }
}
```

## File Structure

```
cloudflare-browser-rendering/
├── README.md                           # 本文件
├── SKILL.md                            # 技能定义文件
├── assets/
│   ├── config_template.json           # 配置文件模板
│   └── config.json                    # 实际配置文件（首次使用时创建）
├── scripts/
│   ├── browser-rendering-client.js    # JavaScript 客户端（主要实现）
│   ├── config.js                      # 配置管理和工具函数
│   └── batch-processor.js             # 批量处理工具
└── references/
    ├── error_handling.md              # 错误处理指南
    ├── examples.md                    # 使用示例
    └── javascript-examples.md         # JavaScript 示例
```

## FAQ

### Q: How to handle pages that require login?

A: Use the `cookies` parameter to pass session cookies:

```javascript
const screenshot = await client.screenshot('https://dashboard.example.com', {
  cookies: [
    {
      name: 'session_id',
      value: 'your_session_token',
      domain: 'example.com'
    }
  ]
});
```

### Q: How to improve screenshot quality?

A: Increase the `deviceScaleFactor` value:

```javascript
const screenshot = await client.screenshot('https://example.com', {
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2  // 2x resolution
  }
});
```

### Q: How to handle JavaScript-heavy pages?

A: Use `waitUntil: 'networkidle0'` or `waitForSelector`:

```javascript
const content = await client.content('https://spa-app.com', {
  gotoOptions: {
    waitUntil: 'networkidle0'
  },
  waitForSelector: '#main-content'
});
```

### Q: How to reduce API usage costs?

A: Block unnecessary resource loading:

```javascript
const content = await client.content('https://example.com', {
  rejectResourceTypes: ['image', 'stylesheet', 'font', 'media']
});
```

## Reference Resources

- [Cloudflare Browser Rendering Official Documentation](https://developers.cloudflare.com/browser-rendering/)
- [API Reference Documentation](https://developers.cloudflare.com/api/resources/browser_rendering/)
- [Example Code](https://developers.cloudflare.com/browser-rendering/examples/)
- [Pricing Information](https://developers.cloudflare.com/browser-rendering/platform/pricing/)

## License

This skill is built on the Cloudflare Browser Rendering API and must comply with Cloudflare's Terms of Service.

## Contributing

Issues and Pull Requests are welcome!

## Changelog

### v1.0.0 (2026-02-10)
- ✨ Initial release
- ✅ Support for all Cloudflare Browser Rendering API endpoints
- ✅ Cross-platform support (Deno, Node.js, Browser)
- ✅ Batch processing functionality
- ✅ Complete error handling
- ✅ Detailed documentation and examples

---

**Note**: 
- Using this skill requires a valid Cloudflare account and API Token
- Keep your API credentials secure and do not commit `config.json` to version control
- The configuration file `assets/config.json` has been added to `.gitignore`
