# AI Artwork Generation for Question Sets

## Overview
This feature will integrate OpenAI's DALL-E 3 image generation API to automatically create custom artwork for question sets based on the musical content and themes.

## Technical Implementation

### API Integration
1. **OpenAI Image Generation Endpoint**
   - Model: `dall-e-3` (latest ChatGPT image generation model)
   - API Route: `/api/ai/generate-artwork`
   - Image specifications:
     - Size: 1024x1024 (square format for consistency)
     - Quality: "standard" (or "hd" for premium users)
     - Style: "vivid" for more artistic interpretations

2. **Cost Considerations**
   - DALL-E 3 pricing: ~$0.040 per 1024x1024 standard image
   - ~$0.080 per 1024x1024 HD image
   - Implement credits system or rate limiting

## Feature Design

### User Interface
1. **Generate AI Artwork Button**
   - Located in artwork upload section
   - Shows alongside manual upload option
   - Disabled if no songs selected

2. **Generation Options**
   - Style selector: "Abstract", "Realistic", "Artistic", "Minimalist"
   - Color scheme: "Vibrant", "Dark", "Pastel", "Monochrome"
   - Optional theme input for additional guidance

3. **Preview and Selection**
   - Show generated image preview
   - Options to regenerate or accept
   - Ability to generate multiple variations

### Prompt Generation Strategy

The AI will analyze the question set to create contextual prompts:

```typescript
interface ArtworkPromptData {
  songs: Array<{ name: string; artist: string; genre?: string }>
  gameType: 'guess_artist' | 'guess_song'
  theme?: string // User-provided theme
  style?: 'abstract' | 'realistic' | 'artistic' | 'minimalist'
  colorScheme?: 'vibrant' | 'dark' | 'pastel' | 'monochrome'
}
```

#### Example Prompt Templates

1. **Genre-Based**
   ```
   Create album artwork for a [genre] music collection featuring:
   - Musical elements: [instruments, symbols]
   - Mood: [energetic/calm/nostalgic]
   - Style: [selected style]
   - Color scheme: [selected colors]
   No text or words in the image.
   ```

2. **Era-Based**
   ```
   Design cover art inspired by [decade] music aesthetics:
   - Visual elements from the [decade]
   - [Artist names] influenced imagery
   - Style: [selected style]
   - No text or typography
   ```

3. **Mood-Based**
   ```
   Abstract representation of [mood/theme]:
   - Musical notes and instruments as design elements
   - [Color scheme] palette
   - [Style] artistic approach
   - No text or lettering
   ```

## Implementation Steps

### Phase 1: Backend Infrastructure
1. Create image generation service
2. Implement prompt builder based on songs
3. Add image upload to Supabase storage
4. Create API endpoint with auth and rate limiting

### Phase 2: Frontend Integration
1. Add "Generate AI Artwork" button to question set builder
2. Create artwork generation modal with options
3. Implement preview and selection UI
4. Add loading states and error handling

### Phase 3: Storage & Management
1. Upload generated images to Supabase Storage
2. Save image URL to question set
3. Implement image history/variations
4. Add cleanup for unused images

## API Endpoint Design

### Request
```typescript
POST /api/ai/generate-artwork
{
  songs: Song[],
  gameType: string,
  style?: string,
  colorScheme?: string,
  userTheme?: string
}
```

### Response
```typescript
{
  imageUrl: string,
  prompt: string, // For transparency
  remaining: number // Rate limit info
}
```

## Workflow

1. User clicks "Generate AI Artwork"
2. Modal opens with style options
3. User selects preferences and optional theme
4. System generates smart prompt based on:
   - Song titles, artists, and genres
   - Common themes across songs
   - User preferences
5. DALL-E 3 generates image
6. Preview shown to user
7. User can accept, regenerate, or cancel
8. Accepted image uploaded to storage
9. URL saved to question set

## Smart Prompt Examples

### For 80s Rock Collection
```
"Retro 80s album cover art with electric guitars, neon colors, and geometric shapes. Vibrant purple and pink gradient background with chrome reflections. Abstract musical energy. No text or words."
```

### For Classical Music Set
```
"Elegant classical music artwork featuring orchestral instruments in watercolor style. Soft golden tones with violin, piano, and sheet music elements artistically arranged. Minimalist composition. No text."
```

### For Summer Pop Hits
```
"Bright summer music festival vibes with abstract beach elements, palm trees silhouettes, and musical notes floating in sunset colors. Energetic and playful composition. No typography."
```

## Rate Limiting & Cost Control

1. **Free Tier**: 3 generations per day
2. **Pro Tier**: 20 generations per day
3. **Track usage per user in database**
4. **Show remaining credits in UI**
5. **Option to purchase additional credits**

## Error Handling

1. Content policy violations → Retry with modified prompt
2. Rate limits exceeded → Show upgrade options
3. Generation failures → Fallback to generic music artwork
4. Network errors → Retry with exponential backoff

## Future Enhancements

1. **Multiple Variations**: Generate 4 options at once
2. **Style Learning**: Learn user preferences over time
3. **Batch Generation**: Generate artwork for multiple sets
4. **Custom Styles**: Save and reuse successful prompts
5. **Community Gallery**: Share generated artwork styles