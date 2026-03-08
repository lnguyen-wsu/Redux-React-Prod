# React Fundamentals: Hooks, Redux, Saga, SDK, BFF & Rendering

This guide explains React core concepts and how they interact with advanced patterns like Redux, Saga, SDK, and BFF in your application architecture.

---

## 📚 Table of Contents
1. [React Hooks Fundamentals](#react-hooks-fundamentals)
2. [Hooks Interaction with Redux/Saga/SDK/BFF](#hooks-interaction-with-reduxsagasdkbff)
3. [Component Rendering Behavior](#component-rendering-behavior)
4. [Duplicate API Requests in Saga-SDK-Redux Pattern](#duplicate-api-requests-in-saga-sdk-redux-pattern)
5. [Best Practices & Solutions](#best-practices--solutions)

---

## React Hooks Fundamentals

### Core Hooks Overview

**useState**: Local component state management
```jsx
const [count, setCount] = useState(0)
// count: current state value
// setCount: function to update state
// Triggers re-render when state changes
```

**useEffect**: Side effects (API calls, subscriptions, DOM manipulation)
```jsx
useEffect(() => {
  // Runs after render
  console.log('Component mounted/updated')
  
  return () => {
    // Cleanup function (runs before unmount/next effect)
    console.log('Cleanup')
  }
}, [dependencies]) // Only re-run when dependencies change
```

**useRef**: Mutable reference that persists across renders
```jsx
const inputRef = useRef(null)
// Access DOM: inputRef.current.focus()
// Store mutable values without triggering re-renders
```

**useMemo**: Memoize expensive computations
```jsx
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b]) // Only recompute when a or b change
```

**useCallback**: Memoize functions
```jsx
const handleClick = useCallback(() => {
  doSomething(a, b)
}, [a, b]) // Function reference stable unless a/b change
```

---

## Hooks Interaction with Redux/Saga/SDK/BFF

### Redux Integration

**Direct Redux Hooks**:
```jsx
import { useDispatch, useSelector } from 'react-redux'

function MyComponent() {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user.value)
  
  // Dispatch actions
  const handleLogin = () => dispatch(login(userData))
  
  return <div>{user.name}</div>
}
```

**Custom Hooks with Redux** (Your Architecture Pattern):
```jsx
// hooks/useTheme.js
export function useTheme() {
  const dispatch = useDispatch()
  const color = useSelector(state => state.theme.value)
  
  const setColor = useCallback((newColor) => {
    dispatch(updateColor(newColor))
  }, [dispatch])
  
  return { color, setColor }
}

// Component usage
function ThemeComponent() {
  const { color, setColor } = useTheme()
  // Clean, no direct Redux knowledge
}
```

### Saga Pattern Integration

**Saga with useEffect**:
```jsx
function WeatherComponent() {
  const dispatch = useDispatch()
  const { weather, status } = useWeather()
  
  useEffect(() => {
    // Dispatch action that Saga listens for
    dispatch(fetchWeatherRequest())
  }, [dispatch])
  
  // Saga handles: API call → Success/Error actions → State update
}
```

**Saga Flow**:
```
Component dispatches action
    ↓
Saga middleware intercepts
    ↓
Generator function executes
    ↓
yield call(apiFunction) - Makes API request
    ↓
yield put(successAction) - Updates Redux state
    ↓
Component re-renders with new data
```

### SDK Pattern Integration

**SDK as Service Layer**:
```jsx
// services/weatherSdk.js
class WeatherSDK {
  async getWeather() {
    // Handles: validation, retry, caching, error formatting
    const response = await this.request('/weather')
    return this.transformResponse(response)
  }
}

// Redux Thunk uses SDK
export const fetchWeather = createAsyncThunk(
  'weather/fetchWeather',
  async () => {
    const sdk = new WeatherSDK()
    return await sdk.getWeather()
  }
)

// useEffect triggers the thunk
useEffect(() => {
  dispatch(fetchWeather())
}, [])
```

### BFF (Backend for Frontend) Integration

**BFF Pattern**:
- BFF server sits between frontend and microservices
- Aggregates multiple API calls
- Formats data specifically for your frontend

**Interaction with Hooks**:
```jsx
// SDK calls BFF endpoint
const bffResponse = await sdk.callBFF('/dashboard-data')

// BFF handles multiple services:
// - User service: GET /user/profile
// - Weather service: GET /weather/current
// - Notifications: GET /notifications/unread

// Returns single response for frontend
// useEffect processes the aggregated data
```

---

## Component Rendering Behavior

### Parent-Child Rendering Rules

**Key Principle**: When a component re-renders, ALL its children re-render by default.

```jsx
function Parent() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <Child />  {/* Re-renders when Parent re-renders */}
    </div>
  )
}

function Child() {
  console.log('Child rendered')
  return <div>Child component</div>
}
```

**Result**: Clicking button renders Parent → Child also re-renders.

### Optimization Techniques

**1. React.memo** (Shallow comparison):
```jsx
const Child = React.memo(() => {
  console.log('Child rendered')
  return <div>Child component</div>
})
// Now only re-renders if props change
```

**2. useMemo for expensive children**:
```jsx
const memoizedChild = useMemo(() => <ExpensiveChild />, [dependencies])
```

**3. useCallback for function props**:
```jsx
const handleClick = useCallback(() => {
  // Function logic
}, [dependencies])

return <Child onClick={handleClick} />
```

### Redux State Changes & Rendering

**Redux re-renders**: Components using `useSelector` re-render when selected state changes.

```jsx
function ComponentA() {
  const user = useSelector(state => state.user) // Subscribes to user slice
}

function ComponentB() {
  const theme = useSelector(state => state.theme) // Subscribes to theme slice
}

// If user state changes → Only ComponentA re-renders
// If theme state changes → Only ComponentB re-renders
```

---

## Duplicate API Requests in Saga-SDK-Redux Pattern

### Common Causes

**1. Multiple Components Mounting**:
```jsx
// Problem: Each component mounts and dispatches
function Dashboard() {
  useEffect(() => dispatch(fetchWeather()), []) // API call 1
  return <WeatherWidget />
}

function WeatherWidget() {
  useEffect(() => dispatch(fetchWeather()), []) // API call 2
}
```

**2. Strict Mode Double Rendering** (Development):
```jsx
// In development, React renders twice to detect side effects
<React.StrictMode>
  <App />
</React.StrictMode>

// Result: useEffect runs twice, API calls twice
```

**3. Hot Module Replacement (HMR)**:
- Development tool causes components to remount
- Triggers useEffect cleanup and re-run

**4. Parent Re-renders Causing Child Remounts**:
```jsx
function Parent({ userId }) {
  return <Child key={userId} /> // New key = remount = new API call
}
```

**5. Missing Dependencies in useEffect**:
```jsx
useEffect(() => {
  dispatch(fetchData())
}, []) // Empty deps = runs on every render
```

### Solutions

**1. Centralized Data Fetching**:
```jsx
// App.js - Fetch once at app level
function App() {
  useEffect(() => {
    dispatch(fetchInitialData())
  }, [])
  
  return <Dashboard />
}

// Components read from Redux, don't fetch
function WeatherWidget() {
  const weather = useSelector(state => state.weather)
  // No useEffect here
}
```

**2. Request Deduplication in SDK**:
```jsx
class WeatherSDK {
  constructor() {
    this.pendingRequests = new Map()
  }
  
  async getWeather() {
    const cacheKey = 'weather'
    
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }
    
    const request = this._fetchWeather()
    this.pendingRequests.set(cacheKey, request)
    
    try {
      const result = await request
      return result
    } finally {
      this.pendingRequests.delete(cacheKey)
    }
  }
}
```

**3. Redux Thunk Deduplication**:
```jsx
// features/weather.js
export const fetchWeather = createAsyncThunk(
  'weather/fetchWeather',
  async (_, { getState }) => {
    const state = getState()
    
    // Don't fetch if already loading or have data
    if (state.weather.status === 'loading' || state.weather.data) {
      return state.weather.data
    }
    
    return await getWeather()
  }
)
```

**4. Saga Pattern for Complex Deduplication**:
```jsx
function* fetchWeatherSaga() {
  // Check if already loading
  const isLoading = yield select(state => state.weather.status === 'loading')
  if (isLoading) return
  
  try {
    yield put(fetchWeatherPending())
    const data = yield call(getWeather)
    yield put(fetchWeatherSuccess(data))
  } catch (error) {
    yield put(fetchWeatherError(error))
  }
}
```

**5. useEffect Dependency Management**:
```jsx
// Correct dependencies
useEffect(() => {
  dispatch(fetchWeather())
}, [dispatch]) // Include dispatch if it's not stable

// Or use useCallback for dispatch
const fetchData = useCallback(() => {
  dispatch(fetchWeather())
}, [dispatch])

useEffect(() => {
  fetchData()
}, [fetchData])
```

---

## Best Practices & Solutions

### Hook Usage Guidelines

1. **useState**: For local UI state
2. **useEffect**: For side effects, API calls, subscriptions
3. **useRef**: For DOM access, timers, mutable values
4. **useMemo**: For expensive computations
5. **useCallback**: For functions passed as props

### Redux Integration Best Practices

1. **Custom Hooks**: Encapsulate Redux logic
2. **Selector Memoization**: Use reselect for complex selectors
3. **Action Creators**: Use createAsyncThunk for async operations
4. **Slice Organization**: Feature-based slices (ducks pattern)

### Preventing Duplicate Requests

1. **Single Source of Truth**: Fetch data once, share via Redux
2. **SDK Deduplication**: Cache pending requests
3. **Conditional Fetching**: Check state before dispatching
4. **Saga Coordination**: Use Saga for complex async flows

### Rendering Optimization

1. **React.memo**: Prevent unnecessary child re-renders
2. **useMemo/useCallback**: Stable references
3. **Code Splitting**: Lazy load components
4. **Virtualization**: For large lists

---

## Summary

- **Hooks** manage local state and side effects
- **Redux** provides global state management
- **Saga** handles complex async flows
- **SDK** abstracts API complexity
- **BFF** aggregates backend services
- **Rendering** follows parent-child hierarchy
- **Duplicates** caused by multiple dispatches, fixed with deduplication

This architecture provides scalable, maintainable React applications with clear separation of concerns.