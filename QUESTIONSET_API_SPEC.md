# Question Set API Specification

## Overview
The Question Set API provides endpoints for managing trivia question sets with support for artwork uploads. This document outlines the available endpoints, data structures, and usage examples.

## Base URL
```
https://rntlhdlzijhdujpxsxzl.supabase.co
```

## Authentication
All endpoints require authentication via Supabase Auth tokens passed in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Data Models

### QuestionSet
```typescript
interface QuestionSet {
  id: string;                    // UUID
  user_id: string;               // UUID (owner)
  name: string;                  // Required
  description: string | null;    // Optional
  difficulty: 'easy' | 'medium' | 'hard';
  is_public: boolean;            // Default: false
  tags: string[] | null;         // Optional array of tags
  artwork_url: string | null;    // NEW: URL to uploaded artwork
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

### Question
```typescript
interface Question {
  id: string;                    // UUID
  question_set_id: string;       // UUID (foreign key)
  type: 'multiple_choice' | 'true_false' | 'fill_in_the_blank';
  question: string;              // The question text
  answer: string;                // Correct answer
  wrong_answers: string[];       // Array of incorrect answers
  hint: string | null;           // Optional hint
  order_index: number;           // Question order in set
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

## Endpoints

### 1. List Question Sets
**GET** `/rest/v1/question_sets`

Returns all question sets for the authenticated user.

**Query Parameters:**
- `select=*,questions(*)` - Include related questions
- `order=created_at.desc` - Sort by creation date (newest first)
- `is_public=eq.true` - Filter public sets only

**Example Request:**
```bash
curl -X GET \
  "https://rntlhdlzijhdujpxsxzl.supabase.co/rest/v1/question_sets?select=*,questions(*)&order=created_at.desc" \
  -H "Authorization: Bearer <token>" \
  -H "apikey: <anon_key>"
```

**Example Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "79e4c84b-a24e-4fcf-a736-4a30ca48a444",
    "name": "80s Music Trivia",
    "description": "Test your knowledge of 1980s music",
    "difficulty": "medium",
    "is_public": true,
    "tags": ["music", "80s", "pop culture"],
    "artwork_url": "https://rntlhdlzijhdujpxsxzl.supabase.co/storage/v1/object/public/question-set-artwork/123e4567-e89b-12d3-a456-426614174000/artwork.jpg",
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-10T10:00:00Z",
    "questions": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "question_set_id": "123e4567-e89b-12d3-a456-426614174000",
        "type": "multiple_choice",
        "question": "Who sang 'Take On Me'?",
        "answer": "a-ha",
        "wrong_answers": ["Duran Duran", "Depeche Mode", "The Police"],
        "hint": "Norwegian band",
        "order_index": 0,
        "created_at": "2025-01-10T10:00:00Z",
        "updated_at": "2025-01-10T10:00:00Z"
      }
    ]
  }
]
```

### 2. Get Single Question Set
**GET** `/rest/v1/question_sets?id=eq.<question_set_id>`

**Example Request:**
```bash
curl -X GET \
  "https://rntlhdlzijhdujpxsxzl.supabase.co/rest/v1/question_sets?id=eq.123e4567-e89b-12d3-a456-426614174000&select=*,questions(*)" \
  -H "Authorization: Bearer <token>" \
  -H "apikey: <anon_key>"
```

### 3. Create Question Set
**POST** `/rest/v1/question_sets`

**Request Body:**
```json
{
  "name": "90s Movies",
  "description": "Test your knowledge of 90s cinema",
  "difficulty": "hard",
  "is_public": false,
  "tags": ["movies", "90s", "entertainment"]
}
```

**Note:** Questions must be created separately after the question set is created.

### 4. Update Question Set
**PATCH** `/rest/v1/question_sets?id=eq.<question_set_id>`

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "difficulty": "easy",
  "is_public": true,
  "tags": ["updated", "tags"],
  "artwork_url": "https://..."
}
```

### 5. Delete Question Set
**DELETE** `/rest/v1/question_sets?id=eq.<question_set_id>`

**Note:** This will cascade delete all associated questions.

### 6. Upload Artwork
**POST** `/storage/v1/object/question-set-artwork/<question_set_id>/artwork.<ext>`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: image/jpeg (or image/png, image/webp)
```

**Body:** Binary image data

**Example Request:**
```bash
curl -X POST \
  "https://rntlhdlzijhdujpxsxzl.supabase.co/storage/v1/object/question-set-artwork/123e4567-e89b-12d3-a456-426614174000/artwork.jpg" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: image/jpeg" \
  --data-binary @artwork.jpg
```

**Response:**
```json
{
  "Key": "question-set-artwork/123e4567-e89b-12d3-a456-426614174000/artwork.jpg"
}
```

**After uploading, update the question set with the public URL:**
```
artwork_url: "https://rntlhdlzijhdujpxsxzl.supabase.co/storage/v1/object/public/question-set-artwork/123e4567-e89b-12d3-a456-426614174000/artwork.jpg"
```

## Storage Bucket Configuration
- **Bucket Name:** `question-set-artwork`
- **Public Access:** Yes (for serving images)
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`
- **Max File Size:** 5MB
- **File Structure:** `/<question_set_id>/artwork.<extension>`

## iOS Implementation Notes

### 1. Displaying Artwork
When a question set has an `artwork_url`, display it in your UI. The URLs are publicly accessible and don't require authentication headers for viewing.

```swift
if let artworkURLString = questionSet.artworkUrl,
   let url = URL(string: artworkURLString) {
    // Load and display image
    imageView.load(url: url)
}
```

### 2. Uploading Artwork
1. First create/update the question set
2. Upload the image to the storage bucket
3. Update the question set with the artwork URL

### 3. Handling Missing Artwork
The `artwork_url` field can be null. Always provide a default/placeholder image in your UI.

### 4. Image Caching
Since artwork URLs are stable, implement client-side caching to improve performance.

## Example iOS Flow

```swift
// 1. Fetch question sets with artwork
func fetchQuestionSets() async throws -> [QuestionSet] {
    let response = await supabase
        .from("question_sets")
        .select("*, questions(*)")
        .order("created_at", ascending: false)
        .execute()
    
    return response.data
}

// 2. Upload artwork for a question set
func uploadArtwork(for questionSetId: String, image: UIImage) async throws -> String {
    guard let imageData = image.jpegData(compressionQuality: 0.8) else {
        throw UploadError.invalidImage
    }
    
    let path = "\(questionSetId)/artwork.jpg"
    
    let response = await supabase.storage
        .from("question-set-artwork")
        .upload(path: path, data: imageData)
    
    // Construct public URL
    let publicURL = "\(supabaseURL)/storage/v1/object/public/question-set-artwork/\(path)"
    
    // Update question set with artwork URL
    await supabase
        .from("question_sets")
        .update(["artwork_url": publicURL])
        .eq("id", questionSetId)
        .execute()
    
    return publicURL
}
```

## Best Practices

1. **Image Optimization:** Resize images before upload to reduce bandwidth
2. **Error Handling:** Always handle cases where artwork_url is null
3. **Caching:** Implement image caching to reduce network requests
4. **Loading States:** Show placeholders while images load
5. **Accessibility:** Provide alt text for images based on question set name/description

## Rate Limits
- Storage uploads: 100 requests per minute per IP
- API requests: 1000 requests per minute per IP

## Support
For issues or questions, contact the backend team or refer to the Supabase documentation.