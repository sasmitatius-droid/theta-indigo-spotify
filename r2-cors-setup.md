# Cloudflare R2 CORS Configuration

## Setup Instructions

### 1. Create R2 Bucket
1. Go to Cloudflare Dashboard → R2 → Create Bucket
2. Name it: `theta-indigo-images` (or your preferred name)
3. Click "Create bucket"

### 2. Configure CORS Rules
1. Go to your R2 bucket settings
2. Click on "Settings" tab
3. Scroll down to "CORS Policy"
4. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Get API Credentials
1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create a new API token with:
   - Permissions: Object Read & Write
   - TTL: Use your preferred expiration
3. Save the Access Key ID and Secret Access Key

### 4. Update Environment Variables
Add these to your `.env.local` file:

```env
# R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=theta-indigo-images
R2_PUBLIC_URL=https://your-bucket-url.r2.cloudflarestorage.com
```

### 5. Install R2 SDK (Optional)
If you want to use the official AWS S3 SDK for R2:

```bash
npm install @aws-sdk/client-s3
```

### 6. Test CORS Configuration
You can test CORS using curl:

```bash
curl -X OPTIONS http://localhost:3000/api/upload \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

## Recommended AI Tools for Spiritual Readings

### Option 1: OpenAI GPT-4 (Recommended)
**Pros:**
- Best quality spiritual readings
- Excellent at following complex prompts
- Fast and reliable
- Good at nuanced, mystical language

**Cons:**
- Higher cost (~$0.01-0.03 per reading)
- Requires API key

**Setup:**
```env
OPENAI_API_KEY=your_openai_api_key
```

**Recommended Model:** `gpt-4-turbo-preview` or `gpt-3.5-turbo` (budget)

### Option 2: Anthropic Claude 3 (Alternative)
**Pros:**
- More human-like, nuanced responses
- Excellent at spiritual/philosophical content
- Good at maintaining consistent tone

**Cons:**
- Higher cost (~$0.015-0.075 per reading)
- Slightly slower than GPT-4

**Setup:**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Recommended Model:** `claude-3-opus-20240229` or `claude-3-sonnet-20240229` (budget)

### Option 3: Cohere Command (Budget-Friendly)
**Pros:**
- Lower cost (~$0.001-0.003 per reading)
- Good for structured outputs
- Fast response times

**Cons:**
- Less nuanced than GPT-4/Claude
- May require more prompt engineering

**Setup:**
```env
COHERE_API_KEY=your_cohere_api_key
```

**Recommended Model:** `command`

### Option 4: Local LLM with Ollama (Free)
**Pros:**
- Completely free
- Privacy-focused (data stays local)
- No API costs
- Can run offline

**Cons:**
- Requires GPU or good CPU
- Setup complexity
- May be slower
- Quality depends on model

**Setup:**
1. Install Ollama: https://ollama.ai
2. Run: `ollama pull llama3` or `ollama pull mistral`
3. Start Ollama server
4. Configure in app to use `http://localhost:11434`

**Recommended Models:**
- `llama3` (best overall)
- `mistral` (good balance)
- `phi3` (lightweight, fast)

## My Recommendation

**For Production:** Use OpenAI GPT-4 Turbo
- Best quality for spiritual readings
- Reasonable cost
- Reliable and fast

**For Development/Testing:** Use OpenAI GPT-3.5 Turbo
- Lower cost
- Good enough for testing
- Easy to switch to GPT-4 later

**For Budget-Conscious:** Use Cohere Command
- Very low cost
- Good quality for the price
- Still produces meaningful readings

**For Privacy/Free:** Use Ollama with Llama 3
- Completely free
- No data leaves your server
- Good quality open-source model

## Example Implementation

See `lib/ai-service.ts` for implementation examples of all providers.
