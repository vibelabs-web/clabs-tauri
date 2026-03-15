# React-19 - Components

**Pages:** 27

---

## createElement

**URL:** https://react.dev/reference/react/createElement

**Contents:**
- createElement
- Reference
  - createElement(type, props, ...children)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Creating an element without JSX
      - Deep Dive
    - What is a React element, exactly?

createElement lets you create a React element. It serves as an alternative to writing JSX.

Call createElement to create a React element with the given type, props, and children.

See more examples below.

type: The type argument must be a valid React component type. For example, it could be a tag name string (such as 'div' or 'span'), or a React component (a function, a class, or a special component like Fragment).

props: The props argument must either be an object or null. If you pass null, it will be treated the same as an empty object. React will create an element with props matching the props you have passed. Note that ref and key from your props object are special and will not be available as element.props.ref and element.props.key on the returned element. They will be available as element.ref and element.key.

optional ...children: Zero or more child nodes. They can be any React nodes, including React elements, strings, numbers, portals, empty nodes (null, undefined, true, and false), and arrays of React nodes.

createElement returns a React element object with a few properties:

Usually, you’ll return the element from your component or make it a child of another element. Although you may read the element’s properties, it’s best to treat every element as opaque after it’s created, and only render it.

You must treat React elements and their props as immutable and never change their contents after creation. In development, React will freeze the returned element and its props property shallowly to enforce this.

When you use JSX, you must start a tag with a capital letter to render your own custom component. In other words, <Something /> is equivalent to createElement(Something), but <something /> (lowercase) is equivalent to createElement('something') (note it’s a string, so it will be treated as a built-in HTML tag).

You should only pass children as multiple arguments to createElement if they are all statically known, like createElement('h1', {}, child1, child2, child3). If your children are dynamic, pass the entire array as the third argument: createElement('ul', {}, listItems). This ensures that React will warn you about missing keys for any dynamic lists. For static lists this is not necessary because they never reorder.

If you don’t like JSX or can’t use it in your project, you can use createElement as an alternative.

To create an element without JSX, call createElement with some type, props, and children:

The children are optional, and you can pass as many as you need (the example above has three children). This code will display a <h1> header with a greeting. For comparison, here is the same example rewritten with JSX:

To render your own React component, pass a function like Greeting as the type instead of a string like 'h1':

With JSX, it would look like this:

Here is a complete example written with createElement:

And here is the same example written using JSX:

Both coding styles are fine, so you can use whichever one you prefer for your project. The main benefit of using JSX compared to createElement is that it’s easy to see which closing tag corresponds to which opening tag.

An element is a lightweight description of a piece of the user interface. For example, both <Greeting name="Taylor" /> and createElement(Greeting, { name: 'Taylor' }) produce an object like this:

Note that creating this object does not render the Greeting component or create any DOM elements.

A React element is more like a description—an instruction for React to later render the Greeting component. By returning this object from your App component, you tell React what to do next.

Creating elements is extremely cheap so you don’t need to try to optimize or avoid it.

**Examples:**

Example 1 (javascript):
```javascript
const element = createElement(type, props, ...children)
```

Example 2 (javascript):
```javascript
import { createElement } from 'react';function Greeting({ name }) {  return createElement(    'h1',    { className: 'greeting' },    'Hello'  );}
```

Example 3 (javascript):
```javascript
import { createElement } from 'react';function Greeting({ name }) {  return createElement(    'h1',    { className: 'greeting' },    'Hello ',    createElement('i', null, name),    '. Welcome!'  );}
```

Example 4 (jsx):
```jsx
function Greeting({ name }) {  return (    <h1 className="greeting">      Hello <i>{name}</i>. Welcome!    </h1>  );}
```

---

## <select>

**URL:** https://react.dev/reference/react-dom/components/select

**Contents:**
- <select>
- Reference
  - <select>
    - Props
    - Caveats
- Usage
  - Displaying a select box with options
  - Providing a label for a select box
  - Providing an initially selected option
  - Pitfall

The built-in browser <select> component lets you render a select box with options.

To display a select box, render the built-in browser <select> component.

See more examples below.

<select> supports all common element props.

You can make a select box controlled by passing a value prop:

When you pass value, you must also pass an onChange handler that updates the passed value.

If your <select> is uncontrolled, you may pass the defaultValue prop instead:

These <select> props are relevant both for uncontrolled and controlled select boxes:

Render a <select> with a list of <option> components inside to display a select box. Give each <option> a value representing the data to be submitted with the form.

Typically, you will place every <select> inside a <label> tag. This tells the browser that this label is associated with that select box. When the user clicks the label, the browser will automatically focus the select box. It’s also essential for accessibility: a screen reader will announce the label caption when the user focuses the select box.

If you can’t nest <select> into a <label>, associate them by passing the same ID to <select id> and <label htmlFor>. To avoid conflicts between multiple instances of one component, generate such an ID with useId.

By default, the browser will select the first <option> in the list. To select a different option by default, pass that <option>’s value as the defaultValue to the <select> element.

Unlike in HTML, passing a selected attribute to an individual <option> is not supported.

Pass multiple={true} to the <select> to let the user select multiple options. In that case, if you also specify defaultValue to choose the initially selected options, it must be an array.

Add a <form> around your select box with a <button type="submit"> inside. It will call your <form onSubmit> event handler. By default, the browser will send the form data to the current URL and refresh the page. You can override that behavior by calling e.preventDefault(). Read the form data with new FormData(e.target).

Give a name to your <select>, for example <select name="selectedFruit" />. The name you specified will be used as a key in the form data, for example { selectedFruit: "orange" }.

If you use <select multiple={true}>, the FormData you’ll read from the form will include each selected value as a separate name-value pair. Look closely at the console logs in the example above.

By default, any <button> inside a <form> will submit it. This can be surprising! If you have your own custom Button React component, consider returning <button type="button"> instead of <button>. Then, to be explicit, use <button type="submit"> for buttons that are supposed to submit the form.

A select box like <select /> is uncontrolled. Even if you pass an initially selected value like <select defaultValue="orange" />, your JSX only specifies the initial value, not the value right now.

To render a controlled select box, pass the value prop to it. React will force the select box to always have the value you passed. Typically, you will control a select box by declaring a state variable:

This is useful if you want to re-render some part of the UI in response to every selection.

If you pass value without onChange, it will be impossible to select an option. When you control a select box by passing some value to it, you force it to always have the value you passed. So if you pass a state variable as a value but forget to update that state variable synchronously during the onChange event handler, React will revert the select box after every keystroke back to the value that you specified.

Unlike in HTML, passing a selected attribute to an individual <option> is not supported.

**Examples:**

Example 1 (jsx):
```jsx
<select>  <option value="someOption">Some option</option>  <option value="otherOption">Other option</option></select>
```

Example 2 (jsx):
```jsx
<select>  <option value="someOption">Some option</option>  <option value="otherOption">Other option</option></select>
```

Example 3 (jsx):
```jsx
function FruitPicker() {  const [selectedFruit, setSelectedFruit] = useState('orange'); // Declare a state variable...  // ...  return (    <select      value={selectedFruit} // ...force the select's value to match the state variable...      onChange={e => setSelectedFruit(e.target.value)} // ... and update the state variable on any change!    >      <option value="apple">Apple</option>      <option value="banana">Banana</option>      <option value="orange">Orange</option>    </select>  );}
```

---

## <Suspense>

**URL:** https://react.dev/reference/react/Suspense

**Contents:**
- <Suspense>
- Reference
  - <Suspense>
    - Props
    - Caveats
- Usage
  - Displaying a fallback while content is loading
  - Note
  - Revealing content together at once
  - Revealing nested content as it loads

<Suspense> lets you display a fallback until its children have finished loading.

You can wrap any part of your application with a Suspense boundary:

React will display your loading fallback until all the code and data needed by the children has been loaded.

In the example below, the Albums component suspends while fetching the list of albums. Until it’s ready to render, React switches the closest Suspense boundary above to show the fallback—your Loading component. Then, when the data loads, React hides the Loading fallback and renders the Albums component with data.

Only Suspense-enabled data sources will activate the Suspense component. They include:

Suspense does not detect when data is fetched inside an Effect or event handler.

The exact way you would load data in the Albums component above depends on your framework. If you use a Suspense-enabled framework, you’ll find the details in its data fetching documentation.

Suspense-enabled data fetching without the use of an opinionated framework is not yet supported. The requirements for implementing a Suspense-enabled data source are unstable and undocumented. An official API for integrating data sources with Suspense will be released in a future version of React.

By default, the whole tree inside Suspense is treated as a single unit. For example, even if only one of these components suspends waiting for some data, all of them together will be replaced by the loading indicator:

Then, after all of them are ready to be displayed, they will all appear together at once.

In the example below, both Biography and Albums fetch some data. However, because they are grouped under a single Suspense boundary, these components always “pop in” together at the same time.

Components that load data don’t have to be direct children of the Suspense boundary. For example, you can move Biography and Albums into a new Details component. This doesn’t change the behavior. Biography and Albums share the same closest parent Suspense boundary, so their reveal is coordinated together.

When a component suspends, the closest parent Suspense component shows the fallback. This lets you nest multiple Suspense components to create a loading sequence. Each Suspense boundary’s fallback will be filled in as the next level of content becomes available. For example, you can give the album list its own fallback:

With this change, displaying the Biography doesn’t need to “wait” for the Albums to load.

The sequence will be:

Suspense boundaries let you coordinate which parts of your UI should always “pop in” together at the same time, and which parts should progressively reveal more content in a sequence of loading states. You can add, move, or delete Suspense boundaries in any place in the tree without affecting the rest of your app’s behavior.

Don’t put a Suspense boundary around every component. Suspense boundaries should not be more granular than the loading sequence that you want the user to experience. If you work with a designer, ask them where the loading states should be placed—it’s likely that they’ve already included them in their design wireframes.

In this example, the SearchResults component suspends while fetching the search results. Type "a", wait for the results, and then edit it to "ab". The results for "a" will get replaced by the loading fallback.

A common alternative UI pattern is to defer updating the list and to keep showing the previous results until the new results are ready. The useDeferredValue Hook lets you pass a deferred version of the query down:

The query will update immediately, so the input will display the new value. However, the deferredQuery will keep its previous value until the data has loaded, so SearchResults will show the stale results for a bit.

To make it more obvious to the user, you can add a visual indication when the stale result list is displayed:

Enter "a" in the example below, wait for the results to load, and then edit the input to "ab". Notice how instead of the Suspense fallback, you now see the dimmed stale result list until the new results have loaded:

Both deferred values and Transitions let you avoid showing Suspense fallback in favor of inline indicators. Transitions mark the whole update as non-urgent so they are typically used by frameworks and router libraries for navigation. Deferred values, on the other hand, are mostly useful in application code where you want to mark a part of UI as non-urgent and let it “lag behind” the rest of the UI.

When a component suspends, the closest parent Suspense boundary switches to showing the fallback. This can lead to a jarring user experience if it was already displaying some content. Try pressing this button:

When you pressed the button, the Router component rendered ArtistPage instead of IndexPage. A component inside ArtistPage suspended, so the closest Suspense boundary started showing the fallback. The closest Suspense boundary was near the root, so the whole site layout got replaced by BigSpinner.

To prevent this, you can mark the navigation state update as a Transition with startTransition:

This tells React that the state transition is not urgent, and it’s better to keep showing the previous page instead of hiding any already revealed content. Now clicking the button “waits” for the Biography to load:

A Transition doesn’t wait for all content to load. It only waits long enough to avoid hiding already revealed content. For example, the website Layout was already revealed, so it would be bad to hide it behind a loading spinner. However, the nested Suspense boundary around Albums is new, so the Transition doesn’t wait for it.

Suspense-enabled routers are expected to wrap the navigation updates into Transitions by default.

In the above example, once you click the button, there is no visual indication that a navigation is in progress. To add an indicator, you can replace startTransition with useTransition which gives you a boolean isPending value. In the example below, it’s used to change the website header styling while a Transition is happening:

During a Transition, React will avoid hiding already revealed content. However, if you navigate to a route with different parameters, you might want to tell React it is different content. You can express this with a key:

Imagine you’re navigating within a user’s profile page, and something suspends. If that update is wrapped in a Transition, it will not trigger the fallback for already visible content. That’s the expected behavior.

However, now imagine you’re navigating between two different user profiles. In that case, it makes sense to show the fallback. For example, one user’s timeline is different content from another user’s timeline. By specifying a key, you ensure that React treats different users’ profiles as different components, and resets the Suspense boundaries during navigation. Suspense-integrated routers should do this automatically.

If you use one of the streaming server rendering APIs (or a framework that relies on them), React will also use your <Suspense> boundaries to handle errors on the server. If a component throws an error on the server, React will not abort the server render. Instead, it will find the closest <Suspense> component above it and include its fallback (such as a spinner) into the generated server HTML. The user will see a spinner at first.

On the client, React will attempt to render the same component again. If it errors on the client too, React will throw the error and display the closest Error Boundary. However, if it does not error on the client, React will not display the error to the user since the content was eventually displayed successfully.

You can use this to opt out some components from rendering on the server. To do this, throw an error in the server environment and then wrap them in a <Suspense> boundary to replace their HTML with fallbacks:

The server HTML will include the loading indicator. It will be replaced by the Chat component on the client.

Replacing visible UI with a fallback creates a jarring user experience. This can happen when an update causes a component to suspend, and the nearest Suspense boundary is already showing content to the user.

To prevent this from happening, mark the update as non-urgent using startTransition. During a Transition, React will wait until enough data has loaded to prevent an unwanted fallback from appearing:

This will avoid hiding existing content. However, any newly rendered Suspense boundaries will still immediately display fallbacks to avoid blocking the UI and let the user see the content as it becomes available.

React will only prevent unwanted fallbacks during non-urgent updates. It will not delay a render if it’s the result of an urgent update. You must opt in with an API like startTransition or useDeferredValue.

If your router is integrated with Suspense, it should wrap its updates into startTransition automatically.

**Examples:**

Example 1 (jsx):
```jsx
<Suspense fallback={<Loading />}>  <SomeComponent /></Suspense>
```

Example 2 (jsx):
```jsx
<Suspense fallback={<Loading />}>  <Albums /></Suspense>
```

Example 3 (jsx):
```jsx
<Suspense fallback={<Loading />}>  <Biography />  <Panel>    <Albums />  </Panel></Suspense>
```

Example 4 (jsx):
```jsx
<Suspense fallback={<Loading />}>  <Details artistId={artist.id} /></Suspense>function Details({ artistId }) {  return (    <>      <Biography artistId={artistId} />      <Panel>        <Albums artistId={artistId} />      </Panel>    </>  );}
```

---

## <input>

**URL:** https://react.dev/reference/react-dom/components/input

**Contents:**
- <input>
- Reference
  - <input>
    - Props
    - Caveats
- Usage
  - Displaying inputs of different types
  - Providing a label for an input
  - Providing an initial value for an input
  - Reading the input values when submitting a form

The built-in browser <input> component lets you render different kinds of form inputs.

To display an input, render the built-in browser <input> component.

See more examples below.

<input> supports all common element props.

You can make an input controlled by passing one of these props:

When you pass either of them, you must also pass an onChange handler that updates the passed value.

These <input> props are only relevant for uncontrolled inputs:

These <input> props are relevant both for uncontrolled and controlled inputs:

To display an input, render an <input> component. By default, it will be a text input. You can pass type="checkbox" for a checkbox, type="radio" for a radio button, or one of the other input types.

Typically, you will place every <input> inside a <label> tag. This tells the browser that this label is associated with that input. When the user clicks the label, the browser will automatically focus the input. It’s also essential for accessibility: a screen reader will announce the label caption when the user focuses the associated input.

If you can’t nest <input> into a <label>, associate them by passing the same ID to <input id> and <label htmlFor>. To avoid conflicts between multiple instances of one component, generate such an ID with useId.

You can optionally specify the initial value for any input. Pass it as the defaultValue string for text inputs. Checkboxes and radio buttons should specify the initial value with the defaultChecked boolean instead.

Add a <form> around your inputs with a <button type="submit"> inside. It will call your <form onSubmit> event handler. By default, the browser will send the form data to the current URL and refresh the page. You can override that behavior by calling e.preventDefault(). Read the form data with new FormData(e.target).

Give a name to every <input>, for example <input name="firstName" defaultValue="Taylor" />. The name you specified will be used as a key in the form data, for example { firstName: "Taylor" }.

By default, a <button> inside a <form> without a type attribute will submit it. This can be surprising! If you have your own custom Button React component, consider using <button type="button"> instead of <button> (with no type). Then, to be explicit, use <button type="submit"> for buttons that are supposed to submit the form.

An input like <input /> is uncontrolled. Even if you pass an initial value like <input defaultValue="Initial text" />, your JSX only specifies the initial value. It does not control what the value should be right now.

To render a controlled input, pass the value prop to it (or checked for checkboxes and radios). React will force the input to always have the value you passed. Usually, you would do this by declaring a state variable:

A controlled input makes sense if you needed state anyway—for example, to re-render your UI on every edit:

It’s also useful if you want to offer multiple ways to adjust the input state (for example, by clicking a button):

The value you pass to controlled components should not be undefined or null. If you need the initial value to be empty (such as with the firstName field below), initialize your state variable to an empty string ('').

If you pass value without onChange, it will be impossible to type into the input. When you control an input by passing some value to it, you force it to always have the value you passed. So if you pass a state variable as a value but forget to update that state variable synchronously during the onChange event handler, React will revert the input after every keystroke back to the value that you specified.

When you use a controlled input, you set the state on every keystroke. If the component containing your state re-renders a large tree, this can get slow. There’s a few ways you can optimize re-rendering performance.

For example, suppose you start with a form that re-renders all page content on every keystroke:

Since <PageContent /> doesn’t rely on the input state, you can move the input state into its own component:

This significantly improves performance because now only SignupForm re-renders on every keystroke.

If there is no way to avoid re-rendering (for example, if PageContent depends on the search input’s value), useDeferredValue lets you keep the controlled input responsive even in the middle of a large re-render.

If you render an input with value but no onChange, you will see an error in the console:

As the error message suggests, if you only wanted to specify the initial value, pass defaultValue instead:

If you want to control this input with a state variable, specify an onChange handler:

If the value is intentionally read-only, add a readOnly prop to suppress the error:

If you render a checkbox with checked but no onChange, you will see an error in the console:

As the error message suggests, if you only wanted to specify the initial value, pass defaultChecked instead:

If you want to control this checkbox with a state variable, specify an onChange handler:

You need to read e.target.checked rather than e.target.value for checkboxes.

If the checkbox is intentionally read-only, add a readOnly prop to suppress the error:

If you control an input, you must update its state variable to the input’s value from the DOM during onChange.

You can’t update it to something other than e.target.value (or e.target.checked for checkboxes):

You also can’t update it asynchronously:

To fix your code, update it synchronously to e.target.value:

If this doesn’t fix the problem, it’s possible that the input gets removed and re-added from the DOM on every keystroke. This can happen if you’re accidentally resetting state on every re-render, for example if the input or one of its parents always receives a different key attribute, or if you nest component function definitions (which is not supported and causes the “inner” component to always be considered a different tree).

If you provide a value to the component, it must remain a string throughout its lifetime.

You cannot pass value={undefined} first and later pass value="some string" because React won’t know whether you want the component to be uncontrolled or controlled. A controlled component should always receive a string value, not null or undefined.

If your value is coming from an API or a state variable, it might be initialized to null or undefined. In that case, either set it to an empty string ('') initially, or pass value={someValue ?? ''} to ensure value is a string.

Similarly, if you pass checked to a checkbox, ensure it’s always a boolean.

**Examples:**

Example 1 (jsx):
```jsx
<input name="myInput" />
```

Example 2 (jsx):
```jsx
function Form() {  const [firstName, setFirstName] = useState(''); // Declare a state variable...  // ...  return (    <input      value={firstName} // ...force the input's value to match the state variable...      onChange={e => setFirstName(e.target.value)} // ... and update the state variable on any edits!    />  );}
```

Example 3 (jsx):
```jsx
function Form() {  const [firstName, setFirstName] = useState('');  return (    <>      <label>        First name:        <input value={firstName} onChange={e => setFirstName(e.target.value)} />      </label>      {firstName !== '' && <p>Your name is {firstName}.</p>}      ...
```

Example 4 (jsx):
```jsx
function Form() {  // ...  const [age, setAge] = useState('');  const ageAsNumber = Number(age);  return (    <>      <label>        Age:        <input          value={age}          onChange={e => setAge(e.target.value)}          type="number"        />        <button onClick={() => setAge(ageAsNumber + 10)}>          Add 10 years        </button>
```

---

## <script>

**URL:** https://react.dev/reference/react-dom/components/script

**Contents:**
- <script>
- Reference
  - <script>
    - Props
    - Special rendering behavior
- Usage
  - Rendering an external script
  - Note
  - Rendering an inline script

The built-in browser <script> component lets you add a script to your document.

To add inline or external scripts to your document, render the built-in browser <script> component. You can render <script> from any component and React will in certain cases place the corresponding DOM element in the document head and de-duplicate identical scripts.

See more examples below.

<script> supports all common element props.

It should have either children or a src prop.

Other supported props:

Props that disable React’s special treatment of scripts:

Props that are not recommended for use with React:

React can move <script> components to the document’s <head> and de-duplicate identical scripts.

To opt into this behavior, provide the src and async={true} props. React will de-duplicate scripts if they have the same src. The async prop must be true to allow scripts to be safely moved.

This special treatment comes with two caveats:

If a component depends on certain scripts in order to be displayed correctly, you can render a <script> within the component. However, the component might be committed before the script has finished loading. You can start depending on the script content once the load event is fired e.g. by using the onLoad prop.

React will de-duplicate scripts that have the same src, inserting only one of them into the DOM even if multiple components render it.

When you want to use a script, it can be beneficial to call the preinit function. Calling this function may allow the browser to start fetching the script earlier than if you just render a <script> component, for example by sending an HTTP Early Hints response.

To include an inline script, render the <script> component with the script source code as its children. Inline scripts are not de-duplicated or moved to the document <head>.

**Examples:**

Example 1 (vue):
```vue
<script> alert("hi!") </script>
```

Example 2 (jsx):
```jsx
<script> alert("hi!") </script><script src="script.js" />
```

---

## <Fragment> (<>...</>)

**URL:** https://react.dev/reference/react/Fragment

**Contents:**
- <Fragment> (<>...</>)
  - Canary
- Reference
  - <Fragment>
    - Props
  - Canary only FragmentInstance
    - Caveats
- Usage
  - Returning multiple elements
      - Deep Dive

<Fragment>, often used via <>...</> syntax, lets you group elements without a wrapper node.

Wrap elements in <Fragment> to group them together in situations where you need a single element. Grouping elements in Fragment has no effect on the resulting DOM; it is the same as if the elements were not grouped. The empty JSX tag <></> is shorthand for <Fragment></Fragment> in most cases.

When you pass a ref to a fragment, React provides a FragmentInstance object with methods for interacting with the DOM nodes wrapped by the fragment:

Event handling methods:

Focus management methods:

If you want to pass key to a Fragment, you can’t use the <>...</> syntax. You have to explicitly import Fragment from 'react' and render <Fragment key={yourKey}>...</Fragment>.

React does not reset state when you go from rendering <><Child /></> to [<Child />] or back, or when you go from rendering <><Child /></> to <Child /> and back. This only works a single level deep: for example, going from <><><Child /></></> to <Child /> resets the state. See the precise semantics here.

Canary only If you want to pass ref to a Fragment, you can’t use the <>...</> syntax. You have to explicitly import Fragment from 'react' and render <Fragment ref={yourRef}>...</Fragment>.

Use Fragment, or the equivalent <>...</> syntax, to group multiple elements together. You can use it to put multiple elements in any place where a single element can go. For example, a component can only return one element, but by using a Fragment you can group multiple elements together and then return them as a group:

Fragments are useful because grouping elements with a Fragment has no effect on layout or styles, unlike if you wrapped the elements in another container like a DOM element. If you inspect this example with the browser tools, you’ll see that all <h1> and <article> DOM nodes appear as siblings without wrappers around them:

The example above is equivalent to importing Fragment from React:

Usually you won’t need this unless you need to pass a key to your Fragment.

Like any other element, you can assign Fragment elements to variables, pass them as props, and so on:

You can use Fragment to group text together with components:

Here’s a situation where you need to write Fragment explicitly instead of using the <></> syntax. When you render multiple elements in a loop, you need to assign a key to each element. If the elements within the loop are Fragments, you need to use the normal JSX element syntax in order to provide the key attribute:

You can inspect the DOM to verify that there are no wrapper elements around the Fragment children:

Fragment refs allow you to interact with the DOM nodes wrapped by a Fragment without adding extra wrapper elements. This is useful for event handling, visibility tracking, focus management, and replacing deprecated patterns like ReactDOM.findDOMNode().

Fragment refs are useful for visibility tracking and intersection observation. This enables you to monitor when content becomes visible without requiring the child Components to expose refs:

This pattern is an alternative to Effect-based visibility logging, which is an anti-pattern in most cases. Relying on Effects alone does not guarantee that the rendered Component is observable by the user.

Fragment refs provide focus management methods that work across all DOM nodes within the Fragment:

The focus() method focuses the first focusable element within the Fragment, while focusLast() focuses the last focusable element.

**Examples:**

Example 1 (jsx):
```jsx
<>  <OneChild />  <AnotherChild /></>
```

Example 2 (jsx):
```jsx
function Post() {  return (    <>      <PostTitle />      <PostBody />    </>  );}
```

Example 3 (jsx):
```jsx
import { Fragment } from 'react';function Post() {  return (    <Fragment>      <PostTitle />      <PostBody />    </Fragment>  );}
```

Example 4 (jsx):
```jsx
function CloseDialog() {  const buttons = (    <>      <OKButton />      <CancelButton />    </>  );  return (    <AlertDialog buttons={buttons}>      Are you sure you want to leave this page?    </AlertDialog>  );}
```

---

## <meta>

**URL:** https://react.dev/reference/react-dom/components/meta

**Contents:**
- <meta>
- Reference
  - <meta>
    - Props
    - Special rendering behavior
- Usage
  - Annotating the document with metadata
  - Annotating specific items within the document with metadata

The built-in browser <meta> component lets you add metadata to the document.

To add document metadata, render the built-in browser <meta> component. You can render <meta> from any component and React will always place the corresponding DOM element in the document head.

See more examples below.

<meta> supports all common element props.

It should have exactly one of the following props: name, httpEquiv, charset, itemProp. The <meta> component does something different depending on which of these props is specified.

React will always place the DOM element corresponding to the <meta> component within the document’s <head>, regardless of where in the React tree it is rendered. The <head> is the only valid place for <meta> to exist within the DOM, yet it’s convenient and keeps things composable if a component representing a specific page can render <meta> components itself.

There is one exception to this: if <meta> has an itemProp prop, there is no special behavior, because in this case it doesn’t represent metadata about the document but rather metadata about a specific part of the page.

You can annotate the document with metadata such as keywords, a summary, or the author’s name. React will place this metadata within the document <head> regardless of where in the React tree it is rendered.

You can render the <meta> component from any component. React will put a <meta> DOM node in the document <head>.

You can use the <meta> component with the itemProp prop to annotate specific items within the document with metadata. In this case, React will not place these annotations within the document <head> but will place them like any other React component.

**Examples:**

Example 1 (jsx):
```jsx
<meta name="keywords" content="React, JavaScript, semantic markup, html" />
```

Example 2 (jsx):
```jsx
<meta name="keywords" content="React, JavaScript, semantic markup, html" />
```

Example 3 (jsx):
```jsx
<meta name="author" content="John Smith" /><meta name="keywords" content="React, JavaScript, semantic markup, html" /><meta name="description" content="API reference for the <meta> component in React DOM" />
```

Example 4 (jsx):
```jsx
<section itemScope>  <h3>Annotating specific items</h3>  <meta itemProp="description" content="API reference for using <meta> with itemProp" />  <p>...</p></section>
```

---

## Server Components

**URL:** https://react.dev/reference/rsc/server-components

**Contents:**
- Server Components
  - Note
    - How do I build support for Server Components?
  - Server Components without a Server
  - Note
  - Server Components with a Server
  - Adding interactivity to Server Components
  - Note
    - There is no directive for Server Components.
  - Async components with Server Components

Server Components are a new type of Component that renders ahead of time, before bundling, in an environment separate from your client app or SSR server.

This separate environment is the “server” in React Server Components. Server Components can run once at build time on your CI server, or they can be run for each request using a web server.

While React Server Components in React 19 are stable and will not break between minor versions, the underlying APIs used to implement a React Server Components bundler or framework do not follow semver and may break between minors in React 19.x.

To support React Server Components as a bundler or framework, we recommend pinning to a specific React version, or using the Canary release. We will continue working with bundlers and frameworks to stabilize the APIs used to implement React Server Components in the future.

Server components can run at build time to read from the filesystem or fetch static content, so a web server is not required. For example, you may want to read static data from a content management system.

Without Server Components, it’s common to fetch static data on the client with an Effect:

This pattern means users need to download and parse an additional 75K (gzipped) of libraries, and wait for a second request to fetch the data after the page loads, just to render static content that will not change for the lifetime of the page.

With Server Components, you can render these components once at build time:

The rendered output can then be server-side rendered (SSR) to HTML and uploaded to a CDN. When the app loads, the client will not see the original Page component, or the expensive libraries for rendering the markdown. The client will only see the rendered output:

This means the content is visible during first page load, and the bundle does not include the expensive libraries needed to render the static content.

You may notice that the Server Component above is an async function:

Async Components are a new feature of Server Components that allow you to await in render.

See Async components with Server Components below.

Server Components can also run on a web server during a request for a page, letting you access your data layer without having to build an API. They are rendered before your application is bundled, and can pass data and JSX as props to Client Components.

Without Server Components, it’s common to fetch dynamic data on the client in an Effect:

With Server Components, you can read the data and render it in the component:

The bundler then combines the data, rendered Server Components and dynamic Client Components into a bundle. Optionally, that bundle can then be server-side rendered (SSR) to create the initial HTML for the page. When the page loads, the browser does not see the original Note and Author components; only the rendered output is sent to the client:

Server Components can be made dynamic by re-fetching them from a server, where they can access the data and render again. This new application architecture combines the simple “request/response” mental model of server-centric Multi-Page Apps with the seamless interactivity of client-centric Single-Page Apps, giving you the best of both worlds.

Server Components are not sent to the browser, so they cannot use interactive APIs like useState. To add interactivity to Server Components, you can compose them with Client Component using the "use client" directive.

A common misunderstanding is that Server Components are denoted by "use server", but there is no directive for Server Components. The "use server" directive is used for Server Functions.

For more info, see the docs for Directives.

In the following example, the Notes Server Component imports an Expandable Client Component that uses state to toggle its expanded state:

This works by first rendering Notes as a Server Component, and then instructing the bundler to create a bundle for the Client Component Expandable. In the browser, the Client Components will see output of the Server Components passed as props:

Server Components introduce a new way to write Components using async/await. When you await in an async component, React will suspend and wait for the promise to resolve before resuming rendering. This works across server/client boundaries with streaming support for Suspense.

You can even create a promise on the server, and await it on the client:

The note content is important data for the page to render, so we await it on the server. The comments are below the fold and lower-priority, so we start the promise on the server, and wait for it on the client with the use API. This will Suspend on the client, without blocking the note content from rendering.

Since async components are not supported on the client, we await the promise with use.

**Examples:**

Example 1 (jsx):
```jsx
// bundle.jsimport marked from 'marked'; // 35.9K (11.2K gzipped)import sanitizeHtml from 'sanitize-html'; // 206K (63.3K gzipped)function Page({page}) {  const [content, setContent] = useState('');  // NOTE: loads *after* first page render.  useEffect(() => {    fetch(`/api/content/${page}`).then((data) => {      setContent(data.content);    });  }, [page]);  return <div>{sanitizeHtml(marked(content))}</div>;}
```

Example 2 (javascript):
```javascript
// api.jsapp.get(`/api/content/:page`, async (req, res) => {  const page = req.params.page;  const content = await file.readFile(`${page}.md`);  res.send({content});});
```

Example 3 (javascript):
```javascript
import marked from 'marked'; // Not included in bundleimport sanitizeHtml from 'sanitize-html'; // Not included in bundleasync function Page({page}) {  // NOTE: loads *during* render, when the app is built.  const content = await file.readFile(`${page}.md`);  return <div>{sanitizeHtml(marked(content))}</div>;}
```

Example 4 (typescript):
```typescript
<div><!-- html for markdown --></div>
```

---

## Built-in React Components

**URL:** https://react.dev/reference/react/components

**Contents:**
- Built-in React Components
- Built-in components
- Your own components

React exposes a few built-in components that you can use in your JSX.

You can also define your own components as JavaScript functions.

---

## PureComponent

**URL:** https://react.dev/reference/react/PureComponent

**Contents:**
- PureComponent
  - Pitfall
- Reference
  - PureComponent
- Usage
  - Skipping unnecessary re-renders for class components
  - Pitfall
- Alternatives
  - Migrating from a PureComponent class component to a function
  - Note

We recommend defining components as functions instead of classes. See how to migrate.

PureComponent is similar to Component but it skips re-renders for same props and state. Class components are still supported by React, but we don’t recommend using them in new code.

To skip re-rendering a class component for same props and state, extend PureComponent instead of Component:

PureComponent is a subclass of Component and supports all the Component APIs. Extending PureComponent is equivalent to defining a custom shouldComponentUpdate method that shallowly compares props and state.

See more examples below.

React normally re-renders a component whenever its parent re-renders. As an optimization, you can create a component that React will not re-render when its parent re-renders so long as its new props and state are the same as the old props and state. Class components can opt into this behavior by extending PureComponent:

A React component should always have pure rendering logic. This means that it must return the same output if its props, state, and context haven’t changed. By using PureComponent, you are telling React that your component complies with this requirement, so React doesn’t need to re-render as long as its props and state haven’t changed. However, your component will still re-render if a context that it’s using changes.

In this example, notice that the Greeting component re-renders whenever name is changed (because that’s one of its props), but not when address is changed (because it’s not passed to Greeting as a prop):

We recommend defining components as functions instead of classes. See how to migrate.

We recommend using function components instead of class components in new code. If you have some existing class components using PureComponent, here is how you can convert them. This is the original code:

When you convert this component from a class to a function, wrap it in memo:

Unlike PureComponent, memo does not compare the new and the old state. In function components, calling the set function with the same state already prevents re-renders by default, even without memo.

**Examples:**

Example 1 (jsx):
```jsx
class Greeting extends PureComponent {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}
```

Example 2 (jsx):
```jsx
import { PureComponent } from 'react';class Greeting extends PureComponent {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}
```

Example 3 (jsx):
```jsx
class Greeting extends PureComponent {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}
```

---

## <form>

**URL:** https://react.dev/reference/react-dom/components/form

**Contents:**
- <form>
- Reference
  - <form>
    - Props
    - Caveats
- Usage
  - Handle form submission on the client
  - Handle form submission with a Server Function
  - Display a pending state during form submission
  - Optimistically updating form data

The built-in browser <form> component lets you create interactive controls for submitting information.

To create interactive controls for submitting information, render the built-in browser <form> component.

See more examples below.

<form> supports all common element props.

action: a URL or function. When a URL is passed to action the form will behave like the HTML form component. When a function is passed to action the function will handle the form submission in a Transition following the Action prop pattern. The function passed to action may be async and will be called with a single argument containing the form data of the submitted form. The action prop can be overridden by a formAction attribute on a <button>, <input type="submit">, or <input type="image"> component.

Pass a function to the action prop of form to run the function when the form is submitted. formData will be passed to the function as an argument so you can access the data submitted by the form. This differs from the conventional HTML action, which only accepts URLs. After the action function succeeds, all uncontrolled field elements in the form are reset.

Render a <form> with an input and submit button. Pass a Server Function (a function marked with 'use server') to the action prop of form to run the function when the form is submitted.

Passing a Server Function to <form action> allow users to submit forms without JavaScript enabled or before the code has loaded. This is beneficial to users who have a slow connection, device, or have JavaScript disabled and is similar to the way forms work when a URL is passed to the action prop.

You can use hidden form fields to provide data to the <form>’s action. The Server Function will be called with the hidden form field data as an instance of FormData.

In lieu of using hidden form fields to provide data to the <form>’s action, you can call the bind method to supply it with extra arguments. This will bind a new argument (productId) to the function in addition to the formData that is passed as an argument to the function.

When <form> is rendered by a Server Component, and a Server Function is passed to the <form>’s action prop, the form is progressively enhanced.

To display a pending state when a form is being submitted, you can call the useFormStatus Hook in a component rendered in a <form> and read the pending property returned.

Here, we use the pending property to indicate the form is submitting.

To learn more about the useFormStatus Hook see the reference documentation.

The useOptimistic Hook provides a way to optimistically update the user interface before a background operation, like a network request, completes. In the context of forms, this technique helps to make apps feel more responsive. When a user submits a form, instead of waiting for the server’s response to reflect the changes, the interface is immediately updated with the expected outcome.

For example, when a user types a message into the form and hits the “Send” button, the useOptimistic Hook allows the message to immediately appear in the list with a “Sending…” label, even before the message is actually sent to a server. This “optimistic” approach gives the impression of speed and responsiveness. The form then attempts to truly send the message in the background. Once the server confirms the message has been received, the “Sending…” label is removed.

In some cases the function called by a <form>’s action prop throws an error. You can handle these errors by wrapping <form> in an Error Boundary. If the function called by a <form>’s action prop throws an error, the fallback for the error boundary will be displayed.

Displaying a form submission error message before the JavaScript bundle loads for progressive enhancement requires that:

useActionState takes two parameters: a Server Function and an initial state. useActionState returns two values, a state variable and an action. The action returned by useActionState should be passed to the action prop of the form. The state variable returned by useActionState can be used to display an error message. The value returned by the Server Function passed to useActionState will be used to update the state variable.

Learn more about updating state from a form action with the useActionState docs

Forms can be designed to handle multiple submission actions based on the button pressed by the user. Each button inside a form can be associated with a distinct action or behavior by setting the formAction prop.

When a user taps a specific button, the form is submitted, and a corresponding action, defined by that button’s attributes and action, is executed. For instance, a form might submit an article for review by default but have a separate button with formAction set to save the article as a draft.

**Examples:**

Example 1 (jsx):
```jsx
<form action={search}>    <input name="query" />    <button type="submit">Search</button></form>
```

Example 2 (jsx):
```jsx
<form action={search}>    <input name="query" />    <button type="submit">Search</button></form>
```

Example 3 (javascript):
```javascript
import { updateCart } from './lib.js';function AddToCart({productId}) {  async function addToCart(formData) {    'use server'    const productId = formData.get('productId')    await updateCart(productId)  }  return (    <form action={addToCart}>        <input type="hidden" name="productId" value={productId} />        <button type="submit">Add to Cart</button>    </form>  );}
```

Example 4 (javascript):
```javascript
import { updateCart } from './lib.js';function AddToCart({productId}) {  async function addToCart(productId, formData) {    "use server";    await updateCart(productId)  }  const addProductToCart = addToCart.bind(null, productId);  return (    <form action={addProductToCart}>      <button type="submit">Add to Cart</button>    </form>  );}
```

---

## Common components (e.g. <div>)

**URL:** https://react.dev/reference/react-dom/components/common

**Contents:**
- Common components (e.g. <div>)
- Reference
  - Common components (e.g. <div>)
    - Props
    - Caveats
  - ref callback function
    - Parameters
  - Note
    - React 19 added cleanup functions for ref callbacks.
    - Returns

All built-in browser components, such as <div>, support some common props and events.

See more examples below.

These special React props are supported for all built-in components:

children: A React node (an element, a string, a number, a portal, an empty node like null, undefined and booleans, or an array of other React nodes). Specifies the content inside the component. When you use JSX, you will usually specify the children prop implicitly by nesting tags like <div><span /></div>.

dangerouslySetInnerHTML: An object of the form { __html: '<p>some html</p>' } with a raw HTML string inside. Overrides the innerHTML property of the DOM node and displays the passed HTML inside. This should be used with extreme caution! If the HTML inside isn’t trusted (for example, if it’s based on user data), you risk introducing an XSS vulnerability. Read more about using dangerouslySetInnerHTML.

ref: A ref object from useRef or createRef, or a ref callback function, or a string for legacy refs. Your ref will be filled with the DOM element for this node. Read more about manipulating the DOM with refs.

suppressContentEditableWarning: A boolean. If true, suppresses the warning that React shows for elements that both have children and contentEditable={true} (which normally do not work together). Use this if you’re building a text input library that manages the contentEditable content manually.

suppressHydrationWarning: A boolean. If you use server rendering, normally there is a warning when the server and the client render different content. In some rare cases (like timestamps), it is very hard or impossible to guarantee an exact match. If you set suppressHydrationWarning to true, React will not warn you about mismatches in the attributes and the content of that element. It only works one level deep, and is intended to be used as an escape hatch. Don’t overuse it. Read about suppressing hydration errors.

style: An object with CSS styles, for example { fontWeight: 'bold', margin: 20 }. Similarly to the DOM style property, the CSS property names need to be written as camelCase, for example fontWeight instead of font-weight. You can pass strings or numbers as values. If you pass a number, like width: 100, React will automatically append px (“pixels”) to the value unless it’s a unitless property. We recommend using style only for dynamic styles where you don’t know the style values ahead of time. In other cases, applying plain CSS classes with className is more efficient. Read more about className and style.

These standard DOM props are also supported for all built-in components:

You can also pass custom attributes as props, for example mycustomprop="someValue". This can be useful when integrating with third-party libraries. The custom attribute name must be lowercase and must not start with on. The value will be converted to a string. If you pass null or undefined, the custom attribute will be removed.

These events fire only for the <form> elements:

These events fire only for the <dialog> elements. Unlike browser events, they bubble in React:

These events fire only for the <details> elements. Unlike browser events, they bubble in React:

These events fire for <img>, <iframe>, <object>, <embed>, <link>, and SVG <image> elements. Unlike browser events, they bubble in React:

These events fire for resources like <audio> and <video>. Unlike browser events, they bubble in React:

Instead of a ref object (like the one returned by useRef), you may pass a function to the ref attribute.

See an example of using the ref callback.

When the <div> DOM node is added to the screen, React will call your ref callback with the DOM node as the argument. When that <div> DOM node is removed, React will call your the cleanup function returned from the callback.

React will also call your ref callback whenever you pass a different ref callback. In the above example, (node) => { ... } is a different function on every render. When your component re-renders, the previous function will be called with null as the argument, and the next function will be called with the DOM node.

To support backwards compatibility, if a cleanup function is not returned from the ref callback, node will be called with null when the ref is detached. This behavior will be removed in a future version.

Your event handlers will receive a React event object. It is also sometimes known as a “synthetic event”.

It conforms to the same standard as the underlying DOM events, but fixes some browser inconsistencies.

Some React events do not map directly to the browser’s native events. For example in onMouseLeave, e.nativeEvent will point to a mouseout event. The specific mapping is not part of the public API and may change in the future. If you need the underlying browser event for some reason, read it from e.nativeEvent.

React event objects implement some of the standard Event properties:

Additionally, React event objects provide these properties:

React event objects implement some of the standard Event methods:

Additionally, React event objects provide these methods:

An event handler type for the CSS animation events.

An event handler type for the Clipboard API events.

e: A React event object with these extra ClipboardEvent properties:

An event handler type for the input method editor (IME) events.

An event handler type for the HTML Drag and Drop API events.

e: A React event object with these extra DragEvent properties:

It also includes the inherited MouseEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for the focus events.

e: A React event object with these extra FocusEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for generic events.

An event handler type for the onBeforeInput event.

An event handler type for keyboard events.

e: A React event object with these extra KeyboardEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for mouse events.

e: A React event object with these extra MouseEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for pointer events.

e: A React event object with these extra PointerEvent properties:

It also includes the inherited MouseEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for touch events.

e: A React event object with these extra TouchEvent properties:

It also includes the inherited UIEvent properties:

An event handler type for the CSS transition events.

An event handler type for generic UI events.

An event handler type for the onWheel event.

e: A React event object with these extra WheelEvent properties:

It also includes the inherited MouseEvent properties:

It also includes the inherited UIEvent properties:

In React, you specify a CSS class with className. It works like the class attribute in HTML:

Then you write the CSS rules for it in a separate CSS file:

React does not prescribe how you add CSS files. In the simplest case, you’ll add a <link> tag to your HTML. If you use a build tool or a framework, consult its documentation to learn how to add a CSS file to your project.

Sometimes, the style values depend on data. Use the style attribute to pass some styles dynamically:

In the above example, style={{}} is not a special syntax, but a regular {} object inside the style={ } JSX curly braces. We recommend only using the style attribute when your styles depend on JavaScript variables.

To apply CSS classes conditionally, you need to produce the className string yourself using JavaScript.

For example, className={'row ' + (isSelected ? 'selected': '')} will produce either className="row" or className="row selected" depending on whether isSelected is true.

To make this more readable, you can use a tiny helper library like classnames:

It is especially convenient if you have multiple conditional classes:

Sometimes, you’ll need to get the browser DOM node associated with a tag in JSX. For example, if you want to focus an <input> when a button is clicked, you need to call focus() on the browser <input> DOM node.

To obtain the browser DOM node for a tag, declare a ref and pass it as the ref attribute to that tag:

React will put the DOM node into inputRef.current after it’s been rendered to the screen.

Read more about manipulating DOM with refs and check out more examples.

For more advanced use cases, the ref attribute also accepts a callback function.

You can pass a raw HTML string to an element like so:

This is dangerous. As with the underlying DOM innerHTML property, you must exercise extreme caution! Unless the markup is coming from a completely trusted source, it is trivial to introduce an XSS vulnerability this way.

For example, if you use a Markdown library that converts Markdown to HTML, you trust that its parser doesn’t contain bugs, and the user only sees their own input, you can display the resulting HTML like this:

The {__html} object should be created as close to where the HTML is generated as possible, like the above example does in the renderMarkdownToHTML function. This ensures that all raw HTML being used in your code is explicitly marked as such, and that only variables that you expect to contain HTML are passed to dangerouslySetInnerHTML. It is not recommended to create the object inline like <div dangerouslySetInnerHTML={{__html: markup}} />.

To see why rendering arbitrary HTML is dangerous, replace the code above with this:

The code embedded in the HTML will run. A hacker could use this security hole to steal user information or to perform actions on their behalf. Only use dangerouslySetInnerHTML with trusted and sanitized data.

This example shows some common mouse events and when they fire.

This example shows some common pointer events and when they fire.

In React, focus events bubble. You can use the currentTarget and relatedTarget to differentiate if the focusing or blurring events originated from outside of the parent element. The example shows how to detect focusing a child, focusing the parent element, and how to detect focus entering or leaving the whole subtree.

This example shows some common keyboard events and when they fire.

**Examples:**

Example 1 (jsx):
```jsx
<div className="wrapper">Some content</div>
```

Example 2 (jsx):
```jsx
<div ref={(node) => {  console.log('Attached', node);  return () => {    console.log('Clean up', node)  }}}>
```

Example 3 (jsx):
```jsx
<button onClick={e => {  console.log(e); // React event object}} />
```

Example 4 (jsx):
```jsx
<div  onAnimationStart={e => console.log('onAnimationStart')}  onAnimationIteration={e => console.log('onAnimationIteration')}  onAnimationEnd={e => console.log('onAnimationEnd')}/>
```

---

## <style>

**URL:** https://react.dev/reference/react-dom/components/style

**Contents:**
- <style>
- Reference
  - <style>
    - Props
    - Special rendering behavior
- Usage
  - Rendering an inline CSS stylesheet

The built-in browser <style> component lets you add inline CSS stylesheets to your document.

To add inline styles to your document, render the built-in browser <style> component. You can render <style> from any component and React will in certain cases place the corresponding DOM element in the document head and de-duplicate identical styles.

See more examples below.

<style> supports all common element props.

Props that are not recommended for use with React:

React can move <style> components to the document’s <head>, de-duplicate identical stylesheets, and suspend while the stylesheet is loading.

To opt into this behavior, provide the href and precedence props. React will de-duplicate styles if they have the same href. The precedence prop tells React where to rank the <style> DOM node relative to others in the document <head>, which determines which stylesheet can override the other.

This special treatment comes with three caveats:

If a component depends on certain CSS styles in order to be displayed correctly, you can render an inline stylesheet within the component.

The href prop should uniquely identify the stylesheet, because React will de-duplicate stylesheets that have the same href. If you supply a precedence prop, React will reorder inline stylesheets based on the order these values appear in the component tree.

Inline stylesheets will not trigger Suspense boundaries while they’re loading. Even if they load async resources like fonts or images.

**Examples:**

Example 1 (css):
```css
<style>{` p { color: red; } `}</style>
```

Example 2 (css):
```css
<style>{` p { color: red; } `}</style>
```

---

## <textarea>

**URL:** https://react.dev/reference/react-dom/components/textarea

**Contents:**
- <textarea>
- Reference
  - <textarea>
    - Props
    - Caveats
- Usage
  - Displaying a text area
  - Providing a label for a text area
  - Providing an initial value for a text area
  - Pitfall

The built-in browser <textarea> component lets you render a multiline text input.

To display a text area, render the built-in browser <textarea> component.

See more examples below.

<textarea> supports all common element props.

You can make a text area controlled by passing a value prop:

When you pass value, you must also pass an onChange handler that updates the passed value.

If your <textarea> is uncontrolled, you may pass the defaultValue prop instead:

These <textarea> props are relevant both for uncontrolled and controlled text areas:

Render <textarea> to display a text area. You can specify its default size with the rows and cols attributes, but by default the user will be able to resize it. To disable resizing, you can specify resize: none in the CSS.

Typically, you will place every <textarea> inside a <label> tag. This tells the browser that this label is associated with that text area. When the user clicks the label, the browser will focus the text area. It’s also essential for accessibility: a screen reader will announce the label caption when the user focuses the text area.

If you can’t nest <textarea> into a <label>, associate them by passing the same ID to <textarea id> and <label htmlFor>. To avoid conflicts between instances of one component, generate such an ID with useId.

You can optionally specify the initial value for the text area. Pass it as the defaultValue string.

Unlike in HTML, passing initial text like <textarea>Some content</textarea> is not supported.

Add a <form> around your textarea with a <button type="submit"> inside. It will call your <form onSubmit> event handler. By default, the browser will send the form data to the current URL and refresh the page. You can override that behavior by calling e.preventDefault(). Read the form data with new FormData(e.target).

Give a name to your <textarea>, for example <textarea name="postContent" />. The name you specified will be used as a key in the form data, for example { postContent: "Your post" }.

By default, any <button> inside a <form> will submit it. This can be surprising! If you have your own custom Button React component, consider returning <button type="button"> instead of <button>. Then, to be explicit, use <button type="submit"> for buttons that are supposed to submit the form.

A text area like <textarea /> is uncontrolled. Even if you pass an initial value like <textarea defaultValue="Initial text" />, your JSX only specifies the initial value, not the value right now.

To render a controlled text area, pass the value prop to it. React will force the text area to always have the value you passed. Typically, you will control a text area by declaring a state variable:

This is useful if you want to re-render some part of the UI in response to every keystroke.

If you pass value without onChange, it will be impossible to type into the text area. When you control a text area by passing some value to it, you force it to always have the value you passed. So if you pass a state variable as a value but forget to update that state variable synchronously during the onChange event handler, React will revert the text area after every keystroke back to the value that you specified.

If you render a text area with value but no onChange, you will see an error in the console:

As the error message suggests, if you only wanted to specify the initial value, pass defaultValue instead:

If you want to control this text area with a state variable, specify an onChange handler:

If the value is intentionally read-only, add a readOnly prop to suppress the error:

If you control a text area, you must update its state variable to the text area’s value from the DOM during onChange.

You can’t update it to something other than e.target.value:

You also can’t update it asynchronously:

To fix your code, update it synchronously to e.target.value:

If this doesn’t fix the problem, it’s possible that the text area gets removed and re-added from the DOM on every keystroke. This can happen if you’re accidentally resetting state on every re-render. For example, this can happen if the text area or one of its parents always receives a different key attribute, or if you nest component definitions (which is not allowed in React and causes the “inner” component to remount on every render).

If you provide a value to the component, it must remain a string throughout its lifetime.

You cannot pass value={undefined} first and later pass value="some string" because React won’t know whether you want the component to be uncontrolled or controlled. A controlled component should always receive a string value, not null or undefined.

If your value is coming from an API or a state variable, it might be initialized to null or undefined. In that case, either set it to an empty string ('') initially, or pass value={someValue ?? ''} to ensure value is a string.

**Examples:**

Example 1 (jsx):
```jsx
<textarea />
```

Example 2 (jsx):
```jsx
<textarea name="postContent" />
```

Example 3 (jsx):
```jsx
function NewPost() {  const [postContent, setPostContent] = useState(''); // Declare a state variable...  // ...  return (    <textarea      value={postContent} // ...force the input's value to match the state variable...      onChange={e => setPostContent(e.target.value)} // ... and update the state variable on any edits!    />  );}
```

Example 4 (jsx):
```jsx
// 🔴 Bug: controlled text area with no onChange handler<textarea value={something} />
```

---

## renderToStaticMarkup

**URL:** https://react.dev/reference/react-dom/server/renderToStaticMarkup

**Contents:**
- renderToStaticMarkup
- Reference
  - renderToStaticMarkup(reactNode, options?)
    - Parameters
    - Returns
    - Caveats
- Usage
  - Rendering a non-interactive React tree as HTML to a string
  - Pitfall

renderToStaticMarkup renders a non-interactive React tree to an HTML string.

On the server, call renderToStaticMarkup to render your app to HTML.

It will produce non-interactive HTML output of your React components.

See more examples below.

renderToStaticMarkup output cannot be hydrated.

renderToStaticMarkup has limited Suspense support. If a component suspends, renderToStaticMarkup immediately sends its fallback as HTML.

renderToStaticMarkup works in the browser, but using it in the client code is not recommended. If you need to render a component to HTML in the browser, get the HTML by rendering it into a DOM node.

Call renderToStaticMarkup to render your app to an HTML string which you can send with your server response:

This will produce the initial non-interactive HTML output of your React components.

This method renders non-interactive HTML that cannot be hydrated. This is useful if you want to use React as a simple static page generator, or if you’re rendering completely static content like emails.

Interactive apps should use renderToString on the server and hydrateRoot on the client.

**Examples:**

Example 1 (javascript):
```javascript
const html = renderToStaticMarkup(reactNode, options?)
```

Example 2 (jsx):
```jsx
import { renderToStaticMarkup } from 'react-dom/server';const html = renderToStaticMarkup(<Page />);
```

Example 3 (jsx):
```jsx
import { renderToStaticMarkup } from 'react-dom/server';// The route handler syntax depends on your backend frameworkapp.use('/', (request, response) => {  const html = renderToStaticMarkup(<Page />);  response.send(html);});
```

---

## React calls Components and Hooks

**URL:** https://react.dev/reference/rules/react-calls-components-and-hooks

**Contents:**
- React calls Components and Hooks
- Never call component functions directly
- Never pass around Hooks as regular values
  - Don’t dynamically mutate a Hook
  - Don’t dynamically use Hooks

React is responsible for rendering components and Hooks when necessary to optimize the user experience. It is declarative: you tell React what to render in your component’s logic, and React will figure out how best to display it to your user.

Components should only be used in JSX. Don’t call them as regular functions. React should call it.

React must decide when your component function is called during rendering. In React, you do this using JSX.

If a component contains Hooks, it’s easy to violate the Rules of Hooks when components are called directly in a loop or conditionally.

Letting React orchestrate rendering also allows a number of benefits:

Hooks should only be called inside of components or Hooks. Never pass it around as a regular value.

Hooks allow you to augment a component with React features. They should always be called as a function, and never passed around as a regular value. This enables local reasoning, or the ability for developers to understand everything a component can do by looking at that component in isolation.

Breaking this rule will cause React to not automatically optimize your component.

Hooks should be as “static” as possible. This means you shouldn’t dynamically mutate them. For example, this means you shouldn’t write higher order Hooks:

Hooks should be immutable and not be mutated. Instead of mutating a Hook dynamically, create a static version of the Hook with the desired functionality.

Hooks should also not be dynamically used: for example, instead of doing dependency injection in a component by passing a Hook as a value:

You should always inline the call of the Hook into that component and handle any logic in there.

This way, <Button /> is much easier to understand and debug. When Hooks are used in dynamic ways, it increases the complexity of your app greatly and inhibits local reasoning, making your team less productive in the long term. It also makes it easier to accidentally break the Rules of Hooks that Hooks should not be called conditionally. If you find yourself needing to mock components for tests, it’s better to mock the server instead to respond with canned data. If possible, it’s also usually more effective to test your app with end-to-end tests.

**Examples:**

Example 1 (jsx):
```jsx
function BlogPost() {  return <Layout><Article /></Layout>; // ✅ Good: Only use components in JSX}
```

Example 2 (javascript):
```javascript
function BlogPost() {  return <Layout>{Article()}</Layout>; // 🔴 Bad: Never call them directly}
```

Example 3 (javascript):
```javascript
function ChatInput() {  const useDataWithLogging = withLogging(useData); // 🔴 Bad: don't write higher order Hooks  const data = useDataWithLogging();}
```

Example 4 (javascript):
```javascript
function ChatInput() {  const data = useDataWithLogging(); // ✅ Good: Create a new version of the Hook}function useDataWithLogging() {  // ... Create a new version of the Hook and inline the logic here}
```

---

## Component

**URL:** https://react.dev/reference/react/Component

**Contents:**
- Component
  - Pitfall
- Reference
  - Component
  - context
  - Note
  - props
  - Note
  - state
  - Note

We recommend defining components as functions instead of classes. See how to migrate.

Component is the base class for the React components defined as JavaScript classes. Class components are still supported by React, but we don’t recommend using them in new code.

To define a React component as a class, extend the built-in Component class and define a render method:

Only the render method is required, other methods are optional.

See more examples below.

The context of a class component is available as this.context. It is only available if you specify which context you want to receive using static contextType.

A class component can only read one context at a time.

Reading this.context in class components is equivalent to useContext in function components.

The props passed to a class component are available as this.props.

Reading this.props in class components is equivalent to declaring props in function components.

The state of a class component is available as this.state. The state field must be an object. Do not mutate the state directly. If you wish to change the state, call setState with the new state.

Defining state in class components is equivalent to calling useState in function components.

The constructor runs before your class component mounts (gets added to the screen). Typically, a constructor is only used for two purposes in React. It lets you declare state and bind your class methods to the class instance:

If you use modern JavaScript syntax, constructors are rarely needed. Instead, you can rewrite this code above using the public class field syntax which is supported both by modern browsers and tools like Babel:

A constructor should not contain any side effects or subscriptions.

constructor should not return anything.

Do not run any side effects or subscriptions in the constructor. Instead, use componentDidMount for that.

Inside a constructor, you need to call super(props) before any other statement. If you don’t do that, this.props will be undefined while the constructor runs, which can be confusing and cause bugs.

Constructor is the only place where you can assign this.state directly. In all other methods, you need to use this.setState() instead. Do not call setState in the constructor.

When you use server rendering, the constructor will run on the server too, followed by the render method. However, lifecycle methods like componentDidMount or componentWillUnmount will not run on the server.

When Strict Mode is on, React will call constructor twice in development and then throw away one of the instances. This helps you notice the accidental side effects that need to be moved out of the constructor.

There is no exact equivalent for constructor in function components. To declare state in a function component, call useState. To avoid recalculating the initial state, pass a function to useState.

If you define componentDidCatch, React will call it when some child component (including distant children) throws an error during rendering. This lets you log that error to an error reporting service in production.

Typically, it is used together with static getDerivedStateFromError which lets you update state in response to an error and display an error message to the user. A component with these methods is called an Error Boundary.

error: The error that was thrown. In practice, it will usually be an instance of Error but this is not guaranteed because JavaScript allows to throw any value, including strings or even null.

info: An object containing additional information about the error. Its componentStack field contains a stack trace with the component that threw, as well as the names and source locations of all its parent components. In production, the component names will be minified. If you set up production error reporting, you can decode the component stack using sourcemaps the same way as you would do for regular JavaScript error stacks.

componentDidCatch should not return anything.

In the past, it was common to call setState inside componentDidCatch in order to update the UI and display the fallback error message. This is deprecated in favor of defining static getDerivedStateFromError.

Production and development builds of React slightly differ in the way componentDidCatch handles errors. In development, the errors will bubble up to window, which means that any window.onerror or window.addEventListener('error', callback) will intercept the errors that have been caught by componentDidCatch. In production, instead, the errors will not bubble up, which means any ancestor error handler will only receive errors not explicitly caught by componentDidCatch.

There is no direct equivalent for componentDidCatch in function components yet. If you’d like to avoid creating class components, write a single ErrorBoundary component like above and use it throughout your app. Alternatively, you can use the react-error-boundary package which does that for you.

If you define the componentDidMount method, React will call it when your component is added (mounted) to the screen. This is a common place to start data fetching, set up subscriptions, or manipulate the DOM nodes.

If you implement componentDidMount, you usually need to implement other lifecycle methods to avoid bugs. For example, if componentDidMount reads some state or props, you also have to implement componentDidUpdate to handle their changes, and componentWillUnmount to clean up whatever componentDidMount was doing.

componentDidMount does not take any parameters.

componentDidMount should not return anything.

When Strict Mode is on, in development React will call componentDidMount, then immediately call componentWillUnmount, and then call componentDidMount again. This helps you notice if you forgot to implement componentWillUnmount or if its logic doesn’t fully “mirror” what componentDidMount does.

Although you may call setState immediately in componentDidMount, it’s best to avoid that when you can. It will trigger an extra rendering, but it will happen before the browser updates the screen. This guarantees that even though the render will be called twice in this case, the user won’t see the intermediate state. Use this pattern with caution because it often causes performance issues. In most cases, you should be able to assign the initial state in the constructor instead. It can, however, be necessary for cases like modals and tooltips when you need to measure a DOM node before rendering something that depends on its size or position.

For many use cases, defining componentDidMount, componentDidUpdate, and componentWillUnmount together in class components is equivalent to calling useEffect in function components. In the rare cases where it’s important for the code to run before browser paint, useLayoutEffect is a closer match.

If you define the componentDidUpdate method, React will call it immediately after your component has been re-rendered with updated props or state. This method is not called for the initial render.

You can use it to manipulate the DOM after an update. This is also a common place to do network requests as long as you compare the current props to previous props (e.g. a network request may not be necessary if the props have not changed). Typically, you’d use it together with componentDidMount and componentWillUnmount:

prevProps: Props before the update. Compare prevProps to this.props to determine what changed.

prevState: State before the update. Compare prevState to this.state to determine what changed.

snapshot: If you implemented getSnapshotBeforeUpdate, snapshot will contain the value you returned from that method. Otherwise, it will be undefined.

componentDidUpdate should not return anything.

componentDidUpdate will not get called if shouldComponentUpdate is defined and returns false.

The logic inside componentDidUpdate should usually be wrapped in conditions comparing this.props with prevProps, and this.state with prevState. Otherwise, there’s a risk of creating infinite loops.

Although you may call setState immediately in componentDidUpdate, it’s best to avoid that when you can. It will trigger an extra rendering, but it will happen before the browser updates the screen. This guarantees that even though the render will be called twice in this case, the user won’t see the intermediate state. This pattern often causes performance issues, but it may be necessary for rare cases like modals and tooltips when you need to measure a DOM node before rendering something that depends on its size or position.

For many use cases, defining componentDidMount, componentDidUpdate, and componentWillUnmount together in class components is equivalent to calling useEffect in function components. In the rare cases where it’s important for the code to run before browser paint, useLayoutEffect is a closer match.

This API has been renamed from componentWillMount to UNSAFE_componentWillMount. The old name has been deprecated. In a future major version of React, only the new name will work.

Run the rename-unsafe-lifecycles codemod to automatically update your components.

This API has been renamed from componentWillReceiveProps to UNSAFE_componentWillReceiveProps. The old name has been deprecated. In a future major version of React, only the new name will work.

Run the rename-unsafe-lifecycles codemod to automatically update your components.

This API has been renamed from componentWillUpdate to UNSAFE_componentWillUpdate. The old name has been deprecated. In a future major version of React, only the new name will work.

Run the rename-unsafe-lifecycles codemod to automatically update your components.

If you define the componentWillUnmount method, React will call it before your component is removed (unmounted) from the screen. This is a common place to cancel data fetching or remove subscriptions.

The logic inside componentWillUnmount should “mirror” the logic inside componentDidMount. For example, if componentDidMount sets up a subscription, componentWillUnmount should clean up that subscription. If the cleanup logic in your componentWillUnmount reads some props or state, you will usually also need to implement componentDidUpdate to clean up resources (such as subscriptions) corresponding to the old props and state.

componentWillUnmount does not take any parameters.

componentWillUnmount should not return anything.

For many use cases, defining componentDidMount, componentDidUpdate, and componentWillUnmount together in class components is equivalent to calling useEffect in function components. In the rare cases where it’s important for the code to run before browser paint, useLayoutEffect is a closer match.

Forces a component to re-render.

Usually, this is not necessary. If your component’s render method only reads from this.props, this.state, or this.context, it will re-render automatically when you call setState inside your component or one of its parents. However, if your component’s render method reads directly from an external data source, you have to tell React to update the user interface when that data source changes. That’s what forceUpdate lets you do.

Try to avoid all uses of forceUpdate and only read from this.props and this.state in render.

forceUpdate does not return anything.

Reading an external data source and forcing class components to re-render in response to its changes with forceUpdate has been superseded by useSyncExternalStore in function components.

If you implement getSnapshotBeforeUpdate, React will call it immediately before React updates the DOM. It enables your component to capture some information from the DOM (e.g. scroll position) before it is potentially changed. Any value returned by this lifecycle method will be passed as a parameter to componentDidUpdate.

For example, you can use it in a UI like a chat thread that needs to preserve its scroll position during updates:

In the above example, it is important to read the scrollHeight property directly in getSnapshotBeforeUpdate. It is not safe to read it in render, UNSAFE_componentWillReceiveProps, or UNSAFE_componentWillUpdate because there is a potential time gap between these methods getting called and React updating the DOM.

prevProps: Props before the update. Compare prevProps to this.props to determine what changed.

prevState: State before the update. Compare prevState to this.state to determine what changed.

You should return a snapshot value of any type that you’d like, or null. The value you returned will be passed as the third argument to componentDidUpdate.

At the moment, there is no equivalent to getSnapshotBeforeUpdate for function components. This use case is very uncommon, but if you have the need for it, for now you’ll have to write a class component.

The render method is the only required method in a class component.

The render method should specify what you want to appear on the screen, for example:

React may call render at any moment, so you shouldn’t assume that it runs at a particular time. Usually, the render method should return a piece of JSX, but a few other return types (like strings) are supported. To calculate the returned JSX, the render method can read this.props, this.state, and this.context.

You should write the render method as a pure function, meaning that it should return the same result if props, state, and context are the same. It also shouldn’t contain side effects (like setting up subscriptions) or interact with the browser APIs. Side effects should happen either in event handlers or methods like componentDidMount.

render does not take any parameters.

render can return any valid React node. This includes React elements such as <div />, strings, numbers, portals, empty nodes (null, undefined, true, and false), and arrays of React nodes.

render should be written as a pure function of props, state, and context. It should not have side effects.

render will not get called if shouldComponentUpdate is defined and returns false.

When Strict Mode is on, React will call render twice in development and then throw away one of the results. This helps you notice the accidental side effects that need to be moved out of the render method.

There is no one-to-one correspondence between the render call and the subsequent componentDidMount or componentDidUpdate call. Some of the render call results may be discarded by React when it’s beneficial.

Call setState to update the state of your React component.

setState enqueues changes to the component state. It tells React that this component and its children need to re-render with the new state. This is the main way you’ll update the user interface in response to interactions.

Calling setState does not change the current state in the already executing code:

It only affects what this.state will return starting from the next render.

You can also pass a function to setState. It lets you update state based on the previous state:

You don’t have to do this, but it’s handy if you want to update state multiple times during the same event.

nextState: Either an object or a function.

optional callback: If specified, React will call the callback you’ve provided after the update is committed.

setState does not return anything.

Think of setState as a request rather than an immediate command to update the component. When multiple components update their state in response to an event, React will batch their updates and re-render them together in a single pass at the end of the event. In the rare case that you need to force a particular state update to be applied synchronously, you may wrap it in flushSync, but this may hurt performance.

setState does not update this.state immediately. This makes reading this.state right after calling setState a potential pitfall. Instead, use componentDidUpdate or the setState callback argument, either of which are guaranteed to fire after the update has been applied. If you need to set the state based on the previous state, you can pass a function to nextState as described above.

Calling setState in class components is similar to calling a set function in function components.

If you define shouldComponentUpdate, React will call it to determine whether a re-render can be skipped.

If you are confident you want to write it by hand, you may compare this.props with nextProps and this.state with nextState and return false to tell React the update can be skipped.

React calls shouldComponentUpdate before rendering when new props or state are being received. Defaults to true. This method is not called for the initial render or when forceUpdate is used.

Return true if you want the component to re-render. That’s the default behavior.

Return false to tell React that re-rendering can be skipped.

This method only exists as a performance optimization. If your component breaks without it, fix that first.

Consider using PureComponent instead of writing shouldComponentUpdate by hand. PureComponent shallowly compares props and state, and reduces the chance that you’ll skip a necessary update.

We do not recommend doing deep equality checks or using JSON.stringify in shouldComponentUpdate. It makes performance unpredictable and dependent on the data structure of every prop and state. In the best case, you risk introducing multi-second stalls to your application, and in the worst case you risk crashing it.

Returning false does not prevent child components from re-rendering when their state changes.

Returning false does not guarantee that the component will not re-render. React will use the return value as a hint but it may still choose to re-render your component if it makes sense to do for other reasons.

Optimizing class components with shouldComponentUpdate is similar to optimizing function components with memo. Function components also offer more granular optimization with useMemo.

If you define UNSAFE_componentWillMount, React will call it immediately after the constructor. It only exists for historical reasons and should not be used in any new code. Instead, use one of the alternatives:

See examples of migrating away from unsafe lifecycles.

UNSAFE_componentWillMount does not take any parameters.

UNSAFE_componentWillMount should not return anything.

UNSAFE_componentWillMount will not get called if the component implements static getDerivedStateFromProps or getSnapshotBeforeUpdate.

Despite its naming, UNSAFE_componentWillMount does not guarantee that the component will get mounted if your app uses modern React features like Suspense. If a render attempt is suspended (for example, because the code for some child component has not loaded yet), React will throw the in-progress tree away and attempt to construct the component from scratch during the next attempt. This is why this method is “unsafe”. Code that relies on mounting (like adding a subscription) should go into componentDidMount.

UNSAFE_componentWillMount is the only lifecycle method that runs during server rendering. For all practical purposes, it is identical to constructor, so you should use the constructor for this type of logic instead.

Calling setState inside UNSAFE_componentWillMount in a class component to initialize state is equivalent to passing that state as the initial state to useState in a function component.

If you define UNSAFE_componentWillReceiveProps, React will call it when the component receives new props. It only exists for historical reasons and should not be used in any new code. Instead, use one of the alternatives:

See examples of migrating away from unsafe lifecycles.

UNSAFE_componentWillReceiveProps should not return anything.

UNSAFE_componentWillReceiveProps will not get called if the component implements static getDerivedStateFromProps or getSnapshotBeforeUpdate.

Despite its naming, UNSAFE_componentWillReceiveProps does not guarantee that the component will receive those props if your app uses modern React features like Suspense. If a render attempt is suspended (for example, because the code for some child component has not loaded yet), React will throw the in-progress tree away and attempt to construct the component from scratch during the next attempt. By the time of the next render attempt, the props might be different. This is why this method is “unsafe”. Code that should run only for committed updates (like resetting a subscription) should go into componentDidUpdate.

UNSAFE_componentWillReceiveProps does not mean that the component has received different props than the last time. You need to compare nextProps and this.props yourself to check if something changed.

React doesn’t call UNSAFE_componentWillReceiveProps with initial props during mounting. It only calls this method if some of component’s props are going to be updated. For example, calling setState doesn’t generally trigger UNSAFE_componentWillReceiveProps inside the same component.

Calling setState inside UNSAFE_componentWillReceiveProps in a class component to “adjust” state is equivalent to calling the set function from useState during rendering in a function component.

If you define UNSAFE_componentWillUpdate, React will call it before rendering with the new props or state. It only exists for historical reasons and should not be used in any new code. Instead, use one of the alternatives:

See examples of migrating away from unsafe lifecycles.

UNSAFE_componentWillUpdate should not return anything.

UNSAFE_componentWillUpdate will not get called if shouldComponentUpdate is defined and returns false.

UNSAFE_componentWillUpdate will not get called if the component implements static getDerivedStateFromProps or getSnapshotBeforeUpdate.

It’s not supported to call setState (or any method that leads to setState being called, like dispatching a Redux action) during componentWillUpdate.

Despite its naming, UNSAFE_componentWillUpdate does not guarantee that the component will update if your app uses modern React features like Suspense. If a render attempt is suspended (for example, because the code for some child component has not loaded yet), React will throw the in-progress tree away and attempt to construct the component from scratch during the next attempt. By the time of the next render attempt, the props and state might be different. This is why this method is “unsafe”. Code that should run only for committed updates (like resetting a subscription) should go into componentDidUpdate.

UNSAFE_componentWillUpdate does not mean that the component has received different props or state than the last time. You need to compare nextProps with this.props and nextState with this.state yourself to check if something changed.

React doesn’t call UNSAFE_componentWillUpdate with initial props and state during mounting.

There is no direct equivalent to UNSAFE_componentWillUpdate in function components.

If you want to read this.context from your class component, you must specify which context it needs to read. The context you specify as the static contextType must be a value previously created by createContext.

Reading this.context in class components is equivalent to useContext in function components.

You can define static defaultProps to set the default props for the class. They will be used for undefined and missing props, but not for null props.

For example, here is how you define that the color prop should default to 'blue':

If the color prop is not provided or is undefined, it will be set by default to 'blue':

Defining defaultProps in class components is similar to using default values in function components.

If you define static getDerivedStateFromError, React will call it when a child component (including distant children) throws an error during rendering. This lets you display an error message instead of clearing the UI.

Typically, it is used together with componentDidCatch which lets you send the error report to some analytics service. A component with these methods is called an Error Boundary.

static getDerivedStateFromError should return the state telling the component to display the error message.

There is no direct equivalent for static getDerivedStateFromError in function components yet. If you’d like to avoid creating class components, write a single ErrorBoundary component like above and use it throughout your app. Alternatively, use the react-error-boundary package which does that.

If you define static getDerivedStateFromProps, React will call it right before calling render, both on the initial mount and on subsequent updates. It should return an object to update the state, or null to update nothing.

This method exists for rare use cases where the state depends on changes in props over time. For example, this Form component resets the email state when the userID prop changes:

Note that this pattern requires you to keep a previous value of the prop (like userID) in state (like prevUserID).

Deriving state leads to verbose code and makes your components difficult to think about. Make sure you’re familiar with simpler alternatives:

static getDerivedStateFromProps return an object to update the state, or null to update nothing.

This method is fired on every render, regardless of the cause. This is different from UNSAFE_componentWillReceiveProps, which only fires when the parent causes a re-render and not as a result of a local setState.

This method doesn’t have access to the component instance. If you’d like, you can reuse some code between static getDerivedStateFromProps and the other class methods by extracting pure functions of the component props and state outside the class definition.

Implementing static getDerivedStateFromProps in a class component is equivalent to calling the set function from useState during rendering in a function component.

To define a React component as a class, extend the built-in Component class and define a render method:

React will call your render method whenever it needs to figure out what to display on the screen. Usually, you will return some JSX from it. Your render method should be a pure function: it should only calculate the JSX.

Similarly to function components, a class component can receive information by props from its parent component. However, the syntax for reading props is different. For example, if the parent component renders <Greeting name="Taylor" />, then you can read the name prop from this.props, like this.props.name:

Note that Hooks (functions starting with use, like useState) are not supported inside class components.

We recommend defining components as functions instead of classes. See how to migrate.

To add state to a class, assign an object to a property called state. To update state, call this.setState.

We recommend defining components as functions instead of classes. See how to migrate.

There are a few special methods you can define on your class.

If you define the componentDidMount method, React will call it when your component is added (mounted) to the screen. React will call componentDidUpdate after your component re-renders due to changed props or state. React will call componentWillUnmount after your component has been removed (unmounted) from the screen.

If you implement componentDidMount, you usually need to implement all three lifecycles to avoid bugs. For example, if componentDidMount reads some state or props, you also have to implement componentDidUpdate to handle their changes, and componentWillUnmount to clean up whatever componentDidMount was doing.

For example, this ChatRoom component keeps a chat connection synchronized with props and state:

Note that in development when Strict Mode is on, React will call componentDidMount, immediately call componentWillUnmount, and then call componentDidMount again. This helps you notice if you forgot to implement componentWillUnmount or if its logic doesn’t fully “mirror” what componentDidMount does.

We recommend defining components as functions instead of classes. See how to migrate.

By default, if your application throws an error during rendering, React will remove its UI from the screen. To prevent this, you can wrap a part of your UI into an Error Boundary. An Error Boundary is a special component that lets you display some fallback UI instead of the part that crashed—for example, an error message.

Error boundaries do not catch errors for:

To implement an Error Boundary component, you need to provide static getDerivedStateFromError which lets you update state in response to an error and display an error message to the user. You can also optionally implement componentDidCatch to add some extra logic, for example, to log the error to an analytics service.

With captureOwnerStack you can include the Owner Stack during development.

Then you can wrap a part of your component tree with it:

If Profile or its child component throws an error, ErrorBoundary will “catch” that error, display a fallback UI with the error message you’ve provided, and send a production error report to your error reporting service.

You don’t need to wrap every component into a separate Error Boundary. When you think about the granularity of Error Boundaries, consider where it makes sense to display an error message. For example, in a messaging app, it makes sense to place an Error Boundary around the list of conversations. It also makes sense to place one around every individual message. However, it wouldn’t make sense to place a boundary around every avatar.

There is currently no way to write an Error Boundary as a function component. However, you don’t have to write the Error Boundary class yourself. For example, you can use react-error-boundary instead.

Typically, you will define components as functions instead.

For example, suppose you’re converting this Greeting class component to a function:

Define a function called Greeting. This is where you will move the body of your render function.

Instead of this.props.name, define the name prop using the destructuring syntax and read it directly:

Here is a complete example:

Suppose you’re converting this Counter class component to a function:

Start by declaring a function with the necessary state variables:

Next, convert the event handlers:

Finally, replace all references starting with this with the variables and functions you defined in your component. For example, replace this.state.age with age, and replace this.handleNameChange with handleNameChange.

Here is a fully converted component:

Suppose you’re converting this ChatRoom class component with lifecycle methods to a function:

First, verify that your componentWillUnmount does the opposite of componentDidMount. In the above example, that’s true: it disconnects the connection that componentDidMount sets up. If such logic is missing, add it first.

Next, verify that your componentDidUpdate method handles changes to any props and state you’re using in componentDidMount. In the above example, componentDidMount calls setupConnection which reads this.state.serverUrl and this.props.roomId. This is why componentDidUpdate checks whether this.state.serverUrl and this.props.roomId have changed, and resets the connection if they did. If your componentDidUpdate logic is missing or doesn’t handle changes to all relevant props and state, fix that first.

In the above example, the logic inside the lifecycle methods connects the component to a system outside of React (a chat server). To connect a component to an external system, describe this logic as a single Effect:

This useEffect call is equivalent to the logic in the lifecycle methods above. If your lifecycle methods do multiple unrelated things, split them into multiple independent Effects. Here is a complete example you can play with:

If your component does not synchronize with any external systems, you might not need an Effect.

In this example, the Panel and Button class components read context from this.context:

When you convert them to function components, replace this.context with useContext calls:

**Examples:**

Example 1 (jsx):
```jsx
class Greeting extends Component {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}
```

Example 2 (jsx):
```jsx
import { Component } from 'react';class Greeting extends Component {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}
```

Example 3 (jsx):
```jsx
class Button extends Component {  static contextType = ThemeContext;  render() {    const theme = this.context;    const className = 'button-' + theme;    return (      <button className={className}>        {this.props.children}      </button>    );  }}
```

Example 4 (jsx):
```jsx
class Greeting extends Component {  render() {    return <h1>Hello, {this.props.name}!</h1>;  }}<Greeting name="Taylor" />
```

---

## <title>

**URL:** https://react.dev/reference/react-dom/components/title

**Contents:**
- <title>
- Reference
  - <title>
    - Props
    - Special rendering behavior
  - Pitfall
- Usage
  - Set the document title
  - Use variables in the title

The built-in browser <title> component lets you specify the title of the document.

To specify the title of the document, render the built-in browser <title> component. You can render <title> from any component and React will always place the corresponding DOM element in the document head.

See more examples below.

<title> supports all common element props.

React will always place the DOM element corresponding to the <title> component within the document’s <head>, regardless of where in the React tree it is rendered. The <head> is the only valid place for <title> to exist within the DOM, yet it’s convenient and keeps things composable if a component representing a specific page can render its <title> itself.

There are two exception to this:

Only render a single <title> at a time. If more than one component renders a <title> tag at the same time, React will place all of those titles in the document head. When this happens, the behavior of browsers and search engines is undefined.

Render the <title> component from any component with text as its children. React will put a <title> DOM node in the document <head>.

The children of the <title> component must be a single string of text. (Or a single number or a single object with a toString method.) It might not be obvious, but using JSX curly braces like this:

… actually causes the <title> component to get a two-element array as its children (the string "Results page" and the value of pageNumber). This will cause an error. Instead, use string interpolation to pass <title> a single string:

**Examples:**

Example 1 (typescript):
```typescript
<title>My Blog</title>
```

Example 2 (typescript):
```typescript
<title>My Blog</title>
```

Example 3 (typescript):
```typescript
<title>Results page {pageNumber}</title> // 🔴 Problem: This is not a single string
```

Example 4 (typescript):
```typescript
<title>{`Results page ${pageNumber}`}</title>
```

---

## <option>

**URL:** https://react.dev/reference/react-dom/components/option

**Contents:**
- <option>
- Reference
  - <option>
    - Props
    - Caveats
- Usage
  - Displaying a select box with options

The built-in browser <option> component lets you render an option inside a <select> box.

The built-in browser <option> component lets you render an option inside a <select> box.

See more examples below.

<option> supports all common element props.

Additionally, <option> supports these props:

Render a <select> with a list of <option> components inside to display a select box. Give each <option> a value representing the data to be submitted with the form.

Read more about displaying a <select> with a list of <option> components.

**Examples:**

Example 1 (jsx):
```jsx
<select>  <option value="someOption">Some option</option>  <option value="otherOption">Other option</option></select>
```

Example 2 (jsx):
```jsx
<select>  <option value="someOption">Some option</option>  <option value="otherOption">Other option</option></select>
```

---

## React DOM Components

**URL:** https://react.dev/reference/react-dom/components

**Contents:**
- React DOM Components
- Common components
- Form components
- Resource and Metadata Components
- All HTML components
  - Note
  - Custom HTML elements
    - Setting values on custom elements
    - Listening for events on custom elements
  - Note

React supports all of the browser built-in HTML and SVG components.

All of the built-in browser components support some props and events.

This includes React-specific props like ref and dangerouslySetInnerHTML.

These built-in browser components accept user input:

They are special in React because passing the value prop to them makes them controlled.

These built-in browser components let you load external resources or annotate the document with metadata:

They are special in React because React can render them into the document head, suspend while resources are loading, and enact other behaviors that are described on the reference page for each specific component.

React supports all built-in browser HTML components. This includes:

Similar to the DOM standard, React uses a camelCase convention for prop names. For example, you’ll write tabIndex instead of tabindex. You can convert existing HTML to JSX with an online converter.

If you render a tag with a dash, like <my-element>, React will assume you want to render a custom HTML element.

If you render a built-in browser HTML element with an is attribute, it will also be treated as a custom element.

Custom elements have two methods of passing data into them:

By default, React will pass values bound in JSX as attributes:

Non-string JavaScript values passed to custom elements will be serialized by default:

React will, however, recognize an custom element’s property as one that it may pass arbitrary values to if the property name shows up on the class during construction:

A common pattern when using custom elements is that they may dispatch CustomEvents rather than accept a function to call when an event occur. You can listen for these events using an on prefix when binding to the event via JSX.

Events are case-sensitive and support dashes (-). Preserve the casing of the event and include all dashes when listening for custom element’s events:

React supports all built-in browser SVG components. This includes:

Similar to the DOM standard, React uses a camelCase convention for prop names. For example, you’ll write tabIndex instead of tabindex. You can convert existing SVG to JSX with an online converter.

Namespaced attributes also have to be written without the colon:

**Examples:**

Example 1 (unknown):
```unknown
<my-element value="Hello, world!"></my-element>
```

Example 2 (typescript):
```typescript
// Will be passed as `"1,2,3"` as the output of `[1,2,3].toString()`<my-element value={[1,2,3]}></my-element>
```

Example 3 (javascript):
```javascript
// Listens for `say-hi` events<my-element onsay-hi={console.log}></my-element>// Listens for `sayHi` events<my-element onsayHi={console.log}></my-element>
```

---

## Components and Hooks must be pure

**URL:** https://react.dev/reference/rules/components-and-hooks-must-be-pure

**Contents:**
- Components and Hooks must be pure
  - Note
  - Why does purity matter?
    - How does React run your code?
      - Deep Dive
    - How to tell if code runs in render
- Components and Hooks must be idempotent
- Side effects must run outside of render
  - Note
  - When is it okay to have mutation?

Pure functions only perform a calculation and nothing more. It makes your code easier to understand, debug, and allows React to automatically optimize your components and Hooks correctly.

This reference page covers advanced topics and requires familiarity with the concepts covered in the Keeping Components Pure page.

One of the key concepts that makes React, React is purity. A pure component or hook is one that is:

When render is kept pure, React can understand how to prioritize which updates are most important for the user to see first. This is made possible because of render purity: since components don’t have side effects in render, React can pause rendering components that aren’t as important to update, and only come back to them later when it’s needed.

Concretely, this means that rendering logic can be run multiple times in a way that allows React to give your user a pleasant user experience. However, if your component has an untracked side effect – like modifying the value of a global variable during render – when React runs your rendering code again, your side effects will be triggered in a way that won’t match what you want. This often leads to unexpected bugs that can degrade how your users experience your app. You can see an example of this in the Keeping Components Pure page.

React is declarative: you tell React what to render, and React will figure out how best to display it to your user. To do this, React has a few phases where it runs your code. You don’t need to know about all of these phases to use React well. But at a high level, you should know about what code runs in render, and what runs outside of it.

Rendering refers to calculating what the next version of your UI should look like. After rendering, Effects are flushed (meaning they are run until there are no more left) and may update the calculation if the Effects have impacts on layout. React takes this new calculation and compares it to the calculation used to create the previous version of your UI, then commits just the minimum changes needed to the DOM (what your user actually sees) to catch it up to the latest version.

One quick heuristic to tell if code runs during render is to examine where it is: if it’s written at the top level like in the example below, there’s a good chance it runs during render.

Event handlers and Effects don’t run in render:

Components must always return the same output with respect to their inputs – props, state, and context. This is known as idempotency. Idempotency is a term popularized in functional programming. It refers to the idea that you always get the same result every time you run that piece of code with the same inputs.

This means that all code that runs during render must also be idempotent in order for this rule to hold. For example, this line of code is not idempotent (and therefore, neither is the component):

new Date() is not idempotent as it always returns the current date and changes its result every time it’s called. When you render the above component, the time displayed on the screen will stay stuck on the time that the component was rendered. Similarly, functions like Math.random() also aren’t idempotent, because they return different results every time they’re called, even when the inputs are the same.

This doesn’t mean you shouldn’t use non-idempotent functions like new Date() at all – you should just avoid using them during render. In this case, we can synchronize the latest date to this component using an Effect:

By wrapping the non-idempotent new Date() call in an Effect, it moves that calculation outside of rendering.

If you don’t need to synchronize some external state with React, you can also consider using an event handler if it only needs to be updated in response to a user interaction.

Side effects should not run in render, as React can render components multiple times to create the best possible user experience.

Side effects are a broader term than Effects. Effects specifically refer to code that’s wrapped in useEffect, while a side effect is a general term for code that has any observable effect other than its primary result of returning a value to the caller.

Side effects are typically written inside of event handlers or Effects. But never during render.

While render must be kept pure, side effects are necessary at some point in order for your app to do anything interesting, like showing something on the screen! The key point of this rule is that side effects should not run in render, as React can render components multiple times. In most cases, you’ll use event handlers to handle side effects. Using an event handler explicitly tells React that this code doesn’t need to run during render, keeping render pure. If you’ve exhausted all options – and only as a last resort – you can also handle side effects using useEffect.

One common example of a side effect is mutation, which in JavaScript refers to changing the value of a non-primitive value. In general, while mutation is not idiomatic in React, local mutation is absolutely fine:

There is no need to contort your code to avoid local mutation. Array.map could also be used here for brevity, but there is nothing wrong with creating a local array and then pushing items into it during render.

Even though it looks like we are mutating items, the key point to note is that this code only does so locally – the mutation isn’t “remembered” when the component is rendered again. In other words, items only stays around as long as the component does. Because items is always recreated every time <FriendList /> is rendered, the component will always return the same result.

On the other hand, if items was created outside of the component, it holds on to its previous values and remembers changes:

When <FriendList /> runs again, we will continue appending friends to items every time that component is run, leading to multiple duplicated results. This version of <FriendList /> has observable side effects during render and breaks the rule.

Lazy initialization is also fine despite not being fully “pure”:

Side effects that are directly visible to the user are not allowed in the render logic of React components. In other words, merely calling a component function shouldn’t by itself produce a change on the screen.

One way to achieve the desired result of updating document.title outside of render is to synchronize the component with document.

As long as calling a component multiple times is safe and doesn’t affect the rendering of other components, React doesn’t care if it’s 100% pure in the strict functional programming sense of the word. It is more important that components must be idempotent.

A component’s props and state are immutable snapshots. Never mutate them directly. Instead, pass new props down, and use the setter function from useState.

You can think of the props and state values as snapshots that are updated after rendering. For this reason, you don’t modify the props or state variables directly: instead you pass new props, or use the setter function provided to you to tell React that state needs to update the next time the component is rendered.

Props are immutable because if you mutate them, the application will produce inconsistent output, which can be hard to debug as it may or may not work depending on the circumstances.

useState returns the state variable and a setter to update that state.

Rather than updating the state variable in-place, we need to update it using the setter function that is returned by useState. Changing values on the state variable doesn’t cause the component to update, leaving your users with an outdated UI. Using the setter function informs React that the state has changed, and that we need to queue a re-render to update the UI.

Once values are passed to a hook, you should not modify them. Like props in JSX, values become immutable when passed to a hook.

One important principle in React is local reasoning: the ability to understand what a component or hook does by looking at its code in isolation. Hooks should be treated like “black boxes” when they are called. For example, a custom hook might have used its arguments as dependencies to memoize values inside it:

If you were to mutate the Hook’s arguments, the custom hook’s memoization will become incorrect, so it’s important to avoid doing that.

Similarly, it’s important to not modify the return values of Hooks, as they may have been memoized.

Don’t mutate values after they’ve been used in JSX. Move the mutation to before the JSX is created.

When you use JSX in an expression, React may eagerly evaluate the JSX before the component finishes rendering. This means that mutating values after they’ve been passed to JSX can lead to outdated UIs, as React won’t know to update the component’s output.

**Examples:**

Example 1 (javascript):
```javascript
function Dropdown() {  const selectedItems = new Set(); // created during render  // ...}
```

Example 2 (javascript):
```javascript
function Dropdown() {  const selectedItems = new Set();  const onSelect = (item) => {    // this code is in an event handler, so it's only run when the user triggers this    selectedItems.add(item);  }}
```

Example 3 (javascript):
```javascript
function Dropdown() {  const selectedItems = new Set();  useEffect(() => {    // this code is inside of an Effect, so it only runs after rendering    logForAnalytics(selectedItems);  }, [selectedItems]);}
```

Example 4 (javascript):
```javascript
function Clock() {  const time = new Date(); // 🔴 Bad: always returns a different result!  return <span>{time.toLocaleString()}</span>}
```

---

## <link>

**URL:** https://react.dev/reference/react-dom/components/link

**Contents:**
- <link>
- Reference
  - <link>
    - Props
    - Special rendering behavior
    - Special behavior for stylesheets
- Usage
  - Linking to related resources
  - Linking to a stylesheet
  - Note

The built-in browser <link> component lets you use external resources such as stylesheets or annotate the document with link metadata.

To link to external resources such as stylesheets, fonts, and icons, or to annotate the document with link metadata, render the built-in browser <link> component. You can render <link> from any component and React will in most cases place the corresponding DOM element in the document head.

See more examples below.

<link> supports all common element props.

These props apply when rel="stylesheet":

These props apply when rel="stylesheet" but disable React’s special treatment of stylesheets:

These props apply when rel="preload" or rel="modulepreload":

These props apply when rel="icon" or rel="apple-touch-icon":

These props apply in all cases:

Props that are not recommended for use with React:

React will always place the DOM element corresponding to the <link> component within the document’s <head>, regardless of where in the React tree it is rendered. The <head> is the only valid place for <link> to exist within the DOM, yet it’s convenient and keeps things composable if a component representing a specific page can render <link> components itself.

There are a few exceptions to this:

In addition, if the <link> is to a stylesheet (namely, it has rel="stylesheet" in its props), React treats it specially in the following ways:

There are two exception to this special behavior:

This special treatment comes with two caveats:

You can annotate the document with links to related resources such as an icon, canonical URL, or pingback. React will place this metadata within the document <head> regardless of where in the React tree it is rendered.

If a component depends on a certain stylesheet in order to be displayed correctly, you can render a link to that stylesheet within the component. Your component will suspend while the stylesheet is loading. You must supply the precedence prop, which tells React where to place this stylesheet relative to others — stylesheets with higher precedence can override those with lower precedence.

When you want to use a stylesheet, it can be beneficial to call the preinit function. Calling this function may allow the browser to start fetching the stylesheet earlier than if you just render a <link> component, for example by sending an HTTP Early Hints response.

Stylesheets can conflict with each other, and when they do, the browser goes with the one that comes later in the document. React lets you control the order of stylesheets with the precedence prop. In this example, three components render stylesheets, and the ones with the same precedence are grouped together in the <head>.

Note the precedence values themselves are arbitrary and their naming is up to you. React will infer that precedence values it discovers first are “lower” and precedence values it discovers later are “higher”.

If you render the same stylesheet from multiple components, React will place only a single <link> in the document head.

You can use the <link> component with the itemProp prop to annotate specific items within the document with links to related resources. In this case, React will not place these annotations within the document <head> but will place them like any other React component.

**Examples:**

Example 1 (jsx):
```jsx
<link rel="icon" href="favicon.ico" />
```

Example 2 (jsx):
```jsx
<link rel="icon" href="favicon.ico" />
```

Example 3 (jsx):
```jsx
<section itemScope>  <h3>Annotating specific items</h3>  <link itemProp="author" href="http://example.com/" />  <p>...</p></section>
```

---

## lazy

**URL:** https://react.dev/reference/react/lazy

**Contents:**
- lazy
- Reference
  - lazy(load)
    - Parameters
    - Returns
  - load function
    - Parameters
    - Returns
- Usage
  - Lazy-loading components with Suspense

lazy lets you defer loading component’s code until it is rendered for the first time.

Call lazy outside your components to declare a lazy-loaded React component:

See more examples below.

lazy returns a React component you can render in your tree. While the code for the lazy component is still loading, attempting to render it will suspend. Use <Suspense> to display a loading indicator while it’s loading.

load receives no parameters.

You need to return a Promise or some other thenable (a Promise-like object with a then method). It needs to eventually resolve to an object whose .default property is a valid React component type, such as a function, memo, or a forwardRef component.

Usually, you import components with the static import declaration:

To defer loading this component’s code until it’s rendered for the first time, replace this import with:

This code relies on dynamic import(), which might require support from your bundler or framework. Using this pattern requires that the lazy component you’re importing was exported as the default export.

Now that your component’s code loads on demand, you also need to specify what should be displayed while it is loading. You can do this by wrapping the lazy component or any of its parents into a <Suspense> boundary:

In this example, the code for MarkdownPreview won’t be loaded until you attempt to render it. If MarkdownPreview hasn’t loaded yet, Loading will be shown in its place. Try ticking the checkbox:

This demo loads with an artificial delay. The next time you untick and tick the checkbox, Preview will be cached, so there will be no loading state. To see the loading state again, click “Reset” on the sandbox.

Learn more about managing loading states with Suspense.

Do not declare lazy components inside other components:

Instead, always declare them at the top level of your module:

**Examples:**

Example 1 (javascript):
```javascript
const SomeComponent = lazy(load)
```

Example 2 (javascript):
```javascript
import { lazy } from 'react';const MarkdownPreview = lazy(() => import('./MarkdownPreview.js'));
```

Example 3 (sql):
```sql
import MarkdownPreview from './MarkdownPreview.js';
```

Example 4 (javascript):
```javascript
import { lazy } from 'react';const MarkdownPreview = lazy(() => import('./MarkdownPreview.js'));
```

---

## static-components

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/static-components

**Contents:**
- static-components
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - I need to render different components conditionally
  - Note

Validates that components are static, not recreated every render. Components that are recreated dynamically can reset state and trigger excessive re-rendering.

Components defined inside other components are recreated on every render. React sees each as a brand new component type, unmounting the old one and mounting the new one, destroying all state and DOM nodes in the process.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You might define components inside to access local state:

Pass data as props instead:

If you find yourself wanting to define components inside other components to access local variables, that’s a sign you should be passing props instead. This makes components more reusable and testable.

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Component defined inside componentfunction Parent() {  const ChildComponent = () => { // New component every render!    const [count, setCount] = useState(0);    return <button onClick={() => setCount(count + 1)}>{count}</button>;  };  return <ChildComponent />; // State resets every render}// ❌ Dynamic component creationfunction Parent({type}) {  const Component = type === 'button'    ? () => <button>Click</button>    : () => <div>Text</div>;  return <Component />;}
```

Example 2 (jsx):
```jsx
// ✅ Components at module levelconst ButtonComponent = () => <button>Click</button>;const TextComponent = () => <div>Text</div>;function Parent({type}) {  const Component = type === 'button'    ? ButtonComponent  // Reference existing component    : TextComponent;  return <Component />;}
```

Example 3 (jsx):
```jsx
// ❌ Wrong: Inner component to access parent statefunction Parent() {  const [theme, setTheme] = useState('light');  function ThemedButton() { // Recreated every render!    return (      <button className={theme}>        Click me      </button>    );  }  return <ThemedButton />;}
```

Example 4 (jsx):
```jsx
// ✅ Better: Pass props to static componentfunction ThemedButton({theme}) {  return (    <button className={theme}>      Click me    </button>  );}function Parent() {  const [theme, setTheme] = useState('light');  return <ThemedButton theme={theme} />;}
```

---

## component-hook-factories

**URL:** https://react.dev/reference/eslint-plugin-react-hooks/lints/component-hook-factories

**Contents:**
- component-hook-factories
- Rule Details
  - Invalid
  - Valid
- Troubleshooting
  - I need dynamic component behavior

Validates against higher order functions defining nested components or hooks. Components and hooks should be defined at the module level.

Defining components or hooks inside other functions creates new instances on every call. React treats each as a completely different component, destroying and recreating the entire component tree, losing all state, and causing performance problems.

Examples of incorrect code for this rule:

Examples of correct code for this rule:

You might think you need a factory to create customized components:

Pass JSX as children instead:

**Examples:**

Example 1 (jsx):
```jsx
// ❌ Factory function creating componentsfunction createComponent(defaultValue) {  return function Component() {    // ...  };}// ❌ Component defined inside componentfunction Parent() {  function Child() {    // ...  }  return <Child />;}// ❌ Hook factory functionfunction createCustomHook(endpoint) {  return function useData() {    // ...  };}
```

Example 2 (julia):
```julia
// ✅ Component defined at module levelfunction Component({ defaultValue }) {  // ...}// ✅ Custom hook at module levelfunction useData(endpoint) {  // ...}
```

Example 3 (javascript):
```javascript
// ❌ Wrong: Factory patternfunction makeButton(color) {  return function Button({children}) {    return (      <button style={{backgroundColor: color}}>        {children}      </button>    );  };}const RedButton = makeButton('red');const BlueButton = makeButton('blue');
```

Example 4 (jsx):
```jsx
// ✅ Better: Pass JSX as childrenfunction Button({color, children}) {  return (    <button style={{backgroundColor: color}}>      {children}    </button>  );}function App() {  return (    <>      <Button color="red">Red</Button>      <Button color="blue">Blue</Button>    </>  );}
```

---

## <progress>

**URL:** https://react.dev/reference/react-dom/components/progress

**Contents:**
- <progress>
- Reference
  - <progress>
    - Props
- Usage
  - Controlling a progress indicator

The built-in browser <progress> component lets you render a progress indicator.

To display a progress indicator, render the built-in browser <progress> component.

See more examples below.

<progress> supports all common element props.

Additionally, <progress> supports these props:

To display a progress indicator, render a <progress> component. You can pass a number value between 0 and the max value you specify. If you don’t pass a max value, it will assumed to be 1 by default.

If the operation is not ongoing, pass value={null} to put the progress indicator into an indeterminate state.

**Examples:**

Example 1 (jsx):
```jsx
<progress value={0.5} />
```

Example 2 (jsx):
```jsx
<progress value={0.5} />
```

---

## <Profiler>

**URL:** https://react.dev/reference/react/Profiler

**Contents:**
- <Profiler>
- Reference
  - <Profiler>
    - Props
    - Caveats
  - onRender callback
    - Parameters
- Usage
  - Measuring rendering performance programmatically
  - Pitfall

<Profiler> lets you measure rendering performance of a React tree programmatically.

Wrap a component tree in a <Profiler> to measure its rendering performance.

React will call your onRender callback with information about what was rendered.

Wrap the <Profiler> component around a React tree to measure its rendering performance.

It requires two props: an id (string) and an onRender callback (function) which React calls any time a component within the tree “commits” an update.

Profiling adds some additional overhead, so it is disabled in the production build by default. To opt into production profiling, you need to enable a special production build with profiling enabled.

<Profiler> lets you gather measurements programmatically. If you’re looking for an interactive profiler, try the Profiler tab in React Developer Tools. It exposes similar functionality as a browser extension.

Components wrapped in <Profiler> will also be marked in the Component tracks of React Performance tracks even in profiling builds. In development builds, all components are marked in the Components track regardless of whether they’re wrapped in <Profiler>.

You can use multiple <Profiler> components to measure different parts of your application:

You can also nest <Profiler> components:

Although <Profiler> is a lightweight component, it should be used only when necessary. Each use adds some CPU and memory overhead to an application.

**Examples:**

Example 1 (jsx):
```jsx
<Profiler id="App" onRender={onRender}>  <App /></Profiler>
```

Example 2 (jsx):
```jsx
<Profiler id="App" onRender={onRender}>  <App /></Profiler>
```

Example 3 (javascript):
```javascript
function onRender(id, phase, actualDuration, baseDuration, startTime, commitTime) {  // Aggregate or log render timings...}
```

Example 4 (jsx):
```jsx
<App>  <Profiler id="Sidebar" onRender={onRender}>    <Sidebar />  </Profiler>  <PageContent /></App>
```

---
