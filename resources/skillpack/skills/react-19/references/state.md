# React-19 - State

**Pages:** 4

---

## set-state-in-render

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-render

**Contents:**
- set-state-in-render
- Rule Details
- Common Violations
  - Invalid
  - Valid
- Troubleshooting
  - I want to sync state to a prop

Validates against unconditionally setting state during render, which can trigger additional renders and potential infinite render loops.

Calling setState during render unconditionally triggers another render before the current one finishes. This creates an infinite loop that crashes your app.

A common problem is trying to “fix” state after it renders. Suppose you want to keep a counter from exceeding a max prop:

As soon as count exceeds max, an infinite loop is triggered.

Instead, it’s often better to move this logic to the event (the place where the state is first set). For example, you can enforce the maximum at the moment you update state:

Now the setter only runs in response to the click, React finishes the render normally, and count never crosses max.

In rare cases, you may need to adjust state based on information from previous renders. For those, follow this pattern of setting state conditionally.

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Unconditional setState directly in renderfunction Component({value}) {  const [count, setCount] = useState(0);  setCount(value); // Infinite loop!  return <div>{count}</div>;}
```

Example 2 (jsx):
```jsx
// ✅ Derive during renderfunction Component({items}) {  const sorted = [...items].sort(); // Just calculate it in render  return <ul>{sorted.map(/*...*/)}</ul>;}// ✅ Set state in event handlerfunction Component() {  const [count, setCount] = useState(0);  return (    <button onClick={() => setCount(count + 1)}>      {count}    </button>  );}// ✅ Derive from props instead of setting statefunction Component({user}) {  const name = user?.name || '';  const email = user?.email || '';  return <div>{name}</div>;}// ✅ Conditionally derive state from props and state from previous rendersfunction Component({ items }) {  const [isReverse, setIsReverse] = useState(false);  const [selection, setSelection] = useState(null);  const [prevItems, setPrevItems] = useState(items);  if (items !== prevItems) { // This condition makes it valid    setPrevItems(items);    setSelection(null);  }  // ...}
```

Example 3 (jsx):
```jsx
// ❌ Wrong: clamps during renderfunction Counter({max}) {  const [count, setCount] = useState(0);  if (count > max) {    setCount(max);  }  return (    <button onClick={() => setCount(count + 1)}>      {count}    </button>  );}
```

Example 4 (jsx):
```jsx
// ✅ Clamp when updatingfunction Counter({max}) {  const [count, setCount] = useState(0);  const increment = () => {    setCount(current => Math.min(current + 1, max));  };  return <button onClick={increment}>{count}</button>;}
```

---

## Built-in React APIs

**URL:** https://react.dev/reference/react/apis

**Contents:**
- Built-in React APIs
- Resource APIs

In addition to Hooks and Components, the react package exports a few other APIs that are useful for defining components. This page lists all the remaining modern React APIs.

Resources can be accessed by a component without having them as part of their state. For example, a component can read a message from a Promise or read styling information from a context.

To read a value from a resource, use this API:

**Examples:**

Example 1 (javascript):
```javascript
function MessageComponent({ messagePromise }) {  const message = use(messagePromise);  const theme = use(ThemeContext);  // ...}
```

---

## set-state-in-effect

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect

**Contents:**
- set-state-in-effect
- Rule Details
- Common Violations
  - Invalid
  - Valid

Validates against calling setState synchronously in an effect, which can lead to re-renders that degrade performance.

Setting state immediately inside an effect forces React to restart the entire render cycle. When you update state in an effect, React must re-render your component, apply changes to the DOM, and then run effects again. This creates an extra render pass that could have been avoided by transforming data directly during render or deriving state from props. Transform data at the top level of your component instead. This code will naturally re-run when props or state change without triggering additional render cycles.

Synchronous setState calls in effects trigger immediate re-renders before the browser can paint, causing performance issues and visual jank. React has to render twice: once to apply the state update, then again after effects run. This double rendering is wasteful when the same result could be achieved with a single render.

In many cases, you may also not need an effect at all. Please see You Might Not Need an Effect for more information.

This rule catches several patterns where synchronous setState is used unnecessarily:

Examples of incorrect code for this rule:

Examples of correct code for this rule:

When something can be calculated from the existing props or state, don’t put it in state. Instead, calculate it during rendering. This makes your code faster, simpler, and less error-prone. Learn more in You Might Not Need an Effect.

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Synchronous setState in effectfunction Component({data}) {  const [items, setItems] = useState([]);  useEffect(() => {    setItems(data); // Extra render, use initial state instead  }, [data]);}// ❌ Setting loading state synchronouslyfunction Component() {  const [loading, setLoading] = useState(false);  useEffect(() => {    setLoading(true); // Synchronous, causes extra render    fetchData().then(() => setLoading(false));  }, []);}// ❌ Transforming data in effectfunction Component({rawData}) {  const [processed, setProcessed] = useState([]);  useEffect(() => {    setProcessed(rawData.map(transform)); // Should derive in render  }, [rawData]);}// ❌ Deriving state from propsfunction Component({selectedId, items}) {  const [selected, setSelected] = useState(null);  useEffect(() => {    setSelected(items.find(i => i.id === selectedId));  }, [selectedId, items]);}
```

Example 2 (jsx):
```jsx
// ✅ setState in an effect is fine if the value comes from a reffunction Tooltip() {  const ref = useRef(null);  const [tooltipHeight, setTooltipHeight] = useState(0);  useLayoutEffect(() => {    const { height } = ref.current.getBoundingClientRect();    setTooltipHeight(height);  }, []);}// ✅ Calculate during renderfunction Component({selectedId, items}) {  const selected = items.find(i => i.id === selectedId);  return <div>{selected?.name}</div>;}
```

---

## Built-in React Hooks

**URL:** https://react.dev/reference/react/hooks

**Contents:**
- Built-in React Hooks
- State Hooks
- Context Hooks
- Ref Hooks
- Effect Hooks
- Performance Hooks
- Other Hooks
- Your own Hooks

Hooks let you use different React features from your components. You can either use the built-in Hooks or combine them to build your own. This page lists all built-in Hooks in React.

State lets a component “remember” information like user input. For example, a form component can use state to store the input value, while an image gallery component can use state to store the selected image index.

To add state to a component, use one of these Hooks:

Context lets a component receive information from distant parents without passing it as props. For example, your app’s top-level component can pass the current UI theme to all components below, no matter how deep.

Refs let a component hold some information that isn’t used for rendering, like a DOM node or a timeout ID. Unlike with state, updating a ref does not re-render your component. Refs are an “escape hatch” from the React paradigm. They are useful when you need to work with non-React systems, such as the built-in browser APIs.

Effects let a component connect to and synchronize with external systems. This includes dealing with network, browser DOM, animations, widgets written using a different UI library, and other non-React code.

Effects are an “escape hatch” from the React paradigm. Don’t use Effects to orchestrate the data flow of your application. If you’re not interacting with an external system, you might not need an Effect.

There are two rarely used variations of useEffect with differences in timing:

A common way to optimize re-rendering performance is to skip unnecessary work. For example, you can tell React to reuse a cached calculation or to skip a re-render if the data has not changed since the previous render.

To skip calculations and unnecessary re-rendering, use one of these Hooks:

Sometimes, you can’t skip re-rendering because the screen actually needs to update. In that case, you can improve performance by separating blocking updates that must be synchronous (like typing into an input) from non-blocking updates which don’t need to block the user interface (like updating a chart).

To prioritize rendering, use one of these Hooks:

These Hooks are mostly useful to library authors and aren’t commonly used in the application code.

You can also define your own custom Hooks as JavaScript functions.

**Examples:**

Example 1 (jsx):
```jsx
function ImageGallery() {  const [index, setIndex] = useState(0);  // ...
```

Example 2 (javascript):
```javascript
function Button() {  const theme = useContext(ThemeContext);  // ...
```

Example 3 (javascript):
```javascript
function Form() {  const inputRef = useRef(null);  // ...
```

Example 4 (javascript):
```javascript
function ChatRoom({ roomId }) {  useEffect(() => {    const connection = createConnection(roomId);    connection.connect();    return () => connection.disconnect();  }, [roomId]);  // ...
```

---
