# InsideCare v1 - Architecture Documentation

## Optimized Save System with json-diff-ts

### Overview
The participant detail page uses `json-diff-ts` to send **only changed fields** to Supabase, reducing network payload and database operations.

### Key Components

#### 1. **Dirty State Tracking** (`hooks/useDirtyTracker.ts`)
```typescript
import { diff } from 'json-diff-ts';

// Returns: { isDirty, formChanged, hasPendingChildChanges, formDiff }
const { isDirty } = useDirtyTracker({
  formData,
  originalData,
  pendingChanges
});
```

**Benefits:**
- ✅ More reliable than `JSON.stringify()` comparison
- ✅ Handles edge cases (field order, dates, whitespace, etc.)
- ✅ Returns detailed diff for debugging
- ✅ Centralized logic in one hook

#### 2. **Pending Changes Factory** (`lib/pending-changes-factory.ts`)
```typescript
// Create empty pending changes structure
const pendingChanges = createPendingChanges();

// Check if any changes exist
const hasChanges = hasAnyPendingChanges(pendingChanges);

// Reset to empty state
const empty = resetPendingChanges();
```

**Benefits:**
- ✅ Consistent structure across all child entities
- ✅ Easy to extend with new entity types
- ✅ Type-safe with existing `PendingChanges` model

#### 3. **Optimized Save Handler**
```typescript
// 1. Use json-diff-ts to detect changes
const formDiff = diff(participant, normalizedFormData);

// 2. Build object with ONLY changed fields
const changedFields: Record<string, any> = {};
formDiff.forEach((change) => {
  if (change.type === 'UPDATE' && change.key) {
    changedFields[change.key] = change.value;
  }
});

// 3. Send only changed fields to Supabase
if (Object.keys(changedFields).length > 0) {
  await supabase
    .from('participants')
    .update(changedFields)  // ← Only changed fields!
    .eq('id', id);
}
```

**Example:**
- User changes only `phone` and `email`
- Old approach: Sends all 20 fields
- New approach: Sends only 2 fields
- **Result: 90% reduction in payload size**

### Save Flow

```
User edits form
    ↓
useDirtyTracker detects changes via json-diff-ts
    ↓
Save button enabled (isDirty = true)
    ↓
User clicks "Save Changes"
    ↓
1. Process child entities (documents, medications, etc.)
2. Use json-diff-ts to get changed fields
3. Send ONLY changed fields to Supabase
4. Log activity with detailed change tracking
5. Update local state
6. Refresh only changed components
    ↓
Save complete ✅
```

### Performance Benefits

| Scenario | Old Approach | New Approach | Improvement |
|----------|-------------|--------------|-------------|
| Edit 1 field | Send 20 fields | Send 1 field | **95% reduction** |
| Edit 5 fields | Send 20 fields | Send 5 fields | **75% reduction** |
| No changes | Send 20 fields | Send 0 fields | **100% reduction** |

### Activity Logging

The system maintains detailed activity logs with:
- ✅ User attribution (who made the change)
- ✅ Descriptive messages (what changed)
- ✅ Change metadata (old/new values)
- ✅ Auto-refresh after save

**Example Log Entries:**
- `"Added medication 'Aspirin' (100mg)"` - John Doe
- `"Updated service provider 'Dr. Smith' (GP)"` - Jane Smith
- `"Deleted shift note for 28 Jan 2026"` - Admin User

### Installation

Add to `package.json`:
```json
{
  "dependencies": {
    "json-diff-ts": "^4.0.0"
  }
}
```

Run:
```bash
npm install
```

### Future Enhancements

1. **Generic Save Pipeline** - Loop through child tables programmatically
2. **Supabase RPC** - Atomic transactions for all changes
3. **React Query** - Replace component remounting with cache invalidation
4. **Optimistic Updates** - Update UI before server response

### Files Modified

- `src/hooks/useDirtyTracker.ts` - New centralized dirty tracking hook
- `src/lib/pending-changes-factory.ts` - Factory for pending changes
- `src/pages/participants/detail/participant-detail-content.tsx` - Optimized save handler
- `src/pages/participants/detail/participant-detail-page.tsx` - Uses new hook
- `package.json` - Added json-diff-ts dependency

### Testing

1. Edit a single field → Verify only that field is sent to Supabase
2. Edit multiple fields → Verify only changed fields are sent
3. Make no changes → Verify no update query is sent
4. Check activity log → Verify detailed change descriptions
5. Test navigation warnings → Verify unsaved changes are detected

---

**Last Updated:** 2026-01-28  
**Version:** 1.0.0
