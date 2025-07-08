# Vercel Deployment Guide

This guide walks through deploying the Guess That Tune Admin application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`
3. All environment variables ready
4. Supabase project set up with migrations applied

## Environment Variables

### Required Variables

Add these in your Vercel project settings under "Environment Variables":

#### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

#### Apple Music API
- `APPLE_TEAM_ID` - Your Apple Developer Team ID
- `APPLE_KEY_ID` - Your Apple Music API Key ID
- `APPLE_PRIVATE_KEY` - Your Apple Music private key (include the full key with headers)

### Getting Your Environment Variables

1. **Supabase Variables:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Apple Music Variables:**
   - Log in to Apple Developer account
   - Navigate to Certificates, Identifiers & Profiles > Keys
   - Create or use existing MusicKit key
   - Note your Team ID from the account membership page

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "Next.js" as the framework (should auto-detect)

2. **Configure Project**
   - Project Name: `guess-that-tune-admin` (or your preference)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Add Environment Variables**
   - Click "Environment Variables"
   - Add each variable listed above
   - For multi-line values (like APPLE_PRIVATE_KEY), paste the entire content

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Confirm settings
   - Deploy

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add APPLE_TEAM_ID
   vercel env add APPLE_KEY_ID
   vercel env add APPLE_PRIVATE_KEY
   ```

## Post-Deployment Setup

### 1. Update Supabase Allowed URLs

In your Supabase project:
1. Go to Authentication > URL Configuration
2. Add your Vercel URLs to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: 
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app`

### 2. Configure Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with your custom domain

### 3. Set Up Environment for Different Stages

Vercel supports different environments. Configure variables for:
- Production
- Preview (for pull requests)
- Development (optional)

## Monitoring and Maintenance

### Check Deployment Health

1. **Function Logs**
   - View in Vercel dashboard under "Functions" tab
   - Monitor for errors or timeouts

2. **Analytics**
   - Enable Vercel Analytics for performance monitoring
   - Check Core Web Vitals

3. **Error Tracking**
   - Consider integrating Sentry or similar
   - Monitor the `/api/error/log` endpoint

### Common Issues and Solutions

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Environment Variable Issues**
   - Double-check variable names (case-sensitive)
   - Ensure multi-line values are properly formatted
   - Verify variables are set for the correct environment

3. **Supabase Connection Issues**
   - Verify Supabase project is not paused
   - Check URL and key are correct
   - Ensure RLS policies allow necessary access

4. **Function Timeouts**
   - Default timeout is 10s (Hobby), 60s (Pro)
   - Optimize long-running queries
   - Consider background jobs for heavy operations

## Deployment Workflow

### For Updates

1. **Automatic Deployments**
   - Push to main branch triggers production deployment
   - Pull requests create preview deployments

2. **Manual Deployments**
   ```bash
   vercel --prod  # Deploy to production
   vercel         # Create preview deployment
   ```

### Rollbacks

1. In Vercel dashboard, go to "Deployments"
2. Find previous working deployment
3. Click "..." menu and select "Promote to Production"

## Security Considerations

1. **Never commit `.env.local` file**
2. **Use Vercel's environment variables** for all secrets
3. **Enable Vercel Authentication** for preview deployments if needed
4. **Regularly rotate API keys** and update in Vercel

## Performance Optimization

1. **Enable Vercel Edge Functions** where appropriate
2. **Use ISR (Incremental Static Regeneration)** for semi-static content
3. **Configure caching headers** for API routes
4. **Monitor bundle size** with Vercel Analytics

## Troubleshooting Checklist

- [ ] All environment variables are set correctly
- [ ] Supabase project is active and accessible
- [ ] Build completes successfully locally (`npm run build`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Database migrations are up to date
- [ ] Redirect URLs are configured in Supabase
- [ ] Apple Music API credentials are valid