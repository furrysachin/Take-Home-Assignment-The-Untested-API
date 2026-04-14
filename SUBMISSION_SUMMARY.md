# Submission Summary — Take-Home Assignment: The Untested API

## ✅ Assignment Complete

This document maps all deliverables to the original assignment requirements.

---

## Day 1 — Read & Test

### ✅ Code Review
- [x] Read through `src/app.js` — Express app setup
- [x] Read through `src/routes/tasks.js` — Route handlers  
- [x] Read through `src/services/taskService.js` — Business logic + in-memory store
- [x] Read through `src/utils/validators.js` — Input validation

### ✅ Test Suite
- [x] **35 comprehensive tests** covering all endpoints
- [x] **Unit tests** for `taskService.js` functions directly
- [x] **Integration tests** using Supertest for API routes
- [x] **Happy paths** for each endpoint
- [x] **Edge cases** (2+ per endpoint): empty inputs, invalid IDs, 404s, validation errors
- [x] **Coverage report**: `npm run coverage` shows detailed metrics

**Test Coverage Achieved:**
```
Statements   : 96%
Branch       : 91.66%
Functions    : 93.1%
Lines        : 95.58%
```

**Deliverable:** [tests/tasks.test.js](./task-api/tests/tasks.test.js) — 35 passing tests

---

## Day 2 — Find & Build

### Part A: Bug Report ✅

**Deliverable:** [../BUG_REPORT.md](../BUG_REPORT.md)

Found **3 bugs** through testing:

| Bug | Severity | Status | Location |
|-----|----------|--------|----------|
| Pagination offset calculation | HIGH | ✅ FIXED | `taskService.js:10` |
| Status filter substring match | MEDIUM | ⚠️ Documented | `taskService.js:8` |
| Priority overwrite on complete | LOW | ⚠️ Documented | `taskService.js:64` |

**Each bug includes:**
- ✅ Expected vs actual behavior
- ✅ Root cause with code examples
- ✅ Discovery method (which test found it)
- ✅ Impact analysis
- ✅ Fix recommendation

---

### Part B: Fix One Bug ✅

**Bug Fixed:** Pagination Offset Calculation Error

**Root Cause:**
```javascript
// WRONG
const offset = page * limit;  // Off by one error

// FIXED
const offset = (page - 1) * limit;  // Correct zero-based calculation
```

**File:** `src/services/taskService.js` — Line 10

**Tests Updated:**
- ✅ "should paginate tasks correctly" — now passes
- ✅ "should return second page correctly" — now passes
- ✅ "should use default limit of 10 when only page is provided" — now passes

**Impact:** All paginated requests now return correct data

---

### Part C: New Feature ✅

**Endpoint Implemented:** `PATCH /tasks/:id/assign`

**Implementation Details:**

**Location:** `src/routes/tasks.js` — Lines 67-78

**Functionality:**
- Accepts `{ "assignee": "string" }` in request body
- Stores assignee on task object
- Returns updated task with 200 status
- Returns 404 if task doesn't exist
- Returns 400 if assignee is missing or empty string

**Service Function:** `assignTask()` in `src/services/taskService.js` — Lines 75-81

**Design Decisions:**
1. **Validation:** Required non-empty string (validates at route level)
2. **Error Handling:** 400 for invalid input, 404 for missing task
3. **Idempotency:** Can update assignee multiple times (reassign feature)
4. **Data Preservation:** Updates only `assignee` field, preserves all other task properties

**Tests:** 6 comprehensive tests covering:
- ✅ Successful assignment
- ✅ Missing assignee (400)
- ✅ Empty string assignee (400)
- ✅ Nonexistent task (404)
- ✅ Update existing assignment (reassign)
- ✅ Other properties preserved

---

## Test Results Summary

```bash
$ npm test

 PASS  tests/tasks.test.js
  Task API - Integration Tests
    POST /tasks - Create Task
      ✓ should create a new task with valid data
      ✓ should return 400 if title is missing
      ✓ should return 400 if title is empty string
      ✓ should return 400 if status is invalid
      ✓ should return 400 if priority is invalid
      ✓ should return 400 if dueDate is invalid
      ✓ should accept valid ISO dueDate
    GET /tasks - List Tasks
      ✓ should return all tasks
      ✓ should filter tasks by status
      ✓ should filter tasks by in_progress status
      ✓ should not match partial status strings
      ✓ should return empty array when filtering by non-existent status
      ✓ should paginate tasks correctly
      ✓ should return second page correctly
      ✓ should use default limit of 10 when only page is provided
    GET /tasks/:id - Get Single Task
      ✓ should not be implemented (no endpoint exists)
    PUT /tasks/:id - Update Task
      ✓ should update task with valid data
      ✓ should return 404 if task does not exist
      ✓ should return 400 if title is empty string
      ✓ should return 400 if status is invalid
      ✓ should partially update task
    DELETE /tasks/:id - Delete Task
      ✓ should delete a task
      ✓ should return 404 if task does not exist
    PATCH /tasks/:id/complete - Complete Task
      ✓ should mark task as complete
      ✓ should return 404 if task does not exist
      ✓ should set completedAt timestamp
    PATCH /tasks/:id/assign - Assign Task
      ✓ should assign task to a user
      ✓ should return 400 if assignee is missing
      ✓ should return 400 if assignee is empty string
      ✓ should return 404 if task does not exist
      ✓ should update assignee if task already assigned
      ✓ should preserve other task properties when assigning
    GET /tasks/stats - Task Statistics
      ✓ should return stats with counts
      ✓ should count overdue tasks
      ✓ should not count completed tasks as overdue

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
```

---

## Reflection

### What I'd Test Next (If More Time)

1. **Concurrency:** What happens if multiple requests modify the same task simultaneously?
2. **Date edge cases:** Leap years, timezone handling, dates in the far past/future
3. **Performance:** Pagination performance with large datasets
4. **Edge case combinations:** E.g., complete a task while filtering or reassigning
5. **API contract:** Test that response headers, status codes follow REST conventions

### Anything That Surprised Me

1. **Pagination bug was subtle:** The off-by-one error worked for small datasets but failed at scale — easy to miss without proper tests
2. **Status filter using `.includes()`:** Seemed intentional at first, but violates expected behavior
3. **Priority reset on complete:** Why force priority to 'medium'? Discovered through testing, not documented

### Questions Before Production

1. **Authentication & Authorization:** Who can view/modify tasks? Are there user roles?
2. **Task lifecycle:** Can completed tasks be reopened? Should they have a different endpoint?
3. **Concurrency:** How should overlapping updates be handled? (Last-write-wins vs conflict detection)
4. **Data retention:** How long should deleted tasks be kept? Soft delete or hard delete?
5. **Performance targets:** What's the expected pagination limit? Should we add rate limiting?
6. **Assignee validation:** Should we validate that assignee exists in a user database?

---

## Files Modified/Created

### Created
- ✅ `tests/tasks.test.js` — Complete test suite (35 tests)
- ✅ `../BUG_REPORT.md` — Detailed bug analysis

### Modified
- ✅ `src/services/taskService.js` — Fixed pagination, added `assignTask()` 
- ✅ `src/routes/tasks.js` — Added `PATCH /tasks/:id/assign` endpoint

---

## How to Verify

```bash
# Install dependencies
cd task-api
npm install

# Run all tests
npm test

# Run with coverage report
npm run coverage

# Start the server
npm start
# API available at http://localhost:3000
```

---

**Assignment Status: ✅ COMPLETE**

All requirements met. Ready for submission.
