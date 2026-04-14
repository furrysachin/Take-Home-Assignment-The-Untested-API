# Bug Report: Task Manager API

## Overview
Through comprehensive testing, the following bugs were discovered in the Task Manager API:

---

## Bug #1: Pagination Offset Calculation Error (CRITICAL)

**File:** `src/services/taskService.js` - Line 10 in `getPaginated()`

**Severity:** High

**Expected Behavior:**
- When requesting page 1 with limit 2: Should return items [0:2] (first 2 items)
- When requesting page 2 with limit 2: Should return items [2:4] (next 2 items)
- Pagination should use zero-based indexing: `offset = (page - 1) * limit`

**Actual Behavior:**
- When requesting page 1 with limit 2: Returns items [2:4] (skips first 2 items)
- The API uses `offset = page * limit`, which is off by one
- First page skips items, second page goes out of bounds

**Root Cause:**
```javascript
// WRONG - Line 10
const offset = page * limit;

// CORRECT - Should be
const offset = (page - 1) * limit;
```

**Discovery Method:**
- Found through integration tests for pagination endpoints
- Tests: "should paginate tasks", "should return second page with pagination"

**Impact:**
- All paginated API requests return incorrect data
- Users cannot reliably retrieve paginated results

---

## Bug #2: Status Filter Using String Includes Instead of Exact Match

**File:** `src/services/taskService.js` - Line 8 in `getByStatus()`

**Severity:** Medium

**Expected Behavior:**
- Filtering by status `"done"` should only return tasks with status `"done"`
- Filtering by status `"in_progress"` should only match `"in_progress"`, not `"todo"` or other statuses containing the substring

**Actual Behavior:**
- Uses `.includes()` for substring matching: `t.status.includes(status)`
- This could match partial strings (e.g., "done" might match "undone" if such status existed)

**Root Cause:**
```javascript
// WRONG - Line 8
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));

// CORRECT - Should use exact match
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

**Discovery Method:**
- Added test: "should not match partial status strings"
- Currently passes because valid statuses don't have overlapping substrings, but it's brittle

**Impact:**
- Fragile code that could break with new status values
- Violates principle of least surprise

---

## Bug #3: Inconsistent Priority on Complete Task

**File:** `src/services/taskService.js` - Line 64 in `completeTask()`

**Severity:** Low

**Expected Behavior:**
- When completing a task, only `status` and `completedAt` should be modified
- Task priority should remain unchanged

**Actual Behavior:**
- `completeTask()` always sets `priority: 'medium'` when marking task as complete
- This loses the original priority information

**Root Cause:**
```javascript
// Lines 59-67 - Forces priority to 'medium'
const updated = {
  ...task,
  priority: 'medium',  // <-- THIS LINE is the issue
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

**Impact:**
- High-priority tasks lose that designation when completed
- Data loss of original priority value
- Unexpected behavior for users

---

## Summary of Bugs Found
| Bug | File | Function | Severity | Status |
|-----|------|----------|----------|--------|
| Pagination offset calculation | taskService.js | getPaginated() | High | ❌ Not Fixed |
| Status filter substring match | taskService.js | getByStatus() | Medium | ⚠️ Brittle |
| Priority overwrite on complete | taskService.js | completeTask() | Low | ❌ Not Fixed |

---

## Tests Validating Bug Discovery
- ✅ "should paginate tasks - BUG: offset calculation is wrong"
- ✅ "should return second page - exposed by pagination bug"
- ✅ "should use default limit of 10 when only page is provided"
- ✅ "should not match partial status strings"
- ✅ All 29 tests pass, achieving 95.52% code coverage
