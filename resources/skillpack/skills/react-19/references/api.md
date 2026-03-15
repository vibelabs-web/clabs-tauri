# React-19 - Api

**Pages:** 64

---

## Directives

**URL:** https://react.dev/reference/react-compiler/directives

**Contents:**
- Directives
- Overview
  - Available directives
  - Quick comparison
- Usage
  - Function-level directives
  - Module-level directives
  - Compilation modes interaction
- Best practices
  - Use directives sparingly

React Compiler directives are special string literals that control whether specific functions are compiled.

React Compiler directives provide fine-grained control over which functions are optimized by the compiler. They are string literals placed at the beginning of a function body or at the top of a module.

Place directives at the beginning of a function to control its compilation:

Place directives at the top of a file to affect all functions in that module:

Directives behave differently depending on your compilationMode:

Directives are escape hatches. Prefer configuring the compiler at the project level:

Always explain why a directive is used:

Opt-out directives should be temporary:

When adopting the React Compiler in a large codebase:

For specific issues with directives, see the troubleshooting sections in:

**Examples:**

Example 1 (javascript):
```javascript
function MyComponent() {  "use memo"; // Opt this component into compilation  return <div>{/* ... */}</div>;}
```

Example 2 (typescript):
```typescript
// Opt into compilationfunction OptimizedComponent() {  "use memo";  return <div>This will be optimized</div>;}// Opt out of compilationfunction UnoptimizedComponent() {  "use no memo";  return <div>This won't be optimized</div>;}
```

Example 3 (julia):
```julia
// At the very top of the file"use memo";// All functions in this file will be compiledfunction Component1() {  return <div>Compiled</div>;}function Component2() {  return <div>Also compiled</div>;}// Can be overridden at function levelfunction Component3() {  "use no memo"; // This overrides the module directive  return <div>Not compiled</div>;}
```

Example 4 (css):
```css
// ✅ Good - project-wide configuration{  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'infer'    }]  ]}// ⚠️ Use directives only when neededfunction SpecialCase() {  "use no memo"; // Document why this is needed  // ...}
```

---

## cache

**URL:** https://react.dev/reference/react/cache

**Contents:**
- cache
  - React Server Components
- Reference
  - cache(fn)
    - Parameters
    - Returns
  - Note
    - Caveats
- Usage
  - Cache an expensive computation

cache is only for use with React Server Components.

cache lets you cache the result of a data fetch or computation.

Call cache outside of any components to create a version of the function with caching.

When getMetrics is first called with data, getMetrics will call calculateMetrics(data) and store the result in cache. If getMetrics is called again with the same data, it will return the cached result instead of calling calculateMetrics(data) again.

See more examples below.

cache returns a cached version of fn with the same type signature. It does not call fn in the process.

When calling cachedFn with given arguments, it first checks if a cached result exists in the cache. If a cached result exists, it returns the result. If not, it calls fn with the arguments, stores the result in the cache, and returns the result. The only time fn is called is when there is a cache miss.

The optimization of caching return values based on inputs is known as memoization. We refer to the function returned from cache as a memoized function.

Use cache to skip duplicate work.

If the same user object is rendered in both Profile and TeamReport, the two components can share work and only call calculateUserMetrics once for that user.

Assume Profile is rendered first. It will call getUserMetrics, and check if there is a cached result. Since it is the first time getUserMetrics is called with that user, there will be a cache miss. getUserMetrics will then call calculateUserMetrics with that user and write the result to cache.

When TeamReport renders its list of users and reaches the same user object, it will call getUserMetrics and read the result from cache.

If calculateUserMetrics can be aborted by passing an AbortSignal, you can use cacheSignal() to cancel the expensive computation if React has finished rendering. calculateUserMetrics may already handle cancellation internally by using cacheSignal directly.

To access the same cache, components must call the same memoized function.

In the above example, Precipitation and Temperature each call cache to create a new memoized function with their own cache look-up. If both components render for the same cityData, they will do duplicate work to call calculateWeekReport.

In addition, Temperature creates a new memoized function each time the component is rendered which doesn’t allow for any cache sharing.

To maximize cache hits and reduce work, the two components should call the same memoized function to access the same cache. Instead, define the memoized function in a dedicated module that can be import-ed across components.

Here, both components call the same memoized function exported from ./getWeekReport.js to read and write to the same cache.

To share a snapshot of data between components, call cache with a data-fetching function like fetch. When multiple components make the same data fetch, only one request is made and the data returned is cached and shared across components. All components refer to the same snapshot of data across the server render.

If AnimatedWeatherCard and MinimalWeatherCard both render for the same city, they will receive the same snapshot of data from the memoized function.

If AnimatedWeatherCard and MinimalWeatherCard supply different city arguments to getTemperature, then fetchTemperature will be called twice and each call site will receive different data.

The city acts as a cache key.

Asynchronous rendering is only supported for Server Components.

To render components that use asynchronous data in Client Components, see use() documentation.

By caching a long-running data fetch, you can kick off asynchronous work prior to rendering the component.

When rendering Page, the component calls getUser but note that it doesn’t use the returned data. This early getUser call kicks off the asynchronous database query that occurs while Page is doing other computational work and rendering children.

When rendering Profile, we call getUser again. If the initial getUser call has already returned and cached the user data, when Profile asks and waits for this data, it can simply read from the cache without requiring another remote procedure call. If the initial data request hasn’t been completed, preloading data in this pattern reduces delay in data-fetching.

When evaluating an asynchronous function, you will receive a Promise for that work. The promise holds the state of that work (pending, fulfilled, failed) and its eventual settled result.

In this example, the asynchronous function fetchData returns a promise that is awaiting the fetch.

In calling getData the first time, the promise returned from fetchData is cached. Subsequent look-ups will then return the same promise.

Notice that the first getData call does not await whereas the second does. await is a JavaScript operator that will wait and return the settled result of the promise. The first getData call simply initiates the fetch to cache the promise for the second getData to look-up.

If by the second call the promise is still pending, then await will pause for the result. The optimization is that while we wait on the fetch, React can continue with computational work, thus reducing the wait time for the second call.

If the promise is already settled, either to an error or the fulfilled result, await will return that value immediately. In both outcomes, there is a performance benefit.

React only provides cache access to the memoized function in a component. When calling getUser outside of a component, it will still evaluate the function but not read or update the cache.

This is because cache access is provided through a context which is only accessible from a component.

All mentioned APIs offer memoization but the difference is what they’re intended to memoize, who can access the cache, and when their cache is invalidated.

In general, you should use useMemo for caching an expensive computation in a Client Component across renders. As an example, to memoize a transformation of data within a component.

In this example, App renders two WeatherReports with the same record. Even though both components do the same work, they cannot share work. useMemo’s cache is only local to the component.

However, useMemo does ensure that if App re-renders and the record object doesn’t change, each component instance would skip work and use the memoized value of avgTemp. useMemo will only cache the last computation of avgTemp with the given dependencies.

In general, you should use cache in Server Components to memoize work that can be shared across components.

Re-writing the previous example to use cache, in this case the second instance of WeatherReport will be able to skip duplicate work and read from the same cache as the first WeatherReport. Another difference from the previous example is that cache is also recommended for memoizing data fetches, unlike useMemo which should only be used for computations.

At this time, cache should only be used in Server Components and the cache will be invalidated across server requests.

You should use memo to prevent a component re-rendering if its props are unchanged.

In this example, both MemoWeatherReport components will call calculateAvg when first rendered. However, if App re-renders, with no changes to record, none of the props have changed and MemoWeatherReport will not re-render.

Compared to useMemo, memo memoizes the component render based on props vs. specific computations. Similar to useMemo, the memoized component only caches the last render with the last prop values. Once the props change, the cache invalidates and the component re-renders.

See prior mentioned pitfalls

If none of the above apply, it may be a problem with how React checks if something exists in cache.

If your arguments are not primitives (ex. objects, functions, arrays), ensure you’re passing the same object reference.

When calling a memoized function, React will look up the input arguments to see if a result is already cached. React will use shallow equality of the arguments to determine if there is a cache hit.

In this case the two MapMarkers look like they’re doing the same work and calling calculateNorm with the same value of {x: 10, y: 10, z:10}. Even though the objects contain the same values, they are not the same object reference as each component creates its own props object.

React will call Object.is on the input to verify if there is a cache hit.

One way to address this could be to pass the vector dimensions to calculateNorm. This works because the dimensions themselves are primitives.

Another solution may be to pass the vector object itself as a prop to the component. We’ll need to pass the same object to both component instances.

**Examples:**

Example 1 (javascript):
```javascript
const cachedFn = cache(fn);
```

Example 2 (javascript):
```javascript
import {cache} from 'react';import calculateMetrics from 'lib/metrics';const getMetrics = cache(calculateMetrics);function Chart({data}) {  const report = getMetrics(data);  // ...}
```

Example 3 (javascript):
```javascript
import {cache} from 'react';import calculateUserMetrics from 'lib/user';const getUserMetrics = cache(calculateUserMetrics);function Profile({user}) {  const metrics = getUserMetrics(user);  // ...}function TeamReport({users}) {  for (let user in users) {    const metrics = getUserMetrics(user);    // ...  }  // ...}
```

Example 4 (javascript):
```javascript
// Temperature.jsimport {cache} from 'react';import {calculateWeekReport} from './report';export function Temperature({cityData}) {  // 🚩 Wrong: Calling `cache` in component creates new `getWeekReport` for each render  const getWeekReport = cache(calculateWeekReport);  const report = getWeekReport(cityData);  // ...}
```

---

## gating

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/gating

**Contents:**
- gating
- Rule Details
  - Invalid
  - Valid

Validates configuration of gating mode.

Gating mode lets you gradually adopt React Compiler by marking specific components for optimization. This rule ensures your gating configuration is valid so the compiler knows which components to process.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

**Examples:**

Example 1 (css):
```css
// ❌ Missing required fieldsmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      gating: {        importSpecifierName: '__experimental_useCompiler'        // Missing 'source' field      }    }]  ]};// ❌ Invalid gating typemodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      gating: '__experimental_useCompiler' // Should be object    }]  ]};
```

Example 2 (julia):
```julia
// ✅ Complete gating configurationmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      gating: {        importSpecifierName: 'isCompilerEnabled', // exported function name        source: 'featureFlags' // module name      }    }]  ]};// featureFlags.jsexport function isCompilerEnabled() {  // ...}// ✅ No gating (compile everything)module.exports = {  plugins: [    ['babel-plugin-react-compiler', {      // No gating field - compiles all components    }]  ]};
```

---

## React DOM APIs

**URL:** https://react.dev/reference/react-dom

**Contents:**
- React DOM APIs
- APIs
- Resource Preloading APIs
- Entry points
- Removed APIs

The react-dom package contains methods that are only supported for the web applications (which run in the browser DOM environment). They are not supported for React Native.

These APIs can be imported from your components. They are rarely used:

These APIs can be used to make apps faster by pre-loading resources such as scripts, stylesheets, and fonts as soon as you know you need them, for example before navigating to another page where the resources will be used.

React-based frameworks frequently handle resource loading for you, so you might not have to call these APIs yourself. Consult your framework’s documentation for details.

The react-dom package provides two additional entry points:

These APIs were removed in React 19:

---

## preloadModule

**URL:** https://react.dev/reference/react-dom/preloadModule

**Contents:**
- preloadModule
  - Note
- Reference
  - preloadModule(href, options)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Preloading when rendering
  - Preloading in an event handler

React-based frameworks frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

preloadModule lets you eagerly fetch an ESM module that you expect to use.

To preload an ESM module, call the preloadModule function from react-dom.

See more examples below.

The preloadModule function provides the browser with a hint that it should start downloading the given module, which can save time.

preloadModule returns nothing.

Call preloadModule when rendering a component if you know that it or its children will use a specific module.

If you want the browser to start executing the module immediately (rather than just downloading it), use preinitModule instead. If you want to load a script that isn’t an ESM module, use preload.

Call preloadModule in an event handler before transitioning to a page or state where the module will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (css):
```css
preloadModule("https://example.com/module.js", {as: "script"});
```

Example 2 (javascript):
```javascript
import { preloadModule } from 'react-dom';function AppRoot() {  preloadModule("https://example.com/module.js", {as: "script"});  // ...}
```

Example 3 (javascript):
```javascript
import { preloadModule } from 'react-dom';function AppRoot() {  preloadModule("https://example.com/module.js", {as: "script"});  return ...;}
```

Example 4 (jsx):
```jsx
import { preloadModule } from 'react-dom';function CallToAction() {  const onClick = () => {    preloadModule("https://example.com/module.js", {as: "script"});    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## panicThreshold

**URL:** https://react.dev/reference/react-compiler/panicThreshold

**Contents:**
- panicThreshold
- Reference
  - panicThreshold
    - Type
    - Default value
    - Options
    - Caveats
- Usage
  - Production configuration (recommended)
  - Development debugging

The panicThreshold option controls how the React Compiler handles errors during compilation.

Determines whether compilation errors should fail the build or skip optimization.

For production builds, always use 'none'. This is the default value:

Temporarily use stricter thresholds to find issues:

**Examples:**

Example 1 (css):
```css
{  panicThreshold: 'none' // Recommended}
```

Example 2 (rust):
```rust
'none' | 'critical_errors' | 'all_errors'
```

Example 3 (css):
```css
{  panicThreshold: 'none'}
```

Example 4 (css):
```css
const isDevelopment = process.env.NODE_ENV === 'development';{  panicThreshold: isDevelopment ? 'critical_errors' : 'none',  logger: {    logEvent(filename, event) {      if (isDevelopment && event.kind === 'CompileError') {        // ...      }    }  }}
```

---

## Children

**URL:** https://react.dev/reference/react/Children

**Contents:**
- Children
  - Pitfall
- Reference
  - Children.count(children)
    - Parameters
    - Returns
    - Caveats
  - Children.forEach(children, fn, thisArg?)
    - Parameters
    - Returns

Using Children is uncommon and can lead to fragile code. See common alternatives.

Children lets you manipulate and transform the JSX you received as the children prop.

Call Children.count(children) to count the number of children in the children data structure.

See more examples below.

The number of nodes inside these children.

Call Children.forEach(children, fn, thisArg?) to run some code for each child in the children data structure.

See more examples below.

Children.forEach returns undefined.

Call Children.map(children, fn, thisArg?) to map or transform each child in the children data structure.

See more examples below.

If children is null or undefined, returns the same value.

Otherwise, returns a flat array consisting of the nodes you’ve returned from the fn function. The returned array will contain all nodes you returned except for null and undefined.

Empty nodes (null, undefined, and Booleans), strings, numbers, and React elements count as individual nodes. Arrays don’t count as individual nodes, but their children do. The traversal does not go deeper than React elements: they don’t get rendered, and their children aren’t traversed. Fragments don’t get traversed.

If you return an element or an array of elements with keys from fn, the returned elements’ keys will be automatically combined with the key of the corresponding original item from children. When you return multiple elements from fn in an array, their keys only need to be unique locally amongst each other.

Call Children.only(children) to assert that children represent a single React element.

If children is a valid element, returns that element.

Otherwise, throws an error.

Call Children.toArray(children) to create an array out of the children data structure.

Returns a flat array of elements in children.

To transform the children JSX that your component receives as the children prop, call Children.map:

In the example above, the RowList wraps every child it receives into a <div className="Row"> container. For example, let’s say the parent component passes three <p> tags as the children prop to RowList:

Then, with the RowList implementation above, the final rendered result will look like this:

Children.map is similar to to transforming arrays with map(). The difference is that the children data structure is considered opaque. This means that even if it’s sometimes an array, you should not assume it’s an array or any other particular data type. This is why you should use Children.map if you need to transform it.

In React, the children prop is considered an opaque data structure. This means that you shouldn’t rely on how it is structured. To transform, filter, or count children, you should use the Children methods.

In practice, the children data structure is often represented as an array internally. However, if there is only a single child, then React won’t create an extra array since this would lead to unnecessary memory overhead. As long as you use the Children methods instead of directly introspecting the children prop, your code will not break even if React changes how the data structure is actually implemented.

Even when children is an array, Children.map has useful special behavior. For example, Children.map combines the keys on the returned elements with the keys on the children you’ve passed to it. This ensures the original JSX children don’t “lose” keys even if they get wrapped like in the example above.

The children data structure does not include rendered output of the components you pass as JSX. In the example below, the children received by the RowList only contains two items rather than three:

This is why only two row wrappers are generated in this example:

There is no way to get the rendered output of an inner component like <MoreRows /> when manipulating children. This is why it’s usually better to use one of the alternative solutions.

Call Children.forEach to iterate over each child in the children data structure. It does not return any value and is similar to the array forEach method. You can use it to run custom logic like constructing your own array.

As mentioned earlier, there is no way to get the rendered output of an inner component when manipulating children. This is why it’s usually better to use one of the alternative solutions.

Call Children.count(children) to calculate the number of children.

As mentioned earlier, there is no way to get the rendered output of an inner component when manipulating children. This is why it’s usually better to use one of the alternative solutions.

Call Children.toArray(children) to turn the children data structure into a regular JavaScript array. This lets you manipulate the array with built-in array methods like filter, sort, or reverse.

As mentioned earlier, there is no way to get the rendered output of an inner component when manipulating children. This is why it’s usually better to use one of the alternative solutions.

This section describes alternatives to the Children API (with capital C) that’s imported like this:

Don’t confuse it with using the children prop (lowercase c), which is good and encouraged.

Manipulating children with the Children methods often leads to fragile code. When you pass children to a component in JSX, you don’t usually expect the component to manipulate or transform the individual children.

When you can, try to avoid using the Children methods. For example, if you want every child of RowList to be wrapped in <div className="Row">, export a Row component, and manually wrap every row into it like this:

Unlike using Children.map, this approach does not wrap every child automatically. However, this approach has a significant benefit compared to the earlier example with Children.map because it works even if you keep extracting more components. For example, it still works if you extract your own MoreRows component:

This wouldn’t work with Children.map because it would “see” <MoreRows /> as a single child (and a single row).

You can also explicitly pass an array as a prop. For example, this RowList accepts a rows array as a prop:

Since rows is a regular JavaScript array, the RowList component can use built-in array methods like map on it.

This pattern is especially useful when you want to be able to pass more information as structured data together with children. In the below example, the TabSwitcher component receives an array of objects as the tabs prop:

Unlike passing the children as JSX, this approach lets you associate some extra data like header with each item. Because you are working with the tabs directly, and it is an array, you do not need the Children methods.

Instead of producing JSX for every single item, you can also pass a function that returns JSX, and call that function when necessary. In this example, the App component passes a renderContent function to the TabSwitcher component. The TabSwitcher component calls renderContent only for the selected tab:

A prop like renderContent is called a render prop because it is a prop that specifies how to render a piece of the user interface. However, there is nothing special about it: it is a regular prop which happens to be a function.

Render props are functions, so you can pass information to them. For example, this RowList component passes the id and the index of each row to the renderRow render prop, which uses index to highlight even rows:

This is another example of how parent and child components can cooperate without manipulating the children.

Suppose you pass two children to RowList like this:

If you do Children.count(children) inside RowList, you will get 2. Even if MoreRows renders 10 different items, or if it returns null, Children.count(children) will still be 2. From the RowList’s perspective, it only “sees” the JSX it has received. It does not “see” the internals of the MoreRows component.

The limitation makes it hard to extract a component. This is why alternatives are preferred to using Children.

**Examples:**

Example 1 (jsx):
```jsx
const mappedChildren = Children.map(children, child =>  <div className="Row">    {child}  </div>);
```

Example 2 (javascript):
```javascript
import { Children } from 'react';function RowList({ children }) {  return (    <>      <h1>Total rows: {Children.count(children)}</h1>      ...    </>  );}
```

Example 3 (javascript):
```javascript
import { Children } from 'react';function SeparatorList({ children }) {  const result = [];  Children.forEach(children, (child, index) => {    result.push(child);    result.push(<hr key={index} />);  });  // ...
```

Example 4 (jsx):
```jsx
import { Children } from 'react';function RowList({ children }) {  return (    <div className="RowList">      {Children.map(children, child =>        <div className="Row">          {child}        </div>      )}    </div>  );}
```

---

## cloneElement

**URL:** https://react.dev/reference/react/cloneElement

**Contents:**
- cloneElement
  - Pitfall
- Reference
  - cloneElement(element, props, ...children)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Overriding props of an element
  - Pitfall

Using cloneElement is uncommon and can lead to fragile code. See common alternatives.

cloneElement lets you create a new React element using another element as a starting point.

Call cloneElement to create a React element based on the element, but with different props and children:

See more examples below.

element: The element argument must be a valid React element. For example, it could be a JSX node like <Something />, the result of calling createElement, or the result of another cloneElement call.

props: The props argument must either be an object or null. If you pass null, the cloned element will retain all of the original element.props. Otherwise, for every prop in the props object, the returned element will “prefer” the value from props over the value from element.props. The rest of the props will be filled from the original element.props. If you pass props.key or props.ref, they will replace the original ones.

optional ...children: Zero or more child nodes. They can be any React nodes, including React elements, strings, numbers, portals, empty nodes (null, undefined, true, and false), and arrays of React nodes. If you don’t pass any ...children arguments, the original element.props.children will be preserved.

cloneElement returns a React element object with a few properties:

Usually, you’ll return the element from your component or make it a child of another element. Although you may read the element’s properties, it’s best to treat every element as opaque after it’s created, and only render it.

Cloning an element does not modify the original element.

You should only pass children as multiple arguments to cloneElement if they are all statically known, like cloneElement(element, null, child1, child2, child3). If your children are dynamic, pass the entire array as the third argument: cloneElement(element, null, listItems). This ensures that React will warn you about missing keys for any dynamic lists. For static lists this is not necessary because they never reorder.

cloneElement makes it harder to trace the data flow, so try the alternatives instead.

To override the props of some React element, pass it to cloneElement with the props you want to override:

Here, the resulting cloned element will be <Row title="Cabbage" isHighlighted={true} />.

Let’s walk through an example to see when it’s useful.

Imagine a List component that renders its children as a list of selectable rows with a “Next” button that changes which row is selected. The List component needs to render the selected Row differently, so it clones every <Row> child that it has received, and adds an extra isHighlighted: true or isHighlighted: false prop:

Let’s say the original JSX received by List looks like this:

By cloning its children, the List can pass extra information to every Row inside. The result looks like this:

Notice how pressing “Next” updates the state of the List, and highlights a different row:

To summarize, the List cloned the <Row /> elements it received and added an extra prop to them.

Cloning children makes it hard to tell how the data flows through your app. Try one of the alternatives.

Instead of using cloneElement, consider accepting a render prop like renderItem. Here, List receives renderItem as a prop. List calls renderItem for every item and passes isHighlighted as an argument:

The renderItem prop is called a “render prop” because it’s a prop that specifies how to render something. For example, you can pass a renderItem implementation that renders a <Row> with the given isHighlighted value:

The end result is the same as with cloneElement:

However, you can clearly trace where the isHighlighted value is coming from.

This pattern is preferred to cloneElement because it is more explicit.

Another alternative to cloneElement is to pass data through context.

For example, you can call createContext to define a HighlightContext:

Your List component can wrap every item it renders into a HighlightContext provider:

With this approach, Row does not need to receive an isHighlighted prop at all. Instead, it reads the context:

This allows the calling component to not know or worry about passing isHighlighted to <Row>:

Instead, List and Row coordinate the highlighting logic through context.

Learn more about passing data through context.

Another approach you can try is to extract the “non-visual” logic into your own Hook, and use the information returned by your Hook to decide what to render. For example, you could write a useList custom Hook like this:

Then you could use it like this:

The data flow is explicit, but the state is inside the useList custom Hook that you can use from any component:

This approach is particularly useful if you want to reuse this logic between different components.

**Examples:**

Example 1 (javascript):
```javascript
const clonedElement = cloneElement(element, props, ...children)
```

Example 2 (jsx):
```jsx
import { cloneElement } from 'react';// ...const clonedElement = cloneElement(  <Row title="Cabbage">    Hello  </Row>,  { isHighlighted: true },  'Goodbye');console.log(clonedElement); // <Row title="Cabbage" isHighlighted={true}>Goodbye</Row>
```

Example 3 (jsx):
```jsx
import { cloneElement } from 'react';// ...const clonedElement = cloneElement(  <Row title="Cabbage" />,  { isHighlighted: true });
```

Example 4 (jsx):
```jsx
export default function List({ children }) {  const [selectedIndex, setSelectedIndex] = useState(0);  return (    <div className="List">      {Children.map(children, (child, index) =>        cloneElement(child, {          isHighlighted: index === selectedIndex         })      )}
```

---

## resumeToPipeableStream

**URL:** https://react.dev/reference/react-dom/server/resumeToPipeableStream

**Contents:**
- resumeToPipeableStream
  - Note
- Reference
  - resumeToPipeableStream(node, postponed, options?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Further reading

resumeToPipeableStream streams a pre-rendered React tree to a pipeable Node.js Stream.

This API is specific to Node.js. Environments with Web Streams, like Deno and modern edge runtimes, should use resume instead.

Call resume to resume rendering a pre-rendered React tree as HTML into a Node.js Stream.

See more examples below.

resume returns an object with two methods:

Resuming behaves like renderToReadableStream. For more examples, check out the usage section of renderToReadableStream. The usage section of prerender includes examples of how to use prerenderToNodeStream specifically.

**Examples:**

Example 1 (csharp):
```csharp
const {pipe, abort} = await resumeToPipeableStream(reactNode, postponedState, options?)
```

Example 2 (javascript):
```javascript
import { resume } from 'react-dom/server';import {getPostponedState} from './storage';async function handler(request, response) {  const postponed = await getPostponedState(request);  const {pipe} = resumeToPipeableStream(<App />, postponed, {    onShellReady: () => {      pipe(response);    }  });}
```

---

## <Activity>

**URL:** https://react.dev/reference/react/Activity

**Contents:**
- <Activity>
- Reference
  - <Activity>
    - Props
    - Caveats
- Usage
  - Restoring the state of hidden components
  - Restoring the DOM of hidden components
  - Pre-rendering content that’s likely to become visible
  - Note

<Activity> lets you hide and restore the UI and internal state of its children.

You can use Activity to hide part of your application:

When an Activity boundary is hidden, React will visually hide its children using the display: "none" CSS property. It will also destroy their Effects, cleaning up any active subscriptions.

While hidden, children still re-render in response to new props, albeit at a lower priority than the rest of the content.

When the boundary becomes visible again, React will reveal the children with their previous state restored, and re-create their Effects.

In this way, Activity can be thought of as a mechanism for rendering “background activity”. Rather than completely discarding content that’s likely to become visible again, you can use Activity to maintain and restore that content’s UI and internal state, while ensuring that your hidden content has no unwanted side effects.

See more examples below.

In React, when you want to conditionally show or hide a component, you typically mount or unmount it based on that condition:

But unmounting a component destroys its internal state, which is not always what you want.

When you hide a component using an Activity boundary instead, React will “save” its state for later:

This makes it possible to hide and then later restore components in the state they were previously in.

The following example has a sidebar with an expandable section. You can press “Overview” to reveal the three subitems below it. The main app area also has a button that hides and shows the sidebar.

Try expanding the Overview section, and then toggling the sidebar closed then open:

The Overview section always starts out collapsed. Because we unmount the sidebar when isShowingSidebar flips to false, all its internal state is lost.

This is a perfect use case for Activity. We can preserve the internal state of our sidebar, even when visually hiding it.

Let’s replace the conditional rendering of our sidebar with an Activity boundary:

and check out the new behavior:

Our sidebar’s internal state is now restored, without any changes to its implementation.

Since Activity boundaries hide their children using display: none, their children’s DOM is also preserved when hidden. This makes them great for maintaining ephemeral state in parts of the UI that the user is likely to interact with again.

In this example, the Contact tab has a <textarea> where the user can enter a message. If you enter some text, change to the Home tab, then change back to the Contact tab, the draft message is lost:

This is because we’re fully unmounting Contact in App. When the Contact tab unmounts, the <textarea> element’s internal DOM state is lost.

If we switch to using an Activity boundary to show and hide the active tab, we can preserve the state of each tab’s DOM. Try entering text and switching tabs again, and you’ll see the draft message is no longer reset:

Again, the Activity boundary let us preserve the Contact tab’s internal state without changing its implementation.

So far, we’ve seen how Activity can hide some content that the user has interacted with, without discarding that content’s ephemeral state.

But Activity boundaries can also be used to prepare content that the user has yet to see for the first time:

When an Activity boundary is hidden during its initial render, its children won’t be visible on the page — but they will still be rendered, albeit at a lower priority than the visible content, and without mounting their Effects.

This pre-rendering allows the children to load any code or data they need ahead of time, so that later, when the Activity boundary becomes visible, the children can appear faster with reduced loading times.

Let’s look at an example.

In this demo, the Posts tab loads some data. If you press it, you’ll see a Suspense fallback displayed while the data is being fetched:

This is because App doesn’t mount Posts until its tab is active.

If we update App to use an Activity boundary to show and hide the active tab, Posts will be pre-rendered when the app first loads, allowing it to fetch its data before it becomes visible.

Try clicking the Posts tab now:

Posts was able to prepare itself for a faster render, thanks to the hidden Activity boundary.

Pre-rendering components with hidden Activity boundaries is a powerful way to reduce loading times for parts of the UI that the user is likely to interact with next.

Only Suspense-enabled data sources will be fetched during pre-rendering. They include:

Activity does not detect data that is fetched inside an Effect.

The exact way you would load data in the Posts component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

React includes an under-the-hood performance optimization called Selective Hydration. It works by hydrating your app’s initial HTML in chunks, enabling some components to become interactive even if other components on the page haven’t loaded their code or data yet.

Suspense boundaries participate in Selective Hydration, because they naturally divide your component tree into units that are independent from one another:

Here, MessageComposer can be fully hydrated during the initial render of the page, even before Chats is mounted and starts to fetch its data.

So by breaking up your component tree into discrete units, Suspense allows React to hydrate your app’s server-rendered HTML in chunks, enabling parts of your app to become interactive as fast as possible.

But what about pages that don’t use Suspense?

Take this tabs example:

Here, React must hydrate the entire page all at once. If Home or Video are slower to render, they could make the tab buttons feel unresponsive during hydration.

Adding Suspense around the active tab would solve this:

…but it would also change the UI, since the Placeholder fallback would be displayed on the initial render.

Instead, we can use Activity. Since Activity boundaries show and hide their children, they already naturally divide the component tree into independent units. And just like Suspense, this feature allows them to participate in Selective Hydration.

Let’s update our example to use Activity boundaries around the active tab:

Now our initial server-rendered HTML looks the same as it did in the original version, but thanks to Activity, React can hydrate the tab buttons first, before it even mounts Home or Video.

Thus, in addition to hiding and showing content, Activity boundaries help improve your app’s performance during hydration by letting React know which parts of your page can become interactive in isolation.

And even if your page doesn’t ever hide part of its content, you can still add always-visible Activity boundaries to improve hydration performance:

An Activity boundary hides its content by setting display: none on its children and cleaning up any of their Effects. So, most well-behaved React components that properly clean up their side effects will already be robust to being hidden by Activity.

But there are some situations where a hidden component behaves differently than an unmounted one. Most notably, since a hidden component’s DOM is not destroyed, any side effects from that DOM will persist, even after the component is hidden.

As an example, consider a <video> tag. Typically it doesn’t require any cleanup, because even if you’re playing a video, unmounting the tag stops the video and audio from playing in the browser. Try playing the video and then pressing Home in this demo:

The video stops playing as expected.

Now, let’s say we wanted to preserve the timecode where the user last watched, so that when they tab back to the video, it doesn’t start over from the beginning again.

This is a great use case for Activity!

Let’s update App to hide the inactive tab with a hidden Activity boundary instead of unmounting it, and see how the demo behaves this time:

Whoops! The video and audio continue to play even after it’s been hidden, because the tab’s <video> element is still in the DOM.

To fix this, we can add an Effect with a cleanup function that pauses the video:

We call useLayoutEffect instead of useEffect because conceptually the clean-up code is tied to the component’s UI being visually hidden. If we used a regular effect, the code could be delayed by (say) a re-suspending Suspense boundary or a View Transition.

Let’s see the new behavior. Try playing the video, switching to the Home tab, then back to the Video tab:

It works great! Our cleanup function ensures that the video stops playing if it’s ever hidden by an Activity boundary, and even better, because the <video> tag is never destroyed, the timecode is preserved, and the video itself doesn’t need to be initialized or downloaded again when the user switches back to keep watching it.

This is a great example of using Activity to preserve ephemeral DOM state for parts of the UI that become hidden, but the user is likely to interact with again soon.

Our example illustrates that for certain tags like <video>, unmounting and hiding have different behavior. If a component renders DOM that has a side effect, and you want to prevent that side effect when an Activity boundary hides it, add an Effect with a return function to clean it up.

The most common cases of this will be from the following tags:

Typically, though, most of your React components should already be robust to being hidden by an Activity boundary. And conceptually, you should think of “hidden” Activities as being unmounted.

To eagerly discover other Effects that don’t have proper cleanup, which is important not only for Activity boundaries but for many other behaviors in React, we recommend using <StrictMode>.

When an <Activity> is “hidden”, all its children’s Effects are cleaned up. Conceptually, the children are unmounted, but React saves their state for later. This is a feature of Activity because it means subscriptions won’t be active for hidden parts of the UI, reducing the amount of work needed for hidden content.

If you’re relying on an Effect mounting to clean up a component’s side effects, refactor the Effect to do the work in the returned cleanup function instead.

To eagerly find problematic Effects, we recommend adding <StrictMode> which will eagerly perform Activity unmounts and mounts to catch any unexpected side-effects.

**Examples:**

Example 1 (jsx):
```jsx
<Activity mode={visibility}>  <Sidebar /></Activity>
```

Example 2 (jsx):
```jsx
<Activity mode={isShowingSidebar ? "visible" : "hidden"}>  <Sidebar /></Activity>
```

Example 3 (jsx):
```jsx
{isShowingSidebar && (  <Sidebar />)}
```

Example 4 (jsx):
```jsx
<Activity mode={isShowingSidebar ? "visible" : "hidden"}>  <Sidebar /></Activity>
```

---

## prerenderToNodeStream

**URL:** https://react.dev/reference/react-dom/static/prerenderToNodeStream

**Contents:**
- prerenderToNodeStream
  - Note
- Reference
  - prerenderToNodeStream(reactNode, options?)
    - Parameters
    - Returns
    - Caveats
  - Note
  - When should I use prerenderToNodeStream?
- Usage

prerenderToNodeStream renders a React tree to a static HTML string using a Node.js Stream.

This API is specific to Node.js. Environments with Web Streams, like Deno and modern edge runtimes, should use prerender instead.

Call prerenderToNodeStream to render your app to static HTML.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

reactNode: A React node you want to render to HTML. For example, a JSX node like <App />. It is expected to represent the entire document, so the App component should render the <html> tag.

optional options: An object with static generation options.

prerenderToNodeStream returns a Promise:

nonce is not an available option when prerendering. Nonces must be unique per request and if you use nonces to secure your application with CSP it would be inappropriate and insecure to include the nonce value in the prerender itself.

The static prerenderToNodeStream API is used for static server-side generation (SSG). Unlike renderToString, prerenderToNodeStream waits for all data to load before resolving. This makes it suitable for generating static HTML for a full page, including data that needs to be fetched using Suspense. To stream content as it loads, use a streaming server-side render (SSR) API like renderToReadableStream.

prerenderToNodeStream can be aborted and resumed later with resumeToPipeableStream to support partial pre-rendering.

Call prerenderToNodeStream to render your React tree to static HTML into a Node.js Stream:

Along with the root component, you need to provide a list of bootstrap <script> paths. Your root component should return the entire document including the root <html> tag.

For example, it might look like this:

React will inject the doctype and your bootstrap <script> tags into the resulting HTML stream:

On the client, your bootstrap script should hydrate the entire document with a call to hydrateRoot:

This will attach event listeners to the static server-generated HTML and make it interactive.

The final asset URLs (like JavaScript and CSS files) are often hashed after the build. For example, instead of styles.css you might end up with styles.123456.css. Hashing static asset filenames guarantees that every distinct build of the same asset will have a different filename. This is useful because it lets you safely enable long-term caching for static assets: a file with a certain name would never change content.

However, if you don’t know the asset URLs until after the build, there’s no way for you to put them in the source code. For example, hardcoding "/styles.css" into JSX like earlier wouldn’t work. To keep them out of your source code, your root component can read the real filenames from a map passed as a prop:

On the server, render <App assetMap={assetMap} /> and pass your assetMap with the asset URLs:

Since your server is now rendering <App assetMap={assetMap} />, you need to render it with assetMap on the client too to avoid hydration errors. You can serialize and pass assetMap to the client like this:

In the example above, the bootstrapScriptContent option adds an extra inline <script> tag that sets the global window.assetMap variable on the client. This lets the client code read the same assetMap:

Both client and server render App with the same assetMap prop, so there are no hydration errors.

Call prerenderToNodeStream to render your app to a static HTML string:

This will produce the initial non-interactive HTML output of your React components. On the client, you will need to call hydrateRoot to hydrate that server-generated HTML and make it interactive.

prerenderToNodeStream waits for all data to load before finishing the static HTML generation and resolving. For example, consider a profile page that shows a cover, a sidebar with friends and photos, and a list of posts:

Imagine that <Posts /> needs to load some data, which takes some time. Ideally, you’d want wait for the posts to finish so it’s included in the HTML. To do this, you can use Suspense to suspend on the data, and prerenderToNodeStream will wait for the suspended content to finish before resolving to the static HTML.

Only Suspense-enabled data sources will activate the Suspense component. They include:

Suspense does not detect when data is fetched inside an Effect or event handler.

The exact way you would load data in the Posts component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

You can force the prerender to “give up” after a timeout:

Any Suspense boundaries with incomplete children will be included in the prelude in the fallback state.

This can be used for partial prerendering together with resumeToPipeableStream or resumeAndPrerenderToNodeStream.

The prerenderToNodeStream response waits for the entire app to finish rendering, including waiting for all Suspense boundaries to resolve, before resolving. It is designed for static site generation (SSG) ahead of time and does not support streaming more content as it loads.

To stream content as it loads, use a streaming server render API like renderToPipeableStream.

**Examples:**

Example 1 (csharp):
```csharp
const {prelude, postponed} = await prerenderToNodeStream(reactNode, options?)
```

Example 2 (jsx):
```jsx
import { prerenderToNodeStream } from 'react-dom/static';// The route handler syntax depends on your backend frameworkapp.use('/', async (request, response) => {  const { prelude } = await prerenderToNodeStream(<App />, {    bootstrapScripts: ['/main.js'],  });  response.setHeader('Content-Type', 'text/plain');  prelude.pipe(response);});
```

Example 3 (jsx):
```jsx
import { prerenderToNodeStream } from 'react-dom/static';// The route handler syntax depends on your backend frameworkapp.use('/', async (request, response) => {  const { prelude } = await prerenderToNodeStream(<App />, {    bootstrapScripts: ['/main.js'],  });  response.setHeader('Content-Type', 'text/plain');  prelude.pipe(response);});
```

Example 4 (html):
```html
export default function App() {  return (    <html>      <head>        <meta charSet="utf-8" />        <meta name="viewport" content="width=device-width, initial-scale=1" />        <link rel="stylesheet" href="/styles.css"></link>        <title>My app</title>      </head>      <body>        <Router />      </body>    </html>  );}
```

---

## Rules of Hooks

**URL:** https://react.dev/reference/rules/rules-of-hooks

**Contents:**
- Rules of Hooks
- Only call Hooks at the top level
  - Note
- Only call Hooks from React functions

Hooks are defined using JavaScript functions, but they represent a special type of reusable UI logic with restrictions on where they can be called.

Functions whose names start with use are called Hooks in React.

Don’t call Hooks inside loops, conditions, nested functions, or try/catch/finally blocks. Instead, always use Hooks at the top level of your React function, before any early returns. You can only call Hooks while React is rendering a function component:

It’s not supported to call Hooks (functions starting with use) in any other cases, for example:

If you break these rules, you might see this error.

You can use the eslint-plugin-react-hooks plugin to catch these mistakes.

Custom Hooks may call other Hooks (that’s their whole purpose). This works because custom Hooks are also supposed to only be called while a function component is rendering.

Don’t call Hooks from regular JavaScript functions. Instead, you can:

✅ Call Hooks from React function components. ✅ Call Hooks from custom Hooks.

By following this rule, you ensure that all stateful logic in a component is clearly visible from its source code.

**Examples:**

Example 1 (jsx):
```jsx
function Counter() {  // ✅ Good: top-level in a function component  const [count, setCount] = useState(0);  // ...}function useWindowWidth() {  // ✅ Good: top-level in a custom Hook  const [width, setWidth] = useState(window.innerWidth);  // ...}
```

Example 2 (jsx):
```jsx
function Bad({ cond }) {  if (cond) {    // 🔴 Bad: inside a condition (to fix, move it outside!)    const theme = useContext(ThemeContext);  }  // ...}function Bad() {  for (let i = 0; i < 10; i++) {    // 🔴 Bad: inside a loop (to fix, move it outside!)    const theme = useContext(ThemeContext);  }  // ...}function Bad({ cond }) {  if (cond) {    return;  }  // 🔴 Bad: after a conditional return (to fix, move it before the return!)  const theme = useContext(ThemeContext);  // ...}function Bad() {  function handleClick() {    // 🔴 Bad: inside an event handler (to fix, move it outside!)    const theme = useContext(ThemeContext);  }  // ...}function Bad() {  const style = useMemo(() => {    // 🔴 Bad: inside useMemo (to fix, move it outside!)    const theme = useContext(ThemeContext);    return createStyle(theme);  });  // ...}class Bad extends React.Component {  render() {    // 🔴 Bad: inside a class component (to fix, write a function component instead of a class!)    useEffect(() => {})    // ...  }}function Bad() {  try {    // 🔴 Bad: inside try/catch/finally block (to fix, move it outside!)    const [x, setX] = useState(0);  } catch {    const [x, setX] = useState(1);  }}
```

Example 3 (javascript):
```javascript
function FriendList() {  const [onlineStatus, setOnlineStatus] = useOnlineStatus(); // ✅}function setOnlineStatus() { // ❌ Not a component or custom Hook!  const [onlineStatus, setOnlineStatus] = useOnlineStatus();}
```

---

## Client React DOM APIs

**URL:** https://react.dev/reference/react-dom/client

**Contents:**
- Client React DOM APIs
- Client APIs
- Browser support

The react-dom/client APIs let you render React components on the client (in the browser). These APIs are typically used at the top level of your app to initialize your React tree. A framework may call them for you. Most of your components don’t need to import or use them.

React supports all popular browsers, including Internet Explorer 9 and above. Some polyfills are required for older browsers such as IE 9 and IE 10.

---

## globals

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/globals

**Contents:**
- globals
- Rule Details
  - Invalid
  - Valid

Validates against assignment/mutation of globals during render, part of ensuring that side effects must run outside of render.

Global variables exist outside React’s control. When you modify them during render, you break React’s assumption that rendering is pure. This can cause components to behave differently in development vs production, break Fast Refresh, and make your app impossible to optimize with features like React Compiler.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

**Examples:**

Example 1 (javascript):
```javascript
// ❌ Global counterlet renderCount = 0;function Component() {  renderCount++; // Mutating global  return <div>Count: {renderCount}</div>;}// ❌ Modifying window propertiesfunction Component({userId}) {  window.currentUser = userId; // Global mutation  return <div>User: {userId}</div>;}// ❌ Global array pushconst events = [];function Component({event}) {  events.push(event); // Mutating global array  return <div>Events: {events.length}</div>;}// ❌ Cache manipulationconst cache = {};function Component({id}) {  if (!cache[id]) {    cache[id] = fetchData(id); // Modifying cache during render  }  return <div>{cache[id]}</div>;}
```

Example 2 (jsx):
```jsx
// ✅ Use state for countersfunction Component() {  const [clickCount, setClickCount] = useState(0);  const handleClick = () => {    setClickCount(c => c + 1);  };  return (    <button onClick={handleClick}>      Clicked: {clickCount} times    </button>  );}// ✅ Use context for global valuesfunction Component() {  const user = useContext(UserContext);  return <div>User: {user.id}</div>;}// ✅ Synchronize external state with Reactfunction Component({title}) {  useEffect(() => {    document.title = title; // OK in effect  }, [title]);  return <div>Page: {title}</div>;}
```

---

## gating

**URL:** https://react.dev/reference/react-compiler/gating

**Contents:**
- gating
- Reference
  - gating
    - Type
    - Default value
    - Properties
    - Caveats
- Usage
  - Basic feature flag setup
- Troubleshooting

The gating option enables conditional compilation, allowing you to control when optimized code is used at runtime.

Configures runtime feature flag gating for compiled functions.

Note that the gating function is evaluated once at module time, so once the JS bundle has been parsed and evaluated the choice of component stays static for the rest of the browser session.

Verify your flag module exports the correct function:

Ensure the source path is correct:

**Examples:**

Example 1 (json):
```json
{  gating: {    source: 'my-feature-flags',    importSpecifierName: 'shouldUseCompiler'  }}
```

Example 2 (css):
```css
{  source: string;  importSpecifierName: string;} | null
```

Example 3 (javascript):
```javascript
// src/utils/feature-flags.jsexport function shouldUseCompiler() {  // your logic here  return getFeatureFlag('react-compiler-enabled');}
```

Example 4 (json):
```json
{  gating: {    source: './src/utils/feature-flags',    importSpecifierName: 'shouldUseCompiler'  }}
```

---

## target

**URL:** https://react.dev/reference/react-compiler/target

**Contents:**
- target
- Reference
  - target
    - Type
    - Default value
    - Valid values
    - Caveats
- Usage
  - Targeting React 19 (default)
  - Targeting React 17 or 18

The target option specifies which React version the compiler should generate code for.

Configures the React version compatibility for the compiled output.

For React 19, no special configuration is needed:

The compiler will use React 19’s built-in runtime APIs:

For React 17 and React 18 projects, you need two steps:

The compiler will use the polyfill runtime for both versions:

If you see errors like “Cannot find module ‘react/compiler-runtime’“:

Check your React version:

If using React 17 or 18, install the runtime:

Ensure your target matches your React version:

Ensure the runtime package is:

To verify the correct runtime is being used, note the different import (react/compiler-runtime for builtin, react-compiler-runtime standalone package for 17/18):

**Examples:**

Example 1 (css):
```css
{  target: '19' // or '18', '17'}
```

Example 2 (unknown):
```unknown
'17' | '18' | '19'
```

Example 3 (json):
```json
{  // defaults to target: '19'}
```

Example 4 (sql):
```sql
// Compiled output uses React 19's native APIsimport { c as _c } from 'react/compiler-runtime';
```

---

## Configuration

**URL:** https://react.dev/reference/react-compiler/configuration

**Contents:**
- Configuration
  - Note
- Compilation Control
- Version Compatibility
- Error Handling
- Debugging
- Feature Flags
- Common Configuration Patterns
  - Default configuration
  - React 17/18 projects

This page lists all configuration options available in React Compiler.

For most apps, the default options should work out of the box. If you have a special need, you can use these advanced options.

These options control what the compiler optimizes and how it selects components and hooks to compile.

React version configuration ensures the compiler generates code compatible with your React version.

target specifies which React version you’re using (17, 18, or 19).

These options control how the compiler responds to code that doesn’t follow the Rules of React.

panicThreshold determines whether to fail the build or skip problematic components.

Logging and analysis options help you understand what the compiler is doing.

logger provides custom logging for compilation events.

Conditional compilation lets you control when optimized code is used.

gating enables runtime feature flags for A/B testing or gradual rollouts.

For most React 19 applications, the compiler works without configuration:

Older React versions need the runtime package and target configuration:

Start with specific directories and expand gradually:

**Examples:**

Example 1 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    [      'babel-plugin-react-compiler', {        // compiler options      }    ]  ]};
```

Example 2 (css):
```css
{  compilationMode: 'annotation' // Only compile "use memo" functions}
```

Example 3 (css):
```css
// For React 18 projects{  target: '18' // Also requires react-compiler-runtime package}
```

Example 4 (css):
```css
// Recommended for production{  panicThreshold: 'none' // Skip components with errors instead of failing the build}
```

---

## preinit

**URL:** https://react.dev/reference/react-dom/preinit

**Contents:**
- preinit
  - Note
- Reference
  - preinit(href, options)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Preiniting when rendering
    - Examples of preiniting

React-based frameworks frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

preinit lets you eagerly fetch and evaluate a stylesheet or external script.

To preinit a script or stylesheet, call the preinit function from react-dom.

See more examples below.

The preinit function provides the browser with a hint that it should start downloading and executing the given resource, which can save time. Scripts that you preinit are executed when they finish downloading. Stylesheets that you preinit are inserted into the document, which causes them to go into effect right away.

preinit returns nothing.

Call preinit when rendering a component if you know that it or its children will use a specific resource, and you’re OK with the resource being evaluated and thereby taking effect immediately upon being downloaded.

If you want the browser to download the script but not to execute it right away, use preload instead. If you want to load an ESM module, use preinitModule.

Call preinit in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (css):
```css
preinit("https://example.com/script.js", {as: "script"});
```

Example 2 (javascript):
```javascript
import { preinit } from 'react-dom';function AppRoot() {  preinit("https://example.com/script.js", {as: "script"});  // ...}
```

Example 3 (javascript):
```javascript
import { preinit } from 'react-dom';function AppRoot() {  preinit("https://example.com/script.js", {as: "script"});  return ...;}
```

Example 4 (jsx):
```jsx
import { preinit } from 'react-dom';function CallToAction() {  const onClick = () => {    preinit("https://example.com/wizardStyles.css", {as: "style"});    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## forwardRef

**URL:** https://react.dev/reference/react/forwardRef

**Contents:**
- forwardRef
  - Deprecated
- Reference
  - forwardRef(render)
    - Parameters
    - Returns
    - Caveats
  - render function
    - Parameters
    - Returns

In React 19, forwardRef is no longer necessary. Pass ref as a prop instead.

forwardRef will be deprecated in a future release. Learn more here.

forwardRef lets your component expose a DOM node to the parent component with a ref.

Call forwardRef() to let your component receive a ref and forward it to a child component:

See more examples below.

forwardRef returns a React component that you can render in JSX. Unlike React components defined as plain functions, a component returned by forwardRef is also able to receive a ref prop.

forwardRef accepts a render function as an argument. React calls this function with props and ref:

props: The props passed by the parent component.

ref: The ref attribute passed by the parent component. The ref can be an object or a function. If the parent component has not passed a ref, it will be null. You should either pass the ref you receive to another component, or pass it to useImperativeHandle.

forwardRef returns a React component that you can render in JSX. Unlike React components defined as plain functions, the component returned by forwardRef is able to take a ref prop.

By default, each component’s DOM nodes are private. However, sometimes it’s useful to expose a DOM node to the parent—for example, to allow focusing it. To opt in, wrap your component definition into forwardRef():

You will receive a ref as the second argument after props. Pass it to the DOM node that you want to expose:

This lets the parent Form component access the <input> DOM node exposed by MyInput:

This Form component passes a ref to MyInput. The MyInput component forwards that ref to the <input> browser tag. As a result, the Form component can access that <input> DOM node and call focus() on it.

Keep in mind that exposing a ref to the DOM node inside your component makes it harder to change your component’s internals later. You will typically expose DOM nodes from reusable low-level components like buttons or text inputs, but you won’t do it for application-level components like an avatar or a comment.

Clicking the button will focus the input. The Form component defines a ref and passes it to the MyInput component. The MyInput component forwards that ref to the browser <input>. This lets the Form component focus the <input>.

Instead of forwarding a ref to a DOM node, you can forward it to your own component like MyInput:

If that MyInput component forwards a ref to its <input>, a ref to FormField will give you that <input>:

The Form component defines a ref and passes it to FormField. The FormField component forwards that ref to MyInput, which forwards it to a browser <input> DOM node. This is how Form accesses that DOM node.

Instead of exposing an entire DOM node, you can expose a custom object, called an imperative handle, with a more constrained set of methods. To do this, you’d need to define a separate ref to hold the DOM node:

Pass the ref you received to useImperativeHandle and specify the value you want to expose to the ref:

If some component gets a ref to MyInput, it will only receive your { focus, scrollIntoView } object instead of the DOM node. This lets you limit the information you expose about your DOM node to the minimum.

Read more about using imperative handles.

Do not overuse refs. You should only use refs for imperative behaviors that you can’t express as props: for example, scrolling to a node, focusing a node, triggering an animation, selecting text, and so on.

If you can express something as a prop, you should not use a ref. For example, instead of exposing an imperative handle like { open, close } from a Modal component, it is better to take isOpen as a prop like <Modal isOpen={isOpen} />. Effects can help you expose imperative behaviors via props.

This usually means that you forgot to actually use the ref that you received.

For example, this component doesn’t do anything with its ref:

To fix it, pass the ref down to a DOM node or another component that can accept a ref:

The ref to MyInput could also be null if some of the logic is conditional:

If showInput is false, then the ref won’t be forwarded to any node, and a ref to MyInput will remain empty. This is particularly easy to miss if the condition is hidden inside another component, like Panel in this example:

**Examples:**

Example 1 (javascript):
```javascript
const SomeComponent = forwardRef(render)
```

Example 2 (javascript):
```javascript
import { forwardRef } from 'react';const MyInput = forwardRef(function MyInput(props, ref) {  // ...});
```

Example 3 (javascript):
```javascript
const MyInput = forwardRef(function MyInput(props, ref) {  return (    <label>      {props.label}      <input ref={ref} />    </label>  );});
```

Example 4 (javascript):
```javascript
import { forwardRef } from 'react';const MyInput = forwardRef(function MyInput(props, ref) {  const { label, ...otherProps } = props;  return (    <label>      {label}      <input {...otherProps} />    </label>  );});
```

---

## unsupported-syntax

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/unsupported-syntax

**Contents:**
- unsupported-syntax
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - I need to evaluate dynamic code
  - Note

Validates against syntax that React Compiler does not support. If you need to, you can still use this syntax outside of React, such as in a standalone utility function.

React Compiler needs to statically analyze your code to apply optimizations. Features like eval and with make it impossible to statically understand what the code does at compile time, so the compiler can’t optimize components that use them.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You might need to evaluate user-provided code:

Use a safe expression parser instead:

Never use eval with user input - it’s a security risk. Use dedicated parsing libraries for specific use cases like mathematical expressions, JSON parsing, or template evaluation.

**Examples:**

Example 1 (typescript):
```typescript
// ❌ Using eval in componentfunction Component({ code }) {  const result = eval(code); // Can't be analyzed  return <div>{result}</div>;}// ❌ Using with statementfunction Component() {  with (Math) { // Changes scope dynamically    return <div>{sin(PI / 2)}</div>;  }}// ❌ Dynamic property access with evalfunction Component({propName}) {  const value = eval(`props.${propName}`);  return <div>{value}</div>;}
```

Example 2 (typescript):
```typescript
// ✅ Use normal property accessfunction Component({propName, props}) {  const value = props[propName]; // Analyzable  return <div>{value}</div>;}// ✅ Use standard Math methodsfunction Component() {  return <div>{Math.sin(Math.PI / 2)}</div>;}
```

Example 3 (typescript):
```typescript
// ❌ Wrong: eval in componentfunction Calculator({expression}) {  const result = eval(expression); // Unsafe and unoptimizable  return <div>Result: {result}</div>;}
```

Example 4 (jsx):
```jsx
// ✅ Better: Use a safe parserimport {evaluate} from 'mathjs'; // or similar libraryfunction Calculator({expression}) {  const [result, setResult] = useState(null);  const calculate = () => {    try {      // Safe mathematical expression evaluation      setResult(evaluate(expression));    } catch (error) {      setResult('Invalid expression');    }  };  return (    <div>      <button onClick={calculate}>Calculate</button>      {result && <div>Result: {result}</div>}    </div>  );}
```

---

## React Performance tracks

**URL:** https://react.dev/reference/dev-tools/react-performance-tracks

**Contents:**
- React Performance tracks
- Usage
  - Pitfall
  - Using profiling builds
- Tracks
  - Scheduler
    - Renders
    - Cascading updates
  - Components
  - Note

React Performance tracks are specialized custom entries that appear on the Performance panel’s timeline in your browser developer tools.

These tracks are designed to provide developers with comprehensive insights into their React application’s performance by visualizing React-specific events and metrics alongside other critical data sources such as network requests, JavaScript execution, and event loop activity, all synchronized on a unified timeline within the Performance panel for a complete understanding of application behavior.

React Performance tracks are only available in development and profiling builds of React:

If enabled, tracks should appear automatically in the traces you record with the Performance panel of browsers that provide extensibility APIs.

The profiling instrumentation that powers React Performance tracks adds some additional overhead, so it is disabled in production builds by default. Server Components and Server Requests tracks are only available in development builds.

In addition to production and development builds, React also includes a special profiling build. To use profiling builds, you have to use react-dom/profiling instead of react-dom/client. We recommend that you alias react-dom/client to react-dom/profiling at build time via bundler aliases instead of manually updating each react-dom/client import. Your framework might have built-in support for enabling React’s profiling build.

The Scheduler is an internal React concept used for managing tasks with different priorities. This track consists of 4 subtracks, each representing work of a specific priority:

Every render pass consists of multiple phases that you can see on a timeline:

Learn more about renders and commits.

Cascading updates is one of the patterns for performance regressions. If an update was scheduled during a render pass, React could discard completed work and start a new pass.

In development builds, React can show you which Component scheduled a new update. This includes both general updates and cascading ones. You can see the enhanced stack trace by clicking on the “Cascading update” entry, which should also display the name of the method that scheduled an update.

Learn more about Effects.

The Components track visualizes the durations of React components. They are displayed as a flamegraph, where each entry represents the duration of the corresponding component render and all its descendant children components.

Similar to render durations, effect durations are also represented as a flamegraph, but with a different color scheme that aligns with the corresponding phase on the Scheduler track.

Unlike renders, not all effects are shown on the Components track by default.

To maintain performance and prevent UI clutter, React will only display those effects, which had a duration of 0.05ms or longer, or triggered an update.

Additional events may be displayed during the render and effects phases:

In development builds, when you click on a component render entry, you can inspect potential changes in props. You can use this information to identify unnecessary renders.

The Server Requests track visualized all Promises that eventually end up in a React Server Component. This includes any async operations like calling fetch or async Node.js file operations.

React will try to combine Promises that are started from inside third-party code into a single span representing the the duration of the entire operation blocking 1st party code. For example, a third party library method called getUser that calls fetch internally multiple times will be represented as a single span called getUser, instead of showing multiple fetch spans.

Clicking on spans will show you a stack trace of where the Promise was created as well as a view of the value that the Promise resolved to, if available.

Rejected Promises are displayed as red with their rejected value.

The Server Components tracks visualize the durations of React Server Components Promises they awaited. Timings are displayed as a flamegraph, where each entry represents the duration of the corresponding component render and all its descendant children components.

If you await a Promise, React will display duration of that Promise. To see all I/O operations, use the Server Requests track.

Different colors are used to indicate the duration of the component render. The darker the color, the longer the duration.

The Server Components track group will always contain a “Primary” track. If React is able to render Server Components concurrently, it will display addititional “Parallel” tracks. If more than 8 Server Components are rendered concurrently, React will associate them with the last “Parallel” track instead of adding more tracks.

---

## Legacy React APIs

**URL:** https://react.dev/reference/react/legacy

**Contents:**
- Legacy React APIs
- Legacy APIs
- Removed APIs

These APIs are exported from the react package, but they are not recommended for use in newly written code. See the linked individual API pages for the suggested alternatives.

These APIs were removed in React 19:

---

## Static React DOM APIs

**URL:** https://react.dev/reference/react-dom/static

**Contents:**
- Static React DOM APIs
- Static APIs for Web Streams
- Static APIs for Node.js Streams

The react-dom/static APIs let you generate static HTML for React components. They have limited functionality compared to the streaming APIs. A framework may call them for you. Most of your components don’t need to import or use them.

These methods are only available in the environments with Web Streams, which includes browsers, Deno, and some modern edge runtimes:

Node.js also includes these methods for compatibility, but they are not recommended due to worse performance. Use the dedicated Node.js APIs instead.

These methods are only available in the environments with Node.js Streams:

---

## prerender

**URL:** https://react.dev/reference/react-dom/static/prerender

**Contents:**
- prerender
  - Note
- Reference
  - prerender(reactNode, options?)
    - Parameters
    - Returns
    - Caveats
  - Note
  - When should I use prerender?
- Usage

prerender renders a React tree to a static HTML string using a Web Stream.

This API depends on Web Streams. For Node.js, use prerenderToNodeStream instead.

Call prerender to render your app to static HTML.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

reactNode: A React node you want to render to HTML. For example, a JSX node like <App />. It is expected to represent the entire document, so the App component should render the <html> tag.

optional options: An object with static generation options.

prerender returns a Promise:

nonce is not an available option when prerendering. Nonces must be unique per request and if you use nonces to secure your application with CSP it would be inappropriate and insecure to include the nonce value in the prerender itself.

The static prerender API is used for static server-side generation (SSG). Unlike renderToString, prerender waits for all data to load before resolving. This makes it suitable for generating static HTML for a full page, including data that needs to be fetched using Suspense. To stream content as it loads, use a streaming server-side render (SSR) API like renderToReadableStream.

prerender can be aborted and later either continued with resumeAndPrerender or resumed with resume to support partial pre-rendering.

Call prerender to render your React tree to static HTML into a Readable Web Stream::

Along with the root component, you need to provide a list of bootstrap <script> paths. Your root component should return the entire document including the root <html> tag.

For example, it might look like this:

React will inject the doctype and your bootstrap <script> tags into the resulting HTML stream:

On the client, your bootstrap script should hydrate the entire document with a call to hydrateRoot:

This will attach event listeners to the static server-generated HTML and make it interactive.

The final asset URLs (like JavaScript and CSS files) are often hashed after the build. For example, instead of styles.css you might end up with styles.123456.css. Hashing static asset filenames guarantees that every distinct build of the same asset will have a different filename. This is useful because it lets you safely enable long-term caching for static assets: a file with a certain name would never change content.

However, if you don’t know the asset URLs until after the build, there’s no way for you to put them in the source code. For example, hardcoding "/styles.css" into JSX like earlier wouldn’t work. To keep them out of your source code, your root component can read the real filenames from a map passed as a prop:

On the server, render <App assetMap={assetMap} /> and pass your assetMap with the asset URLs:

Since your server is now rendering <App assetMap={assetMap} />, you need to render it with assetMap on the client too to avoid hydration errors. You can serialize and pass assetMap to the client like this:

In the example above, the bootstrapScriptContent option adds an extra inline <script> tag that sets the global window.assetMap variable on the client. This lets the client code read the same assetMap:

Both client and server render App with the same assetMap prop, so there are no hydration errors.

Call prerender to render your app to a static HTML string:

This will produce the initial non-interactive HTML output of your React components. On the client, you will need to call hydrateRoot to hydrate that server-generated HTML and make it interactive.

prerender waits for all data to load before finishing the static HTML generation and resolving. For example, consider a profile page that shows a cover, a sidebar with friends and photos, and a list of posts:

Imagine that <Posts /> needs to load some data, which takes some time. Ideally, you’d want wait for the posts to finish so it’s included in the HTML. To do this, you can use Suspense to suspend on the data, and prerender will wait for the suspended content to finish before resolving to the static HTML.

Only Suspense-enabled data sources will activate the Suspense component. They include:

Suspense does not detect when data is fetched inside an Effect or event handler.

The exact way you would load data in the Posts component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

You can force the prerender to “give up” after a timeout:

Any Suspense boundaries with incomplete children will be included in the prelude in the fallback state.

This can be used for partial prerendering together with resume or resumeAndPrerender.

The prerender response waits for the entire app to finish rendering, including waiting for all Suspense boundaries to resolve, before resolving. It is designed for static site generation (SSG) ahead of time and does not support streaming more content as it loads.

To stream content as it loads, use a streaming server render API like renderToReadableStream.

**Examples:**

Example 1 (csharp):
```csharp
const {prelude, postponed} = await prerender(reactNode, options?)
```

Example 2 (javascript):
```javascript
import { prerender } from 'react-dom/static';async function handler(request, response) {  const {prelude} = await prerender(<App />, {    bootstrapScripts: ['/main.js']  });  return new Response(prelude, {    headers: { 'content-type': 'text/html' },  });}
```

Example 3 (javascript):
```javascript
import { prerender } from 'react-dom/static';async function handler(request) {  const {prelude} = await prerender(<App />, {    bootstrapScripts: ['/main.js']  });  return new Response(prelude, {    headers: { 'content-type': 'text/html' },  });}
```

Example 4 (html):
```html
export default function App() {  return (    <html>      <head>        <meta charSet="utf-8" />        <meta name="viewport" content="width=device-width, initial-scale=1" />        <link rel="stylesheet" href="/styles.css"></link>        <title>My app</title>      </head>      <body>        <Router />      </body>    </html>  );}
```

---

## rules-of-hooks

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/rules-of-hooks

**Contents:**
- rules-of-hooks
- Rule Details
- Common Violations
  - Note
  - use hook
  - Invalid
  - Valid
- Troubleshooting
  - I want to fetch data based on some condition
  - Note

Validates that components and hooks follow the Rules of Hooks.

React relies on the order in which hooks are called to correctly preserve state between renders. Each time your component renders, React expects the exact same hooks to be called in the exact same order. When hooks are called conditionally or in loops, React loses track of which state corresponds to which hook call, leading to bugs like state mismatches and “Rendered fewer/more hooks than expected” errors.

These patterns violate the Rules of Hooks:

The use hook is different from other React hooks. You can call it conditionally and in loops:

However, use still has restrictions:

Learn more: use API Reference

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You’re trying to conditionally call useEffect:

Call the hook unconditionally, check condition inside:

There are better ways to fetch data rather than in a useEffect. Consider using TanStack Query, useSWR, or React Router 6.4+ for data fetching. These solutions handle deduplicating requests, caching responses, and avoiding network waterfalls.

Learn more: Fetching Data

You’re trying to conditionally initialize state:

Always call useState, conditionally set the initial value:

You can configure custom effect hooks using shared ESLint settings (available in eslint-plugin-react-hooks 6.1.1 and later):

This shared configuration is used by both rules-of-hooks and exhaustive-deps rules, ensuring consistent behavior across all hook-related linting.

**Examples:**

Example 1 (javascript):
```javascript
// ✅ `use` can be conditionalif (shouldFetch) {  const data = use(fetchPromise);}// ✅ `use` can be in loopsfor (const promise of promises) {  results.push(use(promise));}
```

Example 2 (jsx):
```jsx
// ❌ Hook in conditionif (isLoggedIn) {  const [user, setUser] = useState(null);}// ❌ Hook after early returnif (!data) return <Loading />;const [processed, setProcessed] = useState(data);// ❌ Hook in callback<button onClick={() => {  const [clicked, setClicked] = useState(false);}}/>// ❌ `use` in try/catchtry {  const data = use(promise);} catch (e) {  // error handling}// ❌ Hook at module levelconst globalState = useState(0); // Outside component
```

Example 3 (javascript):
```javascript
function Component({ isSpecial, shouldFetch, fetchPromise }) {  // ✅ Hooks at top level  const [count, setCount] = useState(0);  const [name, setName] = useState('');  if (!isSpecial) {    return null;  }  if (shouldFetch) {    // ✅ `use` can be conditional    const data = use(fetchPromise);    return <div>{data}</div>;  }  return <div>{name}: {count}</div>;}
```

Example 4 (jsx):
```jsx
// ❌ Conditional hookif (isLoggedIn) {  useEffect(() => {    fetchUserData();  }, []);}
```

---

## resumeAndPrerenderToNodeStream

**URL:** https://react.dev/reference/react-dom/static/resumeAndPrerenderToNodeStream

**Contents:**
- resumeAndPrerenderToNodeStream
  - Note
- Reference
  - resumeAndPrerenderToNodeStream(reactNode, postponedState, options?)
    - Parameters
    - Returns
    - Caveats
  - Note
  - When should I use resumeAndPrerenderToNodeStream?
- Usage

resumeAndPrerenderToNodeStream continues a prerendered React tree to a static HTML string using a a Node.js Stream..

This API is specific to Node.js. Environments with Web Streams, like Deno and modern edge runtimes, should use prerender instead.

Call resumeAndPrerenderToNodeStream to continue a prerendered React tree to a static HTML string.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

resumeAndPrerenderToNodeStream returns a Promise:

nonce is not an available option when prerendering. Nonces must be unique per request and if you use nonces to secure your application with CSP it would be inappropriate and insecure to include the nonce value in the prerender itself.

The static resumeAndPrerenderToNodeStream API is used for static server-side generation (SSG). Unlike renderToString, resumeAndPrerenderToNodeStream waits for all data to load before resolving. This makes it suitable for generating static HTML for a full page, including data that needs to be fetched using Suspense. To stream content as it loads, use a streaming server-side render (SSR) API like renderToReadableStream.

resumeAndPrerenderToNodeStream can be aborted and later either continued with another resumeAndPrerenderToNodeStream or resumed with resume to support partial pre-rendering.

resumeAndPrerenderToNodeStream behaves similarly to prerender but can be used to continue a previously started prerendering process that was aborted. For more information about resuming a prerendered tree, see the resume documentation.

**Examples:**

Example 1 (csharp):
```csharp
const {prelude, postponed} = await resumeAndPrerenderToNodeStream(reactNode, postponedState, options?)
```

Example 2 (javascript):
```javascript
import { resumeAndPrerenderToNodeStream } from 'react-dom/static';import { getPostponedState } from 'storage';async function handler(request, writable) {  const postponedState = getPostponedState(request);  const { prelude } = await resumeAndPrerenderToNodeStream(<App />, JSON.parse(postponedState));  prelude.pipe(writable);}
```

---

## config

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/config

**Contents:**
- config
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - Configuration not working as expected

Validates the compiler configuration options.

React Compiler accepts various configuration options to control its behavior. This rule validates that your configuration uses correct option names and value types, preventing silent failures from typos or incorrect settings.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

Your compiler configuration might have typos or incorrect values:

Check the configuration documentation for valid options:

**Examples:**

Example 1 (css):
```css
// ❌ Unknown option namemodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compileMode: 'all' // Typo: should be compilationMode    }]  ]};// ❌ Invalid option valuemodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'everything' // Invalid: use 'all' or 'infer'    }]  ]};
```

Example 2 (css):
```css
// ✅ Valid compiler configurationmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'infer',      panicThreshold: 'critical_errors'    }]  ]};
```

Example 3 (css):
```css
// ❌ Wrong: Common configuration mistakesmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      // Typo in option name      compilationMod: 'all',      // Wrong value type      panicThreshold: true,      // Unknown option      optimizationLevel: 'max'    }]  ]};
```

Example 4 (css):
```css
// ✅ Better: Valid configurationmodule.exports = {  plugins: [    ['babel-plugin-react-compiler', {      compilationMode: 'all', // or 'infer'      panicThreshold: 'none', // or 'critical_errors', 'all_errors'      // Only use documented options    }]  ]};
```

---

## Rules of React

**URL:** https://react.dev/reference/rules

**Contents:**
- Rules of React
  - Note
- Components and Hooks must be pure
- React calls Components and Hooks
- Rules of Hooks

Just as different programming languages have their own ways of expressing concepts, React has its own idioms — or rules — for how to express patterns in a way that is easy to understand and yields high-quality applications.

To learn more about expressing UIs with React, we recommend reading Thinking in React.

This section describes the rules you need to follow to write idiomatic React code. Writing idiomatic React code can help you write well organized, safe, and composable applications. These properties make your app more resilient to changes and makes it easier to work with other developers, libraries, and tools.

These rules are known as the Rules of React. They are rules – and not just guidelines – in the sense that if they are broken, your app likely has bugs. Your code also becomes unidiomatic and harder to understand and reason about.

We strongly recommend using Strict Mode alongside React’s ESLint plugin to help your codebase follow the Rules of React. By following the Rules of React, you’ll be able to find and address these bugs and keep your application maintainable.

Purity in Components and Hooks is a key rule of React that makes your app predictable, easy to debug, and allows React to automatically optimize your code.

React is responsible for rendering components and hooks when necessary to optimize the user experience. It is declarative: you tell React what to render in your component’s logic, and React will figure out how best to display it to your user.

Hooks are defined using JavaScript functions, but they represent a special type of reusable UI logic with restrictions on where they can be called. You need to follow the Rules of Hooks when using them.

---

## cacheSignal

**URL:** https://react.dev/reference/react/cacheSignal

**Contents:**
- cacheSignal
  - React Server Components
- Reference
  - cacheSignal
    - Parameters
    - Returns
    - Caveats
- Usage
  - Cancel in-flight requests
  - Pitfall

cacheSignal is currently only used with React Server Components.

cacheSignal allows you to know when the cache() lifetime is over.

Call cacheSignal to get an AbortSignal.

When React has finished rendering, the AbortSignal will be aborted. This allows you to cancel any in-flight work that is no longer needed. Rendering is considered finished when:

This function does not accept any parameters.

cacheSignal returns an AbortSignal if called during rendering. Otherwise cacheSignal() returns null.

Call cacheSignal to abort in-flight requests.

You can’t use cacheSignal to abort async work that was started outside of rendering e.g.

If a function throws, it may be due to cancellation (e.g. the Database connection has been closed). You can use the aborted property to check if the error was due to cancellation or a real error. You may want to ignore errors that were due to cancellation.

**Examples:**

Example 1 (javascript):
```javascript
const signal = cacheSignal();
```

Example 2 (javascript):
```javascript
import {cacheSignal} from 'react';async function Component() {  await fetch(url, { signal: cacheSignal() });}
```

Example 3 (javascript):
```javascript
import {cache, cacheSignal} from 'react';const dedupedFetch = cache(fetch);async function Component() {  await dedupedFetch(url, { signal: cacheSignal() });}
```

Example 4 (javascript):
```javascript
import {cacheSignal} from 'react';// 🚩 Pitfall: The request will not actually be aborted if the rendering of `Component` is finished.const response = fetch(url, { signal: cacheSignal() });async function Component() {  await response;}
```

---

## renderToPipeableStream

**URL:** https://react.dev/reference/react-dom/server/renderToPipeableStream

**Contents:**
- renderToPipeableStream
  - Note
- Reference
  - renderToPipeableStream(reactNode, options?)
    - Parameters
    - Returns
- Usage
  - Rendering a React tree as HTML to a Node.js Stream
      - Deep Dive
    - Reading CSS and JS asset paths from the build output

renderToPipeableStream renders a React tree to a pipeable Node.js Stream.

This API is specific to Node.js. Environments with Web Streams, like Deno and modern edge runtimes, should use renderToReadableStream instead.

Call renderToPipeableStream to render your React tree as HTML into a Node.js Stream.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

reactNode: A React node you want to render to HTML. For example, a JSX element like <App />. It is expected to represent the entire document, so the App component should render the <html> tag.

optional options: An object with streaming options.

renderToPipeableStream returns an object with two methods:

Call renderToPipeableStream to render your React tree as HTML into a Node.js Stream:

Along with the root component, you need to provide a list of bootstrap <script> paths. Your root component should return the entire document including the root <html> tag.

For example, it might look like this:

React will inject the doctype and your bootstrap <script> tags into the resulting HTML stream:

On the client, your bootstrap script should hydrate the entire document with a call to hydrateRoot:

This will attach event listeners to the server-generated HTML and make it interactive.

The final asset URLs (like JavaScript and CSS files) are often hashed after the build. For example, instead of styles.css you might end up with styles.123456.css. Hashing static asset filenames guarantees that every distinct build of the same asset will have a different filename. This is useful because it lets you safely enable long-term caching for static assets: a file with a certain name would never change content.

However, if you don’t know the asset URLs until after the build, there’s no way for you to put them in the source code. For example, hardcoding "/styles.css" into JSX like earlier wouldn’t work. To keep them out of your source code, your root component can read the real filenames from a map passed as a prop:

On the server, render <App assetMap={assetMap} /> and pass your assetMap with the asset URLs:

Since your server is now rendering <App assetMap={assetMap} />, you need to render it with assetMap on the client too to avoid hydration errors. You can serialize and pass assetMap to the client like this:

In the example above, the bootstrapScriptContent option adds an extra inline <script> tag that sets the global window.assetMap variable on the client. This lets the client code read the same assetMap:

Both client and server render App with the same assetMap prop, so there are no hydration errors.

Streaming allows the user to start seeing the content even before all the data has loaded on the server. For example, consider a profile page that shows a cover, a sidebar with friends and photos, and a list of posts:

Imagine that loading data for <Posts /> takes some time. Ideally, you’d want to show the rest of the profile page content to the user without waiting for the posts. To do this, wrap Posts in a <Suspense> boundary:

This tells React to start streaming the HTML before Posts loads its data. React will send the HTML for the loading fallback (PostsGlimmer) first, and then, when Posts finishes loading its data, React will send the remaining HTML along with an inline <script> tag that replaces the loading fallback with that HTML. From the user’s perspective, the page will first appear with the PostsGlimmer, later replaced by the Posts.

You can further nest <Suspense> boundaries to create a more granular loading sequence:

In this example, React can start streaming the page even earlier. Only ProfileLayout and ProfileCover must finish rendering first because they are not wrapped in any <Suspense> boundary. However, if Sidebar, Friends, or Photos need to load some data, React will send the HTML for the BigSpinner fallback instead. Then, as more data becomes available, more content will continue to be revealed until all of it becomes visible.

Streaming does not need to wait for React itself to load in the browser, or for your app to become interactive. The HTML content from the server will get progressively revealed before any of the <script> tags load.

Read more about how streaming HTML works.

Only Suspense-enabled data sources will activate the Suspense component. They include:

Suspense does not detect when data is fetched inside an Effect or event handler.

The exact way you would load data in the Posts component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

The part of your app outside of any <Suspense> boundaries is called the shell:

It determines the earliest loading state that the user may see:

If you wrap the whole app into a <Suspense> boundary at the root, the shell will only contain that spinner. However, that’s not a pleasant user experience because seeing a big spinner on the screen can feel slower and more annoying than waiting a bit more and seeing the real layout. This is why usually you’ll want to place the <Suspense> boundaries so that the shell feels minimal but complete—like a skeleton of the entire page layout.

The onShellReady callback fires when the entire shell has been rendered. Usually, you’ll start streaming then:

By the time onShellReady fires, components in nested <Suspense> boundaries might still be loading data.

By default, all errors on the server are logged to console. You can override this behavior to log crash reports:

If you provide a custom onError implementation, don’t forget to also log errors to the console like above.

In this example, the shell contains ProfileLayout, ProfileCover, and PostsGlimmer:

If an error occurs while rendering those components, React won’t have any meaningful HTML to send to the client. Override onShellError to send a fallback HTML that doesn’t rely on server rendering as the last resort:

If there is an error while generating the shell, both onError and onShellError will fire. Use onError for error reporting and use onShellError to send the fallback HTML document. Your fallback HTML does not have to be an error page. Instead, you may include an alternative shell that renders your app on the client only.

In this example, the <Posts /> component is wrapped in <Suspense> so it is not a part of the shell:

If an error happens in the Posts component or somewhere inside it, React will try to recover from it:

If retrying rendering Posts on the client also fails, React will throw the error on the client. As with all the errors thrown during rendering, the closest parent error boundary determines how to present the error to the user. In practice, this means that the user will see a loading indicator until it is certain that the error is not recoverable.

If retrying rendering Posts on the client succeeds, the loading fallback from the server will be replaced with the client rendering output. The user will not know that there was a server error. However, the server onError callback and the client onRecoverableError callbacks will fire so that you can get notified about the error.

Streaming introduces a tradeoff. You want to start streaming the page as early as possible so that the user can see the content sooner. However, once you start streaming, you can no longer set the response status code.

By dividing your app into the shell (above all <Suspense> boundaries) and the rest of the content, you’ve already solved a part of this problem. If the shell errors, you’ll get the onShellError callback which lets you set the error status code. Otherwise, you know that the app may recover on the client, so you can send “OK”.

If a component outside the shell (i.e. inside a <Suspense> boundary) throws an error, React will not stop rendering. This means that the onError callback will fire, but you will still get onShellReady instead of onShellError. This is because React will try to recover from that error on the client, as described above.

However, if you’d like, you can use the fact that something has errored to set the status code:

This will only catch errors outside the shell that happened while generating the initial shell content, so it’s not exhaustive. If knowing whether an error occurred for some content is critical, you can move it up into the shell.

You can create your own Error subclasses and use the instanceof operator to check which error is thrown. For example, you can define a custom NotFoundError and throw it from your component. Then your onError, onShellReady, and onShellError callbacks can do something different depending on the error type:

Keep in mind that once you emit the shell and start streaming, you can’t change the status code.

Streaming offers a better user experience because the user can see the content as it becomes available.

However, when a crawler visits your page, or if you’re generating the pages at the build time, you might want to let all of the content load first and then produce the final HTML output instead of revealing it progressively.

You can wait for all the content to load using the onAllReady callback:

A regular visitor will get a stream of progressively loaded content. A crawler will receive the final HTML output after all the data loads. However, this also means that the crawler will have to wait for all data, some of which might be slow to load or error. Depending on your app, you could choose to send the shell to the crawlers too.

You can force the server rendering to “give up” after a timeout:

React will flush the remaining loading fallbacks as HTML, and will attempt to render the rest on the client.

**Examples:**

Example 1 (unknown):
```unknown
const { pipe, abort } = renderToPipeableStream(reactNode, options?)
```

Example 2 (jsx):
```jsx
import { renderToPipeableStream } from 'react-dom/server';const { pipe } = renderToPipeableStream(<App />, {  bootstrapScripts: ['/main.js'],  onShellReady() {    response.setHeader('content-type', 'text/html');    pipe(response);  }});
```

Example 3 (jsx):
```jsx
import { renderToPipeableStream } from 'react-dom/server';// The route handler syntax depends on your backend frameworkapp.use('/', (request, response) => {  const { pipe } = renderToPipeableStream(<App />, {    bootstrapScripts: ['/main.js'],    onShellReady() {      response.setHeader('content-type', 'text/html');      pipe(response);    }  });});
```

Example 4 (html):
```html
export default function App() {  return (    <html>      <head>        <meta charSet="utf-8" />        <meta name="viewport" content="width=device-width, initial-scale=1" />        <link rel="stylesheet" href="/styles.css"></link>        <title>My app</title>      </head>      <body>        <Router />      </body>    </html>  );}
```

---

## experimental_taintObjectReference - This feature is available in the latest Experimental version of React

**URL:** https://react.dev/reference/react/experimental_taintObjectReference

**Contents:**
- experimental_taintObjectReference - This feature is available in the latest Experimental version of React
  - Experimental Feature
- Reference
  - taintObjectReference(message, object)
    - Parameters
    - Returns
    - Caveats
  - Pitfall
- Usage
  - Prevent user data from unintentionally reaching the client

This API is experimental and is not available in a stable version of React yet.

You can try it by upgrading React packages to the most recent experimental version:

Experimental versions of React may contain bugs. Don’t use them in production.

This API is only available inside React Server Components.

taintObjectReference lets you prevent a specific object instance from being passed to a Client Component like a user object.

To prevent passing a key, hash or token, see taintUniqueValue.

Call taintObjectReference with an object to register it with React as something that should not be allowed to be passed to the Client as is:

See more examples below.

message: The message you want to display if the object gets passed to a Client Component. This message will be displayed as a part of the Error that will be thrown if the object gets passed to a Client Component.

object: The object to be tainted. Functions and class instances can be passed to taintObjectReference as object. Functions and classes are already blocked from being passed to Client Components but the React’s default error message will be replaced by what you defined in message. When a specific instance of a Typed Array is passed to taintObjectReference as object, any other copies of the Typed Array will not be tainted.

experimental_taintObjectReference returns undefined.

Do not rely on just tainting for security. Tainting an object doesn’t prevent leaking of every possible derived value. For example, the clone of a tainted object will create a new untainted object. Using data from a tainted object (e.g. {secret: taintedObj.secret}) will create a new value or object that is not tainted. Tainting is a layer of protection; a secure app will have multiple layers of protection, well designed APIs, and isolation patterns.

A Client Component should never accept objects that carry sensitive data. Ideally, the data fetching functions should not expose data that the current user should not have access to. Sometimes mistakes happen during refactoring. To protect against these mistakes happening down the line we can “taint” the user object in our data API.

Now whenever anyone tries to pass this object to a Client Component, an error will be thrown with the passed in error message instead.

If you’re running a Server Components environment that has access to sensitive data, you have to be careful not to pass objects straight through:

Ideally, the getUser should not expose data that the current user should not have access to. To prevent passing the user object to a Client Component down the line we can “taint” the user object:

Now if anyone tries to pass the user object to a Client Component, an error will be thrown with the passed in error message.

**Examples:**

Example 1 (unknown):
```unknown
experimental_taintObjectReference(message, object);
```

Example 2 (sql):
```sql
import {experimental_taintObjectReference} from 'react';experimental_taintObjectReference(  'Do not pass ALL environment variables to the client.',  process.env);
```

Example 3 (javascript):
```javascript
import {experimental_taintObjectReference} from 'react';export async function getUser(id) {  const user = await db`SELECT * FROM users WHERE id = ${id}`;  experimental_taintObjectReference(    'Do not pass the entire user object to the client. ' +      'Instead, pick off the specific properties you need for this use case.',    user,  );  return user;}
```

Example 4 (javascript):
```javascript
// api.jsexport async function getUser(id) {  const user = await db`SELECT * FROM users WHERE id = ${id}`;  return user;}
```

---

## act

**URL:** https://react.dev/reference/react/act

**Contents:**
- act
  - Note
- Reference
  - await act(async actFn)
  - Note
    - Parameters
    - Returns
- Usage
  - Rendering components in tests
  - Dispatching events in tests

act is a test helper to apply pending React updates before making assertions.

To prepare a component for assertions, wrap the code rendering it and performing updates inside an await act() call. This makes your test run closer to how React works in the browser.

You might find using act() directly a bit too verbose. To avoid some of the boilerplate, you could use a library like React Testing Library, whose helpers are wrapped with act().

When writing UI tests, tasks like rendering, user events, or data fetching can be considered as “units” of interaction with a user interface. React provides a helper called act() that makes sure all updates related to these “units” have been processed and applied to the DOM before you make any assertions.

The name act comes from the Arrange-Act-Assert pattern.

We recommend using act with await and an async function. Although the sync version works in many cases, it doesn’t work in all cases and due to the way React schedules updates internally, it’s difficult to predict when you can use the sync version.

We will deprecate and remove the sync version in the future.

act does not return anything.

When testing a component, you can use act to make assertions about its output.

For example, let’s say we have this Counter component, the usage examples below show how to test it:

To test the render output of a component, wrap the render inside act():

Here, we create a container, append it to the document, and render the Counter component inside act(). This ensures that the component is rendered and its effects are applied before making assertions.

Using act ensures that all updates have been applied before we make assertions.

To test events, wrap the event dispatch inside act():

Here, we render the component with act, and then dispatch the event inside another act(). This ensures that all updates from the event are applied before making assertions.

Don’t forget that dispatching DOM events only works when the DOM container is added to the document. You can use a library like React Testing Library to reduce the boilerplate code.

Using act requires setting global.IS_REACT_ACT_ENVIRONMENT=true in your test environment. This is to ensure that act is only used in the correct environment.

If you don’t set the global, you will see an error like this:

To fix, add this to your global setup file for React tests:

In testing frameworks like React Testing Library, IS_REACT_ACT_ENVIRONMENT is already set for you.

**Examples:**

Example 1 (csharp):
```csharp
await act(async actFn)
```

Example 2 (jsx):
```jsx
it ('renders with button disabled', async () => {  await act(async () => {    root.render(<TestComponent />)  });  expect(container.querySelector('button')).toBeDisabled();});
```

Example 3 (jsx):
```jsx
function Counter() {  const [count, setCount] = useState(0);  const handleClick = () => {    setCount(prev => prev + 1);  }  useEffect(() => {    document.title = `You clicked ${count} times`;  }, [count]);  return (    <div>      <p>You clicked {count} times</p>      <button onClick={handleClick}>        Click me      </button>    </div>  )}
```

Example 4 (jsx):
```jsx
import {act} from 'react';import ReactDOMClient from 'react-dom/client';import Counter from './Counter';it('can render and update a counter', async () => {  container = document.createElement('div');  document.body.appendChild(container);    // ✅ Render the component inside act().  await act(() => {    ReactDOMClient.createRoot(container).render(<Counter />);  });    const button = container.querySelector('button');  const label = container.querySelector('p');  expect(label.textContent).toBe('You clicked 0 times');  expect(document.title).toBe('You clicked 0 times');});
```

---

## preinitModule

**URL:** https://react.dev/reference/react-dom/preinitModule

**Contents:**
- preinitModule
  - Note
- Reference
  - preinitModule(href, options)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Preloading when rendering
  - Preloading in an event handler

React-based frameworks frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

preinitModule lets you eagerly fetch and evaluate an ESM module.

To preinit an ESM module, call the preinitModule function from react-dom.

See more examples below.

The preinitModule function provides the browser with a hint that it should start downloading and executing the given module, which can save time. Modules that you preinit are executed when they finish downloading.

preinitModule returns nothing.

Call preinitModule when rendering a component if you know that it or its children will use a specific module and you’re OK with the module being evaluated and thereby taking effect immediately upon being downloaded.

If you want the browser to download the module but not to execute it right away, use preloadModule instead. If you want to preinit a script that isn’t an ESM module, use preinit.

Call preinitModule in an event handler before transitioning to a page or state where the module will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (css):
```css
preinitModule("https://example.com/module.js", {as: "script"});
```

Example 2 (javascript):
```javascript
import { preinitModule } from 'react-dom';function AppRoot() {  preinitModule("https://example.com/module.js", {as: "script"});  // ...}
```

Example 3 (javascript):
```javascript
import { preinitModule } from 'react-dom';function AppRoot() {  preinitModule("https://example.com/module.js", {as: "script"});  return ...;}
```

Example 4 (jsx):
```jsx
import { preinitModule } from 'react-dom';function CallToAction() {  const onClick = () => {    preinitModule("https://example.com/module.js", {as: "script"});    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## React Reference Overview

**URL:** https://react.dev/reference/react

**Contents:**
- React Reference Overview
- React
- React DOM
- React Compiler
- ESLint Plugin React Hooks
- Rules of React
- Legacy APIs

This section provides detailed reference documentation for working with React. For an introduction to React, please visit the Learn section.

The React reference documentation is broken down into functional subsections:

Programmatic React features:

React DOM contains features that are only supported for web applications (which run in the browser DOM environment). This section is broken into the following:

The React Compiler is a build-time optimization tool that automatically memoizes your React components and values:

The ESLint plugin for React Hooks helps enforce the Rules of React:

React has idioms — or rules — for how to express patterns in a way that is easy to understand and yields high-quality applications:

---

## resume

**URL:** https://react.dev/reference/react-dom/server/resume

**Contents:**
- resume
  - Note
- Reference
  - resume(node, postponedState, options?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Resuming a prerender
  - Further reading

resume streams a pre-rendered React tree to a Readable Web Stream.

This API depends on Web Streams. For Node.js, use resumeToNodeStream instead.

Call resume to resume rendering a pre-rendered React tree as HTML into a Readable Web Stream.

See more examples below.

resume returns a Promise:

The returned stream has an additional property:

Resuming behaves like renderToReadableStream. For more examples, check out the usage section of renderToReadableStream. The usage section of prerender includes examples of how to use prerender specifically.

**Examples:**

Example 1 (javascript):
```javascript
const stream = await resume(reactNode, postponedState, options?)
```

Example 2 (javascript):
```javascript
import { resume } from 'react-dom/server';import {getPostponedState} from './storage';async function handler(request, writable) {  const postponed = await getPostponedState(request);  const resumeStream = await resume(<App />, postponed);  return resumeStream.pipeTo(writable)}
```

---

## isValidElement

**URL:** https://react.dev/reference/react/isValidElement

**Contents:**
- isValidElement
- Reference
  - isValidElement(value)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Checking if something is a React element
      - Deep Dive
    - React elements vs React nodes

isValidElement checks whether a value is a React element.

Call isValidElement(value) to check whether value is a React element.

See more examples below.

isValidElement returns true if the value is a React element. Otherwise, it returns false.

Call isValidElement to check if some value is a React element.

For React elements, isValidElement returns true:

Any other values, such as strings, numbers, or arbitrary objects and arrays, are not React elements.

For them, isValidElement returns false:

It is very uncommon to need isValidElement. It’s mostly useful if you’re calling another API that only accepts elements (like cloneElement does) and you want to avoid an error when your argument is not a React element.

Unless you have some very specific reason to add an isValidElement check, you probably don’t need it.

When you write a component, you can return any kind of React node from it:

Note isValidElement checks whether the argument is a React element, not whether it’s a React node. For example, 42 is not a valid React element. However, it is a perfectly valid React node:

This is why you shouldn’t use isValidElement as a way to check whether something can be rendered.

**Examples:**

Example 1 (javascript):
```javascript
const isElement = isValidElement(value)
```

Example 2 (jsx):
```jsx
import { isValidElement, createElement } from 'react';// ✅ React elementsconsole.log(isValidElement(<p />)); // trueconsole.log(isValidElement(createElement('p'))); // true// ❌ Not React elementsconsole.log(isValidElement(25)); // falseconsole.log(isValidElement('Hello')); // falseconsole.log(isValidElement({ age: 42 })); // false
```

Example 3 (jsx):
```jsx
import { isValidElement, createElement } from 'react';// ✅ JSX tags are React elementsconsole.log(isValidElement(<p />)); // trueconsole.log(isValidElement(<MyComponent />)); // true// ✅ Values returned by createElement are React elementsconsole.log(isValidElement(createElement('p'))); // trueconsole.log(isValidElement(createElement(MyComponent))); // true
```

Example 4 (jsx):
```jsx
// ❌ These are *not* React elementsconsole.log(isValidElement(null)); // falseconsole.log(isValidElement(25)); // falseconsole.log(isValidElement('Hello')); // falseconsole.log(isValidElement({ age: 42 })); // falseconsole.log(isValidElement([<div />, <div />])); // falseconsole.log(isValidElement(MyComponent)); // false
```

---

## Server React DOM APIs

**URL:** https://react.dev/reference/react-dom/server

**Contents:**
- Server React DOM APIs
- Server APIs for Web Streams
  - Note
- Server APIs for Node.js Streams
- Legacy Server APIs for non-streaming environments

The react-dom/server APIs let you server-side render React components to HTML. These APIs are only used on the server at the top level of your app to generate the initial HTML. A framework may call them for you. Most of your components don’t need to import or use them.

These methods are only available in the environments with Web Streams, which includes browsers, Deno, and some modern edge runtimes:

Node.js also includes these methods for compatibility, but they are not recommended due to worse performance. Use the dedicated Node.js APIs instead.

These methods are only available in the environments with Node.js Streams:

These methods can be used in the environments that don’t support streams:

They have limited functionality compared to the streaming APIs.

---

## captureOwnerStack

**URL:** https://react.dev/reference/react/captureOwnerStack

**Contents:**
- captureOwnerStack
- Reference
  - captureOwnerStack()
    - Parameters
    - Returns
    - Caveats
      - Deep Dive
    - Owner Stack vs Component Stack
- Usage
  - Enhance a custom error overlay

captureOwnerStack reads the current Owner Stack in development and returns it as a string if available.

Call captureOwnerStack to get the current Owner Stack.

captureOwnerStack does not take any parameters.

captureOwnerStack returns string | null.

Owner Stacks are available in

If no Owner Stack is available, null is returned (see Troubleshooting: The Owner Stack is null).

The Owner Stack is different from the Component Stack available in React error handlers like errorInfo.componentStack in onUncaughtError.

For example, consider the following code:

SubComponent would throw an error. The Component Stack of that error would be

However, the Owner Stack would only read

Neither App nor the DOM components (e.g. fieldset) are considered Owners in this Stack since they didn’t contribute to “creating” the node containing SubComponent. App and DOM components only forwarded the node. App just rendered the children node as opposed to Component which created a node containing SubComponent via <SubComponent />.

Neither Navigation nor legend are in the stack at all since it’s only a sibling to a node containing <SubComponent />.

SubComponent is omitted because it’s already part of the callstack.

If you intercept console.error calls to highlight them in an error overlay, you can call captureOwnerStack to include the Owner Stack.

The call of captureOwnerStack happened outside of a React controlled function e.g. in a setTimeout callback, after a fetch call or in a custom DOM event handler. During render, Effects, React event handlers, and React error handlers (e.g. hydrateRoot#options.onCaughtError) Owner Stacks should be available.

In the example below, clicking the button will log an empty Owner Stack because captureOwnerStack was called during a custom DOM event handler. The Owner Stack must be captured earlier e.g. by moving the call of captureOwnerStack into the Effect body.

captureOwnerStack is only exported in development builds. It will be undefined in production builds. If captureOwnerStack is used in files that are bundled for production and development, you should conditionally access it from a namespace import.

**Examples:**

Example 1 (javascript):
```javascript
const stack = captureOwnerStack();
```

Example 2 (javascript):
```javascript
import * as React from 'react';function Component() {  if (process.env.NODE_ENV !== 'production') {    const ownerStack = React.captureOwnerStack();    console.log(ownerStack);  }}
```

Example 3 (unknown):
```unknown
at SubComponentat fieldsetat Componentat mainat React.Suspenseat App
```

Example 4 (unknown):
```unknown
at Component
```

---

## Server Functions

**URL:** https://react.dev/reference/rsc/server-functions

**Contents:**
- Server Functions
  - React Server Components
  - Note
    - How do I build support for Server Functions?
- Usage
  - Creating a Server Function from a Server Component
  - Importing Server Functions from Client Components
  - Server Functions with Actions
  - Server Functions with Form Actions
  - Server Functions with useActionState

Server Functions are for use in React Server Components.

Note: Until September 2024, we referred to all Server Functions as “Server Actions”. If a Server Function is passed to an action prop or called from inside an action then it is a Server Action, but not all Server Functions are Server Actions. The naming in this documentation has been updated to reflect that Server Functions can be used for multiple purposes.

Server Functions allow Client Components to call async functions executed on the server.

While Server Functions in React 19 are stable and will not break between minor versions, the underlying APIs used to implement Server Functions in a React Server Components bundler or framework do not follow semver and may break between minors in React 19.x.

To support Server Functions as a bundler or framework, we recommend pinning to a specific React version, or using the Canary release. We will continue working with bundlers and frameworks to stabilize the APIs used to implement Server Functions in the future.

When a Server Function is defined with the "use server" directive, your framework will automatically create a reference to the Server Function, and pass that reference to the Client Component. When that function is called on the client, React will send a request to the server to execute the function, and return the result.

Server Functions can be created in Server Components and passed as props to Client Components, or they can be imported and used in Client Components.

Server Components can define Server Functions with the "use server" directive:

When React renders the EmptyNote Server Component, it will create a reference to the createNoteAction function, and pass that reference to the Button Client Component. When the button is clicked, React will send a request to the server to execute the createNoteAction function with the reference provided:

For more, see the docs for "use server".

Client Components can import Server Functions from files that use the "use server" directive:

When the bundler builds the EmptyNote Client Component, it will create a reference to the createNote function in the bundle. When the button is clicked, React will send a request to the server to execute the createNote function using the reference provided:

For more, see the docs for "use server".

Server Functions can be called from Actions on the client:

This allows you to access the isPending state of the Server Function by wrapping it in an Action on the client.

For more, see the docs for Calling a Server Function outside of <form>

Server Functions work with the new Form features in React 19.

You can pass a Server Function to a Form to automatically submit the form to the server:

When the Form submission succeeds, React will automatically reset the form. You can add useActionState to access the pending state, last response, or to support progressive enhancement.

For more, see the docs for Server Functions in Forms.

You can call Server Functions with useActionState for the common case where you just need access to the action pending state and last returned response:

When using useActionState with Server Functions, React will also automatically replay form submissions entered before hydration finishes. This means users can interact with your app even before the app has hydrated.

For more, see the docs for useActionState.

Server Functions also support progressive enhancement with the third argument of useActionState.

When the permalink is provided to useActionState, React will redirect to the provided URL if the form is submitted before the JavaScript bundle loads.

For more, see the docs for useActionState.

**Examples:**

Example 1 (javascript):
```javascript
// Server Componentimport Button from './Button';function EmptyNote () {  async function createNoteAction() {    // Server Function    'use server';        await db.notes.create();  }  return <Button onClick={createNoteAction}/>;}
```

Example 2 (javascript):
```javascript
"use client";export default function Button({onClick}) {   console.log(onClick);   // {$$typeof: Symbol.for("react.server.reference"), $$id: 'createNoteAction'}  return <button onClick={() => onClick()}>Create Empty Note</button>}
```

Example 3 (javascript):
```javascript
"use server";export async function createNote() {  await db.notes.create();}
```

Example 4 (jsx):
```jsx
"use client";import {createNote} from './actions';function EmptyNote() {  console.log(createNote);  // {$$typeof: Symbol.for("react.server.reference"), $$id: 'createNote'}  <button onClick={() => createNote()} />}
```

---

## error-boundaries

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/error-boundaries

**Contents:**
- error-boundaries
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - Why is the linter telling me not to wrap use in try/catch?

Validates usage of Error Boundaries instead of try/catch for errors in child components.

Try/catch blocks can’t catch errors that happen during React’s rendering process. Errors thrown in rendering methods or hooks bubble up through the component tree. Only Error Boundaries can catch these errors.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

The use hook doesn’t throw errors in the traditional sense, it suspends component execution. When use encounters a pending promise, it suspends the component and lets React show a fallback. Only Suspense and Error Boundaries can handle these cases. The linter warns against try/catch around use to prevent confusion as the catch block would never run.

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Try/catch won't catch render errorsfunction Parent() {  try {    return <ChildComponent />; // If this throws, catch won't help  } catch (error) {    return <div>Error occurred</div>;  }}
```

Example 2 (jsx):
```jsx
// ✅ Using error boundaryfunction Parent() {  return (    <ErrorBoundary>      <ChildComponent />    </ErrorBoundary>  );}
```

Example 3 (jsx):
```jsx
// ❌ Try/catch around `use` hookfunction Component({promise}) {  try {    const data = use(promise); // Won't catch - `use` suspends, not throws    return <div>{data}</div>;  } catch (error) {    return <div>Failed to load</div>; // Unreachable  }}// ✅ Error boundary catches `use` errorsfunction App() {  return (    <ErrorBoundary fallback={<div>Failed to load</div>}>      <Suspense fallback={<div>Loading...</div>}>        <DataComponent promise={fetchData()} />      </Suspense>    </ErrorBoundary>  );}
```

---

## renderToReadableStream

**URL:** https://react.dev/reference/react-dom/server/renderToReadableStream

**Contents:**
- renderToReadableStream
  - Note
- Reference
  - renderToReadableStream(reactNode, options?)
    - Parameters
    - Returns
- Usage
  - Rendering a React tree as HTML to a Readable Web Stream
      - Deep Dive
    - Reading CSS and JS asset paths from the build output

renderToReadableStream renders a React tree to a Readable Web Stream.

This API depends on Web Streams. For Node.js, use renderToPipeableStream instead.

Call renderToReadableStream to render your React tree as HTML into a Readable Web Stream.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

reactNode: A React node you want to render to HTML. For example, a JSX element like <App />. It is expected to represent the entire document, so the App component should render the <html> tag.

optional options: An object with streaming options.

renderToReadableStream returns a Promise:

The returned stream has an additional property:

Call renderToReadableStream to render your React tree as HTML into a Readable Web Stream:

Along with the root component, you need to provide a list of bootstrap <script> paths. Your root component should return the entire document including the root <html> tag.

For example, it might look like this:

React will inject the doctype and your bootstrap <script> tags into the resulting HTML stream:

On the client, your bootstrap script should hydrate the entire document with a call to hydrateRoot:

This will attach event listeners to the server-generated HTML and make it interactive.

The final asset URLs (like JavaScript and CSS files) are often hashed after the build. For example, instead of styles.css you might end up with styles.123456.css. Hashing static asset filenames guarantees that every distinct build of the same asset will have a different filename. This is useful because it lets you safely enable long-term caching for static assets: a file with a certain name would never change content.

However, if you don’t know the asset URLs until after the build, there’s no way for you to put them in the source code. For example, hardcoding "/styles.css" into JSX like earlier wouldn’t work. To keep them out of your source code, your root component can read the real filenames from a map passed as a prop:

On the server, render <App assetMap={assetMap} /> and pass your assetMap with the asset URLs:

Since your server is now rendering <App assetMap={assetMap} />, you need to render it with assetMap on the client too to avoid hydration errors. You can serialize and pass assetMap to the client like this:

In the example above, the bootstrapScriptContent option adds an extra inline <script> tag that sets the global window.assetMap variable on the client. This lets the client code read the same assetMap:

Both client and server render App with the same assetMap prop, so there are no hydration errors.

Streaming allows the user to start seeing the content even before all the data has loaded on the server. For example, consider a profile page that shows a cover, a sidebar with friends and photos, and a list of posts:

Imagine that loading data for <Posts /> takes some time. Ideally, you’d want to show the rest of the profile page content to the user without waiting for the posts. To do this, wrap Posts in a <Suspense> boundary:

This tells React to start streaming the HTML before Posts loads its data. React will send the HTML for the loading fallback (PostsGlimmer) first, and then, when Posts finishes loading its data, React will send the remaining HTML along with an inline <script> tag that replaces the loading fallback with that HTML. From the user’s perspective, the page will first appear with the PostsGlimmer, later replaced by the Posts.

You can further nest <Suspense> boundaries to create a more granular loading sequence:

In this example, React can start streaming the page even earlier. Only ProfileLayout and ProfileCover must finish rendering first because they are not wrapped in any <Suspense> boundary. However, if Sidebar, Friends, or Photos need to load some data, React will send the HTML for the BigSpinner fallback instead. Then, as more data becomes available, more content will continue to be revealed until all of it becomes visible.

Streaming does not need to wait for React itself to load in the browser, or for your app to become interactive. The HTML content from the server will get progressively revealed before any of the <script> tags load.

Read more about how streaming HTML works.

Only Suspense-enabled data sources will activate the Suspense component. They include:

Suspense does not detect when data is fetched inside an Effect or event handler.

The exact way you would load data in the Posts component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

The part of your app outside of any <Suspense> boundaries is called the shell:

It determines the earliest loading state that the user may see:

If you wrap the whole app into a <Suspense> boundary at the root, the shell will only contain that spinner. However, that’s not a pleasant user experience because seeing a big spinner on the screen can feel slower and more annoying than waiting a bit more and seeing the real layout. This is why usually you’ll want to place the <Suspense> boundaries so that the shell feels minimal but complete—like a skeleton of the entire page layout.

The async call to renderToReadableStream will resolve to a stream as soon as the entire shell has been rendered. Usually, you’ll start streaming then by creating and returning a response with that stream:

By the time the stream is returned, components in nested <Suspense> boundaries might still be loading data.

By default, all errors on the server are logged to console. You can override this behavior to log crash reports:

If you provide a custom onError implementation, don’t forget to also log errors to the console like above.

In this example, the shell contains ProfileLayout, ProfileCover, and PostsGlimmer:

If an error occurs while rendering those components, React won’t have any meaningful HTML to send to the client. Wrap your renderToReadableStream call in a try...catch to send a fallback HTML that doesn’t rely on server rendering as the last resort:

If there is an error while generating the shell, both onError and your catch block will fire. Use onError for error reporting and use the catch block to send the fallback HTML document. Your fallback HTML does not have to be an error page. Instead, you may include an alternative shell that renders your app on the client only.

In this example, the <Posts /> component is wrapped in <Suspense> so it is not a part of the shell:

If an error happens in the Posts component or somewhere inside it, React will try to recover from it:

If retrying rendering Posts on the client also fails, React will throw the error on the client. As with all the errors thrown during rendering, the closest parent error boundary determines how to present the error to the user. In practice, this means that the user will see a loading indicator until it is certain that the error is not recoverable.

If retrying rendering Posts on the client succeeds, the loading fallback from the server will be replaced with the client rendering output. The user will not know that there was a server error. However, the server onError callback and the client onRecoverableError callbacks will fire so that you can get notified about the error.

Streaming introduces a tradeoff. You want to start streaming the page as early as possible so that the user can see the content sooner. However, once you start streaming, you can no longer set the response status code.

By dividing your app into the shell (above all <Suspense> boundaries) and the rest of the content, you’ve already solved a part of this problem. If the shell errors, your catch block will run which lets you set the error status code. Otherwise, you know that the app may recover on the client, so you can send “OK”.

If a component outside the shell (i.e. inside a <Suspense> boundary) throws an error, React will not stop rendering. This means that the onError callback will fire, but your code will continue running without getting into the catch block. This is because React will try to recover from that error on the client, as described above.

However, if you’d like, you can use the fact that something has errored to set the status code:

This will only catch errors outside the shell that happened while generating the initial shell content, so it’s not exhaustive. If knowing whether an error occurred for some content is critical, you can move it up into the shell.

You can create your own Error subclasses and use the instanceof operator to check which error is thrown. For example, you can define a custom NotFoundError and throw it from your component. Then you can save the error in onError and do something different before returning the response depending on the error type:

Keep in mind that once you emit the shell and start streaming, you can’t change the status code.

Streaming offers a better user experience because the user can see the content as it becomes available.

However, when a crawler visits your page, or if you’re generating the pages at the build time, you might want to let all of the content load first and then produce the final HTML output instead of revealing it progressively.

You can wait for all the content to load by awaiting the stream.allReady Promise:

A regular visitor will get a stream of progressively loaded content. A crawler will receive the final HTML output after all the data loads. However, this also means that the crawler will have to wait for all data, some of which might be slow to load or error. Depending on your app, you could choose to send the shell to the crawlers too.

You can force the server rendering to “give up” after a timeout:

React will flush the remaining loading fallbacks as HTML, and will attempt to render the rest on the client.

**Examples:**

Example 1 (javascript):
```javascript
const stream = await renderToReadableStream(reactNode, options?)
```

Example 2 (javascript):
```javascript
import { renderToReadableStream } from 'react-dom/server';async function handler(request) {  const stream = await renderToReadableStream(<App />, {    bootstrapScripts: ['/main.js']  });  return new Response(stream, {    headers: { 'content-type': 'text/html' },  });}
```

Example 3 (javascript):
```javascript
import { renderToReadableStream } from 'react-dom/server';async function handler(request) {  const stream = await renderToReadableStream(<App />, {    bootstrapScripts: ['/main.js']  });  return new Response(stream, {    headers: { 'content-type': 'text/html' },  });}
```

Example 4 (html):
```html
export default function App() {  return (    <html>      <head>        <meta charSet="utf-8" />        <meta name="viewport" content="width=device-width, initial-scale=1" />        <link rel="stylesheet" href="/styles.css"></link>        <title>My app</title>      </head>      <body>        <Router />      </body>    </html>  );}
```

---

## renderToString

**URL:** https://react.dev/reference/react-dom/server/renderToString

**Contents:**
- renderToString
  - Pitfall
- Reference
  - renderToString(reactNode, options?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Rendering a React tree as HTML to a string
  - Pitfall

renderToString does not support streaming or waiting for data. See the alternatives.

renderToString renders a React tree to an HTML string.

On the server, call renderToString to render your app to HTML.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

reactNode: A React node you want to render to HTML. For example, a JSX node like <App />.

optional options: An object for server render.

renderToString has limited Suspense support. If a component suspends, renderToString immediately sends its fallback as HTML.

renderToString works in the browser, but using it in the client code is not recommended.

Call renderToString to render your app to an HTML string which you can send with your server response:

This will produce the initial non-interactive HTML output of your React components. On the client, you will need to call hydrateRoot to hydrate that server-generated HTML and make it interactive.

renderToString does not support streaming or waiting for data. See the alternatives.

renderToString returns a string immediately, so it does not support streaming content as it loads.

When possible, we recommend using these fully-featured alternatives:

You can continue using renderToString if your server environment does not support streams.

renderToString returns a string immediately, so it does not support waiting for data to load for static HTML generation.

We recommend using these fully-featured alternatives:

You can continue using renderToString if your static site generation environment does not support streams.

Sometimes, renderToString is used on the client to convert some component to HTML.

Importing react-dom/server on the client unnecessarily increases your bundle size and should be avoided. If you need to render some component to HTML in the browser, use createRoot and read HTML from the DOM:

The flushSync call is necessary so that the DOM is updated before reading its innerHTML property.

renderToString does not fully support Suspense.

If some component suspends (for example, because it’s defined with lazy or fetches data), renderToString will not wait for its content to resolve. Instead, renderToString will find the closest <Suspense> boundary above it and render its fallback prop in the HTML. The content will not appear until the client code loads.

To solve this, use one of the recommended streaming solutions. For server side rendering, they can stream content in chunks as it resolves on the server so that the user sees the page being progressively filled in before the client code loads. For static site generation, they can wait for all the content to resolve before generating the static HTML.

**Examples:**

Example 1 (javascript):
```javascript
const html = renderToString(reactNode, options?)
```

Example 2 (jsx):
```jsx
import { renderToString } from 'react-dom/server';const html = renderToString(<App />);
```

Example 3 (jsx):
```jsx
import { renderToString } from 'react-dom/server';// The route handler syntax depends on your backend frameworkapp.use('/', (request, response) => {  const html = renderToString(<App />);  response.send(html);});
```

Example 4 (jsx):
```jsx
// 🚩 Unnecessary: using renderToString on the clientimport { renderToString } from 'react-dom/server';const html = renderToString(<MyIcon />);console.log(html); // For example, "<svg>...</svg>"
```

---

## eslint-plugin-react-hooks - This feature is available in the latest RC version

**URL:** https://react.dev/reference/eslint-plugin-react-hooks

**Contents:**
- eslint-plugin-react-hooks - This feature is available in the latest RC version
  - Note
- Recommended Rules

eslint-plugin-react-hooks provides ESLint rules to enforce the Rules of React.

This plugin helps you catch violations of React’s rules at build time, ensuring your components and hooks follow React’s rules for correctness and performance. The lints cover both fundamental React patterns (exhaustive-deps and rules-of-hooks) and issues flagged by React Compiler. React Compiler diagnostics are automatically surfaced by this ESLint plugin, and can be used even if your app hasn’t adopted the compiler yet.

When the compiler reports a diagnostic, it means that the compiler was able to statically detect a pattern that is not supported or breaks the Rules of React. When it detects this, it automatically skips over those components and hooks, while keeping the rest of your app compiled. This ensures optimal coverage of safe optimizations that won’t break your app.

What this means for linting, is that you don’t need to fix all violations immediately. Address them at your own pace to gradually increase the number of optimized components.

These rules are included in the recommended preset in eslint-plugin-react-hooks:

---

## Built-in React DOM Hooks

**URL:** https://react.dev/reference/react-dom/hooks

**Contents:**
- Built-in React DOM Hooks
- Form Hooks

The react-dom package contains Hooks that are only supported for web applications (which run in the browser DOM environment). These Hooks are not supported in non-browser environments like iOS, Android, or Windows applications. If you are looking for Hooks that are supported in web browsers and other environments see the React Hooks page. This page lists all the Hooks in the react-dom package.

Forms let you create interactive controls for submitting information. To manage forms in your components, use one of these Hooks:

**Examples:**

Example 1 (jsx):
```jsx
function Form({ action }) {  async function increment(n) {    return n + 1;  }  const [count, incrementFormAction] = useActionState(increment, 0);  return (    <form action={action}>      <button formAction={incrementFormAction}>Count: {count}</button>      <Button />    </form>  );}function Button() {  const { pending } = useFormStatus();  return (    <button disabled={pending} type="submit">      Submit    </button>  );}
```

---

## flushSync

**URL:** https://react.dev/reference/react-dom/flushSync

**Contents:**
- flushSync
  - Pitfall
- Reference
  - flushSync(callback)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Flushing updates for third-party integrations
  - Pitfall

Using flushSync is uncommon and can hurt the performance of your app.

flushSync lets you force React to flush any updates inside the provided callback synchronously. This ensures that the DOM is updated immediately.

Call flushSync to force React to flush any pending work and update the DOM synchronously.

Most of the time, flushSync can be avoided. Use flushSync as last resort.

See more examples below.

flushSync returns undefined.

When integrating with third-party code such as browser APIs or UI libraries, it may be necessary to force React to flush updates. Use flushSync to force React to flush any state updates inside the callback synchronously:

This ensures that, by the time the next line of code runs, React has already updated the DOM.

Using flushSync is uncommon, and using it often can significantly hurt the performance of your app. If your app only uses React APIs, and does not integrate with third-party libraries, flushSync should be unnecessary.

However, it can be helpful for integrating with third-party code like browser APIs.

Some browser APIs expect results inside of callbacks to be written to the DOM synchronously, by the end of the callback, so the browser can do something with the rendered DOM. In most cases, React handles this for you automatically. But in some cases it may be necessary to force a synchronous update.

For example, the browser onbeforeprint API allows you to change the page immediately before the print dialog opens. This is useful for applying custom print styles that allow the document to display better for printing. In the example below, you use flushSync inside of the onbeforeprint callback to immediately “flush” the React state to the DOM. Then, by the time the print dialog opens, isPrinting displays “yes”:

Without flushSync, the print dialog will display isPrinting as “no”. This is because React batches the updates asynchronously and the print dialog is displayed before the state is updated.

flushSync can significantly hurt performance, and may unexpectedly force pending Suspense boundaries to show their fallback state.

Most of the time, flushSync can be avoided, so use flushSync as a last resort.

React cannot flushSync in the middle of a render. If you do, it will noop and warn:

This includes calling flushSync inside:

For example, calling flushSync in an Effect will noop and warn:

To fix this, you usually want to move the flushSync call to an event:

If it’s difficult to move to an event, you can defer flushSync in a microtask:

This will allow the current render to finish and schedule another syncronous render to flush the updates.

flushSync can significantly hurt performance, but this particular pattern is even worse for performance. Exhaust all other options before calling flushSync in a microtask as an escape hatch.

**Examples:**

Example 1 (unknown):
```unknown
flushSync(callback)
```

Example 2 (sql):
```sql
import { flushSync } from 'react-dom';flushSync(() => {  setSomething(123);});
```

Example 3 (javascript):
```javascript
flushSync(() => {  setSomething(123);});// By this line, the DOM is updated.
```

Example 4 (javascript):
```javascript
import { useEffect } from 'react';import { flushSync } from 'react-dom';function MyComponent() {  useEffect(() => {    // 🚩 Wrong: calling flushSync inside an effect    flushSync(() => {      setSomething(newValue);    });  }, []);  return <div>{/* ... */}</div>;}
```

---

## startTransition

**URL:** https://react.dev/reference/react/startTransition

**Contents:**
- startTransition
- Reference
  - startTransition(action)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Marking a state update as a non-blocking Transition
  - Note

startTransition lets you render a part of the UI in the background.

The startTransition function lets you mark a state update as a Transition.

See more examples below.

startTransition does not return anything.

startTransition does not provide a way to track whether a Transition is pending. To show a pending indicator while the Transition is ongoing, you need useTransition instead.

You can wrap an update into a Transition only if you have access to the set function of that state. If you want to start a Transition in response to some prop or a custom Hook return value, try useDeferredValue instead.

The function you pass to startTransition is called immediately, marking all state updates that happen while it executes as Transitions. If you try to perform state updates in a setTimeout, for example, they won’t be marked as Transitions.

You must wrap any state updates after any async requests in another startTransition to mark them as Transitions. This is a known limitation that we will fix in the future (see Troubleshooting).

A state update marked as a Transition will be interrupted by other state updates. For example, if you update a chart component inside a Transition, but then start typing into an input while the chart is in the middle of a re-render, React will restart the rendering work on the chart component after handling the input state update.

Transition updates can’t be used to control text inputs.

If there are multiple ongoing Transitions, React currently batches them together. This is a limitation that may be removed in a future release.

You can mark a state update as a Transition by wrapping it in a startTransition call:

Transitions let you keep the user interface updates responsive even on slow devices.

With a Transition, your UI stays responsive in the middle of a re-render. For example, if the user clicks a tab but then change their mind and click another tab, they can do that without waiting for the first re-render to finish.

startTransition is very similar to useTransition, except that it does not provide the isPending flag to track whether a Transition is ongoing. You can call startTransition when useTransition is not available. For example, startTransition works outside components, such as from a data library.

Learn about Transitions and see examples on the useTransition page.

**Examples:**

Example 1 (unknown):
```unknown
startTransition(action)
```

Example 2 (javascript):
```javascript
import { startTransition } from 'react';function TabContainer() {  const [tab, setTab] = useState('about');  function selectTab(nextTab) {    startTransition(() => {      setTab(nextTab);    });  }  // ...}
```

Example 3 (javascript):
```javascript
import { startTransition } from 'react';function TabContainer() {  const [tab, setTab] = useState('about');  function selectTab(nextTab) {    startTransition(() => {      setTab(nextTab);    });  }  // ...}
```

---

## Directives

**URL:** https://react.dev/reference/rsc/directives

**Contents:**
- Directives
  - React Server Components
- Source code directives

Directives are for use in React Server Components.

Directives provide instructions to bundlers compatible with React Server Components.

---

## memo

**URL:** https://react.dev/reference/react/memo

**Contents:**
- memo
  - Note
- Reference
  - memo(Component, arePropsEqual?)
    - Parameters
    - Returns
- Usage
  - Skipping re-rendering when props are unchanged
  - Note
      - Deep Dive

memo lets you skip re-rendering a component when its props are unchanged.

React Compiler automatically applies the equivalent of memo to all components, reducing the need for manual memoization. You can use the compiler to handle component memoization automatically.

Wrap a component in memo to get a memoized version of that component. This memoized version of your component will usually not be re-rendered when its parent component is re-rendered as long as its props have not changed. But React may still re-render it: memoization is a performance optimization, not a guarantee.

See more examples below.

Component: The component that you want to memoize. The memo does not modify this component, but returns a new, memoized component instead. Any valid React component, including functions and forwardRef components, is accepted.

optional arePropsEqual: A function that accepts two arguments: the component’s previous props, and its new props. It should return true if the old and new props are equal: that is, if the component will render the same output and behave in the same way with the new props as with the old. Otherwise it should return false. Usually, you will not specify this function. By default, React will compare each prop with Object.is.

memo returns a new React component. It behaves the same as the component provided to memo except that React will not always re-render it when its parent is being re-rendered unless its props have changed.

React normally re-renders a component whenever its parent re-renders. With memo, you can create a component that React will not re-render when its parent re-renders so long as its new props are the same as the old props. Such a component is said to be memoized.

To memoize a component, wrap it in memo and use the value that it returns in place of your original component:

A React component should always have pure rendering logic. This means that it must return the same output if its props, state, and context haven’t changed. By using memo, you are telling React that your component complies with this requirement, so React doesn’t need to re-render as long as its props haven’t changed. Even with memo, your component will re-render if its own state changes or if a context that it’s using changes.

In this example, notice that the Greeting component re-renders whenever name is changed (because that’s one of its props), but not when address is changed (because it’s not passed to Greeting as a prop):

You should only rely on memo as a performance optimization. If your code doesn’t work without it, find the underlying problem and fix it first. Then you may add memo to improve performance.

If your app is like this site, and most interactions are coarse (like replacing a page or an entire section), memoization is usually unnecessary. On the other hand, if your app is more like a drawing editor, and most interactions are granular (like moving shapes), then you might find memoization very helpful.

Optimizing with memo is only valuable when your component re-renders often with the same exact props, and its re-rendering logic is expensive. If there is no perceptible lag when your component re-renders, memo is unnecessary. Keep in mind that memo is completely useless if the props passed to your component are always different, such as if you pass an object or a plain function defined during rendering. This is why you will often need useMemo and useCallback together with memo.

There is no benefit to wrapping a component in memo in other cases. There is no significant harm to doing that either, so some teams choose to not think about individual cases, and memoize as much as possible. The downside of this approach is that code becomes less readable. Also, not all memoization is effective: a single value that’s “always new” is enough to break memoization for an entire component.

In practice, you can make a lot of memoization unnecessary by following a few principles:

If a specific interaction still feels laggy, use the React Developer Tools profiler to see which components would benefit the most from memoization, and add memoization where needed. These principles make your components easier to debug and understand, so it’s good to follow them in any case. In the long term, we’re researching doing granular memoization automatically to solve this once and for all.

Even when a component is memoized, it will still re-render when its own state changes. Memoization only has to do with props that are passed to the component from its parent.

If you set a state variable to its current value, React will skip re-rendering your component even without memo. You may still see your component function being called an extra time, but the result will be discarded.

Even when a component is memoized, it will still re-render when a context that it’s using changes. Memoization only has to do with props that are passed to the component from its parent.

To make your component re-render only when a part of some context changes, split your component in two. Read what you need from the context in the outer component, and pass it down to a memoized child as a prop.

When you use memo, your component re-renders whenever any prop is not shallowly equal to what it was previously. This means that React compares every prop in your component with its previous value using the Object.is comparison. Note that Object.is(3, 3) is true, but Object.is({}, {}) is false.

To get the most out of memo, minimize the times that the props change. For example, if the prop is an object, prevent the parent component from re-creating that object every time by using useMemo:

A better way to minimize props changes is to make sure the component accepts the minimum necessary information in its props. For example, it could accept individual values instead of a whole object:

Even individual values can sometimes be projected to ones that change less frequently. For example, here a component accepts a boolean indicating the presence of a value rather than the value itself:

When you need to pass a function to memoized component, either declare it outside your component so that it never changes, or useCallback to cache its definition between re-renders.

In rare cases it may be infeasible to minimize the props changes of a memoized component. In that case, you can provide a custom comparison function, which React will use to compare the old and new props instead of using shallow equality. This function is passed as a second argument to memo. It should return true only if the new props would result in the same output as the old props; otherwise it should return false.

If you do this, use the Performance panel in your browser developer tools to make sure that your comparison function is actually faster than re-rendering the component. You might be surprised.

When you do performance measurements, make sure that React is running in the production mode.

If you provide a custom arePropsEqual implementation, you must compare every prop, including functions. Functions often close over the props and state of parent components. If you return true when oldProps.onClick !== newProps.onClick, your component will keep “seeing” the props and state from a previous render inside its onClick handler, leading to very confusing bugs.

Avoid doing deep equality checks inside arePropsEqual unless you are 100% sure that the data structure you’re working with has a known limited depth. Deep equality checks can become incredibly slow and can freeze your app for many seconds if someone changes the data structure later.

When you enable React Compiler, you typically don’t need React.memo anymore. The compiler automatically optimizes component re-rendering for you.

Without React Compiler, you need React.memo to prevent unnecessary re-renders:

With React Compiler enabled, the same optimization happens automatically:

Here’s the key part of what the React Compiler generates:

Notice the highlighted lines: The compiler wraps <ExpensiveChild name="John" /> in a cache check. Since the name prop is always "John", this JSX is created once and reused on every parent re-render. This is exactly what React.memo does - it prevents the child from re-rendering when its props haven’t changed.

The React Compiler automatically:

This means you can safely remove React.memo from your components when using React Compiler. The compiler provides the same optimization automatically, making your code cleaner and easier to maintain.

The compiler’s optimization is actually more comprehensive than React.memo. It also memoizes intermediate values and expensive computations within your components, similar to combining React.memo with useMemo throughout your component tree.

React compares old and new props by shallow equality: that is, it considers whether each new prop is reference-equal to the old prop. If you create a new object or array each time the parent is re-rendered, even if the individual elements are each the same, React will still consider it to be changed. Similarly, if you create a new function when rendering the parent component, React will consider it to have changed even if the function has the same definition. To avoid this, simplify props or memoize props in the parent component.

**Examples:**

Example 1 (javascript):
```javascript
const MemoizedComponent = memo(SomeComponent, arePropsEqual?)
```

Example 2 (javascript):
```javascript
import { memo } from 'react';const SomeComponent = memo(function SomeComponent(props) {  // ...});
```

Example 3 (javascript):
```javascript
const Greeting = memo(function Greeting({ name }) {  return <h1>Hello, {name}!</h1>;});export default Greeting;
```

Example 4 (jsx):
```jsx
function Page() {  const [name, setName] = useState('Taylor');  const [age, setAge] = useState(42);  const person = useMemo(    () => ({ name, age }),    [name, age]  );  return <Profile person={person} />;}const Profile = memo(function Profile({ person }) {  // ...});
```

---

## addTransitionType - This feature is available in the latest Canary version of React

**URL:** https://react.dev/reference/react/addTransitionType

**Contents:**
- addTransitionType - This feature is available in the latest Canary version of React
  - Canary
- Reference
  - addTransitionType
    - Parameters
    - Returns
    - Caveats
- Usage
  - Adding the cause of a transition
  - Customize animations using browser view transition types

The addTransitionType API is currently only available in React’s Canary and Experimental channels.

Learn more about React’s release channels here.

addTransitionType lets you specify the cause of a transition.

addTransitionType does not return anything.

Call addTransitionType inside of startTransition to indicate the cause of a transition:

When you call addTransitionType inside the scope of startTransition, React will associate submit-click as one of the causes for the Transition.

Currently, Transition Types can be used to customize different animations based on what caused the Transition. You have three different ways to choose from for how to use them:

In the future, we plan to support more use cases for using the cause of a transition.

When a ViewTransition activates from a transition, React adds all the Transition Types as browser view transition types to the element.

This allows you to customize different animations based on CSS scopes:

You can customize animations for an activated ViewTransition based on type by passing an object to the View Transition Class:

If multiple types match, then they’re joined together. If no types match then the special “default” entry is used instead. If any type has the value “none” then that wins and the ViewTransition is disabled (not assigned a name).

These can be combined with enter/exit/update/layout/share props to match based on kind of trigger and Transition Type.

You can imperatively customize animations for an activated ViewTransition based on type using View Transition events:

This allows you to pick different imperative Animations based on the cause.

**Examples:**

Example 1 (javascript):
```javascript
startTransition(() => {  addTransitionType('my-transition-type');  setState(newState);});
```

Example 2 (jsx):
```jsx
import { startTransition, addTransitionType } from 'react';function Submit({action) {  function handleClick() {    startTransition(() => {      addTransitionType('submit-click');      action();    });  }  return <button onClick={handleClick}>Click me</button>;}
```

Example 3 (javascript):
```javascript
function Component() {  return (    <ViewTransition>      <div>Hello</div>    </ViewTransition>  );}startTransition(() => {  addTransitionType('my-transition-type');  setShow(true);});
```

Example 4 (julia):
```julia
:root:active-view-transition-type(my-transition-type) {  &::view-transition-...(...) {    ...  }}
```

---

## Compiling Libraries

**URL:** https://react.dev/reference/react-compiler/compiling-libraries

**Contents:**
- Compiling Libraries
- Why Ship Compiled Code?
- Setting Up Compilation
- Backwards Compatibility
  - 1. Install the runtime package
  - 2. Configure the target version
- Testing Strategy
- Troubleshooting
  - Library doesn’t work with older React versions
  - Compilation conflicts with other Babel plugins

This guide helps library authors understand how to use React Compiler to ship optimized library code to their users.

As a library author, you can compile your library code before publishing to npm. This provides several benefits:

Add React Compiler to your library’s build process:

Configure your build tool to compile your library. For example, with Babel:

If your library supports React versions below 19, you’ll need additional configuration:

We recommend installing react-compiler-runtime as a direct dependency:

Set the minimum React version your library supports:

Test your library both with and without compilation to ensure compatibility. Run your existing test suite against the compiled code, and also create a separate test configuration that bypasses the compiler. This helps catch any issues that might arise from the compilation process and ensures your library works correctly in all scenarios.

If your compiled library throws errors in React 17 or 18:

Some Babel plugins may conflict with React Compiler:

If users see “Cannot find module ‘react-compiler-runtime’“:

**Examples:**

Example 1 (python):
```python
npm install -D babel-plugin-react-compiler@latest
```

Example 2 (css):
```css
// babel.config.jsmodule.exports = {  plugins: [    'babel-plugin-react-compiler',  ],  // ... other config};
```

Example 3 (python):
```python
npm install react-compiler-runtime@latest
```

Example 4 (json):
```json
{  "dependencies": {    "react-compiler-runtime": "^1.0.0"  },  "peerDependencies": {    "react": "^17.0.0 || ^18.0.0 || ^19.0.0"  }}
```

---

## logger

**URL:** https://react.dev/reference/react-compiler/logger

**Contents:**
- logger
- Reference
  - logger
    - Type
    - Default value
    - Methods
    - Event types
    - Caveats
- Usage
  - Basic logging

The logger option provides custom logging for React Compiler events during compilation.

Configures custom logging to track compiler behavior and debug issues.

Track compilation success and failures:

Get specific information about compilation failures:

**Examples:**

Example 1 (json):
```json
{  logger: {    logEvent(filename, event) {      console.log(`[Compiler] ${event.kind}: ${filename}`);    }  }}
```

Example 2 (css):
```css
{  logEvent: (filename: string | null, event: LoggerEvent) => void;} | null
```

Example 3 (json):
```json
{  logger: {    logEvent(filename, event) {      switch (event.kind) {        case 'CompileSuccess': {          console.log(`✅ Compiled: ${filename}`);          break;        }        case 'CompileError': {          console.log(`❌ Skipped: ${filename}`);          break;        }        default: {}      }    }  }}
```

Example 4 (json):
```json
{  logger: {    logEvent(filename, event) {      if (event.kind === 'CompileError') {        console.error(`\nCompilation failed: ${filename}`);        console.error(`Reason: ${event.detail.reason}`);        if (event.detail.description) {          console.error(`Details: ${event.detail.description}`);        }        if (event.detail.loc) {          const { line, column } = event.detail.loc.start;          console.error(`Location: Line ${line}, Column ${column}`);        }        if (event.detail.suggestions) {          console.error('Suggestions:', event.detail.suggestions);        }      }    }  }}
```

---

## <StrictMode>

**URL:** https://react.dev/reference/react/StrictMode

**Contents:**
- <StrictMode>
- Reference
  - <StrictMode>
    - Props
    - Caveats
- Usage
  - Enabling Strict Mode for entire app
  - Note
  - Enabling Strict Mode for a part of the app
  - Note

<StrictMode> lets you find common bugs in your components early during development.

Use StrictMode to enable additional development behaviors and warnings for the component tree inside:

See more examples below.

Strict Mode enables the following development-only behaviors:

StrictMode accepts no props.

Strict Mode enables extra development-only checks for the entire component tree inside the <StrictMode> component. These checks help you find common bugs in your components early in the development process.

To enable Strict Mode for your entire app, wrap your root component with <StrictMode> when you render it:

We recommend wrapping your entire app in Strict Mode, especially for newly created apps. If you use a framework that calls createRoot for you, check its documentation for how to enable Strict Mode.

Although the Strict Mode checks only run in development, they help you find bugs that already exist in your code but can be tricky to reliably reproduce in production. Strict Mode lets you fix bugs before your users report them.

Strict Mode enables the following checks in development:

All of these checks are development-only and do not impact the production build.

You can also enable Strict Mode for any part of your application:

In this example, Strict Mode checks will not run against the Header and Footer components. However, they will run on Sidebar and Content, as well as all of the components inside them, no matter how deep.

When StrictMode is enabled for a part of the app, React will only enable behaviors that are possible in production. For example, if <StrictMode> is not enabled at the root of the app, it will not re-run Effects an extra time on initial mount, since this would cause child effects to double fire without the parent effects, which cannot happen in production.

React assumes that every component you write is a pure function. This means that React components you write must always return the same JSX given the same inputs (props, state, and context).

Components breaking this rule behave unpredictably and cause bugs. To help you find accidentally impure code, Strict Mode calls some of your functions (only the ones that should be pure) twice in development. This includes:

If a function is pure, running it twice does not change its behavior because a pure function produces the same result every time. However, if a function is impure (for example, it mutates the data it receives), running it twice tends to be noticeable (that’s what makes it impure!) This helps you spot and fix the bug early.

Here is an example to illustrate how double rendering in Strict Mode helps you find bugs early.

This StoryTray component takes an array of stories and adds one last “Create Story” item at the end:

There is a mistake in the code above. However, it is easy to miss because the initial output appears correct.

This mistake will become more noticeable if the StoryTray component re-renders multiple times. For example, let’s make the StoryTray re-render with a different background color whenever you hover over it:

Notice how every time you hover over the StoryTray component, “Create Story” gets added to the list again. The intention of the code was to add it once at the end. But StoryTray directly modifies the stories array from the props. Every time StoryTray renders, it adds “Create Story” again at the end of the same array. In other words, StoryTray is not a pure function—running it multiple times produces different results.

To fix this problem, you can make a copy of the array, and modify that copy instead of the original one:

This would make the StoryTray function pure. Each time it is called, it would only modify a new copy of the array, and would not affect any external objects or variables. This solves the bug, but you had to make the component re-render more often before it became obvious that something is wrong with its behavior.

In the original example, the bug wasn’t obvious. Now let’s wrap the original (buggy) code in <StrictMode>:

Strict Mode always calls your rendering function twice, so you can see the mistake right away (“Create Story” appears twice). This lets you notice such mistakes early in the process. When you fix your component to render in Strict Mode, you also fix many possible future production bugs like the hover functionality from before:

Without Strict Mode, it was easy to miss the bug until you added more re-renders. Strict Mode made the same bug appear right away. Strict Mode helps you find bugs before you push them to your team and to your users.

Read more about keeping components pure.

If you have React DevTools installed, any console.log calls during the second render call will appear slightly dimmed. React DevTools also offers a setting (off by default) to suppress them completely.

Strict Mode can also help find bugs in Effects.

Every Effect has some setup code and may have some cleanup code. Normally, React calls setup when the component mounts (is added to the screen) and calls cleanup when the component unmounts (is removed from the screen). React then calls cleanup and setup again if its dependencies changed since the last render.

When Strict Mode is on, React will also run one extra setup+cleanup cycle in development for every Effect. This may feel surprising, but it helps reveal subtle bugs that are hard to catch manually.

Here is an example to illustrate how re-running Effects in Strict Mode helps you find bugs early.

Consider this example that connects a component to a chat:

There is an issue with this code, but it might not be immediately clear.

To make the issue more obvious, let’s implement a feature. In the example below, roomId is not hardcoded. Instead, the user can select the roomId that they want to connect to from a dropdown. Click “Open chat” and then select different chat rooms one by one. Keep track of the number of active connections in the console:

You’ll notice that the number of open connections always keeps growing. In a real app, this would cause performance and network problems. The issue is that your Effect is missing a cleanup function:

Now that your Effect “cleans up” after itself and destroys the outdated connections, the leak is solved. However, notice that the problem did not become visible until you’ve added more features (the select box).

In the original example, the bug wasn’t obvious. Now let’s wrap the original (buggy) code in <StrictMode>:

With Strict Mode, you immediately see that there is a problem (the number of active connections jumps to 2). Strict Mode runs an extra setup+cleanup cycle for every Effect. This Effect has no cleanup logic, so it creates an extra connection but doesn’t destroy it. This is a hint that you’re missing a cleanup function.

Strict Mode lets you notice such mistakes early in the process. When you fix your Effect by adding a cleanup function in Strict Mode, you also fix many possible future production bugs like the select box from before:

Notice how the active connection count in the console doesn’t keep growing anymore.

Without Strict Mode, it was easy to miss that your Effect needed cleanup. By running setup → cleanup → setup instead of setup for your Effect in development, Strict Mode made the missing cleanup logic more noticeable.

Read more about implementing Effect cleanup.

Strict Mode can also help find bugs in callbacks refs.

Every callback ref has some setup code and may have some cleanup code. Normally, React calls setup when the element is created (is added to the DOM) and calls cleanup when the element is removed (is removed from the DOM).

When Strict Mode is on, React will also run one extra setup+cleanup cycle in development for every callback ref. This may feel surprising, but it helps reveal subtle bugs that are hard to catch manually.

Consider this example, which allows you to select an animal and then scroll to one of them. Notice when you switch from “Cats” to “Dogs”, the console logs show that the number of animals in the list keeps growing, and the “Scroll to” buttons stop working:

This is a production bug! Since the ref callback doesn’t remove animals from the list in the cleanup, the list of animals keeps growing. This is a memory leak that can cause performance problems in a real app, and breaks the behavior of the app.

The issue is the ref callback doesn’t cleanup after itself:

Now let’s wrap the original (buggy) code in <StrictMode>:

With Strict Mode, you immediately see that there is a problem. Strict Mode runs an extra setup+cleanup cycle for every callback ref. This callback ref has no cleanup logic, so it adds refs but doesn’t remove them. This is a hint that you’re missing a cleanup function.

Strict Mode lets you eagerly find mistakes in callback refs. When you fix your callback by adding a cleanup function in Strict Mode, you also fix many possible future production bugs like the “Scroll to” bug from before:

Now on inital mount in StrictMode, the ref callbacks are all setup, cleaned up, and setup again:

This is expected. Strict Mode confirms that the ref callbacks are cleaned up correctly, so the size never grows above the expected amount. After the fix, there are no memory leaks, and all the features work as expected.

Without Strict Mode, it was easy to miss the bug until you clicked around to app to notice broken features. Strict Mode made the bugs appear right away, before you push them to production.

React warns if some component anywhere inside a <StrictMode> tree uses one of these deprecated APIs:

These APIs are primarily used in older class components so they rarely appear in modern apps.

**Examples:**

Example 1 (jsx):
```jsx
<StrictMode>  <App /></StrictMode>
```

Example 2 (jsx):
```jsx
import { StrictMode } from 'react';import { createRoot } from 'react-dom/client';const root = createRoot(document.getElementById('root'));root.render(  <StrictMode>    <App />  </StrictMode>);
```

Example 3 (jsx):
```jsx
import { StrictMode } from 'react';import { createRoot } from 'react-dom/client';const root = createRoot(document.getElementById('root'));root.render(  <StrictMode>    <App />  </StrictMode>);
```

Example 4 (jsx):
```jsx
import { StrictMode } from 'react';function App() {  return (    <>      <Header />      <StrictMode>        <main>          <Sidebar />          <Content />        </main>      </StrictMode>      <Footer />    </>  );}
```

---

## <ViewTransition> - This feature is available in the latest Canary version of React

**URL:** https://react.dev/reference/react/ViewTransition

**Contents:**
- <ViewTransition> - This feature is available in the latest Canary version of React
  - Canary
- Reference
  - <ViewTransition>
      - Deep Dive
    - How does <ViewTransition> work?
    - Props
    - Callback
  - View Transition Class
  - Styling View Transitions

The <ViewTransition /> API is currently only available in React’s Canary and Experimental channels.

Learn more about React’s release channels here.

<ViewTransition> lets you animate elements that update inside a Transition.

Wrap elements in <ViewTransition> to animate them when they update inside a Transition. React uses the following heuristics to determine if a View Transition activates for an animation:

By default, <ViewTransition> animates with a smooth cross-fade (the browser default view transition). You can customize the animation by providing a View Transition Class to the <ViewTransition> component. You can customize animations for each kind of trigger (see Styling View Transitions).

Under the hood, React applies view-transition-name to inline styles of the nearest DOM node nested inside the <ViewTransition> component. If there are multiple sibling DOM nodes like <ViewTransition><div /><div /></ViewTransition> then React adds a suffix to the name to make each unique but conceptually they’re part of the same one. React doesn’t apply these eagerly but only at the time that boundary should participate in an animation.

React automatically calls startViewTransition itself behind the scenes so you should never do that yourself. In fact, if you have something else on the page running a ViewTransition React will interrupt it. So it’s recommended that you use React itself to coordinate these. If you had other ways of trigger ViewTransitions in the past, we recommend that you migrate to the built-in way.

If there are other React ViewTransitions already running then React will wait for them to finish before starting the next one. However, importantly if there are multiple updates happening while the first one is running, those will all be batched into one. If you start A->B. Then in the meantime you get an update to go to C and then D. When the first A->B animation finishes the next one will animate from B->D.

The getSnapshotBeforeUpdate life-cycle will be called before startViewTransition and some view-transition-name will update at the same time.

Then React calls startViewTransition. Inside the updateCallback, React will:

After the ready Promise of the startViewTransition is resolved, React will then revert the view-transition-name. Then React will invoke the onEnter, onExit, onUpdate and onShare callbacks to allow for manual programmatic control over the Animations. This will be after the built-in default ones have already been computed.

If a flushSync happens to get in the middle of this sequence, then React will skip the Transition since it relies on being able to complete synchronously.

After the finished Promise of the startViewTransition is resolved, React will then invoke useEffect. This prevents those from interfering with the performance of the Animation. However, this is not a guarantee because if another setState happens while the Animation is running it’ll still have to invoke the useEffect earlier to preserve the sequential guarantees.

By default, <ViewTransition> animates with a smooth cross-fade. You can customize the animation, or specify a shared element transition, with these props:

These callbacks allow you to adjust the animation imperatively using the animate APIs:

Each callback receives as arguments:

The View Transition Class is the CSS class name(s) applied by React during the transition when the ViewTransition activates. It can be a string or an object.

The value 'none' can be used to prevent a View Transition from activating for a specific trigger.

In many early examples of View Transitions around the web, you’ll have seen using a view-transition-name and then style it using ::view-transition-...(my-name) selectors. We don’t recommend that for styling. Instead, we normally recommend using a View Transition Class instead.

To customize the animation for a <ViewTransition> you can provide a View Transition Class to one of the activation props. The View Transition Class is a CSS class name that React applies to the child elements when the ViewTransition activates.

For example, to customize an “enter” animation, provide a class name to the enter prop:

When the <ViewTransition> activates an “enter” animation, React will add the class name slide-in. Then you can refer to this class using view transition pseudo selectors to build reusable animations:

In the future, CSS libraries may add built-in animations using View Transition Classes to make this easier to use.

Enter/Exit Transitions trigger when a <ViewTransition> is added or removed by a component in a transition:

When setShow is called, show switches to true and the Child component is rendered. When setShow is called inside startTransition, and Child renders a ViewTransition before any other DOM nodes, an enter animation is triggered.

When show switches back to false, an exit animation is triggered.

<ViewTransition> only activates if it is placed before any DOM node. If Child instead looked like this, no animation would trigger:

Normally, we don’t recommend assigning a name to a <ViewTransition> and instead let React assign it an automatic name. The reason you might want to assign a name is to animate between completely different components when one tree unmounts and another tree mounts at the same time. To preserve continuity.

When one tree unmounts and another mounts, if there’s a pair where the same name exists in the unmounting tree and the mounting tree, they trigger the “share” animation on both. It animates from the unmounting side to the mounting side.

Unlike an exit/enter animation this can be deeply inside the deleted/mounted tree. If a <ViewTransition> would also be eligible for exit/enter, then the “share” animation takes precedence.

If Transition first unmounts one side and then leads to a <Suspense> fallback being shown before eventually the new name being mounted, then no shared element transition happens.

If either the mounted or unmounted side of a pair is outside the viewport, then no pair is formed. This ensures that it doesn’t fly in or out of the viewport when something is scrolled. Instead it’s treated as a regular enter/exit by itself.

This does not happen if the same Component instance changes position, which triggers an “update”. Those animate regardless if one position is outside the viewport.

There’s currently a quirk where if a deeply nested unmounted <ViewTransition> is inside the viewport but the mounted side is not within the viewport, then the unmounted side animates as its own “exit” animation even if it’s deeply nested instead of as part of the parent animation.

It’s important that there’s only one thing with the same name mounted at a time in the entire app. Therefore it’s important to use unique namespaces for the name to avoid conflicts. To ensure you can do this you might want to add a constant in a separate module that you import.

When reordering a list, without updating the content, the “update” animation triggers on each <ViewTransition> in the list if they’re outside a DOM node. Similar to enter/exit animations.

This means that this will trigger the animation on this <ViewTransition>:

However, this wouldn’t animate each individual item:

Instead, any parent <ViewTransition> would cross-fade. If there is no parent <ViewTransition> then there’s no animation in that case.

This means you might want to avoid wrapper elements in lists where you want to allow the Component to control its own reorder animation:

The above rule also applies if one of the items updates to resize, which then causes the siblings to resize, it’ll also animate its sibling <ViewTransition> but only if they’re immediate siblings.

This means that during an update, which causes a lot of re-layout, it doesn’t individually animate every <ViewTransition> on the page. That would lead to a lot of noisy animations which distracts from the actual change. Therefore React is more conservative about when an individual animation triggers.

It’s important to properly use keys to preserve identity when reordering lists. It might seem like you could use “name”, shared element transitions, to animate reorders but that would not trigger if one side was outside the viewport. To animate a reorder you often want to show that it went to a position outside the viewport.

Just like any Transition, React waits for data and new CSS (<link rel="stylesheet" precedence="...">) before running the animation. In addition to this, ViewTransitions also wait up to 500ms for new fonts to load before starting the animation to avoid them flickering in later. For the same reason, an image wrapped in ViewTransition will wait for the image to load.

If it’s inside a new Suspense boundary instance, then the fallback is shown first. After the Suspense boundary fully loads, it triggers the <ViewTransition> to animate the reveal to the content.

Currently, this only happens for client-side Transition. In the future, this will also animate Suspense boundary for streaming SSR when content from the server suspends during the initial load.

There are two ways to animate Suspense boundaries depending on where you place the <ViewTransition>:

In this scenario when the content goes from A to B, it’ll be treated as an “update” and apply that class if appropriate. Both A and B will get the same view-transition-name and therefore they’re acting as a cross-fade by default.

In this scenario, these are two separate ViewTransition instances each with their own view-transition-name. This will be treated as an “exit” of the <A> and an “enter” of the <B>.

You can achieve different effects depending on where you choose to place the <ViewTransition> boundary.

Sometimes you’re wrapping a large existing component, like a whole page, and you want to animate some updates, such as changing the theme. However, you don’t want it to opt-in all updates inside the whole page to cross-fade when they’re updating. Especially if you’re incrementally adding more animations.

You can use the class “none” to opt-out of an animation. By wrapping your children in a “none” you can disable animations for updates to them while the parent still triggers.

This will only animate if the theme changes and not if only the children update. The children can still opt-in again with their own <ViewTransition> but at least it’s manual again.

By default, <ViewTransition> includes the default cross-fade from the browser.

To customize animations, you can provide props to the <ViewTransition> component to specify which animations to use, based on how the <ViewTransition> activates.

For example, we can slow down the default cross fade animation:

And define slow-fade in CSS using view transition classes:

In addition to setting the default, you can also provide configurations for enter, exit, update, and share animations.

You can use the addTransitionType API to add a class name to the child elements when a specific transition type is activated for a specific activation trigger. This allows you to customize the animation for each type of transition.

For example, to customize the animation for all forward and backward navigations:

When the ViewTransition activates a “navigation-back” animation, React will add the class name “slide-right”. When the ViewTransition activates a “navigation-forward” animation, React will add the class name “slide-left”.

In the future, routers and other libraries may add support for standard view-transition types and styles.

React waits for any pending Navigation to finish to ensure that scroll restoration happens within the animation. If the Navigation is blocked on React, your router must unblock in useLayoutEffect since useEffect would lead to a deadlock.

If a startTransition is started from the legacy popstate event, such as during a “back”-navigation then it must finish synchronously to ensure scroll and form restoration works correctly. This is in conflict with running a View Transition animation. Therefore, React will skip animations from popstate. Therefore animations won’t run for the back button. You can fix this by upgrading your router to use the Navigation API.

<ViewTransition> only activates if it is placed before any DOM node:

To fix, ensure that the <ViewTransition> comes before any other DOM nodes:

This error occurs when two <ViewTransition> components with the same name are mounted at the same time:

This will cause the View Transition to error. In development, React detects this issue to surface it and logs two errors:

To fix, ensure that there’s only one <ViewTransition> with the same name mounted at a time in the entire app by ensuring the name is unique, or adding an id to the name:

**Examples:**

Example 1 (sql):
```sql
import {ViewTransition} from 'react';<ViewTransition>  <div>...</div></ViewTransition>
```

Example 2 (jsx):
```jsx
<ViewTransition enter="slide-in">
```

Example 3 (julia):
```julia
::view-transition-group(.slide-in) {  }::view-transition-old(.slide-in) {}::view-transition-new(.slide-in) {}
```

Example 4 (jsx):
```jsx
function Child() {  return (    <ViewTransition>      <div>Hi</div>    </ViewTransition>  );}function Parent() {  const [show, setShow] = useState();  if (show) {    return <Child />;  }  return null;}
```

---

## resumeAndPrerender

**URL:** https://react.dev/reference/react-dom/static/resumeAndPrerender

**Contents:**
- resumeAndPrerender
  - Note
- Reference
  - resumeAndPrerender(reactNode, postponedState, options?)
    - Parameters
    - Returns
    - Caveats
  - Note
  - When should I use resumeAndPrerender?
- Usage

resumeAndPrerender continues a prerendered React tree to a static HTML string using a Web Stream.

This API depends on Web Streams. For Node.js, use resumeAndPrerenderToNodeStream instead.

Call resumeAndPrerender to continue a prerendered React tree to a static HTML string.

On the client, call hydrateRoot to make the server-generated HTML interactive.

See more examples below.

prerender returns a Promise:

nonce is not an available option when prerendering. Nonces must be unique per request and if you use nonces to secure your application with CSP it would be inappropriate and insecure to include the nonce value in the prerender itself.

The static resumeAndPrerender API is used for static server-side generation (SSG). Unlike renderToString, resumeAndPrerender waits for all data to load before resolving. This makes it suitable for generating static HTML for a full page, including data that needs to be fetched using Suspense. To stream content as it loads, use a streaming server-side render (SSR) API like renderToReadableStream.

resumeAndPrerender can be aborted and later either continued with another resumeAndPrerender or resumed with resume to support partial pre-rendering.

resumeAndPrerender behaves similarly to prerender but can be used to continue a previously started prerendering process that was aborted. For more information about resuming a prerendered tree, see the resume documentation.

**Examples:**

Example 1 (csharp):
```csharp
const { prelude,postpone } = await resumeAndPrerender(reactNode, postponedState, options?)
```

Example 2 (javascript):
```javascript
import { resumeAndPrerender } from 'react-dom/static';import { getPostponedState } from 'storage';async function handler(request, response) {  const postponedState = getPostponedState(request);  const { prelude } = await resumeAndPrerender(<App />, postponedState, {    bootstrapScripts: ['/main.js']  });  return new Response(prelude, {    headers: { 'content-type': 'text/html' },  });}
```

---

## prefetchDNS

**URL:** https://react.dev/reference/react-dom/prefetchDNS

**Contents:**
- prefetchDNS
- Reference
  - prefetchDNS(href)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Prefetching DNS when rendering
  - Prefetching DNS in an event handler

prefetchDNS lets you eagerly look up the IP of a server that you expect to load resources from.

To look up a host, call the prefetchDNS function from react-dom.

See more examples below.

The prefetchDNS function provides the browser with a hint that it should look up the IP address of a given server. If the browser chooses to do so, this can speed up the loading of resources from that server.

prefetchDNS returns nothing.

Call prefetchDNS when rendering a component if you know that its children will load external resources from that host.

Call prefetchDNS in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (unknown):
```unknown
prefetchDNS("https://example.com");
```

Example 2 (javascript):
```javascript
import { prefetchDNS } from 'react-dom';function AppRoot() {  prefetchDNS("https://example.com");  // ...}
```

Example 3 (javascript):
```javascript
import { prefetchDNS } from 'react-dom';function AppRoot() {  prefetchDNS("https://example.com");  return ...;}
```

Example 4 (jsx):
```jsx
import { prefetchDNS } from 'react-dom';function CallToAction() {  const onClick = () => {    prefetchDNS('http://example.com');    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## incompatible-library

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library

**Contents:**
- incompatible-library
  - Note
- Rule Details
      - Deep Dive
    - Designing APIs that follow the Rules of React
  - Invalid
  - Pitfall
    - MobX
  - Valid

Validates against usage of libraries which are incompatible with memoization (manual or automatic).

These libraries were designed before React’s memoization rules were fully documented. They made the correct choices at the time to optimize for ergonomic ways to keep components just the right amount of reactive as app state changes. While these legacy patterns worked, we have since discovered that it’s incompatible with React’s programming model. We will continue working with library authors to migrate these libraries to use patterns that follow the Rules of React.

Some libraries use patterns that aren’t supported by React. When the linter detects usages of these APIs from a known list, it flags them under this rule. This means that React Compiler can automatically skip over components that use these incompatible APIs, in order to avoid breaking your app.

React Compiler automatically memoizes values following the Rules of React. If something breaks with manual useMemo, it will also break the compiler’s automatic optimization. This rule helps identify these problematic patterns.

One question to think about when designing a library API or hook is whether calling the API can be safely memoized with useMemo. If it can’t, then both manual and React Compiler memoizations will break your user’s code.

For example, one such incompatible pattern is “interior mutability”. Interior mutability is when an object or function keeps its own hidden state that changes over time, even though the reference to it stays the same. Think of it like a box that looks the same on the outside but secretly rearranges its contents. React can’t tell anything changed because it only checks if you gave it a different box, not what’s inside. This breaks memoization, since React relies on the outer object (or function) changing if part of its value has changed.

As a rule of thumb, when designing React APIs, think about whether useMemo would break it:

Instead, design APIs that return immutable state and use explicit update functions:

Examples of incorrect code for this rule:

MobX patterns like observer also break memoization assumptions, but the linter does not yet detect them. If you rely on MobX and find that your app doesn’t work with React Compiler, you may need to use the "use no memo" directive.

Examples of correct code for this rule:

Some other libraries do not yet have alternative APIs that are compatible with React’s memoization model. If the linter doesn’t automatically skip over your components or hooks that call these APIs, please file an issue so we can add it to the linter.

**Examples:**

Example 1 (jsx):
```jsx
// Example of how memoization breaks with these librariesfunction Form() {  const { watch } = useForm();  // ❌ This value will never update, even when 'name' field changes  const name = useMemo(() => watch('name'), [watch]);  return <div>Name: {name}</div>; // UI appears "frozen"}
```

Example 2 (javascript):
```javascript
function Component() {  const { someFunction } = useLibrary();  // it should always be safe to memoize functions like this  const result = useMemo(() => someFunction(), [someFunction]);}
```

Example 3 (jsx):
```jsx
// ✅ Good: Return immutable state that changes reference when updatedfunction Component() {  const { field, updateField } = useLibrary();  // this is always safe to memo  const greeting = useMemo(() => `Hello, ${field.name}!`, [field.name]);  return (    <div>      <input        value={field.name}        onChange={(e) => updateField('name', e.target.value)}      />      <p>{greeting}</p>    </div>  );}
```

Example 4 (javascript):
```javascript
// ❌ react-hook-form `watch`function Component() {  const {watch} = useForm();  const value = watch('field'); // Interior mutability  return <div>{value}</div>;}// ❌ TanStack Table `useReactTable`function Component({data}) {  const table = useReactTable({    data,    columns,    getCoreRowModel: getCoreRowModel(),  });  // table instance uses interior mutability  return <Table table={table} />;}
```

---

## createRoot

**URL:** https://react.dev/reference/react-dom/client/createRoot

**Contents:**
- createRoot
- Reference
  - createRoot(domNode, options?)
    - Parameters
    - Returns
    - Caveats
  - root.render(reactNode)
    - Parameters
    - Returns
    - Caveats

createRoot lets you create a root to display React components inside a browser DOM node.

Call createRoot to create a React root for displaying content inside a browser DOM element.

React will create a root for the domNode, and take over managing the DOM inside it. After you’ve created a root, you need to call root.render to display a React component inside of it:

An app fully built with React will usually only have one createRoot call for its root component. A page that uses “sprinkles” of React for parts of the page may have as many separate roots as needed.

See more examples below.

domNode: A DOM element. React will create a root for this DOM element and allow you to call functions on the root, such as render to display rendered React content.

optional options: An object with options for this React root.

createRoot returns an object with two methods: render and unmount.

Call root.render to display a piece of JSX (“React node”) into the React root’s browser DOM node.

React will display <App /> in the root, and take over managing the DOM inside it.

See more examples below.

root.render returns undefined.

The first time you call root.render, React will clear all the existing HTML content inside the React root before rendering the React component into it.

If your root’s DOM node contains HTML generated by React on the server or during the build, use hydrateRoot() instead, which attaches the event handlers to the existing HTML.

If you call render on the same root more than once, React will update the DOM as necessary to reflect the latest JSX you passed. React will decide which parts of the DOM can be reused and which need to be recreated by “matching it up” with the previously rendered tree. Calling render on the same root again is similar to calling the set function on the root component: React avoids unnecessary DOM updates.

Although rendering is synchronous once it starts, root.render(...) is not. This means code after root.render() may run before any effects (useLayoutEffect, useEffect) of that specific render are fired. This is usually fine and rarely needs adjustment. In rare cases where effect timing matters, you can wrap root.render(...) in flushSync to ensure the initial render runs fully synchronously.

Call root.unmount to destroy a rendered tree inside a React root.

An app fully built with React will usually not have any calls to root.unmount.

This is mostly useful if your React root’s DOM node (or any of its ancestors) may get removed from the DOM by some other code. For example, imagine a jQuery tab panel that removes inactive tabs from the DOM. If a tab gets removed, everything inside it (including the React roots inside) would get removed from the DOM as well. In that case, you need to tell React to “stop” managing the removed root’s content by calling root.unmount. Otherwise, the components inside the removed root won’t know to clean up and free up global resources like subscriptions.

Calling root.unmount will unmount all the components in the root and “detach” React from the root DOM node, including removing any event handlers or state in the tree.

root.unmount does not accept any parameters.

root.unmount returns undefined.

Calling root.unmount will unmount all the components in the tree and “detach” React from the root DOM node.

Once you call root.unmount you cannot call root.render again on the same root. Attempting to call root.render on an unmounted root will throw a “Cannot update an unmounted root” error. However, you can create a new root for the same DOM node after the previous root for that node has been unmounted.

If your app is fully built with React, create a single root for your entire app.

Usually, you only need to run this code once at startup. It will:

If your app is fully built with React, you shouldn’t need to create any more roots, or to call root.render again.

From this point on, React will manage the DOM of your entire app. To add more components, nest them inside the App component. When you need to update the UI, each of your components can do this by using state. When you need to display extra content like a modal or a tooltip outside the DOM node, render it with a portal.

When your HTML is empty, the user sees a blank page until the app’s JavaScript code loads and runs:

This can feel very slow! To solve this, you can generate the initial HTML from your components on the server or during the build. Then your visitors can read text, see images, and click links before any of the JavaScript code loads. We recommend using a framework that does this optimization out of the box. Depending on when it runs, this is called server-side rendering (SSR) or static site generation (SSG).

Apps using server rendering or static generation must call hydrateRoot instead of createRoot. React will then hydrate (reuse) the DOM nodes from your HTML instead of destroying and re-creating them.

If your page isn’t fully built with React, you can call createRoot multiple times to create a root for each top-level piece of UI managed by React. You can display different content in each root by calling root.render.

Here, two different React components are rendered into two DOM nodes defined in the index.html file:

You could also create a new DOM node with document.createElement() and add it to the document manually.

To remove the React tree from the DOM node and clean up all the resources used by it, call root.unmount.

This is mostly useful if your React components are inside an app written in a different framework.

You can call render more than once on the same root. As long as the component tree structure matches up with what was previously rendered, React will preserve the state. Notice how you can type in the input, which means that the updates from repeated render calls every second in this example are not destructive:

It is uncommon to call render multiple times. Usually, your components will update state instead.

By default, React will log all errors to the console. To implement your own error reporting, you can provide the optional error handler root options onUncaughtError, onCaughtError and onRecoverableError:

The onCaughtError option is a function called with two arguments:

Together with onUncaughtError and onRecoverableError, you can can implement your own error reporting system:

Make sure you haven’t forgotten to actually render your app into the root:

Until you do that, nothing is displayed.

A common mistake is to pass the options for createRoot to root.render(...):

To fix, pass the root options to createRoot(...), not root.render(...):

This error means that whatever you’re passing to createRoot is not a DOM node.

If you’re not sure what’s happening, try logging it:

For example, if domNode is null, it means that getElementById returned null. This will happen if there is no node in the document with the given ID at the time of your call. There may be a few reasons for it:

Another common way to get this error is to write createRoot(<App />) instead of createRoot(domNode).

This error means that whatever you’re passing to root.render is not a React component.

This may happen if you call root.render with Component instead of <Component />:

Or if you pass a function to root.render, instead of the result of calling it:

If your app is server-rendered and includes the initial HTML generated by React, you might notice that creating a root and calling root.render deletes all that HTML, and then re-creates all the DOM nodes from scratch. This can be slower, resets focus and scroll positions, and may lose other user input.

Server-rendered apps must use hydrateRoot instead of createRoot:

Note that its API is different. In particular, usually there will be no further root.render call.

**Examples:**

Example 1 (javascript):
```javascript
const root = createRoot(domNode, options?)
```

Example 2 (sql):
```sql
import { createRoot } from 'react-dom/client';const domNode = document.getElementById('root');const root = createRoot(domNode);
```

Example 3 (jsx):
```jsx
root.render(<App />);
```

Example 4 (jsx):
```jsx
root.render(<App />);
```

---

## preconnect

**URL:** https://react.dev/reference/react-dom/preconnect

**Contents:**
- preconnect
- Reference
  - preconnect(href)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Preconnecting when rendering
  - Preconnecting in an event handler

preconnect lets you eagerly connect to a server that you expect to load resources from.

To preconnect to a host, call the preconnect function from react-dom.

See more examples below.

The preconnect function provides the browser with a hint that it should open a connection to the given server. If the browser chooses to do so, this can speed up the loading of resources from that server.

preconnect returns nothing.

Call preconnect when rendering a component if you know that its children will load external resources from that host.

Call preconnect in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (unknown):
```unknown
preconnect("https://example.com");
```

Example 2 (javascript):
```javascript
import { preconnect } from 'react-dom';function AppRoot() {  preconnect("https://example.com");  // ...}
```

Example 3 (javascript):
```javascript
import { preconnect } from 'react-dom';function AppRoot() {  preconnect("https://example.com");  return ...;}
```

Example 4 (jsx):
```jsx
import { preconnect } from 'react-dom';function CallToAction() {  const onClick = () => {    preconnect('http://example.com');    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## compilationMode

**URL:** https://react.dev/reference/react-compiler/compilationMode

**Contents:**
- compilationMode
- Reference
  - compilationMode
    - Type
    - Default value
    - Options
    - Caveats
- Usage
  - Default inference mode
  - Incremental adoption with annotation mode

The compilationMode option controls how the React Compiler selects which functions to compile.

Controls the strategy for determining which functions the React Compiler will optimize.

'infer' (default): The compiler uses intelligent heuristics to identify React components and hooks:

'annotation': Only compile functions explicitly marked with the "use memo" directive. Ideal for incremental adoption.

'syntax': Only compile components and hooks that use Flow’s component and hook syntax.

'all': Compile all top-level functions. Not recommended as it may compile non-React functions.

The default 'infer' mode works well for most codebases that follow React conventions:

With this mode, these functions will be compiled:

For gradual migration, use 'annotation' mode to only compile marked functions:

Then explicitly mark functions to compile:

If your codebase uses Flow instead of TypeScript:

Then use Flow’s component syntax:

Regardless of compilation mode, use "use no memo" to skip compilation:

In 'infer' mode, ensure your component follows React conventions:

**Examples:**

Example 1 (css):
```css
{  compilationMode: 'infer' // or 'annotation', 'syntax', 'all'}
```

Example 2 (unknown):
```unknown
'infer' | 'syntax' | 'annotation' | 'all'
```

Example 3 (css):
```css
{  compilationMode: 'infer'}
```

Example 4 (jsx):
```jsx
// ✅ Compiled: Named like a component + returns JSXfunction Button(props) {  return <button>{props.label}</button>;}// ✅ Compiled: Named like a hook + calls hooksfunction useCounter() {  const [count, setCount] = useState(0);  return [count, setCount];}// ✅ Compiled: Explicit directivefunction expensiveCalculation(data) {  "use memo";  return data.reduce(/* ... */);}// ❌ Not compiled: Not a component/hook patternfunction calculateTotal(items) {  return items.reduce((a, b) => a + b, 0);}
```

---

## hydrateRoot

**URL:** https://react.dev/reference/react-dom/client/hydrateRoot

**Contents:**
- hydrateRoot
- Reference
  - hydrateRoot(domNode, reactNode, options?)
    - Parameters
    - Returns
    - Caveats
  - root.render(reactNode)
    - Parameters
    - Returns
    - Caveats

hydrateRoot lets you display React components inside a browser DOM node whose HTML content was previously generated by react-dom/server.

Call hydrateRoot to “attach” React to existing HTML that was already rendered by React in a server environment.

React will attach to the HTML that exists inside the domNode, and take over managing the DOM inside it. An app fully built with React will usually only have one hydrateRoot call with its root component.

See more examples below.

domNode: A DOM element that was rendered as the root element on the server.

reactNode: The “React node” used to render the existing HTML. This will usually be a piece of JSX like <App /> which was rendered with a ReactDOM Server method such as renderToPipeableStream(<App />).

optional options: An object with options for this React root.

hydrateRoot returns an object with two methods: render and unmount.

Call root.render to update a React component inside a hydrated React root for a browser DOM element.

React will update <App /> in the hydrated root.

See more examples below.

root.render returns undefined.

Call root.unmount to destroy a rendered tree inside a React root.

An app fully built with React will usually not have any calls to root.unmount.

This is mostly useful if your React root’s DOM node (or any of its ancestors) may get removed from the DOM by some other code. For example, imagine a jQuery tab panel that removes inactive tabs from the DOM. If a tab gets removed, everything inside it (including the React roots inside) would get removed from the DOM as well. You need to tell React to “stop” managing the removed root’s content by calling root.unmount. Otherwise, the components inside the removed root won’t clean up and free up resources like subscriptions.

Calling root.unmount will unmount all the components in the root and “detach” React from the root DOM node, including removing any event handlers or state in the tree.

root.unmount does not accept any parameters.

root.unmount returns undefined.

Calling root.unmount will unmount all the components in the tree and “detach” React from the root DOM node.

Once you call root.unmount you cannot call root.render again on the root. Attempting to call root.render on an unmounted root will throw a “Cannot update an unmounted root” error.

If your app’s HTML was generated by react-dom/server, you need to hydrate it on the client.

This will hydrate the server HTML inside the browser DOM node with the React component for your app. Usually, you will do it once at startup. If you use a framework, it might do this behind the scenes for you.

To hydrate your app, React will “attach” your components’ logic to the initial generated HTML from the server. Hydration turns the initial HTML snapshot from the server into a fully interactive app that runs in the browser.

You shouldn’t need to call hydrateRoot again or to call it in more places. From this point on, React will be managing the DOM of your application. To update the UI, your components will use state instead.

The React tree you pass to hydrateRoot needs to produce the same output as it did on the server.

This is important for the user experience. The user will spend some time looking at the server-generated HTML before your JavaScript code loads. Server rendering creates an illusion that the app loads faster by showing the HTML snapshot of its output. Suddenly showing different content breaks that illusion. This is why the server render output must match the initial render output on the client.

The most common causes leading to hydration errors include:

React recovers from some hydration errors, but you must fix them like other bugs. In the best case, they’ll lead to a slowdown; in the worst case, event handlers can get attached to the wrong elements.

Apps fully built with React can render the entire document as JSX, including the <html> tag:

To hydrate the entire document, pass the document global as the first argument to hydrateRoot:

If a single element’s attribute or text content is unavoidably different between the server and the client (for example, a timestamp), you may silence the hydration mismatch warning.

To silence hydration warnings on an element, add suppressHydrationWarning={true}:

This only works one level deep, and is intended to be an escape hatch. Don’t overuse it. React will not attempt to patch mismatched text content.

If you intentionally need to render something different on the server and the client, you can do a two-pass rendering. Components that render something different on the client can read a state variable like isClient, which you can set to true in an Effect:

This way the initial render pass will render the same content as the server, avoiding mismatches, but an additional pass will happen synchronously right after hydration.

This approach makes hydration slower because your components have to render twice. Be mindful of the user experience on slow connections. The JavaScript code may load significantly later than the initial HTML render, so rendering a different UI immediately after hydration may also feel jarring to the user.

After the root has finished hydrating, you can call root.render to update the root React component. Unlike with createRoot, you don’t usually need to do this because the initial content was already rendered as HTML.

If you call root.render at some point after hydration, and the component tree structure matches up with what was previously rendered, React will preserve the state. Notice how you can type in the input, which means that the updates from repeated render calls every second in this example are not destructive:

It is uncommon to call root.render on a hydrated root. Usually, you’ll update state inside one of the components instead.

By default, React will log all errors to the console. To implement your own error reporting, you can provide the optional error handler root options onUncaughtError, onCaughtError and onRecoverableError:

The onCaughtError option is a function called with two arguments:

Together with onUncaughtError and onRecoverableError, you can implement your own error reporting system:

A common mistake is to pass the options for hydrateRoot to root.render(...):

To fix, pass the root options to hydrateRoot(...), not root.render(...):

**Examples:**

Example 1 (javascript):
```javascript
const root = hydrateRoot(domNode, reactNode, options?)
```

Example 2 (sql):
```sql
import { hydrateRoot } from 'react-dom/client';const domNode = document.getElementById('root');const root = hydrateRoot(domNode, reactNode);
```

Example 3 (jsx):
```jsx
root.render(<App />);
```

Example 4 (unknown):
```unknown
root.unmount();
```

---

## preload

**URL:** https://react.dev/reference/react-dom/preload

**Contents:**
- preload
  - Note
- Reference
  - preload(href, options)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Preloading when rendering
    - Examples of preloading

React-based frameworks frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

preload lets you eagerly fetch a resource such as a stylesheet, font, or external script that you expect to use.

To preload a resource, call the preload function from react-dom.

See more examples below.

The preload function provides the browser with a hint that it should start downloading the given resource, which can save time.

preload returns nothing.

Call preload when rendering a component if you know that it or its children will use a specific resource.

If you want the browser to start executing the script immediately (rather than just downloading it), use preinit instead. If you want to load an ESM module, use preloadModule.

Call preload in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

**Examples:**

Example 1 (css):
```css
preload("https://example.com/font.woff2", {as: "font"});
```

Example 2 (javascript):
```javascript
import { preload } from 'react-dom';function AppRoot() {  preload("https://example.com/font.woff2", {as: "font"});  // ...}
```

Example 3 (javascript):
```javascript
import { preload } from 'react-dom';function AppRoot() {  preload("https://example.com/script.js", {as: "script"});  return ...;}
```

Example 4 (jsx):
```jsx
import { preload } from 'react-dom';function CallToAction() {  const onClick = () => {    preload("https://example.com/wizardStyles.css", {as: "style"});    startWizard();  }  return (    <button onClick={onClick}>Start Wizard</button>  );}
```

---

## purity

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/purity

**Contents:**
- purity
- Rule Details
- Common Violations
  - Invalid
  - Valid
- Troubleshooting
  - I need to show the current time

Validates that components/hooks are pure by checking that they do not call known-impure functions.

React components must be pure functions - given the same props, they should always return the same JSX. When components use functions like Math.random() or Date.now() during render, they produce different output each time, breaking React’s assumptions and causing bugs like hydration mismatches, incorrect memoization, and unpredictable behavior.

In general, any API that returns a different value for the same inputs violates this rule. Usual examples include:

Examples of incorrect code for this rule:

Examples of correct code for this rule:

Calling Date.now() during render makes your component impure:

Instead, move the impure function outside of render:

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Math.random() in renderfunction Component() {  const id = Math.random(); // Different every render  return <div key={id}>Content</div>;}// ❌ Date.now() for valuesfunction Component() {  const timestamp = Date.now(); // Changes every render  return <div>Created at: {timestamp}</div>;}
```

Example 2 (jsx):
```jsx
// ✅ Stable IDs from initial statefunction Component() {  const [id] = useState(() => crypto.randomUUID());  return <div key={id}>Content</div>;}
```

Example 3 (typescript):
```typescript
// ❌ Wrong: Time changes every renderfunction Clock() {  return <div>Current time: {Date.now()}</div>;}
```

Example 4 (jsx):
```jsx
function Clock() {  const [time, setTime] = useState(() => Date.now());  useEffect(() => {    const interval = setInterval(() => {      setTime(Date.now());    }, 1000);    return () => clearInterval(interval);  }, []);  return <div>Current time: {time}</div>;}
```

---

## experimental_taintUniqueValue - This feature is available in the latest Experimental version of React

**URL:** https://react.dev/reference/react/experimental_taintUniqueValue

**Contents:**
- experimental_taintUniqueValue - This feature is available in the latest Experimental version of React
  - Experimental Feature
- Reference
  - taintUniqueValue(message, lifetime, value)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Prevent a token from being passed to Client Components
  - Pitfall

This API is experimental and is not available in a stable version of React yet.

You can try it by upgrading React packages to the most recent experimental version:

Experimental versions of React may contain bugs. Don’t use them in production.

This API is only available inside React Server Components.

taintUniqueValue lets you prevent unique values from being passed to Client Components like passwords, keys, or tokens.

To prevent passing an object containing sensitive data, see taintObjectReference.

Call taintUniqueValue with a password, token, key or hash to register it with React as something that should not be allowed to be passed to the Client as is:

See more examples below.

message: The message you want to display if value is passed to a Client Component. This message will be displayed as a part of the Error that will be thrown if value is passed to a Client Component.

lifetime: Any object that indicates how long value should be tainted. value will be blocked from being sent to any Client Component while this object still exists. For example, passing globalThis blocks the value for the lifetime of an app. lifetime is typically an object whose properties contains value.

value: A string, bigint or TypedArray. value must be a unique sequence of characters or bytes with high entropy such as a cryptographic token, private key, hash, or a long password. value will be blocked from being sent to any Client Component.

experimental_taintUniqueValue returns undefined.

To ensure that sensitive information such as passwords, session tokens, or other unique values do not inadvertently get passed to Client Components, the taintUniqueValue function provides a layer of protection. When a value is tainted, any attempt to pass it to a Client Component will result in an error.

The lifetime argument defines the duration for which the value remains tainted. For values that should remain tainted indefinitely, objects like globalThis or process can serve as the lifetime argument. These objects have a lifespan that spans the entire duration of your app’s execution.

If the tainted value’s lifespan is tied to a object, the lifetime should be the object that encapsulates the value. This ensures the tainted value remains protected for the lifetime of the encapsulating object.

In this example, the user object serves as the lifetime argument. If this object gets stored in a global cache or is accessible by another request, the session token remains tainted.

Do not rely solely on tainting for security. Tainting a value doesn’t block every possible derived value. For example, creating a new value by upper casing a tainted string will not taint the new value.

In this example, the constant password is tainted. Then password is used to create a new value uppercasePassword by calling the toUpperCase method on password. The newly created uppercasePassword is not tainted.

Other similar ways of deriving new values from tainted values like concatenating it into a larger string, converting it to base64, or returning a substring create untained values.

Tainting only protects against simple mistakes like explicitly passing secret values to the client. Mistakes in calling the taintUniqueValue like using a global store outside of React, without the corresponding lifetime object, can cause the tainted value to become untainted. Tainting is a layer of protection; a secure app will have multiple layers of protection, well designed APIs, and isolation patterns.

If you’re running a Server Components environment that has access to private keys or passwords such as database passwords, you have to be careful not to pass that to a Client Component.

This example would leak the secret API token to the client. If this API token can be used to access data this particular user shouldn’t have access to, it could lead to a data breach.

Ideally, secrets like this are abstracted into a single helper file that can only be imported by trusted data utilities on the server. The helper can even be tagged with server-only to ensure that this file isn’t imported on the client.

Sometimes mistakes happen during refactoring and not all of your colleagues might know about this. To protect against this mistakes happening down the line we can “taint” the actual password:

Now whenever anyone tries to pass this password to a Client Component, or send the password to a Client Component with a Server Function, an error will be thrown with message you defined when you called taintUniqueValue.

**Examples:**

Example 1 (unknown):
```unknown
taintUniqueValue(errMessage, lifetime, value)
```

Example 2 (sql):
```sql
import {experimental_taintUniqueValue} from 'react';experimental_taintUniqueValue(  'Do not pass secret keys to the client.',  process,  process.env.SECRET_KEY);
```

Example 3 (sql):
```sql
import {experimental_taintUniqueValue} from 'react';experimental_taintUniqueValue(  'Do not pass a user password to the client.',  globalThis,  process.env.SECRET_KEY);
```

Example 4 (javascript):
```javascript
import {experimental_taintUniqueValue} from 'react';export async function getUser(id) {  const user = await db`SELECT * FROM users WHERE id = ${id}`;  experimental_taintUniqueValue(    'Do not pass a user session token to the client.',    user,    user.session.token  );  return user;}
```

---

## createPortal

**URL:** https://react.dev/reference/react-dom/createPortal

**Contents:**
- createPortal
- Reference
  - createPortal(children, domNode, key?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Rendering to a different part of the DOM
  - Rendering a modal dialog with a portal
  - Pitfall

createPortal lets you render some children into a different part of the DOM.

To create a portal, call createPortal, passing some JSX, and the DOM node where it should be rendered:

See more examples below.

A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the React component that renders it. For example, the child can access the context provided by the parent tree, and events bubble up from children to parents according to the React tree.

children: Anything that can be rendered with React, such as a piece of JSX (e.g. <div /> or <SomeComponent />), a Fragment (<>...</>), a string or a number, or an array of these.

domNode: Some DOM node, such as those returned by document.getElementById(). The node must already exist. Passing a different DOM node during an update will cause the portal content to be recreated.

optional key: A unique string or number to be used as the portal’s key.

createPortal returns a React node that can be included into JSX or returned from a React component. If React encounters it in the render output, it will place the provided children inside the provided domNode.

Portals let your components render some of their children into a different place in the DOM. This lets a part of your component “escape” from whatever containers it may be in. For example, a component can display a modal dialog or a tooltip that appears above and outside of the rest of the page.

To create a portal, render the result of createPortal with some JSX and the DOM node where it should go:

React will put the DOM nodes for the JSX you passed inside of the DOM node you provided.

Without a portal, the second <p> would be placed inside the parent <div>, but the portal “teleported” it into the document.body:

Notice how the second paragraph visually appears outside the parent <div> with the border. If you inspect the DOM structure with developer tools, you’ll see that the second <p> got placed directly into the <body>:

A portal only changes the physical placement of the DOM node. In every other way, the JSX you render into a portal acts as a child node of the React component that renders it. For example, the child can access the context provided by the parent tree, and events still bubble up from children to parents according to the React tree.

You can use a portal to create a modal dialog that floats above the rest of the page, even if the component that summons the dialog is inside a container with overflow: hidden or other styles that interfere with the dialog.

In this example, the two containers have styles that disrupt the modal dialog, but the one rendered into a portal is unaffected because, in the DOM, the modal is not contained within the parent JSX elements.

It’s important to make sure that your app is accessible when using portals. For instance, you may need to manage keyboard focus so that the user can move the focus in and out of the portal in a natural way.

Follow the WAI-ARIA Modal Authoring Practices when creating modals. If you use a community package, ensure that it is accessible and follows these guidelines.

Portals can be useful if your React root is only part of a static or server-rendered page that isn’t built with React. For example, if your page is built with a server framework like Rails, you can create areas of interactivity within static areas such as sidebars. Compared with having multiple separate React roots, portals let you treat the app as a single React tree with shared state even though its parts render to different parts of the DOM.

You can also use a portal to manage the content of a DOM node that’s managed outside of React. For example, suppose you’re integrating with a non-React map widget and you want to render React content inside a popup. To do this, declare a popupContainer state variable to store the DOM node you’re going to render into:

When you create the third-party widget, store the DOM node returned by the widget so you can render into it:

This lets you use createPortal to render React content into popupContainer once it becomes available:

Here is a complete example you can play with:

**Examples:**

Example 1 (jsx):
```jsx
<div>  <SomeComponent />  {createPortal(children, domNode, key?)}</div>
```

Example 2 (sql):
```sql
import { createPortal } from 'react-dom';// ...<div>  <p>This child is placed in the parent div.</p>  {createPortal(    <p>This child is placed in the document body.</p>,    document.body  )}</div>
```

Example 3 (jsx):
```jsx
import { createPortal } from 'react-dom';function MyComponent() {  return (    <div style={{ border: '2px solid black' }}>      <p>This child is placed in the parent div.</p>      {createPortal(        <p>This child is placed in the document body.</p>,        document.body      )}    </div>  );}
```

Example 4 (html):
```html
<body>  <div id="root">    ...      <div style="border: 2px solid black">        <p>This child is placed inside the parent div.</p>      </div>    ...  </div>  <p>This child is placed in the document body.</p></body>
```

---
