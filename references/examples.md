# Cloudflare Browser Rendering API 使用示例

## 基础示例

### 1. 简单网页截图

#### Python版本
```python
from scripts.api_client import CloudflareBrowserRenderingClient

# 初始化客户端
client = CloudflareBrowserRenderingClient(
    account_id="your_account_id",
    api_token="your_api_token"
)

# 截取网页截图
screenshot = client.screenshot("https://example.com")

# 保存到文件
with open("example.png", "wb") as f:
    f.write(screenshot)
```

#### JavaScript版本（支持Deno/Node.js/浏览器）
```javascript
import { CloudflareBrowserRenderingClient } from './browser-rendering-client.js';

// 初始化客户端
const client = new CloudflareBrowserRenderingClient({
  accountId: 'your_account_id',
  apiToken: 'your_api_token'
});

// 截取网页截图
const screenshot = await client.screenshot('https://example.com');

// 保存文件（根据环境不同）
if (typeof Deno !== 'undefined') {
  // Deno环境
  await Deno.writeFile('example.png', screenshot);
} else if (typeof process !== 'undefined') {
  // Node.js环境
  const fs = await import('fs/promises');
  await fs.writeFile('example.png', screenshot);
} else {
  // 浏览器环境
  const blob = screenshot;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'example.png';
  a.click();
}
```

### 2. 生成PDF报告

#### Python版本
```python
# 生成PDF
pdf = client.pdf(
    url="https://example.com",
    format="a4",
    print_background=True,
    display_header_footer=True,
    header_template="<div style='text-align: center;'>月度报告</div>",
    footer_template="<div style='text-align: center;'>第 <span class='pageNumber'></span> 页</div>"
)

with open("report.pdf", "wb") as f:
    f.write(pdf)
```

#### JavaScript版本
```javascript
// 生成PDF
const pdf = await client.pdf('https://example.com', {
  format: 'a4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="text-align: center;">月度报告</div>',
  footerTemplate: '<div style="text-align: center;">第 <span class="pageNumber"></span> 页</div>'
});

// 保存PDF文件
if (typeof Deno !== 'undefined') {
  await Deno.writeFile('report.pdf', pdf);
} else if (typeof process !== 'undefined') {
  const fs = await import('fs/promises');
  await fs.writeFile('report.pdf', pdf);
}
```

### 3. 提取网页内容

#### Python版本
```python
# 获取渲染后的HTML
html = client.content("https://example.com")
print(html[:500])  # 打印前500个字符

# 转换为Markdown
markdown = client.markdown("https://example.com")
with open("content.md", "w", encoding="utf-8") as f:
    f.write(markdown)
```

#### JavaScript版本
```javascript
// 获取渲染后的HTML
const html = await client.content('https://example.com');
console.log(html.substring(0, 500)); // 打印前500个字符

// 转换为Markdown
const markdown = await client.markdown('https://example.com');

// 保存Markdown文件
if (typeof Deno !== 'undefined') {
  await Deno.writeTextFile('content.md', markdown);
} else if (typeof process !== 'undefined') {
  const fs = await import('fs/promises');
  await fs.writeFile('content.md', markdown, 'utf-8');
}
```

## 高级示例

### 1. 电商产品信息提取
```python
# 使用AI提取产品信息
products = client.json_extract(
    url="https://shop.example.com/products",
    response_format={
        "type": "object",
        "properties": {
            "products": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "price": {"type": "string"},
                        "image_url": {"type": "string"},
                        "description": {"type": "string"},
                        "availability": {"type": "string"}
                    },
                    "required": ["name", "price"]
                }
            }
        }
    }
)

# 保存结果
import json
with open("products.json", "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
```

### 2. 动态内容监控
```python
import time
from datetime import datetime

def monitor_page_changes(url, check_interval=3600):
    """监控页面变化"""
    last_content = None

    while True:
        try:
            # 获取当前内容
            current_content = client.content(url)

            if last_content and current_content != last_content:
                print(f"[{datetime.now()}] 页面内容已更新！")

                # 截图保存
                screenshot = client.screenshot(url)
                filename = f"change_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                with open(filename, "wb") as f:
                    f.write(screenshot)

                # 可以发送通知（邮件、Slack等）
                # send_notification(f"页面 {url} 已更新")

            last_content = current_content
            time.sleep(check_interval)

        except Exception as e:
            print(f"监控出错: {e}")
            time.sleep(60)  # 出错后等待1分钟

# 开始监控
monitor_page_changes("https://example.com/news")
```

### 3. 批量处理网站截图

#### Python版本
```python
from scripts.batch_processor import BatchProcessor

# 初始化批量处理器
processor = BatchProcessor(
    account_id="your_account_id",
    api_token="your_api_token",
    max_workers=3
)

# URL列表
websites = [
    "https://google.com",
    "https://github.com",
    "https://stackoverflow.com",
    "https://cloudflare.com"
]

# 批量截图
results = processor.batch_screenshots(
    urls=websites,
    output_dir="./screenshots",
    viewport={"width": 1920, "height": 1080, "deviceScaleFactor": 2},
    delay=2.0  # 请求间隔2秒
)

# 查看结果
for result in results:
    if result["status"] == "success":
        print(f"✓ {result['url']} -> {result['filepath']}")
    else:
        print(f"✗ {result['url']} -> 错误: {result['error']}")
```

#### JavaScript版本
```javascript
import { BatchProcessor } from './batch-processor.js';

// 初始化批量处理器
const processor = new BatchProcessor({
  accountId: 'your_account_id',
  apiToken: 'your_api_token',
  maxWorkers: 3
});

// URL列表
const websites = [
  'https://google.com',
  'https://github.com',
  'https://stackoverflow.com',
  'https://cloudflare.com'
];

// 批量截图
const results = await processor.batchScreenshots(websites, './screenshots', {
  viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
  delay: 2000  // 请求间隔2秒
});

// 查看结果
results.forEach(result => {
  if (result.status === 'success') {
    console.log(`✓ ${result.url} -> ${result.filepath}`);
  } else {
    console.log(`✗ ${result.url} -> 错误: ${result.error}`);
  }
});
```

### 4. SPA应用数据抓取
```python
# 等待动态内容加载
data = client.json_extract(
    url="https://spa-app.example.com/data",
    wait_for_selector=".data-loaded",  # 等待数据加载完成标识
    goto_options={
        "wait_until": "networkidle0",  # 等待网络空闲
        "timeout": 60000  // 60秒超时
    },
    prompt="提取表格中的所有数据，包括列名和每一行的值"
)
```

### 5. 认证页面截图
```python
# 使用cookies访问需要登录的页面
screenshot = client.screenshot(
    url="https://dashboard.example.com",
    cookies=[
        {
            "name": "session_id",
            "value": "abc123xyz",
            "domain": "example.com",
            "path": "/"
        },
        {
            "name": "auth_token",
            "value": "Bearer_eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
            "domain": "example.com"
        }
    ]
)
```

### 6. 自定义样式截图
```python
# 注入自定义CSS和JS
screenshot = client.screenshot(
    url="https://example.com",
    add_script_tag=[
        {
            "content": """
                // 隐藏不需要的元素
                document.querySelector('.advertisement').style.display = 'none';
                document.querySelector('.cookie-banner').style.display = 'none';

                // 添加水印
                const watermark = document.createElement('div');
                watermark.innerHTML = 'CONFIDENTIAL';
                watermark.style.cssText = 'position:fixed;top:10px;right:10px;color:red;font-size:20px;z-index:9999;';
                document.body.appendChild(watermark);
            """
        }
    ],
    add_style_tag=[
        {
            "content": """
                body {
                    font-family: 'Arial', sans-serif;
                    background-color: white !important;
                }
                .header {
                    background-color: #f0f0f0 !important;
                }
            """
        }
    ]
)
```

### 7. 响应式截图
```python
# 不同设备尺寸的截图
devices = [
    {"name": "mobile", "width": 375, "height": 667, "deviceScaleFactor": 2},
    {"name": "tablet", "width": 768, "height": 1024, "deviceScaleFactor": 2},
    {"name": "desktop", "width": 1920, "height": 1080, "deviceScaleFactor": 1}
]

for device in devices:
    screenshot = client.screenshot(
        url="https://example.com",
        viewport=device,
        full_page=False  // 只截取视口区域
    )

    filename = f"responsive_{device['name']}.png"
    with open(filename, "wb") as f:
        f.write(screenshot)
```

### 8. 网页存档（快照）
```python
# 同时获取截图和HTML
snapshot = client.snapshot(
    url="https://important-page.com",
    full_page=True
)

# 保存截图
with open("snapshot.png", "wb") as f:
    f.write(snapshot['screenshot'])

# 保存HTML
with open("snapshot.html", "w", encoding="utf-8") as f:
    f.write(snapshot['html'])

print(f"浏览器使用时间: {snapshot['browser_ms_used']}ms")
```

### 9. 链接提取和验证
```python
# 提取所有链接
links = client.links("https://example.com")

# 验证链接状态
import requests

valid_links = []
broken_links = []

for link in links:
    try:
        response = requests.head(link, timeout=10)
        if response.status_code < 400:
            valid_links.append(link)
        else:
            broken_links.append({
                'url': link,
                'status_code': response.status_code
            })
    except Exception as e:
        broken_links.append({
            'url': link,
            'error': str(e)
        })

print(f"有效链接: {len(valid_links)}")
print(f"失效链接: {len(broken_links)}")
```

### 10. 新闻文章提取
```python
# 提取新闻内容
article = client.json_extract(
    url="https://news.example.com/article123",
    prompt="""提取新闻文章的以下信息：
    - 标题
    - 作者
    - 发布日期
    - 正文内容（前3段）
    - 相关标签或分类
    - 文章URL

    请以中文返回结果。""",
    wait_for_selector="article"
)

# 保存为Markdown格式
markdown_content = f"""# {article['title']}

**作者**: {article['author']}
**发布日期**: {article['publish_date']}
**分类**: {', '.join(article['tags'])}

---

{article['content']}

原文链接: {article['url']}
"""

with open(f"{article['title'][:30]}.md", "w", encoding="utf-8") as f:
    f.write(markdown_content)
```

## 性能优化示例

### 1. 资源过滤配置
```python
# 阻止不必要的资源加载
content = client.content(
    url="https://heavy-site.com",
    reject_resource_types=[
        "image",
        "stylesheet",
        "font",
        "media",
        "websocket"
    ],
    reject_request_pattern=[
        ".*\\.css$",
        ".*\\.woff.*$",
        ".*\\.png$",
        ".*\\.jpg$",
        ".*analytics.*",
        ".*tracking.*"
    ]
)
```

### 2. 并发请求优化
```python
from concurrent.futures import ThreadPoolExecutor
import threading

class OptimizedClient:
    def __init__(self, account_id, api_token, max_workers=5):
        self.clients = [
            CloudflareBrowserRenderingClient(account_id, api_token)
            for _ in range(max_workers)
        ]
        self.semaphore = threading.Semaphore(max_workers)

    def process_url(self, url, client_index=0):
        with self.semaphore:
            client = self.clients[client_index % len(self.clients)]
            return client.screenshot(url)

# 使用线程池处理
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = []
    for i, url in enumerate(urls):
        future = executor.submit(optimized_client.process_url, url, i)
        futures.append(future)

    for future in as_completed(futures):
        screenshot = future.result()
        # 处理截图...
```