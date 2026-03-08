# Architecture Diagrams - Visual Deep Dive

Visual representations of how the application works

---

## 1. Redux State Management Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                   Redux Dispatch Cycle                       │
└─────────────────────────────────────────────────────────────┘

ACTION TYPES:
├─ SYNC ACTIONS (Immediate)
│  ├─ User/login → Synchronous state update
│  ├─ User/logout → Synchronous state update
│  └─ Theme/updateColor → Synchronous state update
│
└─ ASYNC ACTIONS (With Pending/Fulfilled/Rejected)
   └─ weather/fetchWeather
      ├─ => weather/fetchWeather/pending
      ├─ => weather/fetchWeather/fulfilled
      └─ => weather/fetchWeather/rejected

FLOW DIAGRAM:

User Event          Redux Action          Reducer              Store
(Click button) ──→ dispatch() ──→ Action Object ──→ (state update)
                  actionCreator()                        ↓
                                                    Subscribers notified
                                                         ↓
                                                  Re-render Components
                                                  (via useSelector)
                                                         ↓
                                                    Browser Updates UI
```

---

## 2. Component to Redux Connection Map

```
Components Layer:
┌───────────────────────────────────────────────────────────┐
│  Profile.js         Login.js         Theme.js             │
├───────────────────────────────────────────────────────────┤
│  Reads:             Reads:           Reads:               │
│  • state.user       • N/A             • (form input)       │
│  • state.theme                       Writes:              │
│  • state.weather    Writes:          • updateColor()      │
│                     • login()                              │
│  Uses:              • logout()        Uses:                │
│  • useTheme()                        • useTheme()          │
│  • useWeather()     Uses:            • useWeather()       │
│  (custom hooks)     • useDispatch()   (custom hooks)       │
│                     (direct, no                            │
│                      custom hook!)                         │
└───────────────────────────────────────────────────────────┘

⚠️  KEY INSIGHT: Why Login.js Uses useDispatch Directly
────────────────────────────────────────────────────────
Profile & Theme use custom hooks (useTheme, useWeather) because:
  ✅ They READ state (useSelector inside)
  ✅ They handle SIDE EFFECTS (useEffect inside)
  ✅ Logic is REUSABLE (used by multiple components)
  ✅ Custom hook REDUCES COMPLEXITY

Login.js uses useDispatch directly because:
  ✅ It ONLY dispatches (no state reading)
  ✅ No side effects or async operations
  ✅ Creating a custom hook would ADD indirection
  ✅ Direct useDispatch() is SIMPLER and CLEANER

💡 Rule: Custom hooks should provide real value by encapsulating
   complexity, not just wrap 1-2 lines of code.

                            ↓↑
                     Redux Hooks API
                  (useDispatch, useSelector)
                            ↓↑
Redux Store:
┌───────────────────────────────────────────────────────────┐
│  Reducer Slices:                                          │
│  • user: { value: {...} }                                 │
│  • theme: { value: '#...' }                               │
│  • weather: { value: temp, status, error }                │
└───────────────────────────────────────────────────────────┘
                            ↓↑
Services & API Calls:
┌───────────────────────────────────────────────────────────┐
│  getWeather() → open-meteo.com API                        │
│  Returns: { current_weather: { temperature: 12.5 } }     │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Async Thunk Lifecycle (Weather Example)

```
                    fetchWeather Thunk Lifecycle

Initial State:
┌─────────────────────────────────────┐
│ status: 'idle'                      │
│ value: ''                           │
│ error: null                         │
└─────────────────────────────────────┘
            ↓
            
1. DISPATCH (Application code)
   dispatch(fetchWeather())
            ↓
            
2. PENDING (Immediate action)
   Redux Action: fetchWeather.pending
   └─→ state.status = 'loading'
   └─→ Components show: "🔄 Loading..."
            ↓
            
3. ASYNC WORK (While pending)
   async () => {
     const data = await getWeather()  ← HTTP Request
     return data                       ← On success, return value
   }
            ↓
            
4a. SUCCESS PATH ✅
    API Returns: { current_weather: { temperature: 12.5 } }
            ↓
    Redux Action: fetchWeather.fulfilled
    └─→ payload = 12.5
    └─→ state.status = 'succeeded'
    └─→ state.value = 12.5
    └─→ state.error = null
    └─→ Components show: "12.5°C"
            ↓
    ✅ Rendering Complete
    
OR

4b. ERROR PATH ❌
    API Throws Error: Network Timeout
            ↓
    Redux Action: fetchWeather.rejected
    └─→ state.status = 'failed'
    └─→ state.error = 'Network timeout'
    └─→ state.value = '' (unchanged)
    └─→ Components show: "❌ Failed to fetch"
            ↓
    ❌ Error Handling Complete

Timeline:
═════════════════════════════════════════════════════════════
T  Event                    State.status    Component Shows
═════════════════════════════════════════════════════════════
0  dispatch()               idle            (nothing yet)
1  pending fires            loading         🔄 Loading...
2  HTTP request sent        loading         🔄 Loading...
~500 API responds           loading         🔄 Loading...
501 fulfilled/rejected      succeeded/      12.5°C / ❌ Error
    action fires            failed
═════════════════════════════════════════════════════════════
```

---

## 4. Component Re-render Trigger Map

```
What Causes Components to Re-render?

Profile.js Re-renders When:
┌─────────────────────────────────────┐
│ 1. user state changes               │
│    (Login dispatches action)         │
│                                     │
│ 2. theme state changes              │
│    (Theme component dispatches)      │
│                                     │
│ 3. weather state changes            │
│    (Async thunk fulfills)            │
└─────────────────────────────────────┘
       ↓ useSelector subscribes to these
   Profile component function runs again
       ↓
   New JSX generated
       ↓
   React compares with previous JSX (diff)
       ↓
   Only changed parts update in DOM
       ↓
   Browser repaints changes
       ↓
   ✅ User sees updated UI

Login.js Re-renders When:
┌─────────────────────────────────────┐
│ Component internal state changes    │
│ (Parent props change)                │
│ (but no Redux changes affect it)     │
└─────────────────────────────────────┘
  Note: Login doesn't use useSelector
  So Redux changes don't trigger re-render

Theme.js Re-renders When:
┌─────────────────────────────────────┐
│ 1. inputValue changes (local state) │
│    (typing in input field)           │
│                                     │
│ 2. weather state changes            │
│    (from useWeather hook)            │
│                                     │
│ (but NOT when color changes,        │
│  because useSelector doesn't exist)  │
└─────────────────────────────────────┘
```

---

## 5. Data Flow Diagram: User Logs In

```
Step-by-step execution with code:

┌─────────────────────────────────────────────────────────────┐
│ Step 1: User Interaction                                    │
├─────────────────────────────────────────────────────────────┤
│ <button onClick={() => dispatch(login({...}))}>            │
│   Sign In                                                   │
│ </button>                                                   │
│                                                             │
│ User clicks button                                          │
│ └─→ onClick handler fires                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Action Creation & Dispatch                          │
├─────────────────────────────────────────────────────────────┤
│ dispatch(login({                                            │
│   name: "Lawn",                                             │
│   age: 45,                                                  │
│   email: "abc@gmail.com"                                    │
│ }))                                                         │
│                                                             │
│ Creates action object:                                      │
│ {                                                           │
│   type: 'User/login',                                       │
│   payload: { name, age, email }                             │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Redux Store Processes Action                        │
├─────────────────────────────────────────────────────────────┤
│ Reducer receives action:                                    │
│                                                             │
│ login: (state, action) => {                                 │
│   state.value = action.payload                              │
│ }                                                           │
│                                                             │
│ Old state:                                                  │
│ { user: { value: { name: "", age: 0, email: "" } } }       │
│                                                             │
│ New state:                                                  │
│ { user: { value: { name: "Lawn", age: 45, ... } } }        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Store Update & Subscription Notification            │
├─────────────────────────────────────────────────────────────┤
│ Redux store updates:                                        │
│ state = {                                                   │
│   user: { value: { name: "Lawn", age: 45, ... } },          │
│   theme: { value: '#2563eb' },                              │
│   weather: { value: 12.5, status, error }                   │
│ }                                                           │
│                                                             │
│ All useSelector subscribers notified:                       │
│ "Hey! state.user changed!"                                  │
│ └─→ Profile component listening                            │
│ └─→ useSelector called again                                │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Component Function Execution                        │
├─────────────────────────────────────────────────────────────┤
│ Profile() function runs again:                              │
│                                                             │
│ const user = useSelector(                                   │
│   (state) => state.user.value                               │
│ )  // Returns: { name: "Lawn", age: 45, email: "..." }      │
│                                                             │
│ Returns new JSX:                                            │
│ <div>                                                       │
│   <p>{user.name}</p>    {/* "Lawn" */}                      │
│   <p>{user.age}</p>     {/* "45" */}                        │
│   <p>{user.email}</p>   {/* "abc@gmail.com" */}             │
│ </div>                                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: React Reconciliation (Diffing)                      │
├─────────────────────────────────────────────────────────────┤
│ Old JSX:               New JSX:                             │
│ <p></p>     ──→        <p>Lawn</p>                           │
│ <p>0</p>    ──→        <p>45</p>                             │
│ <p></p>     ──→        <p>abc@gmail.com</p>                  │
│                                                             │
│ React's Virtual DOM diff: "Only these 3 texts changed"      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 7: DOM Update (Commit Phase)                           │
├─────────────────────────────────────────────────────────────┤
│ Browser updates 3 text nodes:                               │
│ - document.querySelector('p').textContent = "Lawn"          │
│ - ...                                                       │
│ - ...                                                       │
│                                                             │
│ No re-parsing, reflow minimal, very efficient               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 8: Visual Update (Paint Phase)                         │
├─────────────────────────────────────────────────────────────┤
│ Browser renders changes on screen:                          │
│                                                             │
│ Profile Card:                                               │
│ ┌──────────────────────┐                                    │
│ │ Name: Lawn           │  ← Updated                         │
│ │ Age: 45              │  ← Updated                         │
│ │ Email: abc@gmail.com │  ← Updated                         │
│ │ Weather: 12.5°C      │  ← Unchanged                       │
│ └──────────────────────┘                                    │
│                                                             │
│ ✅ SUCCESS! User sees updated profile                       │
└─────────────────────────────────────────────────────────────┘

Performance: ~5-20ms total time
```

---

## 6. Data Flow Diagram: Theme Color Changes

```
Theme Color Update Process:

USER INPUT:
┌──────────────────────────────────────┐
│ User types in hex color input box    │
│ Example: User types "#dc2626"        │
└──────────────────────────────────────┘
                ↓
LOCAL STATE UPDATE:
┌──────────────────────────────────────┐
│ onChange={(e) =>                     │
│   setInputValue(e.target.value)      │
│ }                                    │
│                                      │
│ Local state: inputValue = "#dc2626"  │
│                                      │
│ Component re-renders with new input  │
│ Color preview updates: shows red ✓   │
└──────────────────────────────────────┘
                ↓
PRESS ENTER or CLICK BUTTON:
┌──────────────────────────────────────┐
│ handleColorChange() executes:        │
│                                      │
│ 1. setColor(inputValue)              │
│    └─→ dispatch(updateColor(        │
│           "#dc2626"                  │
│        ))                            │
│                                      │
│ 2. setInputValue('')                 │
│    └─→ Clear input field             │
└──────────────────────────────────────┘
                ↓
REDUX ACTION DISPATCH:
┌──────────────────────────────────────┐
│ Action: { type: 'Theme/updateColor') │
│         payload: "#dc2626" }          │
│                                      │
│ Reducer:                             │
│ state.value = "#dc2626"              │
│                                      │
│ Store: { theme: { value: "#dc2626" } }
└──────────────────────────────────────┘
                ↓
SUBSCRIPTIONS TRIGGERED:
┌──────────────────────────────────────┐
│ All useTheme() calls notified:       │
│                                      │
│ 1. Profile.js useTheme()             │
│ 2. Theme.js useTheme()               │
│                                      │
│ Both components re-render with       │
│ new color value                      │
└──────────────────────────────────────┘
                ↓
COMPONENT RE-RENDERS:
┌──────────────────────────────────────┐
│ Profile.js:                          │
│ borderLeftColor: "#dc2626"           │
│ └─→ Border turns RED                 │
│                                      │
│ Theme.js:                            │
│ color preview style: color: "#dc..." │
│ └─→ Preview shows RED                │
└──────────────────────────────────────┘
                ↓
BROWSER UPDATES:
┌──────────────────────────────────────┐
│ Styles applied:                      │
│ - Profile border: RED ✓              │
│ - Preview color: RED ✓               │
│                                      │
│ Input cleared ✓                      │
│                                      │
│ ✅ Theme successfully updated        │
└──────────────────────────────────────┘

Timeline:
═════════════════════════════════════════════════════
Event           Time  What Happens
═════════════════════════════════════════════════════
Key press       0ms   onChange fires
Local state     1ms   setInputValue updates
Re-render       2ms   Theme component renders
Button click    100ms handleColorChange fires
Dispatch        101ms dispatch(updateColor(...))
Reducer         102ms state.value updated
Subscribers     103ms useTheme() runs
Re-render       104ms Profile updates
Re-render       105ms Theme updates
Browser paint   106ms Styles applied
═════════════════════════════════════════════════════

Total: ~106ms (perception: instant)
```

---

## 7. Async Weather Fetch - Detailed Timeline

```
INITIAL PAGE LOAD:

Time  Event                          Redux State              Component UI
────────────────────────────────────────────────────────────────────────────
0ms   Page starts loading            N/A                      (blank)

10ms  index.js runs                  N/A                      (blank)
      ├─ configureStore()
      ├─ Provider wraps App
      └─ App component mounts

20ms  App renders children           weather: { idle }        App header shows

30ms  Profile mounts                 weather: { idle }        Profile renders
      useWeather hook runs
      └─ useEffect checks: status == 'idle'? YES
         └─ dispatch(fetchWeather())

35ms  fetchWeather.pending fires     weather: {               Profile shows
      ├─ status = 'loading'          value: '',              🔄 Loading...
      ├─ error = null               status: 'loading',
      └─ value unchanged            error: null }

40ms  Browser makes HTTP request     (unchanged)             Still showing
      GET api.open-meteo.com/?...                           🔄 Loading...

45ms  Network packets traveling      (unchanged)             Still showing
      (Network latency)                                      🔄 Loading...

400ms Network keeps waiting...       (unchanged)             Still showing

500ms API server receives request    (unchanged)             Still showing

505ms API processes and responds     (unchanged)             Still showing
      Returns:
      {
        "current_weather": {
          "temperature": 12.5
        }
      }

510ms Async thunk receives response  (unchanged)             Still showing
      Extracts data: 12.5
      Returns from async function

515ms fetchWeather.fulfilled fires   weather: {              Profile re-renders
      ├─ status = 'succeeded'       value: 12.5,            with temp
      ├─ value = 12.5              status: 'succeeded',
      ├─ error = null              error: null }
      └─ All subscribers notified

520ms Profile re-renders with data   (unchanged state)       ✅ Shows:
      useSelector gets new value                            "12.5°C"
      Component renders new JSX

525ms React updates DOM              (unchanged state)       (DOM updated)

530ms Browser paints new pixels      (unchanged state)       User sees
                                                             temperature

────────────────────────────────────────────────────────────────────────────

ERROR SCENARIO (Network fails):

Time  Event                          Redux State              Component UI
────────────────────────────────────────────────────────────────────────────
...         
500ms API request times out          (unchanged)             Still showing
      Error: Connection timeout                             🔄 Loading...

510ms async thunk receives error     (unchanged)             Still showing

515ms fetchWeather.rejected fires    weather: {              Profile re-renders
      ├─ status = 'failed'          value: '',              with error
      ├─ error: 'Connection timeout'status: 'failed',
      └─ All subscribers notified   error: 'Conn...' }

520ms Profile re-renders with error  (unchanged state)       ✅ Shows:
      useSelector gets status                               "❌ Failed..."

525ms React updates DOM              (unchanged state)       (DOM updated)

530ms Browser paints error message   (unchanged state)       User sees error

────────────────────────────────────────────────────────────────────────────

Key Insights:
✅ All state changes go through Redux
✅ Components automatically re-render on state change
✅ useEffect prevents infinite loops (dependency array)
✅ Network latency doesn't block UI (async nature)
✅ Users see "loading" state during fetch
✅ Errors are handled gracefully
```

---

## 8. Redux Store State Tree Visualization

```
Redux Store (Entire State in One Place):

store = {
  ┌─────────────────────────────────────────────────────┐
  │ user: {                                             │
  │   value: {                                          │
  │     name: "Lawn",                   ← before login: ""
  │     age: 45,                        ← before: 0
  │     email: "abc@gmail.com"          ← before: ""
  │   }                                                 │
  │ }                                                   │
  ├─────────────────────────────────────────────────────┤
  │ theme: {                                            │
  │   value: "#dc2626"                  ← before: ""
  │                                     ← changes when user picks color
  │ }                                                   │
  ├─────────────────────────────────────────────────────┤
  │ weather: {                                          │
  │   value: 12.5,                      ← before: ""
  │   status: "succeeded",              ← before: "idle"
  │   error: null                       ← before: null, could be error msg
  │ }                                                   │
  └─────────────────────────────────────────────────────┘
}

Component Access Patterns:

Profile.js:
  const user = useSelector(state => state.user.value)
  const { color } = useTheme()  // extracts state.theme.value
  const { weather, status, error } = useWeather()
  // extracts state.weather.value, status, error

Login.js:
  const dispatch = useDispatch()
  dispatch(login({...}))
  dispatch(logout())

Theme.js:
  const { color, setColor } = useTheme()
  // setColor calls dispatch(updateColor(...))

Changes Flow:
User clicks "Sign In" button
  ↓
dispatch(login({name, age, email}))
  ↓
Reducer: state.user.value = action.payload
  ↓
store.user.value now = {name, age, email}
  ↓
useSelector in Profile re-runs
  ↓
Profile re-renders with new data
  ↓
Browser shows updated profile ✅
```

---

## 9. Hook Usage Patterns

```
THREE TYPES OF HOOKS:

1️⃣ CUSTOM HOOKS (Our Abstractions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useTheme()
├─ Encapsulates: useDispatch + useSelector
├─ Returns: { color, setColor }
└─ Used in: Profile, Theme

useWeather()
├─ Encapsulates: useSelector + useEffect for fetching
├─ Returns: { weather, status, error }
├─ Side effect: Dispatches fetchWeather on mount
└─ Used in: Profile, Theme

Benefits:
✅ Components don't know about Redux internals
✅ Easy to test hooks independently
✅ Logic is reusable
✅ Can change implementation without affecting components
✅ Clean, simple component code


2️⃣ REACT HOOKS (Built-in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useState()
├─ Local component state (not global)
├─ Example: inputValue in Theme component
└─ Used for: Form input, toggles, local UI state

useEffect()
├─ Side effects (runs after render)
├─ Example: useWeather hook fetches weather on mount
└─ Used for: API calls, DOM manipulation, subscriptions

useMemo() (for optimization)
├─ Memoize expensive calculations
└─ Prevents unnecessary recalculations


3️⃣ REDUX HOOKS (From react-redux)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useSelector()
├─ Reads from Redux store
├─ Automatically re-runs component when state changes
├─ Example: 
│  const user = useSelector(state => state.user.value)
└─ Used in: Any component needing Redux data

useDispatch()
├─ Dispatches actions to Redux
├─ Returns dispatch function
├─ Example:
│  const dispatch = useDispatch()
│  dispatch(login({...}))
└─ Used in: Any component sending actions to Redux
└─ 💡 Can be used directly WITHOUT custom hook if only dispatching

WHEN TO USE CUSTOM HOOK vs useDispatch DIRECTLY:

Custom Hook (Profile, Theme):
┌────────────────────────────────────────┐
│ Situation: Need to READ + WRITE state  │
│ OR handle side effects                 │
├────────────────────────────────────────┤
│ export function useTheme() {           │
│   const dispatch = useDispatch()      │
│   const color = useSelector(...)      │
│   return { color, setColor }          │
│ }                                      │
│                                        │
│ Usage: const { color, setColor } =    │
│        useTheme()                      │
└────────────────────────────────────────┘

Direct useDispatch (Login):
┌────────────────────────────────────────┐
│ Situation: ONLY dispatching, simple    │
│ No complexity to encapsulate           │
├────────────────────────────────────────┤
│ const dispatch = useDispatch()        │
│ dispatch(login({...}))                │
│ dispatch(logout())                    │
│                                        │
│ Result: Simple, clear, no indirection │
└────────────────────────────────────────┘

Example Hook Implementation:
┌─────────────────────────────────────────┐
│ export function useTheme() {            │
│   // Redux setup inside hook            │
│   const dispatch = useDispatch()        │
│   const color = useSelector(            │
│     (state) => state.theme.value        │
│   )                                     │
│                                         │
│   const setColor = (newColor) =>        │
│     dispatch(updateColor(newColor))     │
│                                         │
│   // Clean, simple API                  │
│   return { color, setColor }            │
│ }                                       │
│                                         │
│ // In component:                        │
│ const { color, setColor } = useTheme()  │
│ // Just use it!                         │
└─────────────────────────────────────────┘
```

---

## 10. File Dependency Graph

```
Import/Dependency Relationships:

src/index.js (Entry Point)
  ├─→ React, ReactDOM
  ├─→ App.js
  ├─→ store.js
  └─→ react-redux (Provider)

src/store.js (Redux Configuration)
  └─→ features/ (all reducer slices)
      ├─→ user.js
      ├─→ theme.js
      └─→ weather.js

src/App.js (Root Component)
  ├─→ components/index.js
  │   ├─→ Profile.js
  │   ├─→ Login.js
  │   └─→ Theme.js
  └─→ App.css

src/components/Profile.js
  ├─→ hooks/useTheme.js
  ├─→ hooks/useWeather.js
  └─→ react-redux (useSelector)

src/components/Login.js
  ├─→ features/user.js (actions)
  └─→ react-redux (useDispatch)

src/components/Theme.js
  ├─→ hooks/useTheme.js
  ├─→ hooks/useWeather.js
  └─→ React (useState)

src/hooks/useTheme.js
  ├─→ features/theme.js
  └─→ react-redux

src/hooks/useWeather.js
  ├─→ features/weather.js
  ├─→ React (useEffect)
  └─→ react-redux

src/features/weather.js
  ├─→ features/weather.js
  └─→ services/api.js

src/services/api.js
  └─→ (standalone, no local imports)
      └─→ (external: fetch API)

Dependency Tree:
┌─ index.js
│  └─ App.js
│     ├─ Profile.js ──→ hooks ──→ features ──→ Redux
│     ├─ Login.js ─────────────→ features ──→ Redux
│     └─ Theme.js ──→ hooks ──→ features ──→ Redux
│                      │
│                      └─ services/api.js
│
└─ store.js ──→ features/ ──→ (user, theme, weather)
```

---

## 11. State Mutation Rules (What Redux Cares About)

```
Redux Wants Immutable Updates:

❌ WRONG (Direct mutation):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
state.user.name = "New Name"  // Mutating directly!

NOT OK with Plain Redux
BUT Redux Toolkit's Immer handles this


✅ RIGHT (Redux Toolkit with Immer):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
createSlice({
  reducers: {
    login: (state, action) => {
      // Looks like mutation, but it's NOT
      // Immer converts it to immutable update
      state.value = action.payload
    }
  }
})

Redux Toolkit magic:
state mutation    ──→    Immer    ──→    Immutable update
(looks familiar)     (behind scenes)   (Redux happy ✓)


✅ ALSO RIGHT (Pure manual update):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
login: (state, action) => {
  return {
    ...state,
    value: action.payload
  }
}

Manual immutable update (old way, more verbose)


KEY CONCEPT:
─────────────────────────────────────────────────
Redux needs to detect changes:
  Old state → New state → Subscribers notified

Immer secretly converts mutations to new objects:
  state.name = "X"  →  { ...state, name: "X" }

You write mutation syntax, get immutable behavior
```

---

## 12. Performance Optimization Points

```
Where to Optimize:

1. SELECTOR OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━━━━

❌ BAD (Creates new object every render):
const data = useSelector(state => ({
  color: state.theme.value,
  user: state.user.value
}))

✅ GOOD (Memoized selector):
import { createSelector } from '@reduxjs/toolkit'

const selectThemeAndUser = createSelector(
  state => state.theme.value,
  state => state.user.value,
  (color, user) => ({ color, user })
)

const data = useSelector(selectThemeAndUser)


2. COMPONENT MEMOIZATION
━━━━━━━━━━━━━━━━━━━━━━━

import { memo } from 'react'

const Profile = memo(function Profile() {
  // Only re-renders if props change
})

export default Profile


3. CODE SPLITTING
━━━━━━━━━━━━━━━━

import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./Heavy'))

<Suspense fallback={<div>Loading...</div>}>
  <HeavyComponent />
</Suspense>


4. REDUCER NORMALIZATION (if needed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instead of nested objects, flatten state:

❌ Nested (slow lookups):
state.users = { user1: {...}, user2: {...} }

✅ Normalized (fast lookups):
state.users = {
  byId: { user1: {...}, user2: {...} },
  allIds: ['user1', 'user2']
}


5. BATCH UPDATES
━━━━━━━━━━━━━━━

React 18 auto-batches, but older versions:

import { unstable_batchedUpdates } from 'react-dom'

unstable_batchedUpdates(() => {
  dispatch(action1())
  dispatch(action2())
  // Re-renders once, not twice
})
```

---

## Summary Checklist

✅ **Understand these flows:**
- [ ] User event → Action → Reducer → New state → Component re-render
- [ ] Custom hook creation to encapsulate Redux
- [ ] Async thunk lifecycle (pending → fulfilled/rejected)
- [ ] useEffect dependency array preventing infinite loops
- [ ] Selector subscription triggering component updates

✅ **Key patterns:**
- [ ] Ducks pattern for feature organization
- [ ] Feature slices combining reducer + actions
- [ ] Custom hooks for logic reuse
- [ ] Service layer isolating API calls
- [ ] Immer for "mutable" state updates

✅ **Performance awareness:**
- [ ] Unnecessary re-renders from selectors
- [ ] Memoization when needed
- [ ] Code splitting for large apps
- [ ] Redux DevTools for debugging

✅ **Testing strategy:**
- [ ] Test reducers independently
- [ ] Mock hooks in components
- [ ] Test async thunks separately
- [ ] Integration tests for features

---

**Master these diagrams to master the architecture!** 🎓
