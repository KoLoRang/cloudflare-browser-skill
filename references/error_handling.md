# Cloudflare Browser Rendering API Error Handling Guide

## Common Error Codes and Solutions

### 1. Authentication Errors

#### 401 Unauthorized
```json
{
  "success": false,
  "errors": [
    {
      "code": 10000,
      "message": "Authentication error"
    }
  ]
}
```
**Cause**: Invalid or expired API Token
**Solution**:
- Check if API Token is correct
- Confirm Token has Browser Rendering permissions
- Regenerate Token in Cloudflare console

### 2. Request Errors

#### 400 Bad Request
```json
{
  "success": false,
  "errors": [
    {
      "code": 10020,
      "message": "Invalid request format"
    }
  ]
}
```
**Common Causes**:
- Incorrect request body format (must be JSON)
- Missing required parameters (url or html)
- Incorrect parameter types

**Solution**:
- Validate JSON format
- Check required parameters
- Confirm correct parameter types

### 3. Page Load Errors

#### Timeout Error
```json
{
  "success": false,
  "errors": [
    {
      "code": 10030,
      "message": "Page load timeout"
    }
  ]
}
```
**Solution**:
```json
{
  "url": "https://slow-site.com",
  "gotoOptions": {
    "timeout": 60000,
    "waitUntil": "networkidle2"
  }
}
```

#### Navigation Error
```json
{
  "success": false,
  "errors": [
    {
      "code": 10031,
      "message": "Navigation failed"
    }
  ]
}
```
**Common Causes**:
- URL is inaccessible
- SSL certificate error
- Too many redirects

**Solution**:
- Check if URL is correct
- Verify website SSL certificate
- Test with HTTP instead of HTTPS

### 4. Element Selection Errors

#### Element Not Found
```json
{
  "success": false,
  "errors": [
    {
      "code": 10040,
      "message": "Element not found"
    }
  ]
}
```
**Solution**:
```json
{
  "url": "https://example.com",
  "selector": "#dynamic-content",
  "waitForSelector": "#dynamic-content",
  "gotoOptions": {
    "waitUntil": "networkidle0"
  }
}
```

### 5. Resource Limit Errors

#### Rate Limit Exceeded
```json
{
  "success": false,
  "errors": [
    {
      "code": 10050,
      "message": "Rate limit exceeded"
    }
  ]
}
```
**Solution**:
- Reduce request frequency
- Implement exponential backoff retry
- Use batch processing to reduce number of requests

#### Browser Time Quota Exceeded
```json
{
  "success": false,
  "errors": [
    {
      "code": 10051,
      "message": "Browser time quota exceeded"
    }
  ]
}
```
**Solution**:
- Optimize page loading (block unnecessary resources)
- Reduce processing of complex pages
- Upgrade service plan

## Error Handling Best Practices

### 1. Retry Mechanism
```python
import time
import random

def retry_request(func, max_retries=3, base_delay=1.0):
    """Exponential backoff retry mechanism"""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e

            # Exponential backoff + random jitter
            delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
            print(f"Request failed, retrying in {delay:.1f}s (attempt {attempt + 1})")
            time.sleep(delay)
```

### 2. Parameter Validation
```python
def validate_screenshot_params(params):
    """Validate screenshot parameters"""
    required_fields = []

    if 'url' not in params and 'html' not in params:
        required_fields.append("url or html")

    if 'viewport' in params:
        viewport = params['viewport']
        if not all(k in viewport for k in ['width', 'height']):
            raise ValueError("viewport must contain width and height")

        if viewport['width'] <= 0 or viewport['height'] <= 0:
            raise ValueError("viewport width and height must be greater than 0")

    if required_fields:
        raise ValueError(f"Missing required parameters: {', '.join(required_fields)}")
```

### 3. Timeout Handling
```python
import signal

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("Request timeout")

def make_request_with_timeout(request_func, timeout=30):
    """Request handling with timeout"""
    # Set signal handler
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout)

    try:
        result = request_func()
        signal.alarm(0)  # Cancel alarm
        return result
    except TimeoutError:
        raise TimeoutError(f"Request did not complete within {timeout} seconds")
    finally:
        signal.alarm(0)  # Ensure alarm is cancelled
```

### 4. Logging
```python
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('browser_rendering.log'),
        logging.StreamHandler()
    ]
)

def log_request(endpoint, params, response_time=None, error=None):
    """Log request"""
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'endpoint': endpoint,
        'params': params,
        'response_time_ms': response_time,
        'error': str(error) if error else None
    }

    if error:
        logging.error(f"API request failed: {json.dumps(log_data, ensure_ascii=False)}")
    else:
        logging.info(f"API request successful: {json.dumps(log_data, ensure_ascii=False)}")
```

## Performance Optimization Recommendations

### 1. Resource Filtering
```json
{
  "url": "https://example.com",
  "rejectResourceTypes": ["image", "stylesheet", "font", "media"],
  "rejectRequestPattern": [
    ".*\\.css$",
    ".*\\.woff$",
    ".*\\.png$",
    ".*analytics.*"
  ]
}
```

### 2. Wait Strategy
```json
{
  "url": "https://spa-app.com",
  "gotoOptions": {
    "waitUntil": "networkidle2",
    "timeout": 30000
  },
  "waitForSelector": "#main-content"
}
```

### 3. Viewport Optimization
```json
{
  "viewport": {
    "width": 1920,
    "height": 1080,
    "deviceScaleFactor": 1
  }
}
```

## Monitoring and Debugging

### 1. Monitor Using Response Headers
```python
def monitor_browser_usage(response):
    """Monitor browser usage"""
    browser_time = response.headers.get('X-Browser-Ms-Used')
    if browser_time:
        print(f"Browser time used for this request: {browser_time}ms")

        # Log high-latency requests
        if int(browser_time) > 5000:
            logging.warning(f"High-latency request: {browser_time}ms")
```

### 2. Categorized Error Handling
```python
def handle_api_error(error_response):
    """Handle API errors by category"""
    error_code = error_response.get('errors', [{}])[0].get('code')

    error_handlers = {
        '10000': lambda: print("Please check API Token"),
        '10020': lambda: print("Please check request format"),
        '10030': lambda: print("Please increase timeout"),
        '10040': lambda: print("Please check selector or wait for element to load"),
        '10050': lambda: print("Too many requests, please reduce frequency"),
        '10051': lambda: print("Browser time quota insufficient, please optimize requests")
    }

    handler = error_handlers.get(error_code)
    if handler:
        handler()
    else:
        print(f"Unknown error: {error_response}")
```
