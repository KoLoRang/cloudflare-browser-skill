# Configuration Files

This directory contains configuration files for the Cloudflare Browser Rendering API.

## File Descriptions

### config_template.json
Configuration file template containing all configurable options and default values. This file can be safely committed to version control.

### config.json
The actual configuration file used, containing your API credentials. **This file should NOT be committed to version control**.

## First-Time Configuration

### Method 1: Use Configuration Helper (Recommended)

```bash
# Node.js
node ../scripts/setup-config.js

# Deno
deno run --allow-read --allow-write ../scripts/setup-config.js
```

### Method 2: Manual Configuration

1. Copy the template file:
```bash
cp config_template.json config.json
```

2. Edit `config.json` and fill in your credentials:
   - `account_id`: Your Cloudflare Account ID
   - `api_token`: API Token with Browser Rendering permissions

## Get API Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **My Profile** > **API Tokens**
3. Click **Create Token**
4. Select **Custom Token** template
5. Add permission: **Account** > **Browser Rendering** > **Edit**
6. Create and save the Token

## Configuration Options

### Basic Credentials
- `account_id`: Cloudflare Account ID (required)
- `api_token`: API Token (required)

### Default Settings
- `default_settings.viewport`: Default viewport configuration
- `default_settings.goto_options`: Page loading options
- `default_settings.performance_optimization`: Performance optimization settings

### Feature-Specific Options
- `screenshot_options`: Screenshot default options
- `pdf_options`: PDF generation default options
- `content_extraction`: Content extraction options
- `ai_extraction`: Default prompts for AI extraction

## Security Tips

⚠️ **Important**:
- `config.json` contains sensitive information, do not share or commit to version control
- This file has been automatically added to `.gitignore`
- Regularly update your API Token
- Use the principle of least privilege when configuring Tokens

## Troubleshooting

### Configuration File Does Not Exist
If you get an error that the configuration file doesn't exist, run the configuration helper or manually create the configuration file first.

### Authentication Failed
- Check if `account_id` is correct
- Verify that `api_token` has Browser Rendering permissions
- Confirm the Token has not expired

### Configuration Format Error
Ensure `config.json` is valid JSON format. You can use a JSON validator to check.
