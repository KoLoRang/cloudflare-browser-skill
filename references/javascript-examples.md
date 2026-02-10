# Cloudflare Browser Rendering API JavaScript使用示例

## 环境支持

JavaScript客户端支持多种运行环境：
- **Deno** - 现代JavaScript/TypeScript运行时
- **Node.js** - 服务器端JavaScript
- **现代浏览器** - 前端应用

## 快速开始

### 1. Deno环境

```javascript
// 从URL导入客户端（推荐）
import { CloudflareBrowserRenderingClient } from 'https://your-cdn.com/browser-rendering-client.js';

// 或从本地文件导入
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

const client = new CloudflareBrowserRenderingClient({
  accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID'),
  apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN')
});

// 截取截图
const screenshot = await client.screenshot('https://example.com');
await Deno.writeFile('screenshot.png', screenshot);
```

### 2. Node.js环境

```javascript
// 注意：Node.js需要ES Modules支持
// 在package.json中添加: "type": "module"

import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

const client = new CloudflareBrowserRenderingClient({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

// 截取截图
const screenshot = await client.screenshot('https://example.com');
const fs = await import('fs/promises');
await fs.writeFile('screenshot.png', screenshot);
```

### 3. 浏览器环境

```html
<!DOCTYPE html>
<html>
<head>
  <title>Browser Rendering Demo</title>
</head>
<body>
  <h1>Cloudflare Browser Rendering Demo</h1>
  <input type="text" id="urlInput" placeholder="输入URL" value="https://example.com">
  <button onclick="takeScreenshot()">截取截图</button>
  <div id="result"></div>

  <script type="module">
    import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

    // 注意：在浏览器中使用时，需要通过代理服务器处理CORS
    const client = new CloudflareBrowserRenderingClient({
      accountId: 'your_account_id',
      apiToken: 'your_api_token',
      baseUrl: 'https://your-proxy-server.com/api/browser-rendering' // 代理服务器URL
    });

    window.takeScreenshot = async function() {
      const url = document.getElementById('urlInput').value;
      const resultDiv = document.getElementById('result');

      try {
        resultDiv.innerHTML = '正在截取截图...';
        const screenshot = await client.screenshot(url);

        // 显示截图
        const img = document.createElement('img');
        img.src = URL.createObjectURL(screenshot);
        img.style.maxWidth = '100%';
        resultDiv.innerHTML = '';
        resultDiv.appendChild(img);

        // 提供下载链接
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '下载截图';
        downloadBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = img.src;
          a.download = 'screenshot.png';
          a.click();
        };
        resultDiv.appendChild(downloadBtn);

      } catch (error) {
        resultDiv.innerHTML = `错误: ${error.message}`;
      }
    };
  </script>
</body>
</html>
```

## 高级示例

### 1. 响应式截图生成器

```javascript
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';
import { devicePresets } from './config.js';

/**
 * 为同一URL生成不同设备尺寸的截图
 */
async function generateResponsiveScreenshots(url, outputDir = './responsive') {
  const client = new CloudflareBrowserRenderingClient({
    accountId: 'your_account_id',
    apiToken: 'your_api_token'
  });

  // 确保输出目录存在
  if (typeof Deno !== 'undefined') {
    await Deno.mkdir(outputDir, { recursive: true });
  }

  const results = [];

  for (const [deviceName, device] of Object.entries(devicePresets)) {
    console.log(`正在生成 ${device.name} 尺寸的截图...`);

    try {
      const screenshot = await client.screenshot(url, {
        viewport: device.viewport,
        fullPage: false // 只截取视口区域
      });

      const filename = `${deviceName}_${url.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      const filepath = `${outputDir}/${filename}`;

      // 保存文件
      if (typeof Deno !== 'undefined') {
        await Deno.writeFile(filepath, screenshot);
      } else if (typeof process !== 'undefined') {
        const fs = await import('fs/promises');
        await fs.writeFile(filepath, screenshot);
      }

      results.push({
        device: device.name,
        filepath,
        viewport: device.viewport
      });

    } catch (error) {
      console.error(`生成 ${device.name} 截图失败:`, error.message);
    }
  }

  return results;
}

// 使用示例
const results = await generateResponsiveScreenshots('https://example.com');
console.log('响应式截图生成完成:', results);
```

### 2. 网页监控服务

```javascript
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

/**
 * 简单的网页监控服务
 */
class WebPageMonitor {
  constructor(config) {
    this.client = new CloudflareBrowserRenderingClient(config);
    this.monitors = new Map();
  }

  /**
   * 添加监控任务
   * @param {string} id - 监控ID
   * @param {string} url - 监控的URL
   * @param {Object} options - 监控选项
   */
  addMonitor(id, url, options = {}) {
    this.monitors.set(id, {
      url,
      interval: options.interval || 60000, // 默认1分钟
      selector: options.selector, // 监控特定元素
      callback: options.callback, // 变化回调函数
      lastContent: null,
      lastCheck: null
    });
  }

  /**
   * 开始监控
   */
  async start() {
    console.log('开始网页监控...');

    // 为每个监控任务创建定时器
    for (const [id, monitor] of this.monitors) {
      console.log(`启动监控任务 ${id}: ${monitor.url}`);

      const checkFn = async () => {
        try {
          console.log(`[${new Date().toISOString()}] 检查 ${id}`);

          // 获取页面内容
          const currentContent = await this.client.content(monitor.url, {
            waitForSelector: monitor.selector
          });

          // 比较内容变化
          if (monitor.lastContent && currentContent !== monitor.lastContent) {
            console.log(`检测到变化: ${id}`);

            // 截图保存
            const screenshot = await this.client.screenshot(monitor.url);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${id}_${timestamp}.png`;

            if (typeof Deno !== 'undefined') {
              await Deno.writeFile(`./changes/${filename}`, screenshot);
            }

            // 调用回调函数
            if (monitor.callback) {
              monitor.callback({
                id,
                url: monitor.url,
                timestamp: new Date(),
                screenshot: filename,
                content: currentContent
              });
            }
          }

          monitor.lastContent = currentContent;
          monitor.lastCheck = new Date();

        } catch (error) {
          console.error(`监控 ${id} 出错:`, error.message);
        }
      };

      // 立即执行一次
      await checkFn();

      // 设置定时检查
      setInterval(checkFn, monitor.interval);
    }
  }

  /**
   * 停止监控
   */
  stop() {
    console.log('停止网页监控');
    // 清除所有定时器
    this.monitors.clear();
  }
}

// 使用示例
const monitor = new WebPageMonitor({
  accountId: 'your_account_id',
  apiToken: 'your_api_token'
});

// 添加监控任务
monitor.addMonitor('news-site', 'https://news.example.com', {
  interval: 300000, // 5分钟检查一次
  callback: (change) => {
    console.log('网页变化通知:', change);
    // 可以在这里发送邮件、Slack通知等
  }
});

monitor.addMonitor('product-page', 'https://shop.example.com/product123', {
  interval: 60000, // 1分钟检查一次
  selector: '.price', // 只监控价格元素
  callback: (change) => {
    console.log('产品价格可能发生变化！', change);
  }
});

// 开始监控
monitor.start();
```

### 3. 数据提取管道

```javascript
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

/**
 * 数据提取管道
 */
class DataExtractionPipeline {
  constructor(config) {
    this.client = new CloudflareBrowserRenderingClient(config);
    this.extractors = new Map();
  }

  /**
   * 注册数据提取器
   * @param {string} name - 提取器名称
   * @param {Object} config - 提取器配置
   */
  registerExtractor(name, config) {
    this.extractors.set(name, config);
  }

  /**
   * 执行数据提取
   * @param {string} url - 目标URL
   * @param {string} extractorName - 提取器名称
   * @returns {Promise<Object>} 提取的数据
   */
  async extract(url, extractorName) {
    const extractor = this.extractors.get(extractorName);
    if (!extractor) {
      throw new Error(`未找到提取器: ${extractorName}`);
    }

    console.log(`使用 ${extractorName} 提取数据: ${url}`);

    try {
      let data;

      if (extractor.type === 'ai') {
        // AI驱动的数据提取
        data = await this.client.jsonExtract(url, {
          prompt: extractor.prompt,
          responseFormat: extractor.responseFormat
        });
      } else if (extractor.type === 'scrape') {
        // CSS选择器提取
        data = await this.client.scrape(url, extractor.selectors);
      } else if (extractor.type === 'content') {
        // 内容提取
        data = await this.client.content(url, extractor.options);
      } else if (extractor.type === 'markdown') {
        // Markdown转换
        data = await this.client.markdown(url, extractor.options);
      }

      // 后处理
      if (extractor.postProcess) {
        data = extractor.postProcess(data);
      }

      return {
        url,
        extractor: extractorName,
        timestamp: new Date(),
        data
      };

    } catch (error) {
      console.error(`数据提取失败: ${url}`, error);
      throw error;
    }
  }

  /**
   * 批量提取
   * @param {Array<string>} urls - URL列表
   * @param {string} extractorName - 提取器名称
   * @returns {Promise<Array>} 提取结果列表
   */
  async batchExtract(urls, extractorName) {
    const results = [];

    for (const url of urls) {
      try {
        const result = await this.extract(url, extractorName);
        results.push(result);
      } catch (error) {
        results.push({
          url,
          extractor: extractorName,
          timestamp: new Date(),
          error: error.message,
          data: null
        });
      }
    }

    return results;
  }
}

// 使用示例
const pipeline = new DataExtractionPipeline({
  accountId: 'your_account_id',
  apiToken: 'your_api_token'
});

// 注册提取器
pipeline.registerExtractor('products', {
  type: 'ai',
  prompt: 'Extract all product information including name, price, description, availability, and image URLs',
  responseFormat: {
    type: 'object',
    properties: {
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'string' },
            description: { type: 'string' },
            availability: { type: 'string' },
            imageUrl: { type: 'string' }
          }
        }
      }
    }
  },
  postProcess: (data) => {
    // 数据后处理
    if (data.products) {
      data.products.forEach(product => {
        // 清理价格格式
        if (product.price) {
          product.price = product.price.replace(/[^\d.,]/g, '');
        }
      });
    }
    return data;
  }
});

pipeline.registerExtractor('articles', {
  type: 'ai',
  prompt: 'Extract article metadata and content',
  responseFormat: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      author: { type: 'string' },
      publishDate: { type: 'string' },
      summary: { type: 'string' },
      content: { type: 'string' },
      tags: {
        type: 'array',
        items: { type: 'string' }
      }
    }
  }
});

pipeline.registerExtractor('social-links', {
  type: 'scrape',
  selectors: [
    'a[href*="facebook.com"]',
    'a[href*="twitter.com"]',
    'a[href*="linkedin.com"]',
    'a[href*="instagram.com"]',
    'a[href*="youtube.com"]'
  ]
});

// 执行数据提取
const urls = [
  'https://shop1.example.com',
  'https://shop2.example.com',
  'https://blog.example.com/article1'
];

// 提取产品信息
const productData = await pipeline.batchExtract(urls.slice(0, 2), 'products');
console.log('产品数据:', JSON.stringify(productData, null, 2));

// 提取文章信息
const articleData = await pipeline.extract(urls[2], 'articles');
console.log('文章数据:', JSON.stringify(articleData, null, 2));

// 提取社交媒体链接
const socialLinks = await pipeline.extract('https://company.example.com', 'social-links');
console.log('社交媒体链接:', JSON.stringify(socialLinks, null, 2));
```

### 4. 错误处理和重试

```javascript
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';
import { getRetryDelay } from './config.js';

/**
 * 带重试的请求包装器
 */
async function requestWithRetry(requestFunc, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFunc();
    } catch (error) {
      lastError = error;
      console.error(`请求失败（第${attempt + 1}次）:`, error.message);

      if (attempt < maxRetries - 1) {
        const delay = getRetryDelay(attempt);
        console.log(`${delay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// 使用示例
const client = new CloudflareBrowserRenderingClient({
  accountId: 'your_account_id',
  apiToken: 'your_api_token'
});

// 带重试的截图
const screenshot = await requestWithRetry(async () => {
  return await client.screenshot('https://example.com', {
    waitForSelector: '#main-content',
    timeout: 60000
  });
});

console.log('截图成功！');
```

## 环境特定功能

### 1. Deno部署脚本

```javascript
#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read --allow-env

import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

const client = new CloudflareBrowserRenderingClient({
  accountId: Deno.env.get('CLOUDFLARE_ACCOUNT_ID'),
  apiToken: Deno.env.get('CLOUDFLARE_API_TOKEN')
});

// 从命令行参数获取URL
const url = Deno.args[0] || 'https://example.com';
const output = Deno.args[1] || 'screenshot.png';

console.log(`正在截取 ${url} 的截图...`);

try {
  const screenshot = await client.screenshot(url);
  await Deno.writeFile(output, screenshot);
  console.log(`截图已保存为: ${output}`);
} catch (error) {
  console.error('截图失败:', error.message);
  Deno.exit(1);
}
```

### 2. Node.js Express API

```javascript
import express from 'express';
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

const app = express();
app.use(express.json());

const client = new CloudflareBrowserRenderingClient({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN
});

// 截图API
app.post('/api/screenshot', async (req, res) => {
  try {
    const { url, viewport, fullPage } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const screenshot = await client.screenshot(url, {
      viewport,
      fullPage
    });

    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PDF API
app.post('/api/pdf', async (req, res) => {
  try {
    const { url, format, printBackground } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const pdf = await client.pdf(url, {
      format: format || 'a4',
      printBackground: printBackground !== false
    });

    res.set('Content-Type', 'application/pdf');
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 数据提取API
app.post('/api/extract', async (req, res) => {
  try {
    const { url, prompt, responseFormat } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const data = await client.jsonExtract(url, {
      prompt,
      responseFormat
    });

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```