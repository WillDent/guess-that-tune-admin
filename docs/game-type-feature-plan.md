# Game Type Feature Implementation Plan

## Overview
Implement a feature that allows creating question sets with different game types:
- **Guess the Artist**: Players guess the artist name (current default)
- **Guess the Song**: Players guess the song name

## Implementation Status: 90% Complete ✅
All core functionality has been implemented. Only end-to-end testing remains.

## Current State Analysis
- Question sets store correct song details (id, name, artist, album, artwork, preview_url)
- Detractors are stored as JSON array with wrong answers
- Game logic assumes players are always guessing the artist
- All detractors are currently artist names

## Implementation Tasks

### Phase 1: Database Changes ✅
- [x] Create database migration to add `game_type` column to `question_sets` table
- [x] Update database types in TypeScript
- [x] Test migration on development branch
- [x] Validate RLS policies still work correctly

### Phase 2: Backend API Changes ✅
- [x] Update question generation API to accept game type parameter
- [x] Modify detractor generation logic:
  - For "guess_artist": Generate artist name detractors (current behavior)
  - For "guess_song": Generate song title detractors
- [x] Update question set creation API to save game type
- [x] Modify game completion logic to check answers based on game type

### Phase 3: Frontend UI Changes ✅
- [x] Add game type selector to create question set form
- [x] Update edit question set form to show/change game type
- [x] Add game type indicator on question set cards
- [x] Update game play interface to show appropriate labels
- [x] Modify answer selection to display correct options

### Phase 4: Testing & Validation
- [ ] Test creating question sets with both game types
- [ ] Verify game play works correctly for each type
- [ ] Test editing existing question sets
- [ ] Validate mobile app compatibility
- [ ] Performance testing with new queries

## Technical Details

### Database Schema Change
```sql
ALTER TABLE question_sets 
ADD COLUMN game_type TEXT DEFAULT 'guess_artist' 
CHECK (game_type IN ('guess_artist', 'guess_song'));
```

### TypeScript Types
```typescript
type GameType = 'guess_artist' | 'guess_song';

interface QuestionSet {
  // ... existing fields
  game_type: GameType;
}
```

### API Changes
1. **Question Generation** (`/api/questions/generate`):
   - Accept `gameType` parameter
   - Generate appropriate detractors based on type

2. **Question Set Creation** (`/api/questions`):
   - Save `game_type` field
   - Default to 'guess_artist' for backward compatibility

3. **Game Logic** (`/api/game/complete`):
   - Check answers against correct field based on game type

## UI/UX Considerations
- Clear visual distinction between game types
- Intuitive game type selection during creation
- Consistent labeling throughout the app
- Backward compatibility for existing question sets

## Testing Checklist
- [x] Database migration applies cleanly
- [x] TypeScript types compile without errors
- [ ] Question generation works for both types
- [ ] Game play functions correctly
- [ ] UI displays appropriate labels
- [ ] Mobile app remains functional
- [ ] Performance is not degraded

## Summary of Changes Implemented

### Database
1. Added `game_type` column to `question_sets` table with default value 'guess_artist'
2. Updated TypeScript database types to include the new field

### Backend
1. Modified question generation API to accept and use game type parameter
2. Enhanced similarity algorithm to handle different game types:
   - For "Guess Artist": Avoids songs by the same artist
   - For "Guess Song": Avoids songs with similar titles
3. Updated all question set creation/update endpoints to handle game type

### Frontend
1. Added game type selector to create question set form with clear descriptions
2. Updated edit question set form to allow changing game type
3. Added game type badges to question set cards in both browse and questions pages
4. Modified game play interface to:
   - Display appropriate answer options based on game type
   - Show correct prompts ("Name the artist!" vs "Name this song!")
   - Handle answer display correctly for each type

### Key Files Modified
- `/lib/supabase/database.types.ts` - Added game_type field
- `/types/game-type.ts` - Created new type definitions
- `/lib/question-generator.ts` - Enhanced detractor selection logic
- `/app/api/questions/generate/route.ts` - Added game type support
- `/hooks/use-question-sets.ts` - Updated create/update functions
- `/components/questions/create-question-set-client.tsx` - Added game type selector
- `/app/questions/[id]/edit/page.tsx` - Added game type editing
- `/components/games/game-play.tsx` - Updated game play logic
- `/app/questions/questions-content.tsx` - Added game type display
- `/app/browse/browse-content.tsx` - Added game type display
- `/hooks/use-game-room.ts` - Fetches game type with question set data