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
  pendingChanges,
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
    .update(changedFields) // ← Only changed fields!
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

| Scenario      | Old Approach   | New Approach  | Improvement        |
| ------------- | -------------- | ------------- | ------------------ |
| Edit 1 field  | Send 20 fields | Send 1 field  | **95% reduction**  |
| Edit 5 fields | Send 20 fields | Send 5 fields | **75% reduction**  |
| No changes    | Send 20 fields | Send 0 fields | **100% reduction** |

### Activity Logging integration...

(rest of the content)

## Database Null Consistency Standard

### The Challenge

React controlled components require an empty string (`''`) to remain stable and avoid "uncontrolled to controlled" warnings. However, Postgres databases should store `null` for missing or cleared data to maintain integrity and semantic correctness.

### The Standard Pattern

All "Save" and "Submit" handlers in InsideCare must implement the **Empty-to-Null Bridge**:

1.  **On Load (DB -> UI)**: Standardize all optional string fields with a fallback.
    ```typescript
    value={formData.description || ''}
    ```
2.  **On Save (UI -> DB)**: Convert empty strings back to `null` before sending to Supabase.

#### Implementation Examples

**A. Simple Mapping (Checklist Pattern)**

```typescript
await supabase.from('table').insert({
  description: formData.description || null,
});
```

**B. Object Sanitization (Roles Pattern)**

```typescript
const sanitizedData = { ...formData };
Object.keys(sanitizedData).forEach((key) => {
  if (sanitizedData[key] === '') {
    sanitizedData[key] = null;
  }
});
```

**C. Partial Updates (Participant Pattern)**

```typescript
const normalized = { ...formData };
Object.keys(normalized).forEach((key) => {
  if (normalized[key] === '') {
    normalized[key] = null;
  }
});
```

### Why this is mandatory

- ✅ **Prevents UI Crashes**: Inputs never receive a `null` value.
- ✅ **Clean Data**: Database doesn't get cluttered with redundant empty strings.
- ✅ **SQL Reliability**: Ensures `IS NULL` queries work correctly for cleared fields.

---

**Last Updated:** 2026-05-20  
**Version:** 1.1.0
