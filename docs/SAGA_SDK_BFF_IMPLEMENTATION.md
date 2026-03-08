# Saga, SDK & BFF: Complete Flow Implementation Guide

Step-by-step guide with visual flows and practical implementations

---

## 📚 Table of Contents
1. [Saga Flow - Detailed Steps](#saga-flow--detailed-steps)
2. [SDK Architecture Flow](#sdk-architecture-flow)
3. [What is BFF Pattern](#what-is-bff-pattern)
4. [Integration: Saga + SDK + BFF](#integration-saga--sdk--bff)
5. [Custom Hooks, Models & Actions](#custom-hooks-models--actions)
6. [Implementation Steps](#implementation-steps)
7. [Real-World Examples](#real-world-examples)

---

## Saga Flow - Detailed Steps

### **Understanding Redux Saga Flow**

```
┌──────────────────────────────────────────────────────────────────┐
│                        SAGA EXECUTION FLOW                        │
└──────────────────────────────────────────────────────────────────┘

STEP 1: ACTION DISPATCHED
═══════════════════════════════════════════════════════════════════
User clicks button → dispatch(loginRequest({ email, password }))
                         ↓
            Redux receives action
            { type: 'auth/LOGIN_REQUEST', payload: {...} }

STEP 2: SAGA MIDDLEWARE INTERCEPTS
═══════════════════════════════════════════════════════════════════
Saga middleware checks: "Do I have a watcher listening for this?"
                         ↓
            YES! → takeEvery('auth/LOGIN_REQUEST', loginSaga)

STEP 3: GENERATOR FUNCTION STARTS
═══════════════════════════════════════════════════════════════════
function* loginSaga(action) {  // action = dispatched action
    // Generator pauses at each 'yield'
    // Nothing executes yet!
}
                         ↓
            Generator ready, waiting for instructions

STEP 4: YIELD PUT (Dispatch Action)
═══════════════════════════════════════════════════════════════════
yield put(loginRequest())  // Dispatch: show loading
        ↓
    Reducer updates state:
    { auth: { status: 'loading', error: null } }
        ↓
    Components re-render → Show spinner

STEP 5: YIELD CALL (Execute Function)
═══════════════════════════════════════════════════════════════════
const result = yield call(loginAPI, email, password)
        ↓
    Saga says: "Execute loginAPI() and wait for result"
        ↓
    HTTP Request sent to server
        ↓
    ...Network latency... (waiting)
        ↓
    Server responds with token & user data
        ↓
    result = { token: '...', user: {...} }

STEP 6: CONDITIONAL LOGIC
═══════════════════════════════════════════════════════════════════
if (result.success) {
    yield put(loginSuccess(result))        // Success path
} else {
    yield put(loginError(result.error))    // Error path
}

STEP 7: FURTHER SIDE EFFECTS
═══════════════════════════════════════════════════════════════════
Success path:
    yield put(setCurrentUser(result.user))      // Update user
    yield call(saveToken, result.token)         // Save to localStorage
    yield put(loadUserPermissions())            // Load permissions
    yield call(history.push, '/dashboard')      // Navigate

Error path:
    yield put(clearUserData())                  // Clear state
    yield call(showErrorMessage, result.error)  // Show toast

STEP 8: COMPLETION
═══════════════════════════════════════════════════════════════════
Generator function finishes
    ↓
All dispatched actions processed
    ↓
State updated
    ↓
Components re-rendered
    ↓
User sees final result
```

---

### **Saga Code Example with Comment Steps**

```javascript
// sagas/authSaga.js - Login Flow

import { put, call, takeEvery, select } from 'redux-saga/effects'
import { authSDK } from '../services/authSdk'

// ═══════════════════════════════════════════════════════════════
// MAIN SAGA FUNCTION - This is the flow
// ═══════════════════════════════════════════════════════════════
export function* loginSaga(action) {
    // action.payload = { email, password }
    
    try {
        // STEP 1: Show loading state
        console.log('1️⃣  Dispatching LOGIN_PENDING...')
        yield put({
            type: 'auth/loginPending'
        })
        
        // STEP 2: Get current config from state
        console.log('2️⃣  Selecting API config from state...')
        const config = yield select(state => state.app.apiConfig)
        
        // STEP 3: Call login API (blocking - waits for response)
        console.log('3️⃣  Calling login API...')
        const response = yield call(
            authSDK.login,
            action.payload.email,
            action.payload.password,
            config
        )
        
        // STEP 4: Save sensitive data
        console.log('4️⃣  Saving auth token...')
        yield call(authSDK.saveToken, response.token)
        
        // STEP 5: Load user permissions
        console.log('5️⃣  Loading user permissions...')
        const permissions = yield call(
            authSDK.getPermissions,
            response.userId
        )
        
        // STEP 6: Dispatch success action with data
        console.log('6️⃣  Dispatching LOGIN_SUCCESS...')
        yield put({
            type: 'auth/loginSuccess',
            payload: {
                user: response.user,
                token: response.token,
                permissions: permissions
            }
        })
        
        // STEP 7: Navigate to dashboard
        console.log('7️⃣  Navigating to dashboard...')
        yield call(() => {
            window.location.href = '/dashboard'
        })
        
    } catch (error) {
        console.log('❌ Error occurred:', error.message)
        
        // STEP 8: Handle error
        yield put({
            type: 'auth/loginError',
            payload: error.message
        })
        
        // STEP 9: Clear sensitive data
        yield call(authSDK.clearToken)
        
        // STEP 10: Show error notification
        yield call(() => {
            window.alert(`Login failed: ${error.message}`)
        })
    }
}

// ═══════════════════════════════════════════════════════════════
// WATCHER SAGA - Listen for actions
// ═══════════════════════════════════════════════════════════════
export function* watchAuthSaga() {
    // Whenever LOGIN action is dispatched, run loginSaga
    yield takeEvery('auth/login', loginSaga)
}
```

### **Visual Timeline of Saga Execution**

```
Time  Event                        Code              State              UI
════════════════════════════════════════════════════════════════════════════════
0ms   User clicks "Sign In"       onClick fired     status: 'idle'     Button active
1ms   dispatch(login())           action sent       status: 'idle'     Button active
2ms   Saga watcher catches        takeEvery         status: 'idle'     Button active
3ms   Generator starts            function*         status: 'idle'     Button active
5ms   yield put(pending)          dispatch          status: 'loading'  ↻ Loading...
6ms   Reducer processes           state update      status: 'loading'  ↻ Loading...
7ms   Components re-render        useSelector       status: 'loading'  ↻ Loading...
10ms  yield call(loginAPI)        HTTP request      status: 'loading'  ↻ Loading...
       Network request sent                          status: 'loading'  ↻ Loading...
       ...waiting... (500ms)                        status: 'loading'  ↻ Loading...
510ms Server responds             API returns       status: 'loading'  ↻ Loading...
515ms Response received           result ready      status: 'loading'  ↻ Loading...
520ms yield put(success)          dispatch          status: 'success'  Welcome!
521ms Reducer processes           state update      status: 'success'  Welcome!
522ms Components re-render        useSelector       status: 'success'  Welcome!
525ms yield call(saveToken)       localStorage      status: 'success'  Welcome!
530ms yield call(navigate)        window.location   status: 'success'  Dashboard
════════════════════════════════════════════════════════════════════════════════
Total execution: ~530ms (mostly network latency)
```

---

## SDK Architecture Flow

### **SDK Layer Responsibility**

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│            Components, Sagas, Redux Logic                    │
└────────────────────┬────────────────────────────────────────┘
                     ↓ Uses SDK
┌─────────────────────────────────────────────────────────────┐
│                   SDK LAYER                                  │
│         Encapsulates all API complexity                      │
│                                                              │
│  Class AuthSDK {                                             │
│    - login() → handles HTTP, auth headers, parsing          │
│    - saveToken() → manages local storage                    │
│    - getPermissions() → fetches and caches                  │
│    - clearToken() → cleanup                                 │
│  }                                                           │
│                                                              │
│  Responsibilities:                                          │
│  ✓ HTTP requests (fetch, axios, etc)                       │
│  ✓ Error handling & normalization                          │
│  ✓ Authentication (headers, tokens)                        │
│  ✓ Caching strategy                                        │
│  ✓ Data transformation                                     │
│  ✓ Retry logic                                             │
│  ✓ Rate limiting                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓ Uses fetch/axios
┌─────────────────────────────────────────────────────────────┐
│               EXTERNAL APIs                                  │
│      Backend servers, 3rd party services                    │
└─────────────────────────────────────────────────────────────┘
```

### **SDK Implementation Flow**

```javascript
// services/authSdk.js

export class AuthSDK {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl
        this.tokenKey = 'auth_token'
        this.cache = new Map()
    }

    // ═══════════════════════════════════════════════════════════
    // FLOW: Login Request
    // ═══════════════════════════════════════════════════════════
    async login(email, password) {
        // STEP 1: Validate inputs
        if (!email || !password) {
            throw new Error('Email and password required')
        }

        // STEP 2: Prepare request
        const url = `${this.baseUrl}/auth/login`
        const body = JSON.stringify({ email, password })
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
        }

        // STEP 3: Make HTTP request
        const response = await this.makeRequest(url, options)
        
        // STEP 4: Validate response
        if (!response.success) {
            throw new Error(response.message)
        }

        // STEP 5: Extract important data
        const { token, user } = response.data
        
        // STEP 6: Return to caller
        return { token, user }
    }

    // ═══════════════════════════════════════════════════════════
    // CORE METHOD: All HTTP requests go through here
    // ═══════════════════════════════════════════════════════════
    async makeRequest(url, options = {}) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)

        try {
            // STEP 1: Add auth header if token exists
            const token = this.getToken()
            if (token) {
                options.headers = options.headers || {}
                options.headers['Authorization'] = `Bearer ${token}`
            }

            // STEP 2: Execute request with timeout
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            })

            clearTimeout(timeout)

            // STEP 3: Check HTTP status
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            // STEP 4: Parse JSON
            const data = await response.json()

            // STEP 5: Return data
            return data

        } catch (error) {
            throw this.normalizeError(error)
        } finally {
            clearTimeout(timeout)
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TOKEN MANAGEMENT
    // ═══════════════════════════════════════════════════════════
    saveToken(token) {
        localStorage.setItem(this.tokenKey, token)
    }

    getToken() {
        return localStorage.getItem(this.tokenKey)
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey)
    }

    // ═══════════════════════════════════════════════════════════
    // PERMISSIONS - With Caching
    // ═══════════════════════════════════════════════════════════
    async getPermissions(userId) {
        const cacheKey = `permissions_${userId}`
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }

        // Fetch if not cached
        const response = await this.makeRequest(
            `${this.baseUrl}/users/${userId}/permissions`
        )

        // Cache for future use
        this.cache.set(cacheKey, response.permissions)

        return response.permissions
    }

    // ═══════════════════════════════════════════════════════════
    // ERROR STANDARDIZATION
    // ═══════════════════════════════════════════════════════════
    normalizeError(error) {
        if (error.name === 'AbortError') {
            return {
                code: 'TIMEOUT',
                message: 'Request timeout',
                originalError: error
            }
        }

        if (error instanceof TypeError) {
            return {
                code: 'NETWORK',
                message: 'Network error',
                originalError: error
            }
        }

        return {
            code: 'UNKNOWN',
            message: error.message || 'Unknown error',
            originalError: error
        }
    }
}

// Export singleton instance
export const authSDK = new AuthSDK({
    baseUrl: process.env.REACT_APP_API_URL
})
```

---

## What is BFF Pattern

### **BFF = Backend For Frontend**

**Problem it solves:**

```
Without BFF:
┌──────────────┐
│  Mobile App  │
└────────┬─────┘
         │ Needs: user data + permissions + settings
         ↓
    ┌─────────────────────┐
    │   Main Backend      │
    │                     │
    │ /users/{id}         │ Returns: Full user document
    │ /permissions/{id}   │ Returns: All permissions
    │ /settings           │ Returns: All settings
    └─────────────────────┘

❌ Problem: Mobile has slow network
   - Downloads extra data it doesn't need
   - Makes multiple requests
   - Slow user experience


With BFF:
┌──────────────┐
│  Mobile App  │
└────────┬─────┘
         │ Needs: only name + avatar + 2 permissions
         ↓
    ┌──────────────────────┐
    │  Mobile BFF Layer    │ ← New service
    │                      │
    │ /mobile/user/{id}    │ Returns: name, avatar only
    └────────┬─────────────┘
             │
             ↓
    ┌──────────────────────┐
    │   Main Backend       │
    └──────────────────────┘

✅ Solution: BFF tailors responses for each client
```

### **BFF Architecture**

```
┌────────────────────────────────────────────────────┐
│              Frontend (React Web App)               │
│  Your project with Redux, Saga, SDK                 │
└─────────────────────┬────────────────────────────────┘
                      │
              Web BFF API Layer
         (Receives requests from Web)
                      │
         ├─ GET /api/web/dashboard ←─┐
         ├─ POST /api/web/login       │ Your app calls these
         ├─ GET /api/web/permissions  │
         └─ PUT /api/web/theme        │
                      │                │
                      ↓                │
         ┌─────────────────────────┐   │
         │                         │   │
    ┌────┴───┐   ┌────────────┐   │   │
    │ User   │   │ Permission │   │   │
    │ Service│   │ Service    │   │   │
    │API     │   │ API        │   │   │
    └────┬───┘   └────┬───────┘   │   │
         │            │            │   │
    ┌────┴────────────┴─────────┐  │   │
    │   Core Backend Services   │  │   │
    │   (Business Logic Layer)   │  │   │
    └───────────────────────────┘  │   │
                                   │   │
         ┌──────────────────────────┘   │
         │                              │
      Mobile BFF API Layer              │
   (Receives requests from Mobile)      │
         │                              │
         ├─ GET /api/mobile/profile     │
         ├─ POST /api/mobile/login      │
         └─ GET /api/mobile/settings    │
                                        │
         ┌──────────────────────────────┘
         │
     ┌───┴────────┐
     │ Mobile App │
     └────────────┘
```

### **BFF Benefits**

```
┌────────────────────────────────────────────────────────┐
│ Benefit 1: OPTIMIZED RESPONSES                         │
├────────────────────────────────────────────────────────┤
│ Web needs:     user + profile + recent posts (2MB)    │
│ Mobile needs:  user + avatar only (50KB)              │
│ → BFF returns only what's needed                       │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Benefit 2: FEWER API CALLS                             │
├────────────────────────────────────────────────────────┤
│ Without BFF:                                           │
│   GET /api/user → GET /api/posts → GET /api/comments  │
│   (3 requests, 3x latency)                             │
│                                                        │
│ With BFF:                                              │
│   GET /api/web/dashboard                              │
│   (1 request, aggregated from core backend)            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Benefit 3: FRONTEND-SPECIFIC LOGIC                     │
├────────────────────────────────────────────────────────┤
│ Format data exactly like frontend expects              │
│ Handle frontend-specific transformations               │
│ No extra logic needed in frontend                      │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Benefit 4: DECOUPLED DEVELOPMENT                       │
├────────────────────────────────────────────────────────┤
│ Frontend team can change what they need                │
│ Doesn't affect mobile or core backend                  │
│ Each client has own BFF maintained by its team         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ Benefit 5: API VERSIONING                              │
├────────────────────────────────────────────────────────┤
│ /api/web/v1/dashboard                                  │
│ /api/web/v2/dashboard (new version)                    │
│ Old versions still work, no breaking changes           │
└────────────────────────────────────────────────────────┘
```

---

## Integration: Saga + SDK + BFF

### **Complete Flow**

```
┌──────────────────────────────────────────────────────────────┐
│                     REACT COMPONENT                          │
│  User clicks "Login" button                                  │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓ dispatch(loginRequest({ email, password }))
┌────────────────────────────────────────────────────────────────┐
│                   REDUX SAGA MIDDLEWARE                        │
│  function* loginSaga(action) {                                 │
│    yield put(loginPending())  // Show spinner                  │
│    const result = yield call(authSDK.login, ...)               │
│    yield put(loginSuccess(result))  // Save user data          │
│  }                                                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ↓ Saga calls SDK methods
┌────────────────────────────────────────────────────────────────┐
│                    SDK LAYER (authSdk)                         │
│  async login(email, password) {                                │
│    - Validate inputs                                           │
│    - Add auth headers                                          │
│    - Make HTTP request to BFF                                  │
│    - Parse response                                            │
│    - Return to Saga                                            │
│  }                                                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ↓ HTTP POST /api/web/login
┌────────────────────────────────────────────────────────────────┐
│              BFF LAYER (Backend For Frontend)                  │
│  POST /api/web/login                                           │
│  {                                                             │
│    Receives: { email, password }                               │
│    ├─ Validate credentials                                     │
│    ├─ Call auth core service                                   │
│    ├─ Load user data                                           │
│    ├─ Load permissions                                         │
│    ├─ Transform for WEB ONLY (not mobile format)              │
│    └─ Return: { token, user, permissions, theme }            │
│  }                                                             │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ↓ HTTP Response
┌────────────────────────────────────────────────────────────────┐
│            CORE BACKEND SERVICES                               │
│  Called by BFF to fetch real data:                             │
│  ├─ authService.login(email, password)                         │
│  ├─ userService.getById(userId)                                │
│  ├─ permissionService.getByUserId(userId)                      │
│  └─ settingsService.getDefault()                               │
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
                         ↓
         ┌───────────────────────────────┐
         │ Databases, Caches, etc.       │
         └───────────────────────────────┘
```

---

## Custom Hooks, Models & Actions

### **Custom Hooks: Clean API Providers (Not Listeners)**

**Important Clarification:** Custom hooks don't "listen" like event listeners. They provide a **clean, reusable API** for components to:

- ✅ **Dispatch actions** that trigger sagas
- ✅ **Select state** from Redux store  
- ✅ **Compute derived values** from state
- ✅ **Encapsulate logic** for reuse across components

Custom hooks are **syntactic sugar** - they make your components cleaner by hiding Redux implementation details behind a simple function call.

#### **Hook Integration Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                          │
│  const { login, isLoading, user } = useAuth()              │
│                                                            │
│  // Clean, simple API - no Redux knowledge needed          │
│  const handleLogin = () => login(credentials)              │
└────────────────────┬────────────────────────────────────────┘
                     │
            Hook provides clean methods
                     │
┌─────────────────────────────────────────────────────────────┐
│                   CUSTOM HOOK (useAuth)                     │
│  const useAuth = () => {                                    │
│    const dispatch = useDispatch()                           │
│    const { user, status } = useSelector(state => state.auth)│
│                                                             │
│    // Clean API methods                                     │
│    const login = (creds) => {                               │
│      dispatch({ type: 'auth/login', payload: creds })       │
│    }                                                        │
│                                                             │
│    // Computed values                                       │
│    const isLoading = status === 'loading'                   │
│                                                             │
│    return { login, isLoading, user }                        │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
            Actions flow to Redux/Saga
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   REDUX SAGA MIDDLEWARE                     │
│  // The actual "listening" happens here                     │
│  function* loginSaga(action) {                              │
│    // Saga listens for 'auth/login' actions                 │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### **What Custom Hooks Actually Do**

```javascript
// ❌ Without custom hook - messy component
function LoginComponent() {
    const dispatch = useDispatch()
    const user = useSelector(state => state.auth.user)
    const status = useSelector(state => state.auth.status)
    const error = useSelector(state => state.auth.error)
    
    const isLoading = status === 'loading'
    const hasError = !!error
    
    const handleLogin = (email, password) => {
        dispatch({ type: 'auth/login', payload: { email, password } })
    }
    
    // Lots of Redux boilerplate in component
}

// ✅ With custom hook - clean component
function LoginComponent() {
    const { login, isLoading, hasError, user } = useAuth()
    
    const handleLogin = (email, password) => {
        login({ email, password })  // Simple, clean API
    }
    
    // Component focuses on UI logic, not Redux details
}
```

#### **Custom Hook Responsibilities**

```
CUSTOM HOOK = CLEAN API LAYER

Input:  Redux complexity (dispatch, selectors, actions)
Output: Simple methods and values for components

✅ Dispatch Actions → login(credentials)
✅ Select State → useSelector(state => state.auth)
✅ Compute Values → isLoading = status === 'loading'
✅ Encapsulate Logic → canAccessFeature(feature)
✅ Provide Types → TypeScript interfaces

❌ NOT a listener → Doesn't subscribe to events
❌ NOT middleware → Doesn't intercept actions
❌ NOT a store → Doesn't hold state
```

#### **Example: Enhanced useAuth Hook**

```javascript
// hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux'

export const useAuth = () => {
    const dispatch = useDispatch()
    const { user, status, error, permissions } = useSelector(
        state => state.auth
    )

    // ═══════════════════════════════════════════════════════════
    // CLEAN API METHODS - What components actually call
    // ═══════════════════════════════════════════════════════════
    const login = (credentials) => {
        dispatch({
            type: 'auth/login',
            payload: credentials
        })
    }

    const logout = () => {
        dispatch({
            type: 'auth/logout'
        })
    }

    const refreshToken = () => {
        dispatch({
            type: 'auth/refreshToken'
        })
    }

    // ═══════════════════════════════════════════════════════════
    // COMPUTED VALUES - Derived from raw Redux state
    // ═══════════════════════════════════════════════════════════
    const isAuthenticated = !!user
    const isLoading = status === 'loading'
    const hasError = !!error
    const isAdmin = permissions?.includes('admin')

    // ═══════════════════════════════════════════════════════════
    // SELECTORS - Complex state access made simple
    // ═══════════════════════════════════════════════════════════
    const getUserDisplayName = () => {
        return user ? `${user.firstName} ${user.lastName}` : ''
    }

    const canAccessFeature = (feature) => {
        return permissions?.includes(feature) || isAdmin
    }

    // ═══════════════════════════════════════════════════════════
    // RETURN CLEAN API - Components get simple interface
    // ═══════════════════════════════════════════════════════════
    return {
        // State (processed)
        user,
        isAuthenticated,
        isLoading,
        hasError,
        isAdmin,

        // Actions (simple methods)
        login,
        logout,
        refreshToken,

        // Selectors (computed helpers)
        getUserDisplayName,
        canAccessFeature
    }
}
```

#### **Hook Usage in Components**

```javascript
// components/Login/Login.js
import { useAuth } from '../../hooks/useAuth'

function Login() {
    // Clean API - no Redux knowledge required
    const { login, isLoading, hasError, user } = useAuth()
    
    const [credentials, setCredentials] = useState({ email: '', password: '' })

    const handleSubmit = (e) => {
        e.preventDefault()
        login(credentials)  // Simple method call
    }

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    email: e.target.value
                }))}
                disabled={isLoading}
            />
            <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    password: e.target.value
                }))}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
            {hasError && <div className="error">Login failed</div>}
        </form>
    )
}
```

#### **Key Difference: Hooks vs Sagas**

```
CUSTOM HOOKS                    vs      SAGAS
───────────────────────────────────      ──────────────────────────────
Provide clean API for components        Listen for and handle actions
useDispatch() + useSelector()           Generator functions with yield
Synchronous state access               Asynchronous flow control
Component re-renders on state change   Side effects and API calls
Simple method calls                    Complex async orchestration
```

**Bottom Line:** Custom hooks give components a clean, simple API. Sagas do the actual "listening" and async work.

### **Data Models (Type Definitions)**

Models define the structure and validation rules for your data. They ensure type safety and provide runtime validation.

#### **Model Definitions**

```javascript
// models/User.js
export class User {
    constructor(data = {}) {
        this.id = data.id || null
        this.email = data.email || ''
        this.firstName = data.firstName || ''
        this.lastName = data.lastName || ''
        this.avatar = data.avatar || null
        this.createdAt = data.createdAt ? new Date(data.createdAt) : null
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : null
    }

    // Validation
    static validate(data) {
        const errors = []

        if (!data.email || !data.email.includes('@')) {
            errors.push('Valid email is required')
        }

        if (!data.firstName || data.firstName.length < 2) {
            errors.push('First name must be at least 2 characters')
        }

        return errors
    }

    // Computed properties
    get displayName() {
        return `${this.firstName} ${this.lastName}`.trim()
    }

    get isComplete() {
        return !!(this.email && this.firstName && this.lastName)
    }
}

// models/AuthCredentials.js
export class AuthCredentials {
    constructor(email = '', password = '') {
        this.email = email
        this.password = password
    }

    static validate(credentials) {
        const errors = []

        if (!credentials.email) {
            errors.push('Email is required')
        }

        if (!credentials.password || credentials.password.length < 6) {
            errors.push('Password must be at least 6 characters')
        }

        return errors
    }

    toJSON() {
        return {
            email: this.email,
            password: this.password
        }
    }
}

// models/WeatherData.js
export class WeatherData {
    constructor(data = {}) {
        this.location = data.location || ''
        this.temperature = data.temperature || 0
        this.condition = data.condition || ''
        this.humidity = data.humidity || 0
        this.windSpeed = data.windSpeed || 0
        this.timestamp = data.timestamp ? new Date(data.timestamp) : new Date()
    }

    static fromAPIResponse(response) {
        return new WeatherData({
            location: response.name,
            temperature: response.main.temp,
            condition: response.weather[0].main,
            humidity: response.main.humidity,
            windSpeed: response.wind.speed,
            timestamp: new Date()
        })
    }

    get temperatureCelsius() {
        return Math.round(this.temperature - 273.15) // Kelvin to Celsius
    }

    get temperatureFahrenheit() {
        return Math.round((this.temperature - 273.15) * 9/5 + 32)
    }

    get isHot() {
        return this.temperatureCelsius > 25
    }

    get isCold() {
        return this.temperatureCelsius < 10
    }
}
```

#### **Model Integration with SDK**

```javascript
// services/weatherSdk.js
import { WeatherData } from '../models/WeatherData'

export class WeatherSDK {
    async getWeather(city) {
        const response = await this.makeRequest(
            `${this.baseUrl}/weather?q=${city}`
        )

        // Transform API response to model
        return WeatherData.fromAPIResponse(response)
    }
}
```

### **Redux Actions Structure**

Actions are the standardized messages that trigger state changes. In Saga/SDK/BFF architecture, actions initiate sagas which coordinate complex async flows.

#### **Action Types Convention**

```javascript
// constants/actionTypes.js
export const AUTH_ACTIONS = {
    LOGIN: 'auth/login',
    LOGIN_PENDING: 'auth/loginPending',
    LOGIN_SUCCESS: 'auth/loginSuccess',
    LOGIN_ERROR: 'auth/loginError',
    LOGOUT: 'auth/logout',
    REFRESH_TOKEN: 'auth/refreshToken'
}

export const WEATHER_ACTIONS = {
    FETCH_WEATHER: 'weather/fetchWeather',
    FETCH_WEATHER_PENDING: 'weather/fetchWeatherPending',
    FETCH_WEATHER_SUCCESS: 'weather/fetchWeatherSuccess',
    FETCH_WEATHER_ERROR: 'weather/fetchWeatherError',
    CLEAR_WEATHER: 'weather/clearWeather'
}

export const THEME_ACTIONS = {
    SET_THEME: 'theme/setTheme',
    TOGGLE_THEME: 'theme/toggleTheme'
}
```

#### **Action Creators**

```javascript
// actions/authActions.js
import { AUTH_ACTIONS } from '../constants/actionTypes'

export const login = (credentials) => ({
    type: AUTH_ACTIONS.LOGIN,
    payload: credentials
})

export const loginPending = () => ({
    type: AUTH_ACTIONS.LOGIN_PENDING
})

export const loginSuccess = (data) => ({
    type: AUTH_ACTIONS.LOGIN_SUCCESS,
    payload: data
})

export const loginError = (error) => ({
    type: AUTH_ACTIONS.LOGIN_ERROR,
    payload: error
})

export const logout = () => ({
    type: AUTH_ACTIONS.LOGOUT
})

export const refreshToken = () => ({
    type: AUTH_ACTIONS.REFRESH_TOKEN
})

// actions/weatherActions.js
import { WEATHER_ACTIONS } from '../constants/actionTypes'

export const fetchWeather = (city) => ({
    type: WEATHER_ACTIONS.FETCH_WEATHER,
    payload: { city }
})

export const fetchWeatherPending = () => ({
    type: WEATHER_ACTIONS.FETCH_WEATHER_PENDING
})

export const fetchWeatherSuccess = (data) => ({
    type: WEATHER_ACTIONS.FETCH_WEATHER_SUCCESS,
    payload: data
})

export const fetchWeatherError = (error) => ({
    type: WEATHER_ACTIONS.FETCH_WEATHER_ERROR,
    payload: error
})
```

#### **Actions in Saga Flow**

```javascript
// sagas/authSaga.js
import { put, call, takeEvery } from 'redux-saga/effects'
import { authSDK } from '../services/authSdk'
import {
    loginPending,
    loginSuccess,
    loginError,
    logout
} from '../actions/authActions'

export function* loginSaga(action) {
    try {
        // Dispatch pending action
        yield put(loginPending())

        // Call SDK
        const response = yield call(
            authSDK.login,
            action.payload.email,
            action.payload.password
        )

        // Dispatch success action
        yield put(loginSuccess(response))

    } catch (error) {
        // Dispatch error action
        yield put(loginError(error.message))
    }
}

export function* logoutSaga() {
    try {
        // Clear token
        yield call(authSDK.logout)

        // Dispatch logout action (handled by reducer)
        yield put(logout())

    } catch (error) {
        console.error('Logout error:', error)
    }
}

export function* watchAuthSaga() {
    yield takeEvery('auth/login', loginSaga)
    yield takeEvery('auth/logout', logoutSaga)
}
```

#### **Complete Architecture Flow with Hooks/Models/Actions**

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                          │
│  const { login, user, isLoading } = useAuth()              │
│  const { weather, fetchWeather } = useWeather()            │
│                                                            │
│  // Uses models for type safety                            │
│  const userModel = new User(user)                          │
│  const displayName = userModel.displayName                 │
└────────────────────┬────────────────────────────────────────┘
                     │
            Hooks dispatch actions
                     │
┌─────────────────────────────────────────────────────────────┐
│                   CUSTOM HOOKS                              │
│  const useAuth = () => {                                    │
│    const login = (creds) => dispatch(login(creds))          │
│    return { login, user, isLoading }                        │
│  }                                                          │
│                                                            │
│  const useWeather = () => {                                 │
│    const fetchWeather = (city) => dispatch(fetchWeather(city)) │
│    return { weather, fetchWeather }                         │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
            Actions trigger sagas
                     │
┌─────────────────────────────────────────────────────────────┐
│                   SAGA MIDDLEWARE                           │
│  function* loginSaga(action) {                              │
│    yield put(loginPending())                                │
│    const result = yield call(authSDK.login, action.payload)│
│    yield put(loginSuccess(result))                          │
│  }                                                          │
│                                                            │
│  function* weatherSaga(action) {                            │
│    yield put(fetchWeatherPending())                         │
│    const result = yield call(weatherSDK.getWeather, action.payload.city) │
│    yield put(fetchWeatherSuccess(result))                   │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
            Sagas call SDK methods
                     │
┌─────────────────────────────────────────────────────────────┐
│                   SDK LAYER                                 │
│  class AuthSDK {                                            │
│    async login(creds) {                                     │
│      // HTTP request to BFF                                 │
│      return new User(response.user)  // Return model       │
│    }                                                        │
│  }                                                          │
│                                                            │
│  class WeatherSDK {                                         │
│    async getWeather(city) {                                 │
│      // HTTP request                                        │
│      return WeatherData.fromAPIResponse(response)           │
│    }                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### **Step 1: Setup SDK Class**

```javascript
// services/authSdk.js
export class AuthSDK {
    constructor(config) {
        this.baseUrl = config.baseUrl || process.env.REACT_APP_API_URL
        this.timeout = config.timeout || 10000
    }

    async login(email, password) {
        const url = `${this.baseUrl}/api/web/login`  // BFF endpoint
        const response = await this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        })
        return response.data
    }

    async makeRequest(url, options = {}) {
        // ... HTTP logic, error handling, auth headers
    }
}

export const authSDK = new AuthSDK({
    baseUrl: process.env.REACT_APP_API_URL
})
```

### **Step 2: Create Redux Slice (Reducer)**

```javascript
// features/auth.js
import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        status: 'idle',
        user: null,
        token: null,
        error: null
    },
    reducers: {
        loginPending: (state) => {
            state.status = 'loading'
            state.error = null
        },
        loginSuccess: (state, action) => {
            state.status = 'succeeded'
            state.user = action.payload.user
            state.token = action.payload.token
            state.error = null
        },
        loginError: (state, action) => {
            state.status = 'failed'
            state.error = action.payload
        }
    }
})

export const { loginPending, loginSuccess, loginError } = authSlice.actions
export default authSlice.reducer
```

### **Step 3: Create Saga**

```javascript
// sagas/authSaga.js
import { put, call, takeEvery } from 'redux-saga/effects'
import { authSDK } from '../services/authSdk'
import { loginPending, loginSuccess, loginError } from '../features/auth'

export function* loginSaga(action) {
    try {
        // Dispatch pending
        yield put(loginPending())

        // Call SDK
        const response = yield call(
            authSDK.login,
            action.payload.email,
            action.payload.password
        )

        // Save token
        yield call(() => authSDK.saveToken(response.token))

        // Dispatch success
        yield put(loginSuccess(response))

    } catch (error) {
        yield put(loginError(error.message))
    }
}

export function* watchAuthSaga() {
    yield takeEvery('auth/login', loginSaga)
}
```

### **Step 4: Connect Saga Middleware**

```javascript
// store.js
import createSagaMiddleware from 'redux-saga'
import { configureStore } from '@reduxjs/toolkit'
import { watchAuthSaga } from './sagas/authSaga'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // ... other reducers
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(sagaMiddleware)
})

// Run saga
sagaMiddleware.run(watchAuthSaga)
```

### **Step 5: Use in Component**

```javascript
// components/Login.js
import { useDispatch } from 'react-redux'

function Login() {
    const dispatch = useDispatch()

    const handleLogin = (email, password) => {
        dispatch({ 
            type: 'auth/login',
            payload: { email, password }
        })
    }

    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            handleLogin(email, password)
        }}>
            {/* Form inputs */}
        </form>
    )
}
```

---

## Real-World Examples

### **Example 1: Login Flow with Saga + SDK + BFF**

```
FRONTEND (React)
├─ Component: Login.js
│  └─ User enters email & password
│     └─ Clicks "Sign In"
│        └─ dispatch({ type: 'auth/login', payload: {...} })
│
├─ Saga Middleware: authSaga.js
│  └─ Listens for 'auth/login' action
│     ├─ yield put(loginPending) → Show spinner
│     ├─ yield call(authSDK.login) → Call SDK
│     └─ yield put(loginSuccess) → Save token & user
│
├─ SDK Layer: authSdk.js
│  └─ login(email, password)
│     ├─ Validate inputs
│     ├─ POST /api/web/login → Send to BFF
│     ├─ Parse response
│     └─ Return { token, user, permissions }
│
BACKEND (Node.js / Python)
├─ BFF Route: POST /api/web/login
│  └─ Receives { email, password }
│     ├─ Call authService.authenticate()
│     ├─ Load user profile
│     ├─ Load user permissions
│     ├─ Transform to web format
│     └─ Send response { token, user, permissions }
│
├─ Core Services
│  ├─ authService.authenticate(email, password)
│  ├─ userService.getById(userId)
│  └─ permissionService.getPermissions(userId)
│
└─ Database
   └─ Users, Auth tokens, Permissions tables
```

### **Code Flow Example**

```javascript
// FRONTEND - Component dispatches action
dispatch({
    type: 'auth/login',
    payload: {
        email: 'john@example.com',
        password: 'secret123'
    }
})

// SAGA - Intercepts and coordinates
function* loginSaga(action) {
    // Show loading
    yield put(loginPending())

    // Call SDK
    try {
        const result = yield call(
            authSDK.login,
            action.payload.email,
            action.payload.password
        )
        
        // Save token to localStorage
        yield call(() => {
            localStorage.setItem('authToken', result.token)
        })
        
        // Success
        yield put(loginSuccess({
            user: result.user,
            token: result.token,
            permissions: result.permissions
        }))
    } catch (error) {
        yield put(loginError(error.message))
    }
}

// SDK - Makes HTTP request
async login(email, password) {
    // Add auth headers
    const headers = {
        'Content-Type': 'application/json'
    }
    
    // Make request to BFF endpoint
    const response = await fetch(
        `${this.baseUrl}/api/web/login`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, password })
        }
    )
    
    // Handle errors
    if (!response.ok) {
        throw new Error('Login failed')
    }
    
    // Return data
    return response.json()
}

// BFF - Processes request
// POST /api/web/login
app.post('/api/web/login', async (req, res) => {
    const { email, password } = req.body
    
    // Authenticate user
    const user = await authService.authenticate(email, password)
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Generate token
    const token = authService.generateToken(user.id)
    
    // Load permissions (only what web needs)
    const permissions = await permissionService.getWebPermissions(user.id)
    
    // Return optimized for web
    res.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        permissions
    })
})
```

---

## Step-by-Step Implementation Checklist

### **Phase 1: SDK Setup (Week 1)**
- [ ] Create `services/authSdk.js` class
- [ ] Implement `login()` method
- [ ] Add error handling
- [ ] Add token management
- [ ] Update current thunk to use SDK instead of direct fetch

### **Phase 2: Saga Setup (Week 2)**
- [ ] Install redux-saga: `npm install redux-saga`
- [ ] Create `sagas/authSaga.js`
- [ ] Setup saga middleware in store
- [ ] Update reducers (add pending/success/error actions)
- [ ] Test saga flow

### **Phase 3: BFF Creation (Week 3)**
- [ ] Create BFF API endpoints
- [ ] Update SDK to point to BFF
- [ ] Optimize response format for web
- [ ] Add response transformation
- [ ] Test end-to-end

### **Phase 4: Migration (Week 4)**
- [ ] Replace all thunks with sagas gradually
- [ ] Update components to use sagas
- [ ] Remove old thunk code
- [ ] Comprehensive testing
- [ ] Performance monitoring

---

## Complexity Timeline

```
Current Setup (Thunk):
┌─────────────────────────────────────────────┐
│ Component → Thunk → SDK → API               │
│ Complexity: LOW ✅                          │
│ Setup time: 1 day                           │
│ Maintenance: Easy                            │
│ Async handling: OK for simple flows          │
└─────────────────────────────────────────────┘

With Saga:
┌─────────────────────────────────────────────┐
│ Component → Saga → SDK → API                │
│ Complexity: MEDIUM                          │
│ Setup time: 3-5 days                        │
│ Maintenance: More testing needed            │
│ Async handling: Excellent for complex flows │
└─────────────────────────────────────────────┘

With Saga + BFF:
┌──────────────────────────────────────────────────┐
│ Component → Saga → SDK → BFF → Core Backend      │
│ Complexity: HIGH                                 │
│ Setup time: 2-3 weeks                           │
│ Maintenance: Requires BFF team                   │
│ Async handling: Optimal, cleaner responses       │
│ Benefits: Scalability, multiple clients          │
└──────────────────────────────────────────────────┘
```

---

## Decision Tree

```
Do I need Saga + SDK + BFF?

START
  │
  ├─ Is app simple? (1-5 API calls total)
  │  └─ YES → Keep Thunk + Services ✅
  │
  ├─ Complex async sequences? (login → fetch data → navigate)
  │  ├─ YES → Add Saga ✅
  │  └─ NO → Keep Thunk
  │
  ├─ Multiple client types? (web + mobile + desktop)
  │  ├─ YES → Add BFF ✅
  │  └─ NO → Stick with single API
  │
  ├─ Need caching, auth, errors standardized?
  │  ├─ YES → Enhance SDK ✅
  │  └─ NO → Basic SDK OK
  │
  └─ Team size > 5 growing?
     ├─ YES → BFF enables parallel development ✅
     └─ NO → Direct backend OK
```

---

## Your Project: Where to Start?

### **Current Status**
```
Redux Toolkit ✅
+ Thunk ✅
+ Services (basic SDK) ✅
= Perfect for current app state
```

### **Recommendation**

**Phase 1 (Now):** Enhance SDK
```javascript
// Add to services/api.js
class WeatherSDK {
    - Add caching
    - Add error standardization
    - Add timeout handling
}
// Effort: 1-2 days
// Benefit: Better code organization
// No breaking changes
```

**Phase 2 (When needed):** Add Saga
```javascript
// When you have:
// - Multiple sequential API calls
// - Complex data loading flows
// - Need to cancel requests
// Effort: 1-2 weeks
// Benefit: Better async handling
```

**Phase 3 (If scaling):** Add BFF
```javascript
// When you have:
// - Multiple client types (web + mobile)
// - Need optimization per client
// - Growing backend team
// Effort: 3-4 weeks
// Benefit: Scalability
```

---

## Adding a New API Call: Step-by-Step Guide

This guide shows the exact steps to add a new API call in the correct order. We'll use "getUserProfile" as an example - fetching detailed user profile data after login.

### **Step 1: Define the Model (Data Structure)**

First, create or update your data models to handle the new API response.

```javascript
// models/UserProfile.js
export class UserProfile {
    constructor(data = {}) {
        this.id = data.id || null
        this.email = data.email || ''
        this.firstName = data.firstName || ''
        this.lastName = data.lastName || ''
        this.avatar = data.avatar || null
        this.bio = data.bio || ''
        this.location = data.location || ''
        this.website = data.website || ''
        this.joinDate = data.joinDate ? new Date(data.joinDate) : null
        this.lastActive = data.lastActive ? new Date(data.lastActive) : null
        this.stats = data.stats || {
            posts: 0,
            followers: 0,
            following: 0
        }
    }

    // Validation
    static validate(data) {
        const errors = []
        if (!data.id) errors.push('User ID is required')
        if (!data.email || !data.email.includes('@')) {
            errors.push('Valid email is required')
        }
        return errors
    }

    // Computed properties
    get displayName() {
        return `${this.firstName} ${this.lastName}`.trim() || this.email
    }

    get isActive() {
        if (!this.lastActive) return false
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return this.lastActive > oneWeekAgo
    }

    get profileCompleteness() {
        const fields = [this.firstName, this.lastName, this.bio, this.location, this.website, this.avatar]
        const filledFields = fields.filter(field => field && field.toString().trim()).length
        return Math.round((filledFields / fields.length) * 100)
    }
}
```

### **Step 2: Add Action Types and Creators**

Update your action types and create action creators for the new API call.

```javascript
// constants/actionTypes.js (add to existing)
export const USER_ACTIONS = {
    FETCH_PROFILE: 'user/fetchProfile',
    FETCH_PROFILE_PENDING: 'user/fetchProfilePending',
    FETCH_PROFILE_SUCCESS: 'user/fetchProfileSuccess',
    FETCH_PROFILE_ERROR: 'user/fetchProfileError',
    UPDATE_PROFILE: 'user/updateProfile',
    CLEAR_PROFILE: 'user/clearProfile'
}

// actions/userActions.js (new file)
import { USER_ACTIONS } from '../constants/actionTypes'

export const fetchProfile = (userId) => ({
    type: USER_ACTIONS.FETCH_PROFILE,
    payload: { userId }
})

export const fetchProfilePending = () => ({
    type: USER_ACTIONS.FETCH_PROFILE_PENDING
})

export const fetchProfileSuccess = (profile) => ({
    type: USER_ACTIONS.FETCH_PROFILE_SUCCESS,
    payload: profile
})

export const fetchProfileError = (error) => ({
    type: USER_ACTIONS.FETCH_PROFILE_ERROR,
    payload: error
})

export const updateProfile = (updates) => ({
    type: USER_ACTIONS.UPDATE_PROFILE,
    payload: updates
})

export const clearProfile = () => ({
    type: USER_ACTIONS.CLEAR_PROFILE
})
```

### **Step 3: Create Redux Slice (State Management)**

Add a new slice to manage the profile state.

```javascript
// features/userProfile.js
import { createSlice } from '@reduxjs/toolkit'

const userProfileSlice = createSlice({
    name: 'userProfile',
    initialState: {
        profile: null,
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        lastFetched: null
    },
    reducers: {
        fetchProfilePending: (state) => {
            state.status = 'loading'
            state.error = null
        },
        fetchProfileSuccess: (state, action) => {
            state.status = 'succeeded'
            state.profile = action.payload
            state.error = null
            state.lastFetched = new Date().toISOString()
        },
        fetchProfileError: (state, action) => {
            state.status = 'failed'
            state.error = action.payload
            state.profile = null
        },
        updateProfile: (state, action) => {
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload }
            }
        },
        clearProfile: (state) => {
            state.profile = null
            state.status = 'idle'
            state.error = null
            state.lastFetched = null
        }
    }
})

export const {
    fetchProfilePending,
    fetchProfileSuccess,
    fetchProfileError,
    updateProfile,
    clearProfile
} = userProfileSlice.actions

export default userProfileSlice.reducer
```

### **Step 4: Update SDK with New Method**

Add the new API method to your SDK class.

```javascript
// services/authSdk.js (add to existing AuthSDK class)
import { UserProfile } from '../models/UserProfile'

export class AuthSDK {
    // ... existing methods ...

    // ═══════════════════════════════════════════════════════════
    // NEW METHOD: Get User Profile
    // ═══════════════════════════════════════════════════════════
    async getUserProfile(userId) {
        // STEP 1: Validate input
        if (!userId) {
            throw new Error('User ID is required')
        }

        // STEP 2: Make API request to BFF
        const url = `${this.baseUrl}/api/web/users/${userId}/profile`
        const response = await this.makeRequest(url, {
            method: 'GET'
        })

        // STEP 3: Validate response
        if (!response.success || !response.data) {
            throw new Error('Invalid profile response')
        }

        // STEP 4: Transform to model
        return new UserProfile(response.data)
    }

    // ═══════════════════════════════════════════════════════════
    // NEW METHOD: Update User Profile
    // ═══════════════════════════════════════════════════════════
    async updateUserProfile(userId, updates) {
        // STEP 1: Validate inputs
        if (!userId) {
            throw new Error('User ID is required')
        }

        // STEP 2: Make API request
        const url = `${this.baseUrl}/api/web/users/${userId}/profile`
        const response = await this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(updates)
        })

        // STEP 3: Return updated profile
        return new UserProfile(response.data)
    }
}

// Export updated singleton
export const authSDK = new AuthSDK({
    baseUrl: process.env.REACT_APP_API_URL
})
```

### **Step 5: Create Saga for the New API Call**

Create a saga to handle the async flow.

```javascript
// sagas/userSaga.js
import { put, call, takeEvery, select } from 'redux-saga/effects'
import { authSDK } from '../services/authSdk'
import {
    fetchProfilePending,
    fetchProfileSuccess,
    fetchProfileError,
    updateProfile
} from '../features/userProfile'

// ═══════════════════════════════════════════════════════════════
// SAGA: Fetch User Profile
// ═══════════════════════════════════════════════════════════════
export function* fetchUserProfileSaga(action) {
    try {
        console.log('🔄 Fetching user profile for:', action.payload.userId)

        // STEP 1: Check if we need to fetch (optional caching)
        const currentProfile = yield select(state => state.userProfile.profile)
        const lastFetched = yield select(state => state.userProfile.lastFetched)

        // If we have recent data, skip fetch
        if (currentProfile && lastFetched) {
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
            if (new Date(lastFetched).getTime() > fiveMinutesAgo) {
                console.log('✅ Using cached profile data')
                return
            }
        }

        // STEP 2: Dispatch pending action
        yield put(fetchProfilePending())

        // STEP 3: Get auth token from state
        const token = yield select(state => state.auth.token)
        if (!token) {
            throw new Error('Authentication required')
        }

        // STEP 4: Call SDK method
        console.log('📡 Calling SDK getUserProfile...')
        const profile = yield call(
            authSDK.getUserProfile,
            action.payload.userId
        )

        // STEP 5: Dispatch success action
        console.log('✅ Profile fetched successfully')
        yield put(fetchProfileSuccess(profile))

    } catch (error) {
        console.error('❌ Profile fetch error:', error.message)
        yield put(fetchProfileError(error.message))
    }
}

// ═══════════════════════════════════════════════════════════════
// SAGA: Update User Profile
// ═══════════════════════════════════════════════════════════════
export function* updateUserProfileSaga(action) {
    try {
        console.log('🔄 Updating user profile...')

        // STEP 1: Get current user ID from auth state
        const userId = yield select(state => state.auth.user?.id)
        if (!userId) {
            throw new Error('User not authenticated')
        }

        // STEP 2: Call SDK method
        const updatedProfile = yield call(
            authSDK.updateUserProfile,
            userId,
            action.payload
        )

        // STEP 3: Update local state
        yield put(updateProfile(action.payload))

        // STEP 4: Show success message (optional)
        yield call(() => {
            // Could dispatch a notification action here
            console.log('✅ Profile updated successfully')
        })

    } catch (error) {
        console.error('❌ Profile update error:', error.message)
        // Could dispatch error notification here
    }
}

// ═══════════════════════════════════════════════════════════════
// WATCHER SAGA: Listen for actions
// ═══════════════════════════════════════════════════════════════
export function* watchUserSaga() {
    yield takeEvery('user/fetchProfile', fetchUserProfileSaga)
    yield takeEvery('user/updateProfile', updateUserProfileSaga)
}
```

### **Step 6: Update Store Configuration**

Add the new reducer and run the saga.

```javascript
// store.js
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'

// Import reducers
import authReducer from './features/auth'
import userProfileReducer from './features/userProfile'  // NEW

// Import sagas
import { watchAuthSaga } from './sagas/authSaga'
import { watchUserSaga } from './sagas/userSaga'  // NEW

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        auth: authReducer,
        userProfile: userProfileReducer,  // NEW
        // ... other reducers
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(sagaMiddleware)
})

// Run sagas
sagaMiddleware.run(watchAuthSaga)
sagaMiddleware.run(watchUserSaga)  // NEW
```

### **Step 7: Create/Update Custom Hook**

Add the new functionality to your hooks.

```javascript
// hooks/useUser.js (new file)
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile, updateProfile, clearProfile } from '../actions/userActions'

export const useUser = () => {
    const dispatch = useDispatch()
    const {
        profile,
        status,
        error,
        lastFetched
    } = useSelector(state => state.userProfile)

    // ═══════════════════════════════════════════════════════════
    // ACTION METHODS
    // ═══════════════════════════════════════════════════════════
    const getUserProfile = (userId) => {
        dispatch(fetchProfile(userId))
    }

    const updateUserProfile = (updates) => {
        dispatch(updateProfile(updates))
    }

    const clearUserProfile = () => {
        dispatch(clearProfile())
    }

    // ═══════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════
    const isLoading = status === 'loading'
    const hasError = !!error
    const hasProfile = !!profile
    const isStale = lastFetched ?
        (Date.now() - new Date(lastFetched).getTime()) > (10 * 60 * 1000) : // 10 minutes
        true

    // ═══════════════════════════════════════════════════════════
    // SELECTORS
    // ═══════════════════════════════════════════════════════════
    const getProfileCompleteness = () => {
        return profile?.profileCompleteness || 0
    }

    const isProfileActive = () => {
        return profile?.isActive || false
    }

    return {
        // State
        profile,
        status,
        error,
        lastFetched,

        // Computed
        isLoading,
        hasError,
        hasProfile,
        isStale,

        // Actions
        getUserProfile,
        updateUserProfile,
        clearUserProfile,

        // Selectors
        getProfileCompleteness,
        isProfileActive
    }
}
```

### **Step 8: Update Components to Use the New API**

Finally, use the new hook in your components.

```javascript
// components/Profile/Profile.js
import React, { useEffect } from 'react'
import { useUser } from '../../hooks/useUser'
import { useAuth } from '../../hooks/useAuth'

function Profile() {
    const { user } = useAuth()
    const {
        profile,
        isLoading,
        error,
        hasProfile,
        isStale,
        getUserProfile,
        getProfileCompleteness
    } = useUser()

    // Fetch profile on mount or when user changes
    useEffect(() => {
        if (user?.id && (!hasProfile || isStale)) {
            getUserProfile(user.id)
        }
    }, [user?.id, hasProfile, isStale, getUserProfile])

    if (isLoading) {
        return <div>Loading profile...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    if (!profile) {
        return <div>No profile data available</div>
    }

    return (
        <div className="profile">
            <div className="profile-header">
                <img
                    src={profile.avatar || '/default-avatar.png'}
                    alt="Profile"
                    className="profile-avatar"
                />
                <div className="profile-info">
                    <h1>{profile.displayName}</h1>
                    <p className="profile-email">{profile.email}</p>
                    <div className="profile-stats">
                        <span>{profile.stats.posts} posts</span>
                        <span>{profile.stats.followers} followers</span>
                        <span>{profile.stats.following} following</span>
                    </div>
                    <div className="profile-completeness">
                        Profile {getProfileCompleteness()}% complete
                    </div>
                </div>
            </div>

            {profile.bio && (
                <div className="profile-bio">
                    <h3>Bio</h3>
                    <p>{profile.bio}</p>
                </div>
            )}

            <div className="profile-details">
                {profile.location && <p>Location: {profile.location}</p>}
                {profile.website && (
                    <p>
                        Website: <a href={profile.website} target="_blank" rel="noopener noreferrer">
                            {profile.website}
                        </a>
                    </p>
                )}
                {profile.joinDate && (
                    <p>Joined: {profile.joinDate.toLocaleDateString()}</p>
                )}
            </div>
        </div>
    )
}

export default Profile
```

### **Step 9: Update BFF Endpoint (Backend)**

Finally, implement the BFF endpoint that the SDK calls.

```javascript
// BFF Server (Node.js/Express example)
// routes/web/userRoutes.js
const express = require('express')
const router = express.Router()
const authService = require('../../services/authService')
const userService = require('../../services/userService')

// GET /api/web/users/:userId/profile
router.get('/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params

        // Verify user has permission to view this profile
        const currentUserId = req.user?.id // From auth middleware
        if (currentUserId !== userId) {
            // Check if they can view others' profiles
            const canView = await authService.canViewProfile(currentUserId, userId)
            if (!canView) {
                return res.status(403).json({ error: 'Access denied' })
            }
        }

        // Fetch user profile from core backend
        const profile = await userService.getProfileById(userId)
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' })
        }

        // Transform for web client (remove sensitive data)
        const webProfile = {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            avatar: profile.avatar,
            bio: profile.bio,
            location: profile.location,
            website: profile.website,
            joinDate: profile.createdAt,
            lastActive: profile.lastActiveAt,
            stats: {
                posts: profile.postCount || 0,
                followers: profile.followerCount || 0,
                following: profile.followingCount || 0
            }
        }

        res.json({
            success: true,
            data: webProfile
        })

    } catch (error) {
        console.error('Profile fetch error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile'
        })
    }
})

// PUT /api/web/users/:userId/profile
router.put('/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params
        const updates = req.body

        // Verify ownership
        const currentUserId = req.user?.id
        if (currentUserId !== userId) {
            return res.status(403).json({ error: 'Can only update your own profile' })
        }

        // Validate updates
        const allowedFields = ['firstName', 'lastName', 'bio', 'location', 'website']
        const sanitizedUpdates = {}
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field]
            }
        })

        // Update profile
        const updatedProfile = await userService.updateProfile(userId, sanitizedUpdates)

        // Return web-formatted response
        const webProfile = {
            id: updatedProfile.id,
            email: updatedProfile.email,
            firstName: updatedProfile.firstName,
            lastName: updatedProfile.lastName,
            avatar: updatedProfile.avatar,
            bio: updatedProfile.bio,
            location: updatedProfile.location,
            website: updatedProfile.website,
            joinDate: updatedProfile.createdAt,
            lastActive: updatedProfile.lastActiveAt,
            stats: {
                posts: updatedProfile.postCount || 0,
                followers: updatedProfile.followerCount || 0,
                following: updatedProfile.followingCount || 0
            }
        }

        res.json({
            success: true,
            data: webProfile
        })

    } catch (error) {
        console.error('Profile update error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        })
    }
})

module.exports = router
```

### **Step 10: Testing the New API Call**

Create tests to ensure everything works correctly.

```javascript
// tests/sagas/userSaga.test.js
import { runSaga } from 'redux-saga'
import { fetchUserProfileSaga } from '../../sagas/userSaga'
import { authSDK } from '../../services/authSdk'
import { UserProfile } from '../../models/UserProfile'

jest.mock('../../services/authSdk')

describe('fetchUserProfileSaga', () => {
    it('should fetch profile successfully', async () => {
        const mockProfile = new UserProfile({
            id: '123',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe'
        })

        authSDK.getUserProfile.mockResolvedValue(mockProfile)

        const dispatched = []
        const mockStore = {
            getState: () => ({
                auth: { token: 'valid-token' },
                userProfile: { profile: null }
            }),
            dispatch: (action) => dispatched.push(action)
        }

        await runSaga(mockStore, fetchUserProfileSaga, {
            payload: { userId: '123' }
        })

        expect(authSDK.getUserProfile).toHaveBeenCalledWith('123')
        expect(dispatched).toContainEqual({
            type: 'user/fetchProfileSuccess',
            payload: mockProfile
        })
    })

    it('should handle errors', async () => {
        authSDK.getUserProfile.mockRejectedValue(new Error('API Error'))

        const dispatched = []
        const mockStore = {
            getState: () => ({
                auth: { token: 'valid-token' }
            }),
            dispatch: (action) => dispatched.push(action)
        }

        await runSaga(mockStore, fetchUserProfileSaga, {
            payload: { userId: '123' }
        })

        expect(dispatched).toContainEqual({
            type: 'user/fetchProfileError',
            payload: 'API Error'
        })
    })
})
```

---

## Summary: Adding New API Calls

**Order of Implementation:**
1. **Model** → Define data structure
2. **Actions** → Create action types & creators  
3. **Reducer** → Add state management slice
4. **SDK** → Add API method with error handling
5. **Saga** → Create async flow handler
6. **Store** → Register reducer & saga
7. **Hook** → Add to custom hook
8. **Component** → Use in React component
9. **BFF** → Implement backend endpoint
10. **Tests** → Add comprehensive tests

**Key Benefits of This Approach:**
- ✅ **Modular**: Each layer has single responsibility
- ✅ **Testable**: Each piece can be tested independently  
- ✅ **Maintainable**: Clear separation of concerns
- ✅ **Scalable**: Easy to add more API calls following same pattern
- ✅ **Type Safe**: Models ensure data consistency
- ✅ **Error Handling**: Centralized in SDK layer
- ✅ **Caching**: Built into saga logic
- ✅ **Loading States**: Automatic UI feedback

**Start simple, upgrade gradually, don't over-engineer early!** 🚀
