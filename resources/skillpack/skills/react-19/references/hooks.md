# React-19 - Hooks

**Pages:** 31

---

## use memo

**URL:** https://react.dev/reference/react-compiler/directives/use-memo

**Contents:**
- use memo
  - Note
- Reference
  - "use memo"
    - Caveats
  - How "use memo" marks functions for optimization
  - When to use "use memo"
    - You’re using annotation mode
    - You’re gradually adopting React Compiler
- Usage

"use memo" marks a function for React Compiler optimization.

In most cases, you don’t need "use memo". It’s primarily needed in annotation mode where you must explicitly mark functions for optimization. In infer mode, the compiler automatically detects components and hooks by their naming patterns (PascalCase for components, use prefix for hooks). If a component or hook isn’t being compiled in infer mode, you should fix its naming convention rather than forcing compilation with "use memo".

Add "use memo" at the beginning of a function to mark it for React Compiler optimization.

When a function contains "use memo", the React Compiler will analyze and optimize it during build time. The compiler will automatically memoize values and components to prevent unnecessary re-computations and re-renders.

In a React app that uses the React Compiler, functions are analyzed at build time to determine if they can be optimized. By default, the compiler automatically infers which components to memoize, but this can depend on your compilationMode setting if you’ve set it.

"use memo" explicitly marks a function for optimization, overriding the default behavior:

The directive creates a clear boundary in your codebase between optimized and non-optimized code, giving you fine-grained control over the compilation process.

You should consider using "use memo" when:

In compilationMode: 'annotation', the directive is required for any function you want optimized:

Start with annotation mode and selectively optimize stable components:

The behavior of "use memo" changes based on your compiler configuration:

In infer mode, the compiler automatically detects components and hooks by their naming patterns (PascalCase for components, use prefix for hooks). If a component or hook isn’t being compiled in infer mode, you should fix its naming convention rather than forcing compilation with "use memo".

To confirm your component is being optimized:

**Examples:**

Example 1 (javascript):
```javascript
function MyComponent() {  "use memo";  // ...}
```

Example 2 (unknown):
```unknown
// ✅ This component will be optimizedfunction OptimizedList() {  "use memo";  // ...}// ❌ This component won't be optimizedfunction SimpleWrapper() {  // ...}
```

Example 3 (typescript):
```typescript
// Start by optimizing leaf componentsfunction Button({ onClick, children }) {  "use memo";  // ...}// Gradually move up the tree as you verify behaviorfunction ButtonGroup({ buttons }) {  "use memo";  // ...}
```

Example 4 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'annotation' // or 'infer' or 'all'    }]  ]};
```

---

## createRef

**URL:** https://react.dev/reference/react/createRef

**Contents:**
- createRef
  - Pitfall
- Reference
  - createRef()
    - Parameters
    - Returns
    - Caveats
- Usage
  - Declaring a ref in a class component
  - Pitfall

createRef is mostly used for class components. Function components typically rely on useRef instead.

createRef creates a ref object which can contain arbitrary value.

Call createRef to declare a ref inside a class component.

See more examples below.

createRef takes no parameters.

createRef returns an object with a single property:

To declare a ref inside a class component, call createRef and assign its result to a class field:

If you now pass ref={this.inputRef} to an <input> in your JSX, React will populate this.inputRef.current with the input DOM node. For example, here is how you make a button that focuses the input:

createRef is mostly used for class components. Function components typically rely on useRef instead.

We recommend using function components instead of class components in new code. If you have some existing class components using createRef, here is how you can convert them. This is the original code:

When you convert this component from a class to a function, replace calls to createRef with calls to useRef:

**Examples:**

Example 1 (gdscript):
```gdscript
class MyInput extends Component {  inputRef = createRef();  // ...}
```

Example 2 (gdscript):
```gdscript
import { createRef, Component } from 'react';class MyComponent extends Component {  intervalRef = createRef();  inputRef = createRef();  // ...
```

Example 3 (gdscript):
```gdscript
import { Component, createRef } from 'react';class Form extends Component {  inputRef = createRef();  // ...}
```

---

## useRef

**URL:** https://react.dev/reference/react/useRef

**Contents:**
- useRef
- Reference
  - useRef(initialValue)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Referencing a value with a ref
    - Examples of referencing a value with useRef
    - Example 1 of 2: Click counter

useRef is a React Hook that lets you reference a value that’s not needed for rendering.

Call useRef at the top level of your component to declare a ref.

See more examples below.

useRef returns an object with a single property:

On the next renders, useRef will return the same object.

Call useRef at the top level of your component to declare one or more refs.

useRef returns a ref object with a single current property initially set to the initial value you provided.

On the next renders, useRef will return the same object. You can change its current property to store information and read it later. This might remind you of state, but there is an important difference.

Changing a ref does not trigger a re-render. This means refs are perfect for storing information that doesn’t affect the visual output of your component. For example, if you need to store an interval ID and retrieve it later, you can put it in a ref. To update the value inside the ref, you need to manually change its current property:

Later, you can read that interval ID from the ref so that you can call clear that interval:

By using a ref, you ensure that:

Changing a ref does not trigger a re-render, so refs are not appropriate for storing information you want to display on the screen. Use state for that instead. Read more about choosing between useRef and useState.

This component uses a ref to keep track of how many times the button was clicked. Note that it’s okay to use a ref instead of state here because the click count is only read and written in an event handler.

If you show {ref.current} in the JSX, the number won’t update on click. This is because setting ref.current does not trigger a re-render. Information that’s used for rendering should be state instead.

Do not write or read ref.current during rendering.

React expects that the body of your component behaves like a pure function:

Reading or writing a ref during rendering breaks these expectations.

You can read or write refs from event handlers or effects instead.

If you have to read or write something during rendering, use state instead.

When you break these rules, your component might still work, but most of the newer features we’re adding to React will rely on these expectations. Read more about keeping your components pure.

It’s particularly common to use a ref to manipulate the DOM. React has built-in support for this.

First, declare a ref object with an initial value of null:

Then pass your ref object as the ref attribute to the JSX of the DOM node you want to manipulate:

After React creates the DOM node and puts it on the screen, React will set the current property of your ref object to that DOM node. Now you can access the <input>’s DOM node and call methods like focus():

React will set the current property back to null when the node is removed from the screen.

Read more about manipulating the DOM with refs.

In this example, clicking the button will focus the input:

React saves the initial ref value once and ignores it on the next renders.

Although the result of new VideoPlayer() is only used for the initial render, you’re still calling this function on every render. This can be wasteful if it’s creating expensive objects.

To solve it, you may initialize the ref like this instead:

Normally, writing or reading ref.current during render is not allowed. However, it’s fine in this case because the result is always the same, and the condition only executes during initialization so it’s fully predictable.

If you use a type checker and don’t want to always check for null, you can try a pattern like this instead:

Here, the playerRef itself is nullable. However, you should be able to convince your type checker that there is no case in which getPlayer() returns null. Then use getPlayer() in your event handlers.

If you try to pass a ref to your own component like this:

You might get an error in the console:

By default, your own components don’t expose refs to the DOM nodes inside them.

To fix this, find the component that you want to get a ref to:

And then add ref to the list of props your component accepts and pass ref as a prop to the relevant child built-in component like this:

Then the parent component can get a ref to it.

Read more about accessing another component’s DOM nodes.

**Examples:**

Example 1 (jsx):
```jsx
const ref = useRef(initialValue)
```

Example 2 (javascript):
```javascript
import { useRef } from 'react';function MyComponent() {  const intervalRef = useRef(0);  const inputRef = useRef(null);  // ...
```

Example 3 (javascript):
```javascript
import { useRef } from 'react';function Stopwatch() {  const intervalRef = useRef(0);  // ...
```

Example 4 (javascript):
```javascript
function handleStartClick() {  const intervalId = setInterval(() => {    // ...  }, 1000);  intervalRef.current = intervalId;}
```

---

## useReducer

**URL:** https://react.dev/reference/react/useReducer

**Contents:**
- useReducer
- Reference
  - useReducer(reducer, initialArg, init?)
    - Parameters
    - Returns
    - Caveats
  - dispatch function
    - Parameters
    - Returns
    - Caveats

useReducer is a React Hook that lets you add a reducer to your component.

Call useReducer at the top level of your component to manage its state with a reducer.

See more examples below.

useReducer returns an array with exactly two values:

The dispatch function returned by useReducer lets you update the state to a different value and trigger a re-render. You need to pass the action as the only argument to the dispatch function:

React will set the next state to the result of calling the reducer function you’ve provided with the current state and the action you’ve passed to dispatch.

dispatch functions do not have a return value.

The dispatch function only updates the state variable for the next render. If you read the state variable after calling the dispatch function, you will still get the old value that was on the screen before your call.

If the new value you provide is identical to the current state, as determined by an Object.is comparison, React will skip re-rendering the component and its children. This is an optimization. React may still need to call your component before ignoring the result, but it shouldn’t affect your code.

React batches state updates. It updates the screen after all the event handlers have run and have called their set functions. This prevents multiple re-renders during a single event. In the rare case that you need to force React to update the screen earlier, for example to access the DOM, you can use flushSync.

Call useReducer at the top level of your component to manage state with a reducer.

useReducer returns an array with exactly two items:

To update what’s on the screen, call dispatch with an object representing what the user did, called an action:

React will pass the current state and the action to your reducer function. Your reducer will calculate and return the next state. React will store that next state, render your component with it, and update the UI.

useReducer is very similar to useState, but it lets you move the state update logic from event handlers into a single function outside of your component. Read more about choosing between useState and useReducer.

A reducer function is declared like this:

Then you need to fill in the code that will calculate and return the next state. By convention, it is common to write it as a switch statement. For each case in the switch, calculate and return some next state.

Actions can have any shape. By convention, it’s common to pass objects with a type property identifying the action. It should include the minimal necessary information that the reducer needs to compute the next state.

The action type names are local to your component. Each action describes a single interaction, even if that leads to multiple changes in data. The shape of the state is arbitrary, but usually it’ll be an object or an array.

Read extracting state logic into a reducer to learn more.

State is read-only. Don’t modify any objects or arrays in state:

Instead, always return new objects from your reducer:

Read updating objects in state and updating arrays in state to learn more.

In this example, the reducer manages a state object with two fields: name and age.

React saves the initial state once and ignores it on the next renders.

Although the result of createInitialState(username) is only used for the initial render, you’re still calling this function on every render. This can be wasteful if it’s creating large arrays or performing expensive calculations.

To solve this, you may pass it as an initializer function to useReducer as the third argument instead:

Notice that you’re passing createInitialState, which is the function itself, and not createInitialState(), which is the result of calling it. This way, the initial state does not get re-created after initialization.

In the above example, createInitialState takes a username argument. If your initializer doesn’t need any information to compute the initial state, you may pass null as the second argument to useReducer.

This example passes the initializer function, so the createInitialState function only runs during initialization. It does not run when component re-renders, such as when you type into the input.

Calling the dispatch function does not change state in the running code:

This is because states behaves like a snapshot. Updating state requests another render with the new state value, but does not affect the state JavaScript variable in your already-running event handler.

If you need to guess the next state value, you can calculate it manually by calling the reducer yourself:

React will ignore your update if the next state is equal to the previous state, as determined by an Object.is comparison. This usually happens when you change an object or an array in state directly:

You mutated an existing state object and returned it, so React ignored the update. To fix this, you need to ensure that you’re always updating objects in state and updating arrays in state instead of mutating them:

Make sure that every case branch copies all of the existing fields when returning the new state:

Without ...state above, the returned next state would only contain the age field and nothing else.

If your state unexpectedly becomes undefined, you’re likely forgetting to return state in one of the cases, or your action type doesn’t match any of the case statements. To find why, throw an error outside the switch:

You can also use a static type checker like TypeScript to catch such mistakes.

You might get an error that says: Too many re-renders. React limits the number of renders to prevent an infinite loop. Typically, this means that you’re unconditionally dispatching an action during render, so your component enters a loop: render, dispatch (which causes a render), render, dispatch (which causes a render), and so on. Very often, this is caused by a mistake in specifying an event handler:

If you can’t find the cause of this error, click on the arrow next to the error in the console and look through the JavaScript stack to find the specific dispatch function call responsible for the error.

In Strict Mode, React will call your reducer and initializer functions twice. This shouldn’t break your code.

This development-only behavior helps you keep components pure. React uses the result of one of the calls, and ignores the result of the other call. As long as your component, initializer, and reducer functions are pure, this shouldn’t affect your logic. However, if they are accidentally impure, this helps you notice the mistakes.

For example, this impure reducer function mutates an array in state:

Because React calls your reducer function twice, you’ll see the todo was added twice, so you’ll know that there is a mistake. In this example, you can fix the mistake by replacing the array instead of mutating it:

Now that this reducer function is pure, calling it an extra time doesn’t make a difference in behavior. This is why React calling it twice helps you find mistakes. Only component, initializer, and reducer functions need to be pure. Event handlers don’t need to be pure, so React will never call your event handlers twice.

Read keeping components pure to learn more.

**Examples:**

Example 1 (unknown):
```unknown
const [state, dispatch] = useReducer(reducer, initialArg, init?)
```

Example 2 (javascript):
```javascript
import { useReducer } from 'react';function reducer(state, action) {  // ...}function MyComponent() {  const [state, dispatch] = useReducer(reducer, { age: 42 });  // ...
```

Example 3 (javascript):
```javascript
const [state, dispatch] = useReducer(reducer, { age: 42 });function handleClick() {  dispatch({ type: 'incremented_age' });  // ...
```

Example 4 (javascript):
```javascript
import { useReducer } from 'react';function reducer(state, action) {  // ...}function MyComponent() {  const [state, dispatch] = useReducer(reducer, { age: 42 });  // ...
```

---

## useFormStatus

**URL:** https://react.dev/reference/react-dom/hooks/useFormStatus

**Contents:**
- useFormStatus
- Reference
  - useFormStatus()
    - Parameters
    - Returns
    - Caveats
- Usage
  - Display a pending state during form submission
  - Pitfall
      - useFormStatus will not return status information for a <form> rendered in the same component.

useFormStatus is a Hook that gives you status information of the last form submission.

The useFormStatus Hook provides status information of the last form submission.

To get status information, the Submit component must be rendered within a <form>. The Hook returns information like the pending property which tells you if the form is actively submitting.

In the above example, Submit uses this information to disable <button> presses while the form is submitting.

See more examples below.

useFormStatus does not take any parameters.

A status object with the following properties:

pending: A boolean. If true, this means the parent <form> is pending submission. Otherwise, false.

data: An object implementing the FormData interface that contains the data the parent <form> is submitting. If there is no active submission or no parent <form>, it will be null.

method: A string value of either 'get' or 'post'. This represents whether the parent <form> is submitting with either a GET or POST HTTP method. By default, a <form> will use the GET method and can be specified by the method property.

To display a pending state while a form is submitting, you can call the useFormStatus Hook in a component rendered in a <form> and read the pending property returned.

Here, we use the pending property to indicate the form is submitting.

The useFormStatus Hook only returns status information for a parent <form> and not for any <form> rendered in the same component calling the Hook, or child components.

Instead call useFormStatus from inside a component that is located inside <form>.

You can use the data property of the status information returned from useFormStatus to display what data is being submitted by the user.

Here, we have a form where users can request a username. We can use useFormStatus to display a temporary status message confirming what username they have requested.

useFormStatus will only return status information for a parent <form>.

If the component that calls useFormStatus is not nested in a <form>, status.pending will always return false. Verify useFormStatus is called in a component that is a child of a <form> element.

useFormStatus will not track the status of a <form> rendered in the same component. See Pitfall for more details.

**Examples:**

Example 1 (unknown):
```unknown
const { pending, data, method, action } = useFormStatus();
```

Example 2 (jsx):
```jsx
import { useFormStatus } from "react-dom";import action from './actions';function Submit() {  const status = useFormStatus();  return <button disabled={status.pending}>Submit</button>}export default function App() {  return (    <form action={action}>      <Submit />    </form>  );}
```

Example 3 (jsx):
```jsx
function Form() {  // 🚩 `pending` will never be true  // useFormStatus does not track the form rendered in this component  const { pending } = useFormStatus();  return <form action={submit}></form>;}
```

Example 4 (jsx):
```jsx
function Submit() {  // ✅ `pending` will be derived from the form that wraps the Submit component  const { pending } = useFormStatus();   return <button disabled={pending}>...</button>;}function Form() {  // This is the <form> `useFormStatus` tracks  return (    <form action={submit}>      <Submit />    </form>  );}
```

---

## useEffect

**URL:** https://react.dev/reference/react/useEffect

**Contents:**
- useEffect
- Reference
  - useEffect(setup, dependencies?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Connecting to an external system
  - Note
    - Examples of connecting to an external system

useEffect is a React Hook that lets you synchronize a component with an external system.

Call useEffect at the top level of your component to declare an Effect:

See more examples below.

setup: The function with your Effect’s logic. Your setup function may also optionally return a cleanup function. When your component commits, React will run your setup function. After every commit with changed dependencies, React will first run the cleanup function (if you provided it) with the old values, and then run your setup function with the new values. After your component is removed from the DOM, React will run your cleanup function.

optional dependencies: The list of all reactive values referenced inside of the setup code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison. If you omit this argument, your Effect will re-run after every commit of the component. See the difference between passing an array of dependencies, an empty array, and no dependencies at all.

useEffect returns undefined.

useEffect is a Hook, so you can only call it at the top level of your component or your own Hooks. You can’t call it inside loops or conditions. If you need that, extract a new component and move the state into it.

If you’re not trying to synchronize with some external system, you probably don’t need an Effect.

When Strict Mode is on, React will run one extra development-only setup+cleanup cycle before the first real setup. This is a stress-test that ensures that your cleanup logic “mirrors” your setup logic and that it stops or undoes whatever the setup is doing. If this causes a problem, implement the cleanup function.

If some of your dependencies are objects or functions defined inside the component, there is a risk that they will cause the Effect to re-run more often than needed. To fix this, remove unnecessary object and function dependencies. You can also extract state updates and non-reactive logic outside of your Effect.

If your Effect wasn’t caused by an interaction (like a click), React will generally let the browser paint the updated screen first before running your Effect. If your Effect is doing something visual (for example, positioning a tooltip), and the delay is noticeable (for example, it flickers), replace useEffect with useLayoutEffect.

If your Effect is caused by an interaction (like a click), React may run your Effect before the browser paints the updated screen. This ensures that the result of the Effect can be observed by the event system. Usually, this works as expected. However, if you must defer the work until after paint, such as an alert(), you can use setTimeout. See reactwg/react-18/128 for more information.

Even if your Effect was caused by an interaction (like a click), React may allow the browser to repaint the screen before processing the state updates inside your Effect. Usually, this works as expected. However, if you must block the browser from repainting the screen, you need to replace useEffect with useLayoutEffect.

Effects only run on the client. They don’t run during server rendering.

Some components need to stay connected to the network, some browser API, or a third-party library, while they are displayed on the page. These systems aren’t controlled by React, so they are called external.

To connect your component to some external system, call useEffect at the top level of your component:

You need to pass two arguments to useEffect:

React calls your setup and cleanup functions whenever it’s necessary, which may happen multiple times:

Let’s illustrate this sequence for the example above.

When the ChatRoom component above gets added to the page, it will connect to the chat room with the initial serverUrl and roomId. If either serverUrl or roomId change as a result of a commit (say, if the user picks a different chat room in a dropdown), your Effect will disconnect from the previous room, and connect to the next one. When the ChatRoom component is removed from the page, your Effect will disconnect one last time.

To help you find bugs, in development React runs setup and cleanup one extra time before the setup. This is a stress-test that verifies your Effect’s logic is implemented correctly. If this causes visible issues, your cleanup function is missing some logic. The cleanup function should stop or undo whatever the setup function was doing. The rule of thumb is that the user shouldn’t be able to distinguish between the setup being called once (as in production) and a setup → cleanup → setup sequence (as in development). See common solutions.

Try to write every Effect as an independent process and think about a single setup/cleanup cycle at a time. It shouldn’t matter whether your component is mounting, updating, or unmounting. When your cleanup logic correctly “mirrors” the setup logic, your Effect is resilient to running setup and cleanup as often as needed.

An Effect lets you keep your component synchronized with some external system (like a chat service). Here, external system means any piece of code that’s not controlled by React, such as:

If you’re not connecting to any external system, you probably don’t need an Effect.

In this example, the ChatRoom component uses an Effect to stay connected to an external system defined in chat.js. Press “Open chat” to make the ChatRoom component appear. This sandbox runs in development mode, so there is an extra connect-and-disconnect cycle, as explained here. Try changing the roomId and serverUrl using the dropdown and the input, and see how the Effect re-connects to the chat. Press “Close chat” to see the Effect disconnect one last time.

Effects are an “escape hatch”: you use them when you need to “step outside React” and when there is no better built-in solution for your use case. If you find yourself often needing to manually write Effects, it’s usually a sign that you need to extract some custom Hooks for common behaviors your components rely on.

For example, this useChatRoom custom Hook “hides” the logic of your Effect behind a more declarative API:

Then you can use it from any component like this:

There are also many excellent custom Hooks for every purpose available in the React ecosystem.

Learn more about wrapping Effects in custom Hooks.

This example is identical to one of the earlier examples, but the logic is extracted to a custom Hook.

Sometimes, you want to keep an external system synchronized to some prop or state of your component.

For example, if you have a third-party map widget or a video player component written without React, you can use an Effect to call methods on it that make its state match the current state of your React component. This Effect creates an instance of a MapWidget class defined in map-widget.js. When you change the zoomLevel prop of the Map component, the Effect calls the setZoom() on the class instance to keep it synchronized:

In this example, a cleanup function is not needed because the MapWidget class manages only the DOM node that was passed to it. After the Map React component is removed from the tree, both the DOM node and the MapWidget class instance will be automatically garbage-collected by the browser JavaScript engine.

You can use an Effect to fetch data for your component. Note that if you use a framework, using your framework’s data fetching mechanism will be a lot more efficient than writing Effects manually.

If you want to fetch data from an Effect manually, your code might look like this:

Note the ignore variable which is initialized to false, and is set to true during cleanup. This ensures your code doesn’t suffer from “race conditions”: network responses may arrive in a different order than you sent them.

You can also rewrite using the async / await syntax, but you still need to provide a cleanup function:

Writing data fetching directly in Effects gets repetitive and makes it difficult to add optimizations like caching and server rendering later. It’s easier to use a custom Hook—either your own or maintained by the community.

Writing fetch calls inside Effects is a popular way to fetch data, especially in fully client-side apps. This is, however, a very manual approach and it has significant downsides:

This list of downsides is not specific to React. It applies to fetching data on mount with any library. Like with routing, data fetching is not trivial to do well, so we recommend the following approaches:

You can continue fetching data directly in Effects if neither of these approaches suit you.

Notice that you can’t “choose” the dependencies of your Effect. Every reactive value used by your Effect’s code must be declared as a dependency. Your Effect’s dependency list is determined by the surrounding code:

If either serverUrl or roomId change, your Effect will reconnect to the chat using the new values.

Reactive values include props and all variables and functions declared directly inside of your component. Since roomId and serverUrl are reactive values, you can’t remove them from the dependencies. If you try to omit them and your linter is correctly configured for React, the linter will flag this as a mistake you need to fix:

To remove a dependency, you need to “prove” to the linter that it doesn’t need to be a dependency. For example, you can move serverUrl out of your component to prove that it’s not reactive and won’t change on re-renders:

Now that serverUrl is not a reactive value (and can’t change on a re-render), it doesn’t need to be a dependency. If your Effect’s code doesn’t use any reactive values, its dependency list should be empty ([]):

An Effect with empty dependencies doesn’t re-run when any of your component’s props or state change.

If you have an existing codebase, you might have some Effects that suppress the linter like this:

When dependencies don’t match the code, there is a high risk of introducing bugs. By suppressing the linter, you “lie” to React about the values your Effect depends on. Instead, prove they’re unnecessary.

If you specify the dependencies, your Effect runs after the initial commit and after commits with changed dependencies.

In the below example, serverUrl and roomId are reactive values, so they both must be specified as dependencies. As a result, selecting a different room in the dropdown or editing the server URL input causes the chat to re-connect. However, since message isn’t used in the Effect (and so it isn’t a dependency), editing the message doesn’t re-connect to the chat.

When you want to update state based on previous state from an Effect, you might run into a problem:

Since count is a reactive value, it must be specified in the list of dependencies. However, that causes the Effect to cleanup and setup again every time the count changes. This is not ideal.

To fix this, pass the c => c + 1 state updater to setCount:

Now that you’re passing c => c + 1 instead of count + 1, your Effect no longer needs to depend on count. As a result of this fix, it won’t need to cleanup and setup the interval again every time the count changes.

If your Effect depends on an object or a function created during rendering, it might run too often. For example, this Effect re-connects after every commit because the options object is different for every render:

Avoid using an object created during rendering as a dependency. Instead, create the object inside the Effect:

Now that you create the options object inside the Effect, the Effect itself only depends on the roomId string.

With this fix, typing into the input doesn’t reconnect the chat. Unlike an object which gets re-created, a string like roomId doesn’t change unless you set it to another value. Read more about removing dependencies.

If your Effect depends on an object or a function created during rendering, it might run too often. For example, this Effect re-connects after every commit because the createOptions function is different for every render:

By itself, creating a function from scratch on every re-render is not a problem. You don’t need to optimize that. However, if you use it as a dependency of your Effect, it will cause your Effect to re-run after every commit.

Avoid using a function created during rendering as a dependency. Instead, declare it inside the Effect:

Now that you define the createOptions function inside the Effect, the Effect itself only depends on the roomId string. With this fix, typing into the input doesn’t reconnect the chat. Unlike a function which gets re-created, a string like roomId doesn’t change unless you set it to another value. Read more about removing dependencies.

By default, when you read a reactive value from an Effect, you have to add it as a dependency. This ensures that your Effect “reacts” to every change of that value. For most dependencies, that’s the behavior you want.

However, sometimes you’ll want to read the latest props and state from an Effect without “reacting” to them. For example, imagine you want to log the number of the items in the shopping cart for every page visit:

What if you want to log a new page visit after every url change, but not if only the shoppingCart changes? You can’t exclude shoppingCart from dependencies without breaking the reactivity rules. However, you can express that you don’t want a piece of code to “react” to changes even though it is called from inside an Effect. Declare an Effect Event with the useEffectEvent Hook, and move the code reading shoppingCart inside of it:

Effect Events are not reactive and must always be omitted from dependencies of your Effect. This is what lets you put non-reactive code (where you can read the latest value of some props and state) inside of them. By reading shoppingCart inside of onVisit, you ensure that shoppingCart won’t re-run your Effect.

Read more about how Effect Events let you separate reactive and non-reactive code.

If your app uses server rendering (either directly or via a framework), your component will render in two different environments. On the server, it will render to produce the initial HTML. On the client, React will run the rendering code again so that it can attach your event handlers to that HTML. This is why, for hydration to work, your initial render output must be identical on the client and the server.

In rare cases, you might need to display different content on the client. For example, if your app reads some data from localStorage, it can’t possibly do that on the server. Here is how you could implement this:

While the app is loading, the user will see the initial render output. Then, when it’s loaded and hydrated, your Effect will run and set didMount to true, triggering a re-render. This will switch to the client-only render output. Effects don’t run on the server, so this is why didMount was false during the initial server render.

Use this pattern sparingly. Keep in mind that users with a slow connection will see the initial content for quite a bit of time—potentially, many seconds—so you don’t want to make jarring changes to your component’s appearance. In many cases, you can avoid the need for this by conditionally showing different things with CSS.

When Strict Mode is on, in development, React runs setup and cleanup one extra time before the actual setup.

This is a stress-test that verifies your Effect’s logic is implemented correctly. If this causes visible issues, your cleanup function is missing some logic. The cleanup function should stop or undo whatever the setup function was doing. The rule of thumb is that the user shouldn’t be able to distinguish between the setup being called once (as in production) and a setup → cleanup → setup sequence (as in development).

Read more about how this helps find bugs and how to fix your logic.

First, check that you haven’t forgotten to specify the dependency array:

If you’ve specified the dependency array but your Effect still re-runs in a loop, it’s because one of your dependencies is different on every re-render.

You can debug this problem by manually logging your dependencies to the console:

You can then right-click on the arrays from different re-renders in the console and select “Store as a global variable” for both of them. Assuming the first one got saved as temp1 and the second one got saved as temp2, you can then use the browser console to check whether each dependency in both arrays is the same:

When you find the dependency that is different on every re-render, you can usually fix it in one of these ways:

As a last resort (if these methods didn’t help), wrap its creation with useMemo or useCallback (for functions).

If your Effect runs in an infinite cycle, these two things must be true:

Before you start fixing the problem, ask yourself whether your Effect is connecting to some external system (like DOM, network, a third-party widget, and so on). Why does your Effect need to set state? Does it synchronize with that external system? Or are you trying to manage your application’s data flow with it?

If there is no external system, consider whether removing the Effect altogether would simplify your logic.

If you’re genuinely synchronizing with some external system, think about why and under what conditions your Effect should update the state. Has something changed that affects your component’s visual output? If you need to keep track of some data that isn’t used by rendering, a ref (which doesn’t trigger re-renders) might be more appropriate. Verify your Effect doesn’t update the state (and trigger re-renders) more than needed.

Finally, if your Effect is updating the state at the right time, but there is still a loop, it’s because that state update leads to one of the Effect’s dependencies changing. Read how to debug dependency changes.

The cleanup function runs not only during unmount, but before every re-render with changed dependencies. Additionally, in development, React runs setup+cleanup one extra time immediately after component mounts.

If you have cleanup code without corresponding setup code, it’s usually a code smell:

Your cleanup logic should be “symmetrical” to the setup logic, and should stop or undo whatever setup did:

Learn how the Effect lifecycle is different from the component’s lifecycle.

If your Effect must block the browser from painting the screen, replace useEffect with useLayoutEffect. Note that this shouldn’t be needed for the vast majority of Effects. You’ll only need this if it’s crucial to run your Effect before the browser paint: for example, to measure and position a tooltip before the user sees it.

**Examples:**

Example 1 (jsx):
```jsx
useEffect(setup, dependencies?)
```

Example 2 (jsx):
```jsx
import { useState, useEffect } from 'react';import { createConnection } from './chat.js';function ChatRoom({ roomId }) {  const [serverUrl, setServerUrl] = useState('https://localhost:1234');  useEffect(() => {    const connection = createConnection(serverUrl, roomId);    connection.connect();    return () => {      connection.disconnect();    };  }, [serverUrl, roomId]);  // ...}
```

Example 3 (jsx):
```jsx
import { useState, useEffect } from 'react';import { createConnection } from './chat.js';function ChatRoom({ roomId }) {  const [serverUrl, setServerUrl] = useState('https://localhost:1234');  useEffect(() => {  	const connection = createConnection(serverUrl, roomId);    connection.connect();  	return () => {      connection.disconnect();  	};  }, [serverUrl, roomId]);  // ...}
```

Example 4 (javascript):
```javascript
function useChatRoom({ serverUrl, roomId }) {  useEffect(() => {    const options = {      serverUrl: serverUrl,      roomId: roomId    };    const connection = createConnection(options);    connection.connect();    return () => connection.disconnect();  }, [roomId, serverUrl]);}
```

---

## refs

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/refs

**Contents:**
- refs
- Rule Details
- How It Detects Refs
- Common Violations
  - Invalid
  - Valid
- Troubleshooting
  - The lint flagged my plain object with .current

Validates correct usage of refs, not reading/writing during render. See the “pitfalls” section in useRef() usage.

Refs hold values that aren’t used for rendering. Unlike state, changing a ref doesn’t trigger a re-render. Reading or writing ref.current during render breaks React’s expectations. Refs might not be initialized when you try to read them, and their values can be stale or inconsistent.

The lint only applies these rules to values it knows are refs. A value is inferred as a ref when the compiler sees any of the following patterns:

Returned from useRef() or React.createRef().

An identifier named ref or ending in Ref that reads from or writes to .current.

Passed through a JSX ref prop (for example <div ref={someRef} />).

Once something is marked as a ref, that inference follows the value through assignments, destructuring, or helper calls. This lets the lint surface violations even when ref.current is accessed inside another function that received the ref as an argument.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

The name heuristic intentionally treats ref.current and fooRef.current as real refs. If you’re modeling a custom container object, pick a different name (for example, box) or move the mutable value into state. Renaming avoids the lint because the compiler stops inferring it as a ref.

**Examples:**

Example 1 (jsx):
```jsx
const scrollRef = useRef(null);
```

Example 2 (unknown):
```unknown
buttonRef.current = node;
```

Example 3 (jsx):
```jsx
<input ref={inputRef} />
```

Example 4 (jsx):
```jsx
// ❌ Reading ref during renderfunction Component() {  const ref = useRef(0);  const value = ref.current; // Don't read during render  return <div>{value}</div>;}// ❌ Modifying ref during renderfunction Component({value}) {  const ref = useRef(null);  ref.current = value; // Don't modify during render  return <div />;}
```

---

## useMemo

**URL:** https://react.dev/reference/react/useMemo

**Contents:**
- useMemo
  - Note
- Reference
  - useMemo(calculateValue, dependencies)
    - Parameters
    - Returns
    - Caveats
  - Note
- Usage
  - Skipping expensive recalculations

useMemo is a React Hook that lets you cache the result of a calculation between re-renders.

React Compiler automatically memoizes values and functions, reducing the need for manual useMemo calls. You can use the compiler to handle memoization automatically.

Call useMemo at the top level of your component to cache a calculation between re-renders:

See more examples below.

calculateValue: The function calculating the value that you want to cache. It should be pure, should take no arguments, and should return a value of any type. React will call your function during the initial render. On next renders, React will return the same value again if the dependencies have not changed since the last render. Otherwise, it will call calculateValue, return its result, and store it so it can be reused later.

dependencies: The list of all reactive values referenced inside of the calculateValue code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison.

On the initial render, useMemo returns the result of calling calculateValue with no arguments.

During next renders, it will either return an already stored value from the last render (if the dependencies haven’t changed), or call calculateValue again, and return the result that calculateValue has returned.

Caching return values like this is also known as memoization, which is why this Hook is called useMemo.

To cache a calculation between re-renders, wrap it in a useMemo call at the top level of your component:

You need to pass two things to useMemo:

On the initial render, the value you’ll get from useMemo will be the result of calling your calculation.

On every subsequent render, React will compare the dependencies with the dependencies you passed during the last render. If none of the dependencies have changed (compared with Object.is), useMemo will return the value you already calculated before. Otherwise, React will re-run your calculation and return the new value.

In other words, useMemo caches a calculation result between re-renders until its dependencies change.

Let’s walk through an example to see when this is useful.

By default, React will re-run the entire body of your component every time that it re-renders. For example, if this TodoList updates its state or receives new props from its parent, the filterTodos function will re-run:

Usually, this isn’t a problem because most calculations are very fast. However, if you’re filtering or transforming a large array, or doing some expensive computation, you might want to skip doing it again if data hasn’t changed. If both todos and tab are the same as they were during the last render, wrapping the calculation in useMemo like earlier lets you reuse visibleTodos you’ve already calculated before.

This type of caching is called memoization.

You should only rely on useMemo as a performance optimization. If your code doesn’t work without it, find the underlying problem and fix it first. Then you may add useMemo to improve performance.

In general, unless you’re creating or looping over thousands of objects, it’s probably not expensive. If you want to get more confidence, you can add a console log to measure the time spent in a piece of code:

Perform the interaction you’re measuring (for example, typing into the input). You will then see logs like filter array: 0.15ms in your console. If the overall logged time adds up to a significant amount (say, 1ms or more), it might make sense to memoize that calculation. As an experiment, you can then wrap the calculation in useMemo to verify whether the total logged time has decreased for that interaction or not:

useMemo won’t make the first render faster. It only helps you skip unnecessary work on updates.

Keep in mind that your machine is probably faster than your users’ so it’s a good idea to test the performance with an artificial slowdown. For example, Chrome offers a CPU Throttling option for this.

Also note that measuring performance in development will not give you the most accurate results. (For example, when Strict Mode is on, you will see each component render twice rather than once.) To get the most accurate timings, build your app for production and test it on a device like your users have.

If your app is like this site, and most interactions are coarse (like replacing a page or an entire section), memoization is usually unnecessary. On the other hand, if your app is more like a drawing editor, and most interactions are granular (like moving shapes), then you might find memoization very helpful.

Optimizing with useMemo is only valuable in a few cases:

There is no benefit to wrapping a calculation in useMemo in other cases. There is no significant harm to doing that either, so some teams choose to not think about individual cases, and memoize as much as possible. The downside of this approach is that code becomes less readable. Also, not all memoization is effective: a single value that’s “always new” is enough to break memoization for an entire component.

In practice, you can make a lot of memoization unnecessary by following a few principles:

If a specific interaction still feels laggy, use the React Developer Tools profiler to see which components would benefit the most from memoization, and add memoization where needed. These principles make your components easier to debug and understand, so it’s good to follow them in any case. In the long term, we’re researching doing granular memoization automatically to solve this once and for all.

In this example, the filterTodos implementation is artificially slowed down so that you can see what happens when some JavaScript function you’re calling during rendering is genuinely slow. Try switching the tabs and toggling the theme.

Switching the tabs feels slow because it forces the slowed down filterTodos to re-execute. That’s expected because the tab has changed, and so the entire calculation needs to re-run. (If you’re curious why it runs twice, it’s explained here.)

Toggle the theme. Thanks to useMemo, it’s fast despite the artificial slowdown! The slow filterTodos call was skipped because both todos and tab (which you pass as dependencies to useMemo) haven’t changed since the last render.

In some cases, useMemo can also help you optimize performance of re-rendering child components. To illustrate this, let’s say this TodoList component passes the visibleTodos as a prop to the child List component:

You’ve noticed that toggling the theme prop freezes the app for a moment, but if you remove <List /> from your JSX, it feels fast. This tells you that it’s worth trying to optimize the List component.

By default, when a component re-renders, React re-renders all of its children recursively. This is why, when TodoList re-renders with a different theme, the List component also re-renders. This is fine for components that don’t require much calculation to re-render. But if you’ve verified that a re-render is slow, you can tell List to skip re-rendering when its props are the same as on last render by wrapping it in memo:

With this change, List will skip re-rendering if all of its props are the same as on the last render. This is where caching the calculation becomes important! Imagine that you calculated visibleTodos without useMemo:

In the above example, the filterTodos function always creates a different array, similar to how the {} object literal always creates a new object. Normally, this wouldn’t be a problem, but it means that List props will never be the same, and your memo optimization won’t work. This is where useMemo comes in handy:

By wrapping the visibleTodos calculation in useMemo, you ensure that it has the same value between the re-renders (until dependencies change). You don’t have to wrap a calculation in useMemo unless you do it for some specific reason. In this example, the reason is that you pass it to a component wrapped in memo, and this lets it skip re-rendering. There are a few other reasons to add useMemo which are described further on this page.

Instead of wrapping List in memo, you could wrap the <List /> JSX node itself in useMemo:

The behavior would be the same. If the visibleTodos haven’t changed, List won’t be re-rendered.

A JSX node like <List items={visibleTodos} /> is an object like { type: List, props: { items: visibleTodos } }. Creating this object is very cheap, but React doesn’t know whether its contents is the same as last time or not. This is why by default, React will re-render the List component.

However, if React sees the same exact JSX as during the previous render, it won’t try to re-render your component. This is because JSX nodes are immutable. A JSX node object could not have changed over time, so React knows it’s safe to skip a re-render. However, for this to work, the node has to actually be the same object, not merely look the same in code. This is what useMemo does in this example.

Manually wrapping JSX nodes into useMemo is not convenient. For example, you can’t do this conditionally. This is usually why you would wrap components with memo instead of wrapping JSX nodes.

In this example, the List component is artificially slowed down so that you can see what happens when a React component you’re rendering is genuinely slow. Try switching the tabs and toggling the theme.

Switching the tabs feels slow because it forces the slowed down List to re-render. That’s expected because the tab has changed, and so you need to reflect the user’s new choice on the screen.

Next, try toggling the theme. Thanks to useMemo together with memo, it’s fast despite the artificial slowdown! The List skipped re-rendering because the visibleTodos array has not changed since the last render. The visibleTodos array has not changed because both todos and tab (which you pass as dependencies to useMemo) haven’t changed since the last render.

Sometimes, you might want to use a value inside an Effect:

This creates a problem. Every reactive value must be declared as a dependency of your Effect. However, if you declare options as a dependency, it will cause your Effect to constantly reconnect to the chat room:

To solve this, you can wrap the object you need to call from an Effect in useMemo:

This ensures that the options object is the same between re-renders if useMemo returns the cached object.

However, since useMemo is performance optimization, not a semantic guarantee, React may throw away the cached value if there is a specific reason to do that. This will also cause the effect to re-fire, so it’s even better to remove the need for a function dependency by moving your object inside the Effect:

Now your code is simpler and doesn’t need useMemo. Learn more about removing Effect dependencies.

Suppose you have a calculation that depends on an object created directly in the component body:

Depending on an object like this defeats the point of memoization. When a component re-renders, all of the code directly inside the component body runs again. The lines of code creating the searchOptions object will also run on every re-render. Since searchOptions is a dependency of your useMemo call, and it’s different every time, React knows the dependencies are different, and recalculate searchItems every time.

To fix this, you could memoize the searchOptions object itself before passing it as a dependency:

In the example above, if the text did not change, the searchOptions object also won’t change. However, an even better fix is to move the searchOptions object declaration inside of the useMemo calculation function:

Now your calculation depends on text directly (which is a string and can’t “accidentally” become different).

Suppose the Form component is wrapped in memo. You want to pass a function to it as a prop:

Just as {} creates a different object, function declarations like function() {} and expressions like () => {} produce a different function on every re-render. By itself, creating a new function is not a problem. This is not something to avoid! However, if the Form component is memoized, presumably you want to skip re-rendering it when no props have changed. A prop that is always different would defeat the point of memoization.

To memoize a function with useMemo, your calculation function would have to return another function:

This looks clunky! Memoizing functions is common enough that React has a built-in Hook specifically for that. Wrap your functions into useCallback instead of useMemo to avoid having to write an extra nested function:

The two examples above are completely equivalent. The only benefit to useCallback is that it lets you avoid writing an extra nested function inside. It doesn’t do anything else. Read more about useCallback.

In Strict Mode, React will call some of your functions twice instead of once:

This is expected and shouldn’t break your code.

This development-only behavior helps you keep components pure. React uses the result of one of the calls, and ignores the result of the other call. As long as your component and calculation functions are pure, this shouldn’t affect your logic. However, if they are accidentally impure, this helps you notice and fix the mistake.

For example, this impure calculation function mutates an array you received as a prop:

React calls your function twice, so you’d notice the todo is added twice. Your calculation shouldn’t change any existing objects, but it’s okay to change any new objects you created during the calculation. For example, if the filterTodos function always returns a different array, you can mutate that array instead:

Read keeping components pure to learn more about purity.

Also, check out the guides on updating objects and updating arrays without mutation.

This code doesn’t work:

In JavaScript, () => { starts the arrow function body, so the { brace is not a part of your object. This is why it doesn’t return an object, and leads to mistakes. You could fix it by adding parentheses like ({ and }):

However, this is still confusing and too easy for someone to break by removing the parentheses.

To avoid this mistake, write a return statement explicitly:

Make sure you’ve specified the dependency array as a second argument!

If you forget the dependency array, useMemo will re-run the calculation every time:

This is the corrected version passing the dependency array as a second argument:

If this doesn’t help, then the problem is that at least one of your dependencies is different from the previous render. You can debug this problem by manually logging your dependencies to the console:

You can then right-click on the arrays from different re-renders in the console and select “Store as a global variable” for both of them. Assuming the first one got saved as temp1 and the second one got saved as temp2, you can then use the browser console to check whether each dependency in both arrays is the same:

When you find which dependency breaks memoization, either find a way to remove it, or memoize it as well.

Suppose the Chart component is wrapped in memo. You want to skip re-rendering every Chart in the list when the ReportList component re-renders. However, you can’t call useMemo in a loop:

Instead, extract a component for each item and memoize data for individual items:

Alternatively, you could remove useMemo and instead wrap Report itself in memo. If the item prop does not change, Report will skip re-rendering, so Chart will skip re-rendering too:

**Examples:**

Example 1 (jsx):
```jsx
const cachedValue = useMemo(calculateValue, dependencies)
```

Example 2 (javascript):
```javascript
import { useMemo } from 'react';function TodoList({ todos, tab }) {  const visibleTodos = useMemo(    () => filterTodos(todos, tab),    [todos, tab]  );  // ...}
```

Example 3 (javascript):
```javascript
import { useMemo } from 'react';function TodoList({ todos, tab, theme }) {  const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);  // ...}
```

Example 4 (javascript):
```javascript
function TodoList({ todos, tab, theme }) {  const visibleTodos = filterTodos(todos, tab);  // ...}
```

---

## useSyncExternalStore

**URL:** https://react.dev/reference/react/useSyncExternalStore

**Contents:**
- useSyncExternalStore
- Reference
  - useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Subscribing to an external store
  - Note
  - Subscribing to a browser API

useSyncExternalStore is a React Hook that lets you subscribe to an external store.

Call useSyncExternalStore at the top level of your component to read a value from an external data store.

It returns the snapshot of the data in the store. You need to pass two functions as arguments:

See more examples below.

subscribe: A function that takes a single callback argument and subscribes it to the store. When the store changes, it should invoke the provided callback, which will cause React to re-call getSnapshot and (if needed) re-render the component. The subscribe function should return a function that cleans up the subscription.

getSnapshot: A function that returns a snapshot of the data in the store that’s needed by the component. While the store has not changed, repeated calls to getSnapshot must return the same value. If the store changes and the returned value is different (as compared by Object.is), React re-renders the component.

optional getServerSnapshot: A function that returns the initial snapshot of the data in the store. It will be used only during server rendering and during hydration of server-rendered content on the client. The server snapshot must be the same between the client and the server, and is usually serialized and passed from the server to the client. If you omit this argument, rendering the component on the server will throw an error.

The current snapshot of the store which you can use in your rendering logic.

The store snapshot returned by getSnapshot must be immutable. If the underlying store has mutable data, return a new immutable snapshot if the data has changed. Otherwise, return a cached last snapshot.

If a different subscribe function is passed during a re-render, React will re-subscribe to the store using the newly passed subscribe function. You can prevent this by declaring subscribe outside the component.

If the store is mutated during a non-blocking Transition update, React will fall back to performing that update as blocking. Specifically, for every Transition update, React will call getSnapshot a second time just before applying changes to the DOM. If it returns a different value than when it was called originally, React will restart the update from scratch, this time applying it as a blocking update, to ensure that every component on screen is reflecting the same version of the store.

It’s not recommended to suspend a render based on a store value returned by useSyncExternalStore. The reason is that mutations to the external store cannot be marked as non-blocking Transition updates, so they will trigger the nearest Suspense fallback, replacing already-rendered content on screen with a loading spinner, which typically makes a poor UX.

For example, the following are discouraged:

Most of your React components will only read data from their props, state, and context. However, sometimes a component needs to read some data from some store outside of React that changes over time. This includes:

Call useSyncExternalStore at the top level of your component to read a value from an external data store.

It returns the snapshot of the data in the store. You need to pass two functions as arguments:

React will use these functions to keep your component subscribed to the store and re-render it on changes.

For example, in the sandbox below, todosStore is implemented as an external store that stores data outside of React. The TodosApp component connects to that external store with the useSyncExternalStore Hook.

When possible, we recommend using built-in React state with useState and useReducer instead. The useSyncExternalStore API is mostly useful if you need to integrate with existing non-React code.

Another reason to add useSyncExternalStore is when you want to subscribe to some value exposed by the browser that changes over time. For example, suppose that you want your component to display whether the network connection is active. The browser exposes this information via a property called navigator.onLine.

This value can change without React’s knowledge, so you should read it with useSyncExternalStore.

To implement the getSnapshot function, read the current value from the browser API:

Next, you need to implement the subscribe function. For example, when navigator.onLine changes, the browser fires the online and offline events on the window object. You need to subscribe the callback argument to the corresponding events, and then return a function that cleans up the subscriptions:

Now React knows how to read the value from the external navigator.onLine API and how to subscribe to its changes. Disconnect your device from the network and notice that the component re-renders in response:

Usually you won’t write useSyncExternalStore directly in your components. Instead, you’ll typically call it from your own custom Hook. This lets you use the same external store from different components.

For example, this custom useOnlineStatus Hook tracks whether the network is online:

Now different components can call useOnlineStatus without repeating the underlying implementation:

If your React app uses server rendering, your React components will also run outside the browser environment to generate the initial HTML. This creates a few challenges when connecting to an external store:

To solve these issues, pass a getServerSnapshot function as the third argument to useSyncExternalStore:

The getServerSnapshot function is similar to getSnapshot, but it runs only in two situations:

This lets you provide the initial snapshot value which will be used before the app becomes interactive. If there is no meaningful initial value for the server rendering, omit this argument to force rendering on the client.

Make sure that getServerSnapshot returns the same exact data on the initial client render as it returned on the server. For example, if getServerSnapshot returned some prepopulated store content on the server, you need to transfer this content to the client. One way to do this is to emit a <script> tag during server rendering that sets a global like window.MY_STORE_DATA, and read from that global on the client in getServerSnapshot. Your external store should provide instructions on how to do that.

This error means your getSnapshot function returns a new object every time it’s called, for example:

React will re-render the component if getSnapshot return value is different from the last time. This is why, if you always return a different value, you will enter an infinite loop and get this error.

Your getSnapshot object should only return a different object if something has actually changed. If your store contains immutable data, you can return that data directly:

If your store data is mutable, your getSnapshot function should return an immutable snapshot of it. This means it does need to create new objects, but it shouldn’t do this for every single call. Instead, it should store the last calculated snapshot, and return the same snapshot as the last time if the data in the store has not changed. How you determine whether mutable data has changed depends on your mutable store.

This subscribe function is defined inside a component so it is different on every re-render:

React will resubscribe to your store if you pass a different subscribe function between re-renders. If this causes performance issues and you’d like to avoid resubscribing, move the subscribe function outside:

Alternatively, wrap subscribe into useCallback to only resubscribe when some argument changes:

**Examples:**

Example 1 (javascript):
```javascript
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)
```

Example 2 (javascript):
```javascript
import { useSyncExternalStore } from 'react';import { todosStore } from './todoStore.js';function TodosApp() {  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);  // ...}
```

Example 3 (jsx):
```jsx
const LazyProductDetailPage = lazy(() => import('./ProductDetailPage.js'));function ShoppingApp() {  const selectedProductId = useSyncExternalStore(...);  // ❌ Calling `use` with a Promise dependent on `selectedProductId`  const data = use(fetchItem(selectedProductId))  // ❌ Conditionally rendering a lazy component based on `selectedProductId`  return selectedProductId != null ? <LazyProductDetailPage /> : <FeaturedProducts />;}
```

Example 4 (javascript):
```javascript
import { useSyncExternalStore } from 'react';import { todosStore } from './todoStore.js';function TodosApp() {  const todos = useSyncExternalStore(todosStore.subscribe, todosStore.getSnapshot);  // ...}
```

---

## 'use server'

**URL:** https://react.dev/reference/rsc/use-server

**Contents:**
- 'use server'
  - React Server Components
- Reference
  - 'use server'
    - Caveats
  - Security considerations
  - Under Construction
  - Serializable arguments and return values
- Usage
  - Server Functions in forms

'use server' is for use with using React Server Components.

'use server' marks server-side functions that can be called from client-side code.

Add 'use server' at the top of an async function body to mark the function as callable by the client. We call these functions Server Functions.

When calling a Server Function on the client, it will make a network request to the server that includes a serialized copy of any arguments passed. If the Server Function returns a value, that value will be serialized and returned to the client.

Instead of individually marking functions with 'use server', you can add the directive to the top of a file to mark all exports within that file as Server Functions that can be used anywhere, including imported in client code.

Arguments to Server Functions are fully client-controlled. For security, always treat them as untrusted input, and make sure to validate and escape arguments as appropriate.

In any Server Function, make sure to validate that the logged-in user is allowed to perform that action.

To prevent sending sensitive data from a Server Function, there are experimental taint APIs to prevent unique values and objects from being passed to client code.

See experimental_taintUniqueValue and experimental_taintObjectReference.

Since client code calls the Server Function over the network, any arguments passed will need to be serializable.

Here are supported types for Server Function arguments:

Notably, these are not supported:

Supported serializable return values are the same as serializable props for a boundary Client Component.

The most common use case of Server Functions will be calling functions that mutate data. On the browser, the HTML form element is the traditional approach for a user to submit a mutation. With React Server Components, React introduces first-class support for Server Functions as Actions in forms.

Here is a form that allows a user to request a username.

In this example requestUsername is a Server Function passed to a <form>. When a user submits this form, there is a network request to the server function requestUsername. When calling a Server Function in a form, React will supply the form’s FormData as the first argument to the Server Function.

By passing a Server Function to the form action, React can progressively enhance the form. This means that forms can be submitted before the JavaScript bundle is loaded.

In the username request form, there might be the chance that a username is not available. requestUsername should tell us if it fails or not.

To update the UI based on the result of a Server Function while supporting progressive enhancement, use useActionState.

Note that like most Hooks, useActionState can only be called in client code.

Server Functions are exposed server endpoints and can be called anywhere in client code.

When using a Server Function outside a form, call the Server Function in a Transition, which allows you to display a loading indicator, show optimistic state updates, and handle unexpected errors. Forms will automatically wrap Server Functions in transitions.

To read a Server Function return value, you’ll need to await the promise returned.

**Examples:**

Example 1 (javascript):
```javascript
async function addToCart(data) {  'use server';  // ...}
```

Example 2 (javascript):
```javascript
// App.jsasync function requestUsername(formData) {  'use server';  const username = formData.get('username');  // ...}export default function App() {  return (    <form action={requestUsername}>      <input type="text" name="username" />      <button type="submit">Request</button>    </form>  );}
```

Example 3 (javascript):
```javascript
// requestUsername.js'use server';export default async function requestUsername(formData) {  const username = formData.get('username');  if (canRequest(username)) {    // ...    return 'successful';  }  return 'failed';}
```

Example 4 (jsx):
```jsx
// UsernameForm.js'use client';import { useActionState } from 'react';import requestUsername from './requestUsername';function UsernameForm() {  const [state, action] = useActionState(requestUsername, null, 'n/a');  return (    <>      <form action={action}>        <input type="text" name="username" />        <button type="submit">Request</button>      </form>      <p>Last submission request returned: {state}</p>    </>  );}
```

---

## useDeferredValue

**URL:** https://react.dev/reference/react/useDeferredValue

**Contents:**
- useDeferredValue
- Reference
  - useDeferredValue(value, initialValue?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Showing stale content while fresh content is loading
  - Note
      - Deep Dive

useDeferredValue is a React Hook that lets you defer updating a part of the UI.

Call useDeferredValue at the top level of your component to get a deferred version of that value.

See more examples below.

When an update is inside a Transition, useDeferredValue always returns the new value and does not spawn a deferred render, since the update is already deferred.

The values you pass to useDeferredValue should either be primitive values (like strings and numbers) or objects created outside of rendering. If you create a new object during rendering and immediately pass it to useDeferredValue, it will be different on every render, causing unnecessary background re-renders.

When useDeferredValue receives a different value (compared with Object.is), in addition to the current render (when it still uses the previous value), it schedules a re-render in the background with the new value. The background re-render is interruptible: if there’s another update to the value, React will restart the background re-render from scratch. For example, if the user is typing into an input faster than a chart receiving its deferred value can re-render, the chart will only re-render after the user stops typing.

useDeferredValue is integrated with <Suspense>. If the background update caused by a new value suspends the UI, the user will not see the fallback. They will see the old deferred value until the data loads.

useDeferredValue does not by itself prevent extra network requests.

There is no fixed delay caused by useDeferredValue itself. As soon as React finishes the original re-render, React will immediately start working on the background re-render with the new deferred value. Any updates caused by events (like typing) will interrupt the background re-render and get prioritized over it.

The background re-render caused by useDeferredValue does not fire Effects until it’s committed to the screen. If the background re-render suspends, its Effects will run after the data loads and the UI updates.

Call useDeferredValue at the top level of your component to defer updating some part of your UI.

During the initial render, the deferred value will be the same as the value you provided.

During updates, the deferred value will “lag behind” the latest value. In particular, React will first re-render without updating the deferred value, and then try to re-render with the newly received value in the background.

Let’s walk through an example to see when this is useful.

This example assumes you use a Suspense-enabled data source:

Learn more about Suspense and its limitations.

In this example, the SearchResults component suspends while fetching the search results. Try typing "a", waiting for the results, and then editing it to "ab". The results for "a" get replaced by the loading fallback.

A common alternative UI pattern is to defer updating the list of results and to keep showing the previous results until the new results are ready. Call useDeferredValue to pass a deferred version of the query down:

The query will update immediately, so the input will display the new value. However, the deferredQuery will keep its previous value until the data has loaded, so SearchResults will show the stale results for a bit.

Enter "a" in the example below, wait for the results to load, and then edit the input to "ab". Notice how instead of the Suspense fallback, you now see the stale result list until the new results have loaded:

You can think of it as happening in two steps:

First, React re-renders with the new query ("ab") but with the old deferredQuery (still "a"). The deferredQuery value, which you pass to the result list, is deferred: it “lags behind” the query value.

In the background, React tries to re-render with both query and deferredQuery updated to "ab". If this re-render completes, React will show it on the screen. However, if it suspends (the results for "ab" have not loaded yet), React will abandon this rendering attempt, and retry this re-render again after the data has loaded. The user will keep seeing the stale deferred value until the data is ready.

The deferred “background” rendering is interruptible. For example, if you type into the input again, React will abandon it and restart with the new value. React will always use the latest provided value.

Note that there is still a network request per each keystroke. What’s being deferred here is displaying results (until they’re ready), not the network requests themselves. Even if the user continues typing, responses for each keystroke get cached, so pressing Backspace is instant and doesn’t fetch again.

In the example above, there is no indication that the result list for the latest query is still loading. This can be confusing to the user if the new results take a while to load. To make it more obvious to the user that the result list does not match the latest query, you can add a visual indication when the stale result list is displayed:

With this change, as soon as you start typing, the stale result list gets slightly dimmed until the new result list loads. You can also add a CSS transition to delay dimming so that it feels gradual, like in the example below:

You can also apply useDeferredValue as a performance optimization. It is useful when a part of your UI is slow to re-render, there’s no easy way to optimize it, and you want to prevent it from blocking the rest of the UI.

Imagine you have a text field and a component (like a chart or a long list) that re-renders on every keystroke:

First, optimize SlowList to skip re-rendering when its props are the same. To do this, wrap it in memo:

However, this only helps if the SlowList props are the same as during the previous render. The problem you’re facing now is that it’s slow when they’re different, and when you actually need to show different visual output.

Concretely, the main performance problem is that whenever you type into the input, the SlowList receives new props, and re-rendering its entire tree makes the typing feel janky. In this case, useDeferredValue lets you prioritize updating the input (which must be fast) over updating the result list (which is allowed to be slower):

This does not make re-rendering of the SlowList faster. However, it tells React that re-rendering the list can be deprioritized so that it doesn’t block the keystrokes. The list will “lag behind” the input and then “catch up”. Like before, React will attempt to update the list as soon as possible, but will not block the user from typing.

In this example, each item in the SlowList component is artificially slowed down so that you can see how useDeferredValue lets you keep the input responsive. Type into the input and notice that typing feels snappy while the list “lags behind” it.

This optimization requires SlowList to be wrapped in memo. This is because whenever the text changes, React needs to be able to re-render the parent component quickly. During that re-render, deferredText still has its previous value, so SlowList is able to skip re-rendering (its props have not changed). Without memo, it would have to re-render anyway, defeating the point of the optimization.

There are two common optimization techniques you might have used before in this scenario:

While these techniques are helpful in some cases, useDeferredValue is better suited to optimizing rendering because it is deeply integrated with React itself and adapts to the user’s device.

Unlike debouncing or throttling, it doesn’t require choosing any fixed delay. If the user’s device is fast (e.g. powerful laptop), the deferred re-render would happen almost immediately and wouldn’t be noticeable. If the user’s device is slow, the list would “lag behind” the input proportionally to how slow the device is.

Also, unlike with debouncing or throttling, deferred re-renders done by useDeferredValue are interruptible by default. This means that if React is in the middle of re-rendering a large list, but the user makes another keystroke, React will abandon that re-render, handle the keystroke, and then start rendering in the background again. By contrast, debouncing and throttling still produce a janky experience because they’re blocking: they merely postpone the moment when rendering blocks the keystroke.

If the work you’re optimizing doesn’t happen during rendering, debouncing and throttling are still useful. For example, they can let you fire fewer network requests. You can also use these techniques together.

**Examples:**

Example 1 (javascript):
```javascript
const deferredValue = useDeferredValue(value)
```

Example 2 (javascript):
```javascript
import { useState, useDeferredValue } from 'react';function SearchPage() {  const [query, setQuery] = useState('');  const deferredQuery = useDeferredValue(query);  // ...}
```

Example 3 (javascript):
```javascript
import { useState, useDeferredValue } from 'react';function SearchPage() {  const [query, setQuery] = useState('');  const deferredQuery = useDeferredValue(query);  // ...}
```

Example 4 (jsx):
```jsx
export default function App() {  const [query, setQuery] = useState('');  const deferredQuery = useDeferredValue(query);  return (    <>      <label>        Search albums:        <input value={query} onChange={e => setQuery(e.target.value)} />      </label>      <Suspense fallback={<h2>Loading...</h2>}>        <SearchResults query={deferredQuery} />      </Suspense>    </>  );}
```

---

## useInsertionEffect

**URL:** https://react.dev/reference/react/useInsertionEffect

**Contents:**
- useInsertionEffect
  - Pitfall
- Reference
  - useInsertionEffect(setup, dependencies?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Injecting dynamic styles from CSS-in-JS libraries
      - Deep Dive

useInsertionEffect is for CSS-in-JS library authors. Unless you are working on a CSS-in-JS library and need a place to inject the styles, you probably want useEffect or useLayoutEffect instead.

useInsertionEffect allows inserting elements into the DOM before any layout Effects fire.

Call useInsertionEffect to insert styles before any Effects fire that may need to read layout:

See more examples below.

setup: The function with your Effect’s logic. Your setup function may also optionally return a cleanup function. When your component is added to the DOM, but before any layout Effects fire, React will run your setup function. After every re-render with changed dependencies, React will first run the cleanup function (if you provided it) with the old values, and then run your setup function with the new values. When your component is removed from the DOM, React will run your cleanup function.

optional dependencies: The list of all reactive values referenced inside of the setup code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison algorithm. If you don’t specify the dependencies at all, your Effect will re-run after every re-render of the component.

useInsertionEffect returns undefined.

Traditionally, you would style React components using plain CSS.

Some teams prefer to author styles directly in JavaScript code instead of writing CSS files. This usually requires using a CSS-in-JS library or a tool. There are three common approaches to CSS-in-JS:

If you use CSS-in-JS, we recommend a combination of the first two approaches (CSS files for static styles, inline styles for dynamic styles). We don’t recommend runtime <style> tag injection for two reasons:

The first problem is not solvable, but useInsertionEffect helps you solve the second problem.

Call useInsertionEffect to insert the styles before any layout Effects fire:

Similarly to useEffect, useInsertionEffect does not run on the server. If you need to collect which CSS rules have been used on the server, you can do it during rendering:

Read more about upgrading CSS-in-JS libraries with runtime injection to useInsertionEffect.

If you insert styles during rendering and React is processing a non-blocking update, the browser will recalculate the styles every single frame while rendering a component tree, which can be extremely slow.

useInsertionEffect is better than inserting styles during useLayoutEffect or useEffect because it ensures that by the time other Effects run in your components, the <style> tags have already been inserted. Otherwise, layout calculations in regular Effects would be wrong due to outdated styles.

**Examples:**

Example 1 (unknown):
```unknown
useInsertionEffect(setup, dependencies?)
```

Example 2 (typescript):
```typescript
import { useInsertionEffect } from 'react';// Inside your CSS-in-JS libraryfunction useCSS(rule) {  useInsertionEffect(() => {    // ... inject <style> tags here ...  });  return rule;}
```

Example 3 (jsx):
```jsx
// In your JS file:<button className="success" />// In your CSS file:.success { color: green; }
```

Example 4 (jsx):
```jsx
// Inside your CSS-in-JS librarylet isInserted = new Set();function useCSS(rule) {  useInsertionEffect(() => {    // As explained earlier, we don't recommend runtime injection of <style> tags.    // But if you have to do it, then it's important to do in useInsertionEffect.    if (!isInserted.has(rule)) {      isInserted.add(rule);      document.head.appendChild(getStyleForRule(rule));    }  });  return rule;}function Button() {  const className = useCSS('...');  return <div className={className} />;}
```

---

## useActionState

**URL:** https://react.dev/reference/react/useActionState

**Contents:**
- useActionState
  - Note
- Reference
  - useActionState(action, initialState, permalink?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Using information returned by a form action
    - Display information after submitting a form

useActionState is a Hook that allows you to update state based on the result of a form action.

In earlier React Canary versions, this API was part of React DOM and called useFormState.

Call useActionState at the top level of your component to create component state that is updated when a form action is invoked. You pass useActionState an existing form action function as well as an initial state, and it returns a new action that you use in your form, along with the latest form state and whether the Action is still pending. The latest form state is also passed to the function that you provided.

The form state is the value returned by the action when the form was last submitted. If the form has not yet been submitted, it is the initial state that you pass.

If used with a Server Function, useActionState allows the server’s response from submitting the form to be shown even before hydration has completed.

See more examples below.

useActionState returns an array with the following values:

Call useActionState at the top level of your component to access the return value of an action from the last time a form was submitted.

useActionState returns an array with the following items:

When the form is submitted, the action function that you provided will be called. Its return value will become the new current state of the form.

The action that you provide will also receive a new first argument, namely the current state of the form. The first time the form is submitted, this will be the initial state you provided, while with subsequent submissions, it will be the return value from the last time the action was called. The rest of the arguments are the same as if useActionState had not been used.

To display messages such as an error message or toast that’s returned by a Server Function, wrap the action in a call to useActionState.

When you wrap an action with useActionState, it gets an extra argument as its first argument. The submitted form data is therefore its second argument instead of its first as it would usually be. The new first argument that gets added is the current state of the form.

**Examples:**

Example 1 (unknown):
```unknown
const [state, formAction, isPending] = useActionState(fn, initialState, permalink?);
```

Example 2 (javascript):
```javascript
import { useActionState } from "react";async function increment(previousState, formData) {  return previousState + 1;}function StatefulForm({}) {  const [state, formAction] = useActionState(increment, 0);  return (    <form>      {state}      <button formAction={formAction}>Increment</button>    </form>  )}
```

Example 3 (jsx):
```jsx
import { useActionState } from 'react';import { action } from './actions.js';function MyComponent() {  const [state, formAction] = useActionState(action, null);  // ...  return (    <form action={formAction}>      {/* ... */}    </form>  );}
```

Example 4 (javascript):
```javascript
function action(currentState, formData) {  // ...  return 'next state';}
```

---

## useEffectEvent

**URL:** https://react.dev/reference/react/useEffectEvent

**Contents:**
- useEffectEvent
- Reference
  - useEffectEvent(callback)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Reading the latest props and state

useEffectEvent is a React Hook that lets you extract non-reactive logic from your Effects into a reusable function called an Effect Event.

Call useEffectEvent at the top level of your component to declare an Effect Event. Effect Events are functions you can call inside Effects, such as useEffect:

See more examples below.

Returns an Effect Event function. You can call this function inside useEffect, useLayoutEffect, or useInsertionEffect.

Typically, when you access a reactive value inside an Effect, you must include it in the dependency array. This makes sure your Effect runs again whenever that value changes, which is usually the desired behavior.

But in some cases, you may want to read the most recent props or state inside an Effect without causing the Effect to re-run when those values change.

To read the latest props or state in your Effect, without making those values reactive, include them in an Effect Event.

In this example, the Effect should re-run after a render when url changes (to log the new page visit), but it should not re-run when numberOfItems changes. By wrapping the logging logic in an Effect Event, numberOfItems becomes non-reactive. It’s always read from the latest value without triggering the Effect.

You can pass reactive values like url as arguments to the Effect Event to keep them reactive while accessing the latest non-reactive values inside the event.

**Examples:**

Example 1 (javascript):
```javascript
const onSomething = useEffectEvent(callback)
```

Example 2 (javascript):
```javascript
import { useEffectEvent, useEffect } from 'react';function ChatRoom({ roomId, theme }) {  const onConnected = useEffectEvent(() => {    showNotification('Connected!', theme);  });  useEffect(() => {    const connection = createConnection(serverUrl, roomId);    connection.on('connected', () => {      onConnected();    });    connection.connect();    return () => connection.disconnect();  }, [roomId]);  // ...}
```

Example 3 (javascript):
```javascript
import { useEffect, useContext, useEffectEvent } from 'react';function Page({ url }) {  const { items } = useContext(ShoppingCartContext);  const numberOfItems = items.length;  const onNavigate = useEffectEvent((visitedUrl) => {    logVisit(visitedUrl, numberOfItems);  });  useEffect(() => {    onNavigate(url);  }, [url]);  // ...}
```

---

## useLayoutEffect

**URL:** https://react.dev/reference/react/useLayoutEffect

**Contents:**
- useLayoutEffect
  - Pitfall
- Reference
  - useLayoutEffect(setup, dependencies?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Measuring layout before the browser repaints the screen
    - useLayoutEffect vs useEffect

useLayoutEffect can hurt performance. Prefer useEffect when possible.

useLayoutEffect is a version of useEffect that fires before the browser repaints the screen.

Call useLayoutEffect to perform the layout measurements before the browser repaints the screen:

See more examples below.

setup: The function with your Effect’s logic. Your setup function may also optionally return a cleanup function. Before your component commits, React will run your setup function. After every commit with changed dependencies, React will first run the cleanup function (if you provided it) with the old values, and then run your setup function with the new values. Before your component is removed from the DOM, React will run your cleanup function.

optional dependencies: The list of all reactive values referenced inside of the setup code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison. If you omit this argument, your Effect will re-run after every commit of the component.

useLayoutEffect returns undefined.

useLayoutEffect is a Hook, so you can only call it at the top level of your component or your own Hooks. You can’t call it inside loops or conditions. If you need that, extract a component and move the Effect there.

When Strict Mode is on, React will run one extra development-only setup+cleanup cycle before the first real setup. This is a stress-test that ensures that your cleanup logic “mirrors” your setup logic and that it stops or undoes whatever the setup is doing. If this causes a problem, implement the cleanup function.

If some of your dependencies are objects or functions defined inside the component, there is a risk that they will cause the Effect to re-run more often than needed. To fix this, remove unnecessary object and function dependencies. You can also extract state updates and non-reactive logic outside of your Effect.

Effects only run on the client. They don’t run during server rendering.

The code inside useLayoutEffect and all state updates scheduled from it block the browser from repainting the screen. When used excessively, this makes your app slow. When possible, prefer useEffect.

If you trigger a state update inside useLayoutEffect, React will execute all remaining Effects immediately including useEffect.

Most components don’t need to know their position and size on the screen to decide what to render. They only return some JSX. Then the browser calculates their layout (position and size) and repaints the screen.

Sometimes, that’s not enough. Imagine a tooltip that appears next to some element on hover. If there’s enough space, the tooltip should appear above the element, but if it doesn’t fit, it should appear below. In order to render the tooltip at the right final position, you need to know its height (i.e. whether it fits at the top).

To do this, you need to render in two passes:

All of this needs to happen before the browser repaints the screen. You don’t want the user to see the tooltip moving. Call useLayoutEffect to perform the layout measurements before the browser repaints the screen:

Here’s how this works step by step:

Hover over the buttons below and see how the tooltip adjusts its position depending on whether it fits:

Notice that even though the Tooltip component has to render in two passes (first, with tooltipHeight initialized to 0 and then with the real measured height), you only see the final result. This is why you need useLayoutEffect instead of useEffect for this example. Let’s look at the difference in detail below.

React guarantees that the code inside useLayoutEffect and any state updates scheduled inside it will be processed before the browser repaints the screen. This lets you render the tooltip, measure it, and re-render the tooltip again without the user noticing the first extra render. In other words, useLayoutEffect blocks the browser from painting.

Rendering in two passes and blocking the browser hurts performance. Try to avoid this when you can.

The purpose of useLayoutEffect is to let your component use layout information for rendering:

When you or your framework uses server rendering, your React app renders to HTML on the server for the initial render. This lets you show the initial HTML before the JavaScript code loads.

The problem is that on the server, there is no layout information.

In the earlier example, the useLayoutEffect call in the Tooltip component lets it position itself correctly (either above or below content) depending on the content height. If you tried to render Tooltip as a part of the initial server HTML, this would be impossible to determine. On the server, there is no layout yet! So, even if you rendered it on the server, its position would “jump” on the client after the JavaScript loads and runs.

Usually, components that rely on layout information don’t need to render on the server anyway. For example, it probably doesn’t make sense to show a Tooltip during the initial render. It is triggered by a client interaction.

However, if you’re running into this problem, you have a few different options:

Replace useLayoutEffect with useEffect. This tells React that it’s okay to display the initial render result without blocking the paint (because the original HTML will become visible before your Effect runs).

Alternatively, mark your component as client-only. This tells React to replace its content up to the closest <Suspense> boundary with a loading fallback (for example, a spinner or a glimmer) during server rendering.

Alternatively, you can render a component with useLayoutEffect only after hydration. Keep a boolean isMounted state that’s initialized to false, and set it to true inside a useEffect call. Your rendering logic can then be like return isMounted ? <RealContent /> : <FallbackContent />. On the server and during the hydration, the user will see FallbackContent which should not call useLayoutEffect. Then React will replace it with RealContent which runs on the client only and can include useLayoutEffect calls.

If you synchronize your component with an external data store and rely on useLayoutEffect for different reasons than measuring layout, consider useSyncExternalStore instead which supports server rendering.

**Examples:**

Example 1 (unknown):
```unknown
useLayoutEffect(setup, dependencies?)
```

Example 2 (jsx):
```jsx
import { useState, useRef, useLayoutEffect } from 'react';function Tooltip() {  const ref = useRef(null);  const [tooltipHeight, setTooltipHeight] = useState(0);  useLayoutEffect(() => {    const { height } = ref.current.getBoundingClientRect();    setTooltipHeight(height);  }, []);  // ...
```

Example 3 (jsx):
```jsx
function Tooltip() {  const ref = useRef(null);  const [tooltipHeight, setTooltipHeight] = useState(0); // You don't know real height yet  useLayoutEffect(() => {    const { height } = ref.current.getBoundingClientRect();    setTooltipHeight(height); // Re-render now that you know the real height  }, []);  // ...use tooltipHeight in the rendering logic below...}
```

---

## useDebugValue

**URL:** https://react.dev/reference/react/useDebugValue

**Contents:**
- useDebugValue
- Reference
  - useDebugValue(value, format?)
    - Parameters
    - Returns
- Usage
  - Adding a label to a custom Hook
  - Note
  - Deferring formatting of a debug value

useDebugValue is a React Hook that lets you add a label to a custom Hook in React DevTools.

Call useDebugValue at the top level of your custom Hook to display a readable debug value:

See more examples below.

useDebugValue does not return anything.

Call useDebugValue at the top level of your custom Hook to display a readable debug value for React DevTools.

This gives components calling useOnlineStatus a label like OnlineStatus: "Online" when you inspect them:

Without the useDebugValue call, only the underlying data (in this example, true) would be displayed.

Don’t add debug values to every custom Hook. It’s most valuable for custom Hooks that are part of shared libraries and that have a complex internal data structure that’s difficult to inspect.

You can also pass a formatting function as the second argument to useDebugValue:

Your formatting function will receive the debug value as a parameter and should return a formatted display value. When your component is inspected, React DevTools will call this function and display its result.

This lets you avoid running potentially expensive formatting logic unless the component is actually inspected. For example, if date is a Date value, this avoids calling toDateString() on it for every render.

**Examples:**

Example 1 (unknown):
```unknown
useDebugValue(value, format?)
```

Example 2 (javascript):
```javascript
import { useDebugValue } from 'react';function useOnlineStatus() {  // ...  useDebugValue(isOnline ? 'Online' : 'Offline');  // ...}
```

Example 3 (javascript):
```javascript
import { useDebugValue } from 'react';function useOnlineStatus() {  // ...  useDebugValue(isOnline ? 'Online' : 'Offline');  // ...}
```

Example 4 (javascript):
```javascript
useDebugValue(date, date => date.toDateString());
```

---

## useContext

**URL:** https://react.dev/reference/react/useContext

**Contents:**
- useContext
- Reference
  - useContext(SomeContext)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Passing data deeply into the tree
  - Pitfall
  - Updating data passed via context

useContext is a React Hook that lets you read and subscribe to context from your component.

Call useContext at the top level of your component to read and subscribe to context.

See more examples below.

useContext returns the context value for the calling component. It is determined as the value passed to the closest SomeContext above the calling component in the tree. If there is no such provider, then the returned value will be the defaultValue you have passed to createContext for that context. The returned value is always up-to-date. React automatically re-renders components that read some context if it changes.

Call useContext at the top level of your component to read and subscribe to context.

useContext returns the context value for the context you passed. To determine the context value, React searches the component tree and finds the closest context provider above for that particular context.

To pass context to a Button, wrap it or one of its parent components into the corresponding context provider:

It doesn’t matter how many layers of components there are between the provider and the Button. When a Button anywhere inside of Form calls useContext(ThemeContext), it will receive "dark" as the value.

useContext() always looks for the closest provider above the component that calls it. It searches upwards and does not consider providers in the component from which you’re calling useContext().

Often, you’ll want the context to change over time. To update context, combine it with state. Declare a state variable in the parent component, and pass the current state down as the context value to the provider.

Now any Button inside of the provider will receive the current theme value. If you call setTheme to update the theme value that you pass to the provider, all Button components will re-render with the new 'light' value.

In this example, the MyApp component holds a state variable which is then passed to the ThemeContext provider. Checking the “Dark mode” checkbox updates the state. Changing the provided value re-renders all the components using that context.

Note that value="dark" passes the "dark" string, but value={theme} passes the value of the JavaScript theme variable with JSX curly braces. Curly braces also let you pass context values that aren’t strings.

If React can’t find any providers of that particular context in the parent tree, the context value returned by useContext() will be equal to the default value that you specified when you created that context:

The default value never changes. If you want to update context, use it with state as described above.

Often, instead of null, there is some more meaningful value you can use as a default, for example:

This way, if you accidentally render some component without a corresponding provider, it won’t break. This also helps your components work well in a test environment without setting up a lot of providers in the tests.

In the example below, the “Toggle theme” button is always light because it’s outside any theme context provider and the default context theme value is 'light'. Try editing the default theme to be 'dark'.

You can override the context for a part of the tree by wrapping that part in a provider with a different value.

You can nest and override providers as many times as you need.

Here, the button inside the Footer receives a different context value ("light") than the buttons outside ("dark").

You can pass any values via context, including objects and functions.

Here, the context value is a JavaScript object with two properties, one of which is a function. Whenever MyApp re-renders (for example, on a route update), this will be a different object pointing at a different function, so React will also have to re-render all components deep in the tree that call useContext(AuthContext).

In smaller apps, this is not a problem. However, there is no need to re-render them if the underlying data, like currentUser, has not changed. To help React take advantage of that fact, you may wrap the login function with useCallback and wrap the object creation into useMemo. This is a performance optimization:

As a result of this change, even if MyApp needs to re-render, the components calling useContext(AuthContext) won’t need to re-render unless currentUser has changed.

Read more about useMemo and useCallback.

There are a few common ways that this can happen:

You might have a provider without a value in the tree:

If you forget to specify value, it’s like passing value={undefined}.

You may have also mistakingly used a different prop name by mistake:

In both of these cases you should see a warning from React in the console. To fix them, call the prop value:

Note that the default value from your createContext(defaultValue) call is only used if there is no matching provider above at all. If there is a <SomeContext value={undefined}> component somewhere in the parent tree, the component calling useContext(SomeContext) will receive undefined as the context value.

**Examples:**

Example 1 (javascript):
```javascript
const value = useContext(SomeContext)
```

Example 2 (javascript):
```javascript
import { useContext } from 'react';function MyComponent() {  const theme = useContext(ThemeContext);  // ...
```

Example 3 (javascript):
```javascript
import { useContext } from 'react';function Button() {  const theme = useContext(ThemeContext);  // ...
```

Example 4 (jsx):
```jsx
function MyPage() {  return (    <ThemeContext value="dark">      <Form />    </ThemeContext>  );}function Form() {  // ... renders buttons inside ...}
```

---

## useOptimistic

**URL:** https://react.dev/reference/react/useOptimistic

**Contents:**
- useOptimistic
- Reference
  - useOptimistic(state, updateFn)
    - Parameters
    - Returns
- Usage
  - Optimistically updating forms

useOptimistic is a React Hook that lets you optimistically update the UI.

useOptimistic is a React Hook that lets you show a different state while an async action is underway. It accepts some state as an argument and returns a copy of that state that can be different during the duration of an async action such as a network request. You provide a function that takes the current state and the input to the action, and returns the optimistic state to be used while the action is pending.

This state is called the “optimistic” state because it is usually used to immediately present the user with the result of performing an action, even though the action actually takes time to complete.

See more examples below.

The useOptimistic Hook provides a way to optimistically update the user interface before a background operation, like a network request, completes. In the context of forms, this technique helps to make apps feel more responsive. When a user submits a form, instead of waiting for the server’s response to reflect the changes, the interface is immediately updated with the expected outcome.

For example, when a user types a message into the form and hits the “Send” button, the useOptimistic Hook allows the message to immediately appear in the list with a “Sending…” label, even before the message is actually sent to a server. This “optimistic” approach gives the impression of speed and responsiveness. The form then attempts to truly send the message in the background. Once the server confirms the message has been received, the “Sending…” label is removed.

**Examples:**

Example 1 (unknown):
```unknown
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);
```

Example 2 (javascript):
```javascript
import { useOptimistic } from 'react';function AppContainer() {  const [optimisticState, addOptimistic] = useOptimistic(    state,    // updateFn    (currentState, optimisticValue) => {      // merge and return new state      // with optimistic value    }  );}
```

---

## exhaustive-deps

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps

**Contents:**
- exhaustive-deps
- Rule Details
- Common Violations
  - Invalid
  - Valid
- Troubleshooting
  - Adding a function dependency causes infinite loops
  - Running an effect only once
- Options

Validates that dependency arrays for React hooks contain all necessary dependencies.

React hooks like useEffect, useMemo, and useCallback accept dependency arrays. When a value referenced inside these hooks isn’t included in the dependency array, React won’t re-run the effect or recalculate the value when that dependency changes. This causes stale closures where the hook uses outdated values.

This error often happens when you try to “trick” React about dependencies to control when an effect runs. Effects should synchronize your component with external systems. The dependency array tells React which values the effect uses, so React knows when to re-synchronize.

If you find yourself fighting with the linter, you likely need to restructure your code. See Removing Effect Dependencies to learn how.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You have an effect, but you’re creating a new function on every render:

In most cases, you don’t need the effect. Call the function where the action happens instead:

If you genuinely need the effect (for example, to subscribe to something external), make the dependency stable:

You want to run an effect once on mount, but the linter complains about missing dependencies:

Either include the dependency (recommended) or use a ref if you truly need to run once:

You can configure custom effect hooks using shared ESLint settings (available in eslint-plugin-react-hooks 6.1.1 and later):

For backward compatibility, this rule also accepts a rule-level option:

**Examples:**

Example 1 (javascript):
```javascript
// ❌ Missing dependencyuseEffect(() => {  console.log(count);}, []); // Missing 'count'// ❌ Missing propuseEffect(() => {  fetchUser(userId);}, []); // Missing 'userId'// ❌ Incomplete dependenciesuseMemo(() => {  return items.sort(sortOrder);}, [items]); // Missing 'sortOrder'
```

Example 2 (javascript):
```javascript
// ✅ All dependencies includeduseEffect(() => {  console.log(count);}, [count]);// ✅ All dependencies includeduseEffect(() => {  fetchUser(userId);}, [userId]);
```

Example 3 (jsx):
```jsx
// ❌ Causes infinite loopconst logItems = () => {  console.log(items);};useEffect(() => {  logItems();}, [logItems]); // Infinite loop!
```

Example 4 (jsx):
```jsx
// ✅ Call it from the event handlerconst logItems = () => {  console.log(items);};return <button onClick={logItems}>Log</button>;// ✅ Or derive during render if there's no side effectitems.forEach(item => {  console.log(item);});
```

---

## useId

**URL:** https://react.dev/reference/react/useId

**Contents:**
- useId
- Reference
  - useId()
    - Parameters
    - Returns
    - Caveats
- Usage
  - Pitfall
  - Generating unique IDs for accessibility attributes
  - Pitfall

useId is a React Hook for generating unique IDs that can be passed to accessibility attributes.

Call useId at the top level of your component to generate a unique ID:

See more examples below.

useId does not take any parameters.

useId returns a unique ID string associated with this particular useId call in this particular component.

useId is a Hook, so you can only call it at the top level of your component or your own Hooks. You can’t call it inside loops or conditions. If you need that, extract a new component and move the state into it.

useId should not be used to generate keys in a list. Keys should be generated from your data.

useId currently cannot be used in async Server Components.

Do not call useId to generate keys in a list. Keys should be generated from your data.

Call useId at the top level of your component to generate a unique ID:

You can then pass the generated ID to different attributes:

Let’s walk through an example to see when this is useful.

HTML accessibility attributes like aria-describedby let you specify that two tags are related to each other. For example, you can specify that an element (like an input) is described by another element (like a paragraph).

In regular HTML, you would write it like this:

However, hardcoding IDs like this is not a good practice in React. A component may be rendered more than once on the page—but IDs have to be unique! Instead of hardcoding an ID, generate a unique ID with useId:

Now, even if PasswordField appears multiple times on the screen, the generated IDs won’t clash.

Watch this video to see the difference in the user experience with assistive technologies.

With server rendering, useId requires an identical component tree on the server and the client. If the trees you render on the server and the client don’t match exactly, the generated IDs won’t match.

You might be wondering why useId is better than incrementing a global variable like nextId++.

The primary benefit of useId is that React ensures that it works with server rendering. During server rendering, your components generate HTML output. Later, on the client, hydration attaches your event handlers to the generated HTML. For hydration to work, the client output must match the server HTML.

This is very difficult to guarantee with an incrementing counter because the order in which the Client Components are hydrated may not match the order in which the server HTML was emitted. By calling useId, you ensure that hydration will work, and the output will match between the server and the client.

Inside React, useId is generated from the “parent path” of the calling component. This is why, if the client and the server tree are the same, the “parent path” will match up regardless of rendering order.

If you need to give IDs to multiple related elements, you can call useId to generate a shared prefix for them:

This lets you avoid calling useId for every single element that needs a unique ID.

If you render multiple independent React applications on a single page, pass identifierPrefix as an option to your createRoot or hydrateRoot calls. This ensures that the IDs generated by the two different apps never clash because every identifier generated with useId will start with the distinct prefix you’ve specified.

If you render multiple independent React apps on the same page, and some of these apps are server-rendered, make sure that the identifierPrefix you pass to the hydrateRoot call on the client side is the same as the identifierPrefix you pass to the server APIs such as renderToPipeableStream.

You do not need to pass identifierPrefix if you only have one React app on the page.

**Examples:**

Example 1 (javascript):
```javascript
const id = useId()
```

Example 2 (javascript):
```javascript
import { useId } from 'react';function PasswordField() {  const passwordHintId = useId();  // ...
```

Example 3 (javascript):
```javascript
import { useId } from 'react';function PasswordField() {  const passwordHintId = useId();  // ...
```

Example 4 (jsx):
```jsx
<>  <input type="password" aria-describedby={passwordHintId} />  <p id={passwordHintId}></>
```

---

## use-memo

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/use-memo

**Contents:**
- use-memo
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - I need to run side effects when dependencies change

Validates that the useMemo hook is used with a return value. See useMemo docs for more information.

useMemo is for computing and caching expensive values, not for side effects. Without a return value, useMemo returns undefined, which defeats its purpose and likely indicates you’re using the wrong hook.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You might try to use useMemo for side effects:

If the side effect needs to happen in response to user interaction, it’s best to colocate the side effect with the event:

If the side effect sychronizes React state with some external state (or vice versa), use useEffect:

**Examples:**

Example 1 (javascript):
```javascript
// ❌ No return valuefunction Component({ data }) {  const processed = useMemo(() => {    data.forEach(item => console.log(item));    // Missing return!  }, [data]);  return <div>{processed}</div>; // Always undefined}
```

Example 2 (jsx):
```jsx
// ✅ Returns computed valuefunction Component({ data }) {  const processed = useMemo(() => {    return data.map(item => item * 2);  }, [data]);  return <div>{processed}</div>;}
```

Example 3 (jsx):
```jsx
// ❌ Wrong: Side effects in useMemofunction Component({user}) {  // No return value, just side effect  useMemo(() => {    analytics.track('UserViewed', {userId: user.id});  }, [user.id]);  // Not assigned to a variable  useMemo(() => {    return analytics.track('UserViewed', {userId: user.id});  }, [user.id]);}
```

Example 4 (jsx):
```jsx
// ✅ Good: Side effects in event handlersfunction Component({user}) {  const handleClick = () => {    analytics.track('ButtonClicked', {userId: user.id});    // Other click logic...  };  return <button onClick={handleClick}>Click me</button>;}
```

---

## useCallback

**URL:** https://react.dev/reference/react/useCallback

**Contents:**
- useCallback
  - Note
- Reference
  - useCallback(fn, dependencies)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Skipping re-rendering of components
  - Note

useCallback is a React Hook that lets you cache a function definition between re-renders.

React Compiler automatically memoizes values and functions, reducing the need for manual useCallback calls. You can use the compiler to handle memoization automatically.

Call useCallback at the top level of your component to cache a function definition between re-renders:

See more examples below.

fn: The function value that you want to cache. It can take any arguments and return any values. React will return (not call!) your function back to you during the initial render. On next renders, React will give you the same function again if the dependencies have not changed since the last render. Otherwise, it will give you the function that you have passed during the current render, and store it in case it can be reused later. React will not call your function. The function is returned to you so you can decide when and whether to call it.

dependencies: The list of all reactive values referenced inside of the fn code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison algorithm.

On the initial render, useCallback returns the fn function you have passed.

During subsequent renders, it will either return an already stored fn function from the last render (if the dependencies haven’t changed), or return the fn function you have passed during this render.

When you optimize rendering performance, you will sometimes need to cache the functions that you pass to child components. Let’s first look at the syntax for how to do this, and then see in which cases it’s useful.

To cache a function between re-renders of your component, wrap its definition into the useCallback Hook:

You need to pass two things to useCallback:

On the initial render, the returned function you’ll get from useCallback will be the function you passed.

On the following renders, React will compare the dependencies with the dependencies you passed during the previous render. If none of the dependencies have changed (compared with Object.is), useCallback will return the same function as before. Otherwise, useCallback will return the function you passed on this render.

In other words, useCallback caches a function between re-renders until its dependencies change.

Let’s walk through an example to see when this is useful.

Say you’re passing a handleSubmit function down from the ProductPage to the ShippingForm component:

You’ve noticed that toggling the theme prop freezes the app for a moment, but if you remove <ShippingForm /> from your JSX, it feels fast. This tells you that it’s worth trying to optimize the ShippingForm component.

By default, when a component re-renders, React re-renders all of its children recursively. This is why, when ProductPage re-renders with a different theme, the ShippingForm component also re-renders. This is fine for components that don’t require much calculation to re-render. But if you verified a re-render is slow, you can tell ShippingForm to skip re-rendering when its props are the same as on last render by wrapping it in memo:

With this change, ShippingForm will skip re-rendering if all of its props are the same as on the last render. This is when caching a function becomes important! Let’s say you defined handleSubmit without useCallback:

In JavaScript, a function () {} or () => {} always creates a different function, similar to how the {} object literal always creates a new object. Normally, this wouldn’t be a problem, but it means that ShippingForm props will never be the same, and your memo optimization won’t work. This is where useCallback comes in handy:

By wrapping handleSubmit in useCallback, you ensure that it’s the same function between the re-renders (until dependencies change). You don’t have to wrap a function in useCallback unless you do it for some specific reason. In this example, the reason is that you pass it to a component wrapped in memo, and this lets it skip re-rendering. There are other reasons you might need useCallback which are described further on this page.

You should only rely on useCallback as a performance optimization. If your code doesn’t work without it, find the underlying problem and fix it first. Then you may add useCallback back.

You will often see useMemo alongside useCallback. They are both useful when you’re trying to optimize a child component. They let you memoize (or, in other words, cache) something you’re passing down:

The difference is in what they’re letting you cache:

If you’re already familiar with useMemo, you might find it helpful to think of useCallback as this:

Read more about the difference between useMemo and useCallback.

If your app is like this site, and most interactions are coarse (like replacing a page or an entire section), memoization is usually unnecessary. On the other hand, if your app is more like a drawing editor, and most interactions are granular (like moving shapes), then you might find memoization very helpful.

Caching a function with useCallback is only valuable in a few cases:

There is no benefit to wrapping a function in useCallback in other cases. There is no significant harm to doing that either, so some teams choose to not think about individual cases, and memoize as much as possible. The downside is that code becomes less readable. Also, not all memoization is effective: a single value that’s “always new” is enough to break memoization for an entire component.

Note that useCallback does not prevent creating the function. You’re always creating a function (and that’s fine!), but React ignores it and gives you back a cached function if nothing changed.

In practice, you can make a lot of memoization unnecessary by following a few principles:

If a specific interaction still feels laggy, use the React Developer Tools profiler to see which components benefit the most from memoization, and add memoization where needed. These principles make your components easier to debug and understand, so it’s good to follow them in any case. In long term, we’re researching doing memoization automatically to solve this once and for all.

In this example, the ShippingForm component is artificially slowed down so that you can see what happens when a React component you’re rendering is genuinely slow. Try incrementing the counter and toggling the theme.

Incrementing the counter feels slow because it forces the slowed down ShippingForm to re-render. That’s expected because the counter has changed, and so you need to reflect the user’s new choice on the screen.

Next, try toggling the theme. Thanks to useCallback together with memo, it’s fast despite the artificial slowdown! ShippingForm skipped re-rendering because the handleSubmit function has not changed. The handleSubmit function has not changed because both productId and referrer (your useCallback dependencies) haven’t changed since last render.

Sometimes, you might need to update state based on previous state from a memoized callback.

This handleAddTodo function specifies todos as a dependency because it computes the next todos from it:

You’ll usually want memoized functions to have as few dependencies as possible. When you read some state only to calculate the next state, you can remove that dependency by passing an updater function instead:

Here, instead of making todos a dependency and reading it inside, you pass an instruction about how to update the state (todos => [...todos, newTodo]) to React. Read more about updater functions.

Sometimes, you might want to call a function from inside an Effect:

This creates a problem. Every reactive value must be declared as a dependency of your Effect. However, if you declare createOptions as a dependency, it will cause your Effect to constantly reconnect to the chat room:

To solve this, you can wrap the function you need to call from an Effect into useCallback:

This ensures that the createOptions function is the same between re-renders if the roomId is the same. However, it’s even better to remove the need for a function dependency. Move your function inside the Effect:

Now your code is simpler and doesn’t need useCallback. Learn more about removing Effect dependencies.

If you’re writing a custom Hook, it’s recommended to wrap any functions that it returns into useCallback:

This ensures that the consumers of your Hook can optimize their own code when needed.

Make sure you’ve specified the dependency array as a second argument!

If you forget the dependency array, useCallback will return a new function every time:

This is the corrected version passing the dependency array as a second argument:

If this doesn’t help, then the problem is that at least one of your dependencies is different from the previous render. You can debug this problem by manually logging your dependencies to the console:

You can then right-click on the arrays from different re-renders in the console and select “Store as a global variable” for both of them. Assuming the first one got saved as temp1 and the second one got saved as temp2, you can then use the browser console to check whether each dependency in both arrays is the same:

When you find which dependency is breaking memoization, either find a way to remove it, or memoize it as well.

Suppose the Chart component is wrapped in memo. You want to skip re-rendering every Chart in the list when the ReportList component re-renders. However, you can’t call useCallback in a loop:

Instead, extract a component for an individual item, and put useCallback there:

Alternatively, you could remove useCallback in the last snippet and instead wrap Report itself in memo. If the item prop does not change, Report will skip re-rendering, so Chart will skip re-rendering too:

**Examples:**

Example 1 (jsx):
```jsx
const cachedFn = useCallback(fn, dependencies)
```

Example 2 (javascript):
```javascript
import { useCallback } from 'react';export default function ProductPage({ productId, referrer, theme }) {  const handleSubmit = useCallback((orderDetails) => {    post('/product/' + productId + '/buy', {      referrer,      orderDetails,    });  }, [productId, referrer]);
```

Example 3 (javascript):
```javascript
import { useCallback } from 'react';function ProductPage({ productId, referrer, theme }) {  const handleSubmit = useCallback((orderDetails) => {    post('/product/' + productId + '/buy', {      referrer,      orderDetails,    });  }, [productId, referrer]);  // ...
```

Example 4 (jsx):
```jsx
function ProductPage({ productId, referrer, theme }) {  // ...  return (    <div className={theme}>      <ShippingForm onSubmit={handleSubmit} />    </div>  );
```

---

## use no memo

**URL:** https://react.dev/reference/react-compiler/directives/use-no-memo

**Contents:**
- use no memo
- Reference
  - "use no memo"
    - Caveats
  - How "use no memo" opts-out of optimization
  - When to use "use no memo"
    - Debugging compiler issues
    - Third-party library integration
- Usage
- Troubleshooting

"use no memo" prevents a function from being optimized by React Compiler.

Add "use no memo" at the beginning of a function to prevent React Compiler optimization.

When a function contains "use no memo", the React Compiler will skip it entirely during optimization. This is useful as a temporary escape hatch when debugging or when dealing with code that doesn’t work correctly with the compiler.

React Compiler analyzes your code at build time to apply optimizations. "use no memo" creates an explicit boundary that tells the compiler to skip a function entirely.

This directive takes precedence over all other settings:

The compiler treats these functions as if the React Compiler wasn’t enabled, leaving them exactly as written.

"use no memo" should be used sparingly and temporarily. Common scenarios include:

When you suspect the compiler is causing issues, temporarily disable optimization to isolate the problem:

When integrating with libraries that might not be compatible with the compiler:

The "use no memo" directive is placed at the beginning of a function body to prevent React Compiler from optimizing that function:

The directive can also be placed at the top of a file to affect all functions in that module:

"use no memo" at the function level overrides the module level directive.

If "use no memo" isn’t working:

Always document why you’re disabling optimization:

**Examples:**

Example 1 (javascript):
```javascript
function MyComponent() {  "use no memo";  // ...}
```

Example 2 (javascript):
```javascript
function ProblematicComponent({ data }) {  "use no memo"; // TODO: Remove after fixing issue #123  // Rules of React violations that weren't statically detected  // ...}
```

Example 3 (javascript):
```javascript
function ThirdPartyWrapper() {  "use no memo";  useThirdPartyHook(); // Has side effects that compiler might optimize incorrectly  // ...}
```

Example 4 (javascript):
```javascript
function MyComponent() {  "use no memo";  // Function body}
```

---

## use

**URL:** https://react.dev/reference/react/use

**Contents:**
- use
- Reference
  - use(resource)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Reading context with use
  - Pitfall
  - Streaming data from the server to the client

use is a React API that lets you read the value of a resource like a Promise or context.

Call use in your component to read the value of a resource like a Promise or context.

Unlike React Hooks, use can be called within loops and conditional statements like if. Like React Hooks, the function that calls use must be a Component or Hook.

When called with a Promise, the use API integrates with Suspense and Error Boundaries. The component calling use suspends while the Promise passed to use is pending. If the component that calls use is wrapped in a Suspense boundary, the fallback will be displayed. Once the Promise is resolved, the Suspense fallback is replaced by the rendered components using the data returned by the use API. If the Promise passed to use is rejected, the fallback of the nearest Error Boundary will be displayed.

See more examples below.

The use API returns the value that was read from the resource like the resolved value of a Promise or context.

When a context is passed to use, it works similarly to useContext. While useContext must be called at the top level of your component, use can be called inside conditionals like if and loops like for. use is preferred over useContext because it is more flexible.

use returns the context value for the context you passed. To determine the context value, React searches the component tree and finds the closest context provider above for that particular context.

To pass context to a Button, wrap it or one of its parent components into the corresponding context provider.

It doesn’t matter how many layers of components there are between the provider and the Button. When a Button anywhere inside of Form calls use(ThemeContext), it will receive "dark" as the value.

Unlike useContext, use can be called in conditionals and loops like if.

use is called from inside a if statement, allowing you to conditionally read values from a Context.

Like useContext, use(context) always looks for the closest context provider above the component that calls it. It searches upwards and does not consider context providers in the component from which you’re calling use(context).

Data can be streamed from the server to the client by passing a Promise as a prop from a Server Component to a Client Component.

The Client Component then takes the Promise it received as a prop and passes it to the use API. This allows the Client Component to read the value from the Promise that was initially created by the Server Component.

Because Message is wrapped in Suspense, the fallback will be displayed until the Promise is resolved. When the Promise is resolved, the value will be read by the use API and the Message component will replace the Suspense fallback.

When passing a Promise from a Server Component to a Client Component, its resolved value must be serializable to pass between server and client. Data types like functions aren’t serializable and cannot be the resolved value of such a Promise.

A Promise can be passed from a Server Component to a Client Component and resolved in the Client Component with the use API. You can also resolve the Promise in a Server Component with await and pass the required data to the Client Component as a prop.

But using await in a Server Component will block its rendering until the await statement is finished. Passing a Promise from a Server Component to a Client Component prevents the Promise from blocking the rendering of the Server Component.

In some cases a Promise passed to use could be rejected. You can handle rejected Promises by either:

use cannot be called in a try-catch block. Instead of a try-catch block wrap your component in an Error Boundary, or provide an alternative value to use with the Promise’s .catch method.

If you’d like to display an error to your users when a Promise is rejected, you can use an Error Boundary. To use an Error Boundary, wrap the component where you are calling the use API in an Error Boundary. If the Promise passed to use is rejected the fallback for the Error Boundary will be displayed.

If you’d like to provide an alternative value when the Promise passed to use is rejected you can use the Promise’s catch method.

To use the Promise’s catch method, call catch on the Promise object. catch takes a single argument: a function that takes an error message as an argument. Whatever is returned by the function passed to catch will be used as the resolved value of the Promise.

You are either calling use outside of a React Component or Hook function, or calling use in a try–catch block. If you are calling use inside a try–catch block, wrap your component in an Error Boundary, or call the Promise’s catch to catch the error and resolve the Promise with another value. See these examples.

If you are calling use outside a React Component or Hook function, move the use call to a React Component or Hook function.

Instead, call use outside any component closures, where the function that calls use is a Component or Hook.

**Examples:**

Example 1 (javascript):
```javascript
const value = use(resource);
```

Example 2 (javascript):
```javascript
import { use } from 'react';function MessageComponent({ messagePromise }) {  const message = use(messagePromise);  const theme = use(ThemeContext);  // ...
```

Example 3 (javascript):
```javascript
import { use } from 'react';function Button() {  const theme = use(ThemeContext);  // ...
```

Example 4 (jsx):
```jsx
function MyPage() {  return (    <ThemeContext value="dark">      <Form />    </ThemeContext>  );}function Form() {  // ... renders buttons inside ...}
```

---

## immutability

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability

**Contents:**
- immutability
- Rule Details
- Common Violations
  - Invalid
  - Valid
- Troubleshooting
  - I need to add items to an array
  - I need to update nested objects

Validates against mutating props, state, and other values that are immutable.

A component’s props and state are immutable snapshots. Never mutate them directly. Instead, pass new props down, and use the setter function from useState.

Mutating arrays with methods like push() won’t trigger re-renders:

Create a new array instead:

Mutating nested properties doesn’t trigger re-renders:

Spread at each level that needs updating:

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Array push mutationfunction Component() {  const [items, setItems] = useState([1, 2, 3]);  const addItem = () => {    items.push(4); // Mutating!    setItems(items); // Same reference, no re-render  };}// ❌ Object property assignmentfunction Component() {  const [user, setUser] = useState({name: 'Alice'});  const updateName = () => {    user.name = 'Bob'; // Mutating!    setUser(user); // Same reference  };}// ❌ Sort without spreadingfunction Component() {  const [items, setItems] = useState([3, 1, 2]);  const sortItems = () => {    setItems(items.sort()); // sort mutates!  };}
```

Example 2 (jsx):
```jsx
// ✅ Create new arrayfunction Component() {  const [items, setItems] = useState([1, 2, 3]);  const addItem = () => {    setItems([...items, 4]); // New array  };}// ✅ Create new objectfunction Component() {  const [user, setUser] = useState({name: 'Alice'});  const updateName = () => {    setUser({...user, name: 'Bob'}); // New object  };}
```

Example 3 (jsx):
```jsx
// ❌ Wrong: Mutating the arrayfunction TodoList() {  const [todos, setTodos] = useState([]);  const addTodo = (id, text) => {    todos.push({id, text});    setTodos(todos); // Same array reference!  };  return (    <ul>      {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}    </ul>  );}
```

Example 4 (jsx):
```jsx
// ✅ Better: Create a new arrayfunction TodoList() {  const [todos, setTodos] = useState([]);  const addTodo = (id, text) => {    setTodos([...todos, {id, text}]);    // Or: setTodos(todos => [...todos, {id: Date.now(), text}])  };  return (    <ul>      {todos.map(todo => <li key={todo.id}>{todo.text}</li>)}    </ul>  );}
```

---

## createContext

**URL:** https://react.dev/reference/react/createContext

**Contents:**
- createContext
- Reference
  - createContext(defaultValue)
    - Parameters
    - Returns
  - SomeContext Provider
  - Note
    - Props
  - SomeContext.Consumer
    - Props

createContext lets you create a context that components can provide or read.

Call createContext outside of any components to create a context.

See more examples below.

createContext returns a context object.

The context object itself does not hold any information. It represents which context other components read or provide. Typically, you will use SomeContext in components above to specify the context value, and call useContext(SomeContext) in components below to read it. The context object has a few properties:

Wrap your components into a context provider to specify the value of this context for all components inside:

Starting in React 19, you can render <SomeContext> as a provider.

In older versions of React, use <SomeContext.Provider>.

Before useContext existed, there was an older way to read context:

Although this older way still works, newly written code should read context with useContext() instead:

Context lets components pass information deep down without explicitly passing props.

Call createContext outside any components to create one or more contexts.

createContext returns a context object. Components can read context by passing it to useContext():

By default, the values they receive will be the default values you have specified when creating the contexts. However, by itself this isn’t useful because the default values never change.

Context is useful because you can provide other, dynamic values from your components:

Now the Page component and any components inside it, no matter how deep, will “see” the passed context values. If the passed context values change, React will re-render the components reading the context as well.

Read more about reading and providing context and see examples.

Often, components in different files will need access to the same context. This is why it’s common to declare contexts in a separate file. Then you can use the export statement to make context available for other files:

Components declared in other files can then use the import statement to read or provide this context:

This works similar to importing and exporting components.

Code like this specifies the default context value:

This value never changes. React only uses this value as a fallback if it can’t find a matching provider above.

To make context change over time, add state and wrap components in a context provider.

**Examples:**

Example 1 (javascript):
```javascript
const SomeContext = createContext(defaultValue)
```

Example 2 (sql):
```sql
import { createContext } from 'react';const ThemeContext = createContext('light');
```

Example 3 (jsx):
```jsx
function App() {  const [theme, setTheme] = useState('light');  // ...  return (    <ThemeContext value={theme}>      <Page />    </ThemeContext>  );}
```

Example 4 (jsx):
```jsx
function Button() {  // 🟡 Legacy way (not recommended)  return (    <ThemeContext.Consumer>      {theme => (        <button className={theme} />      )}    </ThemeContext.Consumer>  );}
```

---

## useImperativeHandle

**URL:** https://react.dev/reference/react/useImperativeHandle

**Contents:**
- useImperativeHandle
- Reference
  - useImperativeHandle(ref, createHandle, dependencies?)
    - Parameters
  - Note
    - Returns
- Usage
  - Exposing a custom ref handle to the parent component
  - Exposing your own imperative methods
  - Pitfall

useImperativeHandle is a React Hook that lets you customize the handle exposed as a ref.

Call useImperativeHandle at the top level of your component to customize the ref handle it exposes:

See more examples below.

ref: The ref you received as a prop to the MyInput component.

createHandle: A function that takes no arguments and returns the ref handle you want to expose. That ref handle can have any type. Usually, you will return an object with the methods you want to expose.

optional dependencies: The list of all reactive values referenced inside of the createHandle code. Reactive values include props, state, and all the variables and functions declared directly inside your component body. If your linter is configured for React, it will verify that every reactive value is correctly specified as a dependency. The list of dependencies must have a constant number of items and be written inline like [dep1, dep2, dep3]. React will compare each dependency with its previous value using the Object.is comparison. If a re-render resulted in a change to some dependency, or if you omitted this argument, your createHandle function will re-execute, and the newly created handle will be assigned to the ref.

Starting with React 19, ref is available as a prop. In React 18 and earlier, it was necessary to get the ref from forwardRef.

useImperativeHandle returns undefined.

To expose a DOM node to the parent element, pass in the ref prop to the node.

With the code above, a ref to MyInput will receive the <input> DOM node. However, you can expose a custom value instead. To customize the exposed handle, call useImperativeHandle at the top level of your component:

Note that in the code above, the ref is no longer passed to the <input>.

For example, suppose you don’t want to expose the entire <input> DOM node, but you want to expose two of its methods: focus and scrollIntoView. To do this, keep the real browser DOM in a separate ref. Then use useImperativeHandle to expose a handle with only the methods that you want the parent component to call:

Now, if the parent component gets a ref to MyInput, it will be able to call the focus and scrollIntoView methods on it. However, it will not have full access to the underlying <input> DOM node.

The methods you expose via an imperative handle don’t have to match the DOM methods exactly. For example, this Post component exposes a scrollAndFocusAddComment method via an imperative handle. This lets the parent Page scroll the list of comments and focus the input field when you click the button:

Do not overuse refs. You should only use refs for imperative behaviors that you can’t express as props: for example, scrolling to a node, focusing a node, triggering an animation, selecting text, and so on.

If you can express something as a prop, you should not use a ref. For example, instead of exposing an imperative handle like { open, close } from a Modal component, it is better to take isOpen as a prop like <Modal isOpen={isOpen} />. Effects can help you expose imperative behaviors via props.

**Examples:**

Example 1 (unknown):
```unknown
useImperativeHandle(ref, createHandle, dependencies?)
```

Example 2 (javascript):
```javascript
import { useImperativeHandle } from 'react';function MyInput({ ref }) {  useImperativeHandle(ref, () => {    return {      // ... your methods ...    };  }, []);  // ...
```

Example 3 (jsx):
```jsx
function MyInput({ ref }) {  return <input ref={ref} />;};
```

Example 4 (jsx):
```jsx
import { useImperativeHandle } from 'react';function MyInput({ ref }) {  useImperativeHandle(ref, () => {    return {      // ... your methods ...    };  }, []);  return <input />;};
```

---

## useState

**URL:** https://react.dev/reference/react/useState

**Contents:**
- useState
- Reference
  - useState(initialState)
    - Parameters
    - Returns
    - Caveats
  - set functions, like setSomething(nextState)
    - Parameters
    - Returns
    - Caveats

useState is a React Hook that lets you add a state variable to your component.

Call useState at the top level of your component to declare a state variable.

The convention is to name state variables like [something, setSomething] using array destructuring.

See more examples below.

useState returns an array with exactly two values:

The set function returned by useState lets you update the state to a different value and trigger a re-render. You can pass the next state directly, or a function that calculates it from the previous state:

set functions do not have a return value.

The set function only updates the state variable for the next render. If you read the state variable after calling the set function, you will still get the old value that was on the screen before your call.

If the new value you provide is identical to the current state, as determined by an Object.is comparison, React will skip re-rendering the component and its children. This is an optimization. Although in some cases React may still need to call your component before skipping the children, it shouldn’t affect your code.

React batches state updates. It updates the screen after all the event handlers have run and have called their set functions. This prevents multiple re-renders during a single event. In the rare case that you need to force React to update the screen earlier, for example to access the DOM, you can use flushSync.

The set function has a stable identity, so you will often see it omitted from Effect dependencies, but including it will not cause the Effect to fire. If the linter lets you omit a dependency without errors, it is safe to do. Learn more about removing Effect dependencies.

Calling the set function during rendering is only allowed from within the currently rendering component. React will discard its output and immediately attempt to render it again with the new state. This pattern is rarely needed, but you can use it to store information from the previous renders. See an example below.

In Strict Mode, React will call your updater function twice in order to help you find accidental impurities. This is development-only behavior and does not affect production. If your updater function is pure (as it should be), this should not affect the behavior. The result from one of the calls will be ignored.

Call useState at the top level of your component to declare one or more state variables.

The convention is to name state variables like [something, setSomething] using array destructuring.

useState returns an array with exactly two items:

To update what’s on the screen, call the set function with some next state:

React will store the next state, render your component again with the new values, and update the UI.

Calling the set function does not change the current state in the already executing code:

It only affects what useState will return starting from the next render.

In this example, the count state variable holds a number. Clicking the button increments it.

Suppose the age is 42. This handler calls setAge(age + 1) three times:

However, after one click, age will only be 43 rather than 45! This is because calling the set function does not update the age state variable in the already running code. So each setAge(age + 1) call becomes setAge(43).

To solve this problem, you may pass an updater function to setAge instead of the next state:

Here, a => a + 1 is your updater function. It takes the pending state and calculates the next state from it.

React puts your updater functions in a queue. Then, during the next render, it will call them in the same order:

There are no other queued updates, so React will store 45 as the current state in the end.

By convention, it’s common to name the pending state argument for the first letter of the state variable name, like a for age. However, you may also call it like prevAge or something else that you find clearer.

React may call your updaters twice in development to verify that they are pure.

You might hear a recommendation to always write code like setAge(a => a + 1) if the state you’re setting is calculated from the previous state. There is no harm in it, but it is also not always necessary.

In most cases, there is no difference between these two approaches. React always makes sure that for intentional user actions, like clicks, the age state variable would be updated before the next click. This means there is no risk of a click handler seeing a “stale” age at the beginning of the event handler.

However, if you do multiple updates within the same event, updaters can be helpful. They’re also helpful if accessing the state variable itself is inconvenient (you might run into this when optimizing re-renders).

If you prefer consistency over slightly more verbose syntax, it’s reasonable to always write an updater if the state you’re setting is calculated from the previous state. If it’s calculated from the previous state of some other state variable, you might want to combine them into one object and use a reducer.

This example passes the updater function, so the “+3” button works.

You can put objects and arrays into state. In React, state is considered read-only, so you should replace it rather than mutate your existing objects. For example, if you have a form object in state, don’t mutate it:

Instead, replace the whole object by creating a new one:

Read updating objects in state and updating arrays in state to learn more.

In this example, the form state variable holds an object. Each input has a change handler that calls setForm with the next state of the entire form. The { ...form } spread syntax ensures that the state object is replaced rather than mutated.

React saves the initial state once and ignores it on the next renders.

Although the result of createInitialTodos() is only used for the initial render, you’re still calling this function on every render. This can be wasteful if it’s creating large arrays or performing expensive calculations.

To solve this, you may pass it as an initializer function to useState instead:

Notice that you’re passing createInitialTodos, which is the function itself, and not createInitialTodos(), which is the result of calling it. If you pass a function to useState, React will only call it during initialization.

React may call your initializers twice in development to verify that they are pure.

This example passes the initializer function, so the createInitialTodos function only runs during initialization. It does not run when component re-renders, such as when you type into the input.

You’ll often encounter the key attribute when rendering lists. However, it also serves another purpose.

You can reset a component’s state by passing a different key to a component. In this example, the Reset button changes the version state variable, which we pass as a key to the Form. When the key changes, React re-creates the Form component (and all of its children) from scratch, so its state gets reset.

Read preserving and resetting state to learn more.

Usually, you will update state in event handlers. However, in rare cases you might want to adjust state in response to rendering — for example, you might want to change a state variable when a prop changes.

In most cases, you don’t need this:

In the rare case that none of these apply, there is a pattern you can use to update state based on the values that have been rendered so far, by calling a set function while your component is rendering.

Here’s an example. This CountLabel component displays the count prop passed to it:

Say you want to show whether the counter has increased or decreased since the last change. The count prop doesn’t tell you this — you need to keep track of its previous value. Add the prevCount state variable to track it. Add another state variable called trend to hold whether the count has increased or decreased. Compare prevCount with count, and if they’re not equal, update both prevCount and trend. Now you can show both the current count prop and how it has changed since the last render.

Note that if you call a set function while rendering, it must be inside a condition like prevCount !== count, and there must be a call like setPrevCount(count) inside of the condition. Otherwise, your component would re-render in a loop until it crashes. Also, you can only update the state of the currently rendering component like this. Calling the set function of another component during rendering is an error. Finally, your set call should still update state without mutation — this doesn’t mean you can break other rules of pure functions.

This pattern can be hard to understand and is usually best avoided. However, it’s better than updating state in an effect. When you call the set function during render, React will re-render that component immediately after your component exits with a return statement, and before rendering the children. This way, children don’t need to render twice. The rest of your component function will still execute (and the result will be thrown away). If your condition is below all the Hook calls, you may add an early return; to restart rendering earlier.

Calling the set function does not change state in the running code:

This is because states behaves like a snapshot. Updating state requests another render with the new state value, but does not affect the count JavaScript variable in your already-running event handler.

If you need to use the next state, you can save it in a variable before passing it to the set function:

React will ignore your update if the next state is equal to the previous state, as determined by an Object.is comparison. This usually happens when you change an object or an array in state directly:

You mutated an existing obj object and passed it back to setObj, so React ignored the update. To fix this, you need to ensure that you’re always replacing objects and arrays in state instead of mutating them:

You might get an error that says: Too many re-renders. React limits the number of renders to prevent an infinite loop. Typically, this means that you’re unconditionally setting state during render, so your component enters a loop: render, set state (which causes a render), render, set state (which causes a render), and so on. Very often, this is caused by a mistake in specifying an event handler:

If you can’t find the cause of this error, click on the arrow next to the error in the console and look through the JavaScript stack to find the specific set function call responsible for the error.

In Strict Mode, React will call some of your functions twice instead of once:

This is expected and shouldn’t break your code.

This development-only behavior helps you keep components pure. React uses the result of one of the calls, and ignores the result of the other call. As long as your component, initializer, and updater functions are pure, this shouldn’t affect your logic. However, if they are accidentally impure, this helps you notice the mistakes.

For example, this impure updater function mutates an array in state:

Because React calls your updater function twice, you’ll see the todo was added twice, so you’ll know that there is a mistake. In this example, you can fix the mistake by replacing the array instead of mutating it:

Now that this updater function is pure, calling it an extra time doesn’t make a difference in behavior. This is why React calling it twice helps you find mistakes. Only component, initializer, and updater functions need to be pure. Event handlers don’t need to be pure, so React will never call your event handlers twice.

Read keeping components pure to learn more.

You can’t put a function into state like this:

Because you’re passing a function, React assumes that someFunction is an initializer function, and that someOtherFunction is an updater function, so it tries to call them and store the result. To actually store a function, you have to put () => before them in both cases. Then React will store the functions you pass.

**Examples:**

Example 1 (jsx):
```jsx
const [state, setState] = useState(initialState)
```

Example 2 (javascript):
```javascript
import { useState } from 'react';function MyComponent() {  const [age, setAge] = useState(28);  const [name, setName] = useState('Taylor');  const [todos, setTodos] = useState(() => createTodos());  // ...
```

Example 3 (javascript):
```javascript
const [name, setName] = useState('Edward');function handleClick() {  setName('Taylor');  setAge(a => a + 1);  // ...
```

Example 4 (jsx):
```jsx
import { useState } from 'react';function MyComponent() {  const [age, setAge] = useState(42);  const [name, setName] = useState('Taylor');  // ...
```

---

## useTransition

**URL:** https://react.dev/reference/react/useTransition

**Contents:**
- useTransition
- Reference
  - useTransition()
    - Parameters
    - Returns
  - startTransition(action)
  - Note
    - Functions called in startTransition are called “Actions”.
    - Parameters
    - Returns

useTransition is a React Hook that lets you render a part of the UI in the background.

Call useTransition at the top level of your component to mark some state updates as Transitions.

See more examples below.

useTransition does not take any parameters.

useTransition returns an array with exactly two items:

The startTransition function returned by useTransition lets you mark an update as a Transition.

The function passed to startTransition is called an “Action”. By convention, any callback called inside startTransition (such as a callback prop) should be named action or include the “Action” suffix:

startTransition does not return anything.

useTransition is a Hook, so it can only be called inside components or custom Hooks. If you need to start a Transition somewhere else (for example, from a data library), call the standalone startTransition instead.

You can wrap an update into a Transition only if you have access to the set function of that state. If you want to start a Transition in response to some prop or a custom Hook value, try useDeferredValue instead.

The function you pass to startTransition is called immediately, marking all state updates that happen while it executes as Transitions. If you try to perform state updates in a setTimeout, for example, they won’t be marked as Transitions.

You must wrap any state updates after any async requests in another startTransition to mark them as Transitions. This is a known limitation that we will fix in the future (see Troubleshooting).

The startTransition function has a stable identity, so you will often see it omitted from Effect dependencies, but including it will not cause the Effect to fire. If the linter lets you omit a dependency without errors, it is safe to do. Learn more about removing Effect dependencies.

A state update marked as a Transition will be interrupted by other state updates. For example, if you update a chart component inside a Transition, but then start typing into an input while the chart is in the middle of a re-render, React will restart the rendering work on the chart component after handling the input update.

Transition updates can’t be used to control text inputs.

If there are multiple ongoing Transitions, React currently batches them together. This is a limitation that may be removed in a future release.

Call useTransition at the top of your component to create Actions, and access the pending state:

useTransition returns an array with exactly two items:

To start a Transition, pass a function to startTransition like this:

The function passed to startTransition is called the “Action”. You can update state and (optionally) perform side effects within an Action, and the work will be done in the background without blocking user interactions on the page. A Transition can include multiple Actions, and while a Transition is in progress, your UI stays responsive. For example, if the user clicks a tab but then changes their mind and clicks another tab, the second click will be immediately handled without waiting for the first update to finish.

To give the user feedback about in-progress Transitions, the isPending state switches to true at the first call to startTransition, and stays true until all Actions complete and the final state is shown to the user. Transitions ensure side effects in Actions to complete in order to prevent unwanted loading indicators, and you can provide immediate feedback while the Transition is in progress with useOptimistic.

In this example, the updateQuantity function simulates a request to the server to update the item’s quantity in the cart. This function is artificially slowed down so that it takes at least a second to complete the request.

Update the quantity multiple times quickly. Notice that the pending “Total” state is shown while any requests are in progress, and the “Total” updates only after the final request is complete. Because the update is in an Action, the “quantity” can continue to be updated while the request is in progress.

This is a basic example to demonstrate how Actions work, but this example does not handle requests completing out of order. When updating the quantity multiple times, it’s possible for the previous requests to finish after later requests causing the quantity to update out of order. This is a known limitation that we will fix in the future (see Troubleshooting below).

For common use cases, React provides built-in abstractions such as:

These solutions handle request ordering for you. When using Transitions to build your own custom hooks or libraries that manage async state transitions, you have greater control over the request ordering, but you must handle it yourself.

You can expose an action prop from a component to allow a parent to call an Action.

For example, this TabButton component wraps its onClick logic in an action prop:

Because the parent component updates its state inside the action, that state update gets marked as a Transition. This means you can click on “Posts” and then immediately click “Contact” and it does not block user interactions:

When exposing an action prop from a component, you should await it inside the transition.

This allows the action callback to be either synchronous or asynchronous without requiring an additional startTransition to wrap the await in the action.

You can use the isPending boolean value returned by useTransition to indicate to the user that a Transition is in progress. For example, the tab button can have a special “pending” visual state:

Notice how clicking “Posts” now feels more responsive because the tab button itself updates right away:

In this example, the PostsTab component fetches some data using use. When you click the “Posts” tab, the PostsTab component suspends, causing the closest loading fallback to appear:

Hiding the entire tab container to show a loading indicator leads to a jarring user experience. If you add useTransition to TabButton, you can instead display the pending state in the tab button instead.

Notice that clicking “Posts” no longer replaces the entire tab container with a spinner:

Read more about using Transitions with Suspense.

Transitions only “wait” long enough to avoid hiding already revealed content (like the tab container). If the Posts tab had a nested <Suspense> boundary, the Transition would not “wait” for it.

If you’re building a React framework or a router, we recommend marking page navigations as Transitions.

This is recommended for three reasons:

Here is a simplified router example using Transitions for navigations.

Suspense-enabled routers are expected to wrap the navigation updates into Transitions by default.

If a function passed to startTransition throws an error, you can display an error to your user with an error boundary. To use an error boundary, wrap the component where you are calling the useTransition in an error boundary. Once the function passed to startTransition errors, the fallback for the error boundary will be displayed.

You can’t use a Transition for a state variable that controls an input:

This is because Transitions are non-blocking, but updating an input in response to the change event should happen synchronously. If you want to run a Transition in response to typing, you have two options:

When you wrap a state update in a Transition, make sure that it happens during the startTransition call:

The function you pass to startTransition must be synchronous. You can’t mark an update as a Transition like this:

Instead, you could do this:

When you use await inside a startTransition function, the state updates that happen after the await are not marked as Transitions. You must wrap state updates after each await in a startTransition call:

However, this works instead:

This is a JavaScript limitation due to React losing the scope of the async context. In the future, when AsyncContext is available, this limitation will be removed.

You can’t call useTransition outside a component because it’s a Hook. In this case, use the standalone startTransition method instead. It works the same way, but it doesn’t provide the isPending indicator.

If you run this code, it will print 1, 2, 3:

It is expected to print 1, 2, 3. The function you pass to startTransition does not get delayed. Unlike with the browser setTimeout, it does not run the callback later. React executes your function immediately, but any state updates scheduled while it is running are marked as Transitions. You can imagine that it works like this:

If you await inside startTransition, you might see the updates happen out of order.

In this example, the updateQuantity function simulates a request to the server to update the item’s quantity in the cart. This function artificially returns every other request after the previous to simulate race conditions for network requests.

Try updating the quantity once, then update it quickly multiple times. You might see the incorrect total:

When clicking multiple times, it’s possible for previous requests to finish after later requests. When this happens, React currently has no way to know the intended order. This is because the updates are scheduled asynchronously, and React loses context of the order across the async boundary.

This is expected, because Actions within a Transition do not guarantee execution order. For common use cases, React provides higher-level abstractions like useActionState and <form> actions that handle ordering for you. For advanced use cases, you’ll need to implement your own queuing and abort logic to handle this.

Example of useActionState handling execution order:

**Examples:**

Example 1 (unknown):
```unknown
const [isPending, startTransition] = useTransition()
```

Example 2 (javascript):
```javascript
import { useTransition } from 'react';function TabContainer() {  const [isPending, startTransition] = useTransition();  // ...}
```

Example 3 (javascript):
```javascript
function TabContainer() {  const [isPending, startTransition] = useTransition();  const [tab, setTab] = useState('about');  function selectTab(nextTab) {    startTransition(() => {      setTab(nextTab);    });  }  // ...}
```

Example 4 (jsx):
```jsx
function SubmitButton({ submitAction }) {  const [isPending, startTransition] = useTransition();  return (    <button      disabled={isPending}      onClick={() => {        startTransition(async () => {          await submitAction();        });      }}    >      Submit    </button>  );}
```

---

## 'use client'

**URL:** https://react.dev/reference/rsc/use-client

**Contents:**
- 'use client'
  - React Server Components
- Reference
  - 'use client'
    - Caveats
  - How 'use client' marks client code
      - Deep Dive
    - How is FancyText both a Server and a Client Component?
      - Deep Dive
    - Why is Copyright a Server Component?

'use client' is for use with React Server Components.

'use client' lets you mark what code runs on the client.

Add 'use client' at the top of a file to mark the module and its transitive dependencies as client code.

When a file marked with 'use client' is imported from a Server Component, compatible bundlers will treat the module import as a boundary between server-run and client-run code.

As dependencies of RichTextEditor, formatDate and Button will also be evaluated on the client regardless of whether their modules contain a 'use client' directive. Note that a single module may be evaluated on the server when imported from server code and on the client when imported from client code.

In a React app, components are often split into separate files, or modules.

For apps that use React Server Components, the app is server-rendered by default. 'use client' introduces a server-client boundary in the module dependency tree, effectively creating a subtree of Client modules.

To better illustrate this, consider the following React Server Components app.

In the module dependency tree of this example app, the 'use client' directive in InspirationGenerator.js marks that module and all of its transitive dependencies as Client modules. The subtree starting at InspirationGenerator.js is now marked as Client modules.

'use client' segments the module dependency tree of the React Server Components app, marking InspirationGenerator.js and all of its dependencies as client-rendered.

During render, the framework will server-render the root component and continue through the render tree, opting-out of evaluating any code imported from client-marked code.

The server-rendered portion of the render tree is then sent to the client. The client, with its client code downloaded, then completes rendering the rest of the tree.

The render tree for the React Server Components app. InspirationGenerator and its child component FancyText are components exported from client-marked code and considered Client Components.

We introduce the following definitions:

Working through the example app, App, FancyText and Copyright are all server-rendered and considered Server Components. As InspirationGenerator.js and its transitive dependencies are marked as client code, the component InspirationGenerator and its child component FancyText are Client Components.

By the above definitions, the component FancyText is both a Server and Client Component, how can that be?

First, let’s clarify that the term “component” is not very precise. Here are just two ways “component” can be understood:

Often, the imprecision is not important when explaining concepts, but in this case it is.

When we talk about Server or Client Components, we are referring to component usages.

Back to the question of FancyText, we see that the component definition does not have a 'use client' directive and it has two usages.

The usage of FancyText as a child of App, marks that usage as a Server Component. When FancyText is imported and called under InspirationGenerator, that usage of FancyText is a Client Component as InspirationGenerator contains a 'use client' directive.

This means that the component definition for FancyText will both be evaluated on the server and also downloaded by the client to render its Client Component usage.

Because Copyright is rendered as a child of the Client Component InspirationGenerator, you might be surprised that it is a Server Component.

Recall that 'use client' defines the boundary between server and client code on the module dependency tree, not the render tree.

'use client' defines the boundary between server and client code on the module dependency tree.

In the module dependency tree, we see that App.js imports and calls Copyright from the Copyright.js module. As Copyright.js does not contain a 'use client' directive, the component usage is rendered on the server. App is rendered on the server as it is the root component.

Client Components can render Server Components because you can pass JSX as props. In this case, InspirationGenerator receives Copyright as children. However, the InspirationGenerator module never directly imports the Copyright module nor calls the component, all of that is done by App. In fact, the Copyright component is fully executed before InspirationGenerator starts rendering.

The takeaway is that a parent-child render relationship between components does not guarantee the same render environment.

With 'use client', you can determine when components are Client Components. As Server Components are default, here is a brief overview of the advantages and limitations to Server Components to determine when you need to mark something as client rendered.

For simplicity, we talk about Server Components, but the same principles apply to all code in your app that is server run.

As in any React app, parent components pass data to child components. As they are rendered in different environments, passing data from a Server Component to a Client Component requires extra consideration.

Prop values passed from a Server Component to Client Component must be serializable.

Serializable props include:

Notably, these are not supported:

As Counter requires both the useState Hook and event handlers to increment or decrement the value, this component must be a Client Component and will require a 'use client' directive at the top.

In contrast, a component that renders UI without interaction will not need to be a Client Component.

For example, Counter’s parent component, CounterContainer, does not require 'use client' as it is not interactive and does not use state. In addition, CounterContainer must be a Server Component as it reads from the local file system on the server, which is possible only in a Server Component.

There are also components that don’t use any server or client-only features and can be agnostic to where they render. In our earlier example, FancyText is one such component.

In this case, we don’t add the 'use client' directive, resulting in FancyText’s output (rather than its source code) to be sent to the browser when referenced from a Server Component. As demonstrated in the earlier Inspirations app example, FancyText is used as both a Server or Client Component, depending on where it is imported and used.

But if FancyText’s HTML output was large relative to its source code (including dependencies), it might be more efficient to force it to always be a Client Component. Components that return a long SVG path string are one case where it may be more efficient to force a component to be a Client Component.

Your React app may use client-specific APIs, such as the browser’s APIs for web storage, audio and video manipulation, and device hardware, among others.

In this example, the component uses DOM APIs to manipulate a canvas element. Since those APIs are only available in the browser, it must be marked as a Client Component.

Often in a React app, you’ll leverage third-party libraries to handle common UI patterns or logic.

These libraries may rely on component Hooks or client APIs. Third-party components that use any of the following React APIs must run on the client:

If these libraries have been updated to be compatible with React Server Components, then they will already include 'use client' markers of their own, allowing you to use them directly from your Server Components. If a library hasn’t been updated, or if a component needs props like event handlers that can only be specified on the client, you may need to add your own Client Component file in between the third-party Client Component and your Server Component where you’d like to use it.

**Examples:**

Example 1 (jsx):
```jsx
'use client';import { useState } from 'react';import { formatDate } from './formatters';import Button from './button';export default function RichTextEditor({ timestamp, text }) {  const date = formatDate(timestamp);  // ...  const editButton = <Button />;  // ...}
```

Example 2 (typescript):
```typescript
// This is a definition of a componentfunction MyComponent() {  return <p>My Component</p>}
```

Example 3 (jsx):
```jsx
import MyComponent from './MyComponent';function App() {  // This is a usage of a component  return <MyComponent />;}
```

Example 4 (javascript):
```javascript
import { readFile } from 'node:fs/promises';import Counter from './Counter';export default async function CounterContainer() {  const initialValue = await readFile('/path/to/counter_value');  return <Counter initialValue={initialValue} />}
```

---

## preserve-manual-memoization

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/preserve-manual-memoization

**Contents:**
- preserve-manual-memoization
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - Should I remove my manual memoization?

Validates that existing manual memoization is preserved by the compiler. React Compiler will only compile components and hooks if its inference matches or exceeds the existing manual memoization.

React Compiler preserves your existing useMemo, useCallback, and React.memo calls. If you’ve manually memoized something, the compiler assumes you had a good reason and won’t remove it. However, incomplete dependencies prevent the compiler from understanding your code’s data flow and applying further optimizations.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You might wonder if React Compiler makes manual memoization unnecessary:

You can safely remove it if using React Compiler:

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Missing dependencies in useMemofunction Component({ data, filter }) {  const filtered = useMemo(    () => data.filter(filter),    [data] // Missing 'filter' dependency  );  return <List items={filtered} />;}// ❌ Missing dependencies in useCallbackfunction Component({ onUpdate, value }) {  const handleClick = useCallback(() => {    onUpdate(value);  }, [onUpdate]); // Missing 'value'  return <button onClick={handleClick}>Update</button>;}
```

Example 2 (jsx):
```jsx
// ✅ Complete dependenciesfunction Component({ data, filter }) {  const filtered = useMemo(    () => data.filter(filter),    [data, filter] // All dependencies included  );  return <List items={filtered} />;}// ✅ Or let the compiler handle itfunction Component({ data, filter }) {  // No manual memoization needed  const filtered = data.filter(filter);  return <List items={filtered} />;}
```

Example 3 (jsx):
```jsx
// Do I still need this?function Component({items, sortBy}) {  const sorted = useMemo(() => {    return [...items].sort((a, b) => {      return a[sortBy] - b[sortBy];    });  }, [items, sortBy]);  return <List items={sorted} />;}
```

Example 4 (jsx):
```jsx
// ✅ Better: Let the compiler optimizefunction Component({items, sortBy}) {  const sorted = [...items].sort((a, b) => {    return a[sortBy] - b[sortBy];  });  return <List items={sorted} />;}
```

---
