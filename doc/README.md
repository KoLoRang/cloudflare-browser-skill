# Cloudflare 浏览器渲染技能

一个完整的 Cloudflare 浏览器渲染 API 技能，支持网页截图、PDF 生成、内容提取等功能。

## 功能特性

- 🖼️ **网页截图** - 支持整页截图、特定元素截图和自定义视口
- 📄 **PDF 生成** - 将网页转换为高质量的 PDF 文档
- 📝 **内容提取** - 获取 JavaScript 渲染后的完整 HTML
- 📋 **Markdown 转换** - 将网页内容转换为 Markdown 格式
- 🤖 **AI 数据提取** - 使用 AI 提取结构化数据（JSON 模式或自然语言）
- 🔍 **元素抓取** - 获取特定 CSS 选择器的信息
- 📸 **快照功能** - 同时捕获截图和 HTML 内容
- 🔗 **链接提取** - 获取页面中的所有链接

## 环境支持

JavaScript 客户端支持多种运行时环境：
- ✅ **Deno** - 现代 JavaScript/TypeScript 运行时
- ✅ **Node.js** - 服务器端 JavaScript（需要 ES 模块）
- ✅ **现代浏览器** - 前端应用程序（需要 CORS 代理）

## 快速开始

### 1. 配置 API 凭据

在使用此技能之前，您需要配置 Cloudflare API 凭据：

#### 获取 API 凭据

1. 登录 [Cloudflare 仪表板](https://dash.cloudflare.com/)
2. 前往 **我的个人资料** > **API 令牌**
3. 点击 **创建令牌**
4. 选择 **自定义令牌** 模板
5. 添加权限：**账户** > **浏览器渲染** > **编辑**
6. 创建并保存令牌

#### 配置凭据

**方法 1：使用配置助手（推荐）**

运行配置助手脚本并按照提示操作：

```bash
# Node.js 环境
node scripts/setup-config.js

# Deno 环境
deno run --allow-read --allow-write scripts/setup-config.js
```

**方法 2：手动配置**

1. 复制配置模板：
```bash
cp assets/config_template.json assets/config.json
```

2. 编辑 `assets/config.json` 并填写您的凭据：
```json
{
  "account_id": "您的实际账户 ID",
  "api_token": "您的实际 API 令牌",
  ...
}
```

**方法 3：通过对话配置**

首次使用时，只需向 AI 提供您的凭据：

```
请为我配置 Cloudflare 浏览器渲染 API
账户 ID：abc123def456
API 令牌：your_token_here
```

配置文件将保存到 `assets/config.json`，并在后续使用中自动加载。

### 2. 使用示例

配置完成后，您可以直接使用：

```
请截取 https://example.com 的截图
```

```
请将 https://blog.example.com/article 转换为 Markdown 格式
```

```
请从 https://shop.example.com 提取所有产品名称和价格
```

## 高级功能

### 1. 认证页面处理

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

### 2. 性能优化

```javascript
// 阻止不必要的资源加载
const content = await client.content('https://heavy-site.com', {
  rejectResourceTypes: ['image', 'stylesheet', 'font', 'media']
});
```

### 3. 自定义样式和脚本

```javascript
const screenshot = await client.screenshot('https://example.com', {
  addScriptTag: [
    {
      content: `
        // 隐藏广告
        document.querySelector('.advertisement')?.remove();
        // 添加水印
        const watermark = document.createElement('div');
        watermark.textContent = '机密';
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

### 4. 响应式截图

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
  // 保存截图...
}
```

## 错误处理

```javascript
try {
  const screenshot = await client.screenshot('https://example.com', {
    waitForSelector: '#main-content',
    timeout: 60000
  });
} catch (error) {
  if (error.message.includes('10030')) {
    console.error('页面加载超时，请增加超时值');
  } else if (error.message.includes('10040')) {
    console.error('未找到元素，请检查选择器');
  } else if (error.message.includes('10050')) {
    console.error('超出速率限制，请降低请求频率');
  } else {
    console.error('未知错误：', error.message);
  }
}
```

## 最佳实践

1. **监控使用情况** - 注意 API 响应中的 `browserMsUsed` 字段
2. **优化性能** - 使用 `rejectResourceTypes` 阻止不必要的资源加载
3. **处理动态内容** - 使用 `waitForSelector` 等待特定元素加载
4. **错误重试** - 实现指数退避重试机制
5. **批量处理** - 使用 `BatchProcessor` 处理多个 URL
6. **请求间隔** - 批量处理时添加适当的延迟

## 配置选项

### 视口配置

```javascript
{
  viewport: {
    width: 1920,        // 视口宽度
    height: 1080,       // 视口高度
    deviceScaleFactor: 2 // 设备缩放因子（用于高分辨率截图）
  }
}
```

### 页面加载选项

```javascript
{
  gotoOptions: {
    waitUntil: 'networkidle2', // 等待条件：load、domcontentloaded、networkidle0、networkidle2
    timeout: 30000              // 超时时间（毫秒）
  }
}
```

### PDF 选项

```javascript
{
  pdfOptions: {
    format: 'a4',              // 页面格式：a4、a5、letter 等
    landscape: false,          // 横向方向
    printBackground: true,     // 打印背景
    displayHeaderFooter: true, // 显示页眉和页脚
    margin: {
      top: '20px',
      bottom: '20px',
      left: '20px',
      right: '20px'
    }
  }
}
```

## 文件结构

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

## 常见问题

### Q: 如何处理需要登录的页面？

A: 使用 `cookies` 参数传递会话 cookie：

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

### Q: 如何提高截图质量？

A: 增加 `deviceScaleFactor` 值：

```javascript
const screenshot = await client.screenshot('https://example.com', {
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2  // 2 倍分辨率
  }
});
```

### Q: 如何处理 JavaScript 密集型页面？

A: 使用 `waitUntil: 'networkidle0'` 或 `waitForSelector`：

```javascript
const content = await client.content('https://spa-app.com', {
  gotoOptions: {
    waitUntil: 'networkidle0'
  },
  waitForSelector: '#main-content'
});
```

### Q: 如何降低 API 使用成本？

A: 阻止不必要的资源加载：

```javascript
const content = await client.content('https://example.com', {
  rejectResourceTypes: ['image', 'stylesheet', 'font', 'media']
});
```

## 参考资源

- [Cloudflare 浏览器渲染官方文档](https://developers.cloudflare.com/browser-rendering/)
- [API 参考文档](https://developers.cloudflare.com/api/resources/browser_rendering/)
- [示例代码](https://developers.cloudflare.com/browser-rendering/examples/)
- [定价信息](https://developers.cloudflare.com/browser-rendering/platform/pricing/)

## 许可证

本技能基于 Cloudflare 浏览器渲染 API 构建，必须遵守 Cloudflare 的服务条款。

## 贡献

欢迎提交问题和拉取请求！

## 更新日志

### v1.0.0 (2026-02-10)
- ✨ 初始版本
- ✅ 支持所有 Cloudflare 浏览器渲染 API 端点
- ✅ 跨平台支持（Deno、Node.js、浏览器）
- ✅ 批量处理功能
- ✅ 完整的错误处理
- ✅ 详细的文档和示例

---

**注意**：
- 使用此技能需要有效的 Cloudflare 账户和 API 令牌
- 请妥善保管您的 API 凭据，不要将 `config.json` 提交到版本控制
- 配置文件 `assets/config.json` 已添加到 `.gitignore`