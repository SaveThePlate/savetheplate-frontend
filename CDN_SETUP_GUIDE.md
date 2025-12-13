# CDN Setup Guide for Image Delivery

This guide explains how to set up a CDN (Content Delivery Network) to serve images faster to users worldwide.

## Why Use a CDN?

- **Faster Image Delivery**: Images served from edge locations closer to users
- **Reduced Server Load**: Offloads image serving from your backend
- **Better Performance**: Lower latency, especially for international users
- **Cost Effective**: Many CDN providers offer generous free tiers

## Recommended CDN Options

### 1. Cloudflare (Recommended - Free Tier Available)
- **Free Tier**: Unlimited bandwidth, global CDN
- **Setup**: Point your domain to Cloudflare, enable CDN
- **Best For**: Quick setup, no additional cost

### 2. Cloudflare R2 (Object Storage + CDN)
- **Cost**: Very affordable, pay-as-you-go
- **Setup**: Upload images to R2, serve via CDN
- **Best For**: Long-term scalable solution

### 3. AWS CloudFront + S3
- **Cost**: Pay-per-use, can be expensive at scale
- **Setup**: Upload to S3, serve via CloudFront
- **Best For**: Enterprise applications already on AWS

### 4. DigitalOcean Spaces + CDN
- **Cost**: $5/month + bandwidth
- **Setup**: Upload to Spaces, enable CDN
- **Best For**: If already using DigitalOcean

## Implementation Steps

### Option A: Cloudflare (Simplest)

1. **Sign up for Cloudflare** (free account)
2. **Add your domain** to Cloudflare
3. **Update DNS** to point to Cloudflare nameservers
4. **Enable CDN** in Cloudflare dashboard
5. **Configure caching rules**:
   - Images: Cache for 1 year
   - Add cache headers in backend

### Option B: Cloudflare R2 (Recommended for Production)

1. **Create R2 bucket** in Cloudflare dashboard
2. **Update backend** to upload images to R2 instead of local storage
3. **Configure public access** for images
4. **Use R2 CDN URL** for image serving

### Backend Changes Needed

Update `storage.service.ts` to upload to R2:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 is S3-compatible
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadToR2(file: Buffer, filename: string) {
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: filename,
    Body: file,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000', // 1 year
  }));
  
  // Return public CDN URL
  return `https://${process.env.R2_PUBLIC_DOMAIN}/${filename}`;
}
```

### Frontend Changes Needed

Update image URL construction to use CDN URLs:

```typescript
// In AddOffer.tsx, CustomCard.tsx, ProviderOfferCard.tsx
const imageUrl = uploadedImage.absoluteUrl || 
  `${process.env.NEXT_PUBLIC_CDN_URL}/${uploadedImage.filename}`;
```

## Environment Variables

Add to your `.env` files:

```bash
# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_DOMAIN=your-public-domain.r2.cloudflarestorage.com
```

## Cache Headers

Ensure your backend sets proper cache headers:

```typescript
// In storage.controller.ts
@Get('*')
seeUploadedFile(@Req() req: Request, @Res() res) {
  // ... existing code ...
  
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/jpeg'); // or image/png
  
  return res.sendFile(filename, { root });
}
```

## Migration Strategy

1. **Phase 1**: Set up CDN, keep current storage
2. **Phase 2**: Upload new images to CDN
3. **Phase 3**: Migrate existing images gradually
4. **Phase 4**: Switch all image serving to CDN

## Testing

After setup, test image loading:
- Check network tab for CDN URLs
- Verify cache headers
- Test from different locations (use VPN)
- Monitor CDN analytics

## Cost Estimation

**Cloudflare R2** (example):
- Storage: $0.015/GB/month
- Egress: $0.01/GB (first 10GB free)
- Operations: $4.50/million Class A, $0.36/million Class B

**For 1000 images (~500MB)**:
- Storage: ~$0.0075/month
- Egress: Free (under 10GB)
- **Total: ~$0.01/month**

## Next Steps

1. Choose a CDN provider
2. Set up account and bucket
3. Update backend storage service
4. Update frontend image URLs
5. Test and monitor performance

For questions or issues, refer to the CDN provider's documentation.

