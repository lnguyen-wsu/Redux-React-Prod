# Quick Reference & Cheat Sheets

Fast lookup guides for common patterns and questions

---

## 🚀 Quick Start Cheat Sheet

### Setup Redux Slice (Ducks Pattern)

```jsx
// features/notification.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getNotifications } from '../services/api'

// Async thunk for API calls
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async () => {
    const data = await getNotifications()
    return data
  }
)

// Slice combines reducer + actions
const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    list: [],
    status: 'idle',
    error: null
  },
  reducers: {
    // Synchronous actions
    clearNotifications: (state) => {
      state.list = []
    }
  },
  extraReducers: (builder) => {
    // Async thunk lifecycle
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  }
})

export const { clearNotifications } = notificationSlice.actions
export default notificationSlice.reducer
```

### Add to Store

```jsx
// store.js
import { configureStore } from '@reduxjs/toolkit'
import { notificationReducer } from './features'

export const store = configureStore({
  reducer: {
    notification: notificationReducer
  }
})
```

### Create Custom Hook

```jsx
// hooks/useNotifications.js
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, clearNotifications } from '../features'

export function useNotifications() {
  const dispatch = useDispatch()
  
  const notifications = useSelector(
    (state) => state.notification.list
  )
  const status = useSelector(
    (state) => state.notification.status
  )
  const error = useSelector(
    (state) => state.notification.error
  )

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNotifications())
    }
  }, [dispatch, status])

  const handleClear = () => dispatch(clearNotifications())

  return { notifications, status, error, handleClear }
}
```

### Use in Component

```jsx
// components/Notifications.js
import { useNotifications } from '../hooks'

function Notifications() {
  const { notifications, status, error, handleClear } = useNotifications()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'failed') return <div>Error: {error}</div>

  return (
    <div>
      {notifications.map(notif => (
        <div key={notif.id}>{notif.message}</div>
      ))}
      <button onClick={handleClear}>Clear All</button>
    </div>
  )
}

export default Notifications
```

---

## 📚 Common Patterns

### Pattern 1: Reading Data from Redux (Use Custom Hook)

```jsx
import { useTheme } from '../hooks'

// ✅ GOOD: Uses custom hook that encapsulates Redux
const { color } = useTheme()

// Component doesn't know about Redux internals
```

### Pattern 2: Dispatching Only Actions (Use useDispatch Directly)

```jsx
import { useDispatch } from 'react-redux'
import { login, logout } from '../features/user'

// ✅ GOOD: Direct dispatch for simple actions (Login.js pattern)
const dispatch = useDispatch()

onClick={() => dispatch(login({...}))}
onClick={() => dispatch(logout())}

// No need for custom hook here!
// Custom hook would add unnecessary indirection.
```

### Pattern 2a: Real-World Example (Login.js)

```jsx
// src/components/Login/Login.js
import { useDispatch } from "react-redux"
import { login, logout } from "../../features/user"
import './Login.css'

function Login() {
    const dispatch = useDispatch()
    
    return (
        <div className="login-container">
            <h2>Authentication</h2>
            <div className="login-actions">
                <button 
                    className="login-button btn-login"
                    onClick={() => {
                        dispatch(login({
                            name: "Lawn",
                            age: 45,
                            email: "abc@gmail.com"
                        }))
                    }}
                >
                    <span className="login-icon">🔐</span>
                    Sign In
                </button>
                <button
                    className="login-button btn-logout"
                    onClick={() => {
                        dispatch(logout())
                    }}
                >
                    <span className="login-icon">🚪</span>
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export default Login

// WHY NO CUSTOM HOOK?
// ✅ Only dispatches (no useSelector)
// ✅ No async operations (no useEffect inside hook)
// ✅ No state reading (no complex logic)
// ✅ Simple, direct, clear intent
// ✅ Adding useLogin() hook would hide simple dispatch calls
```

### Pattern 3: Dispatching with State Reading (Use Custom Hook)

```jsx
import { useTheme } from '../hooks'

// ✅ GOOD: Custom hook handles both reading AND writing
const { color, setColor } = useTheme()

// Inside useTheme() hook:
// - useSelector to read current color
// - useDispatch to update color
// - Returns clean API: { color, setColor }
```

### When to Create Custom Hooks vs Use useDispatch Directly

| Scenario | Use Custom Hook | Use useDispatch |
|----------|-----------------|-----------------|
| **Dispatching only** | ❌ NO | ✅ YES |
| **Reading state** | ✅ YES | ❌ NO |
| **Reading + Writing** | ✅ YES | ❌ NO |
| **Side effects (async)** | ✅ YES | ❌ NO |
| **Reusable logic** | ✅ YES | ❌ NO |
| **Simple one-liners** | ❌ NO | ✅ YES |

---

### Pattern 1: Reading Data from Redux

### Pattern 2: Dispatching Actions

```jsx
import { useDispatch } from 'react-redux'
import { login, logout } from '../features/user'

const dispatch = useDispatch()

// Sync action
dispatch(login({ name: 'John', age: 30 }))
dispatch(logout())

// Async thunk
import { fetchWeather } from '../features/weather'
dispatch(fetchWeather())
```

### Pattern 3: Form Handling

```jsx
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateProfile } from '../features/user'

function ProfileForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const dispatch = useDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(updateProfile(formData))
    setFormData({ name: '', email: '' })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter name"
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter email"
      />
      <button type="submit">Update</button>
    </form>
  )
}
```

### Pattern 4: Conditional Rendering Based on Status

```jsx
import { useData } from '../hooks'

function DataDisplay() {
  const { data, status, error } = useData()

  if (status === 'loading') {
    return <div className="spinner">Loading...</div>
  }

  if (status === 'failed') {
    return <div className="error">⚠️ {error}</div>
  }

  if (status === 'succeeded' && !data) {
    return <div className="empty">No data available</div>
  }

  return (
    <div className="data-display">
      {/* Render data */}
      {data && data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

### Pattern 5: Error Handling

```jsx
// In feature slice:
export const fetchData = createAsyncThunk(
  'data/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/data')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// In component:
const { error } = useSelector(state => state.data)

if (error) {
  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <button onClick={() => dispatch(fetchData())}>
        Retry
      </button>
    </div>
  )
}
```

---

## 🔍 How to Answer Common Questions

### Question: "Which file should I modify?"

**Answer Guide:**

| Scenario | File | Reason |
|----------|------|--------|
| User sees wrong data | `src/components/*.js` | Data display logic |
| State not updating | `src/features/*.js` | Reducer logic |
| API call fails | `src/services/api.js` | API request logic |
| Hook not returning data | `src/hooks/*.js` | Hook logic |
| Redux state missing field | `src/store.js` | Store configuration |
| Button click does nothing | Check reducer for action | Action handler |
| Component won't re-render | Check useSelector subscription | Selector logic |

### Question: "How do I add a new feature?"

**Step-by-Step:**

1. **Create feature slice** (`src/features/myFeature.js`)
   - Define initialState
   - Create reducers for actions
   - Add extraReducers if async

2. **Register in store** (`src/store.js`)
   - Import reducer
   - Add to configureStore

3. **Create custom hook** (`src/hooks/useMyFeature.js`)
   - Export Redux logic
   - Encapsulate complexity

4. **Create component** (`src/components/MyFeature/MyFeature.js`)
   - Use custom hook
   - Render UI
   - Handle events

5. **Add to App** (`src/App.js`)
   - Import component
   - Add to JSX tree

---

## 🧪 Testing Cheat Sheet

### Test Reducer

```jsx
import { myReducer, myAction } from '../features/myFeature'

describe('myReducer', () => {
  it('should handle myAction', () => {
    const initialState = { value: '' }
    const action = {
      type: myAction.type,
      payload: 'test'
    }
    
    const newState = myReducer(initialState, action)
    expect(newState.value).toBe('test')
  })
})
```

### Test Hook

```jsx
import { renderHook, act } from '@testing-library/react'
import { useMyHook } from '../hooks'
import { Provider } from 'react-redux'
import { store } from '../store'

function Wrapper({ children }) {
  return <Provider store={store}>{children}</Provider>
}

it('should return data from hook', () => {
  const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper })
  
  expect(result.current.data).toBeDefined()
})

it('should update data on action', () => {
  const { result } = renderHook(() => useMyHook(), { wrapper: Wrapper })
  
  act(() => {
    result.current.updateData('new value')
  })
  
  expect(result.current.data).toBe('new value')
})
```

### Test Component

```jsx
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import MyComponent from '../components/MyComponent'

// Mock store
const mockStore = configureStore({
  reducer: {
    myFeature: (state = { value: 'test' }) => state
  }
})

it('should display data', () => {
  render(
    <Provider store={mockStore}>
      <MyComponent />
    </Provider>
  )
  
  expect(screen.getByText('test')).toBeInTheDocument()
})
```

### Test Async Thunk

```jsx
import { fetchData } from '../features/myFeature'
import { configureStore } from '@reduxjs/toolkit'

it('should handle async thunk', async () => {
  const store = configureStore({
    reducer: { /* ... */ }
  })
  
  // Dispatch thunk
  await store.dispatch(fetchData())
  
  // Check state
  const state = store.getState()
  expect(state.myFeature.status).toBe('succeeded')
})
```

---

## 🐛 Debugging Checklist

### Component Not Re-rendering

- [ ] Check `useSelector` is subscribed to correct state path
- [ ] Verify reducer is actually changing state
- [ ] Confirm action is being dispatched (use Redux DevTools)
- [ ] Check component is inside `<Provider>`
- [ ] Verify no circular dependencies in imports

### Redux State Not Updating

- [ ] Check action type matches reducer case
- [ ] Verify reducer is merged into store
- [ ] Confirm action payload is correct shape
- [ ] Check Redux DevTools for action dispatch
- [ ] Look for async operations that need thunk

### API Call Not Happening

- [ ] Check thunk is dispatched
- [ ] Verify useEffect dependency array
- [ ] Confirm status check prevents duplicate calls
- [ ] Check network tab for actual request
- [ ] Verify API response format matches expectations

### Infinite Loops

- [ ] Check useEffect dependency array
- [ ] Verify reducer doesn't mutate original state
- [ ] Confirm dispatch isn't called in render
- [ ] Look for circular selector dependencies

### Memory Leaks

- [ ] Cleanup in useEffect return function
- [ ] Cancel in-flight requests on unmount
- [ ] Unsubscribe from listeners
- [ ] Clear timers and intervals

---

## 📊 State Shape Reference

### User Slice
```jsx
state.user = {
  value: {
    name: "John",
    age: 30,
    email: "john@example.com"
  }
}
```

### Theme Slice
```jsx
state.theme = {
  value: "#2563eb"  // Hex color
}
```

### Weather Slice
```jsx
state.weather = {
  value: 12.5,                    // Temperature
  status: "idle|loading|succeeded|failed",
  error: null || "Error message"
}
```

### For New Feature
```jsx
state.myFeature = {
  data: [],                       // Or appropriate type
  status: "idle|loading|succeeded|failed",
  error: null || "Error message"
}
```

---

## 🎯 Performance Tips

### Use Selectors Properly

```jsx
// ❌ BAD: Creates new object every render
useSelector(state => ({
  a: state.a,
  b: state.b
}))

// ✅ GOOD: Use createSelector for memoization
const selectAandB = createSelector(
  state => state.a,
  state => state.b,
  (a, b) => ({ a, b })
)
useSelector(selectAandB)
```

### Memoize Components

```jsx
import { memo } from 'react'

const MyComponent = memo(function MyComponent(props) {
  // Only re-renders if props change
})
```

### Optimize Thunks

```jsx
// Good: Simple, focused thunk
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId) => {
    const response = await fetch(`/api/users/${userId}`)
    return response.json()
  }
)
```

---

## 🔗 Import Reference

### From Redux Toolkit
```jsx
import {
  createSlice,
  createAsyncThunk,
  configureStore,
  createSelector
} from '@reduxjs/toolkit'
```

### From React-Redux
```jsx
import {
  useDispatch,
  useSelector,
  useStore,
  shallowEqual
} from 'react-redux'
```

### From React
```jsx
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  Suspense,
  lazy
} from 'react'
```

---

## 📝 File Template

### New Feature Slice

```jsx
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const featureName = 'featureName'

// Async operations (if needed)
export const fetchFeatureData = createAsyncThunk(
  `${featureName}/fetchData`,
  async (_, { rejectWithValue }) => {
    try {
      // const response = await api call
      // return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Feature slice
const featureSlice = createSlice({
  name: featureName,
  initialState: {
    data: null,
    status: 'idle',
    error: null
  },
  reducers: {
    // Sync actions here
  },
  extraReducers: (builder) => {
    // Async thunk handlers here
    builder
      .addCase(fetchFeatureData.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchFeatureData.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
      })
      .addCase(fetchFeatureData.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  }
})

export const { /* actions */ } = featureSlice.actions
export default featureSlice.reducer
```

### New Hook

```jsx
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { fetchFeatureData } from '../features'

export function useFeature() {
  const dispatch = useDispatch()
  
  const data = useSelector(state => state.feature.data)
  const status = useSelector(state => state.feature.status)
  const error = useSelector(state => state.feature.error)

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFeatureData())
    }
  }, [dispatch, status])

  return { data, status, error }
}
```

---

## 🎓 Learning Path

**Week 1: Fundamentals**
- [ ] Understand Redux store concept
- [ ] Learn reducers and actions
- [ ] Practice dispatch and useSelector
- [ ] Understand component re-rendering

**Week 2: Advanced Patterns**
- [ ] Master async thunks
- [ ] Learn createSelector
- [ ] Build custom hooks
- [ ] Understand Immer mutations

**Week 3: Real Applications**
- [ ] Build feature slices
- [ ] Create reusable hooks
- [ ] Handle errors properly
- [ ] Optimize performance

**Week 4: Testing & Deployment**
- [ ] Test reducers and thunks
- [ ] Test hooks
- [ ] Test components
- [ ] Deploy confidently

---

## ❓ FAQ Quick Answers

**Q: When should I use Redux vs useState?**
A: Use Redux for **shared, complex state**. Use useState for **local, simple state**.

**Q: How do I pass data between sibling components?**
A: Put it in Redux! That's exactly what Redux is for.

**Q: Can I have multiple stores?**
A: No, use one store with multiple slices instead.

**Q: Should I put all state in Redux?**
A: No, just shared/global state. Keep local state in components.

**Q: How do I debug Redux?**
A: Install Redux DevTools browser extension.

**Q: What if my thunk takes arguments?**
A: Pass them: `dispatch(fetchUser(userId))`

**Q: Can I call one thunk from another?**
A: Yes, but prefer decomposing into smaller functions.

**Q: How do I clear Redux state?**
A: Create a reset action and call it.

**Q: When should I create a custom hook for Redux?**
A: When the hook **reads state** (useSelector) OR **handles side effects** (useEffect). 
   - Profile/Theme: Use `useTheme()`, `useWeather()` ✅ (read + side effects)
   - Login: Use `useDispatch()` directly ✅ (only dispatch, no reading)
   - Rule: Don't create hooks just to wrap 1-2 lines of dispatch code.

**Q: Why doesn't Login.js use a custom hook?**
A: Because it ONLY dispatches actions without reading Redux state or handling side effects. 
   Creating `useLogin()` would add indirection without reducing complexity. 
   Direct `useDispatch()` is cleaner.

---

**Keep this guide handy for quick reference!** 📖
