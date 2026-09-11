# 7. Vue reactivity and lifecycle compared with React

## First: "hook" versus "composable"

React uses the term **Hook** for functions such as `useState` and `useEffect`.
Vue uses several related terms:

- **Reactivity API:** `ref`, `reactive`, `computed`, `watch`, `readonly`, and
  `shallowRef`.
- **Lifecycle hook:** `onMounted`, `onBeforeUnmount`, and similar functions.
- **Composable:** a reusable function that combines reactive state, computed
  values, watchers, lifecycle hooks, and other composables. By convention its
  name starts with `use`, such as Drive Hub's `useAuth()`.
- **Compiler macro:** `defineProps`, `defineEmits`, `defineModel`, and Nuxt's
  `definePageMeta`. These look like function calls but the compiler processes
  them; they are not ordinary runtime hooks.

A React custom Hook and a Vue composable solve a similar organizational
problem, but their runtime rules differ. React Hooks rely on stable call order
and must follow the Rules of Hooks. Vue reactivity uses refs/proxies rather than
an ordered Hook state list. Vue lifecycle APIs still need to be registered
synchronously while a component setup context is active.

Nuxt auto-imports Vue APIs and files from `app/composables/`, which is why this
project can call `ref()` or `useAuth()` without import statements. React code
normally imports each Hook explicitly.

## Quick mapping

| Vue API used here | Closest React equivalent | How exact is it? |
| --- | --- | --- |
| `ref(value)` for UI state | `useState(value)` | Same purpose, different mutation/render model. |
| `ref(null)` bound to a DOM element | `useRef(null)` | Close mapping for element references. |
| `reactive(object)` | `useState(object)` or `useReducer` | No exact equivalent; React updates should be immutable. |
| `computed(getter)` | Derived value, optionally `useMemo` | Similar caching role, but Vue tracks dependencies automatically. |
| writable `computed({ get, set })` | Derived value plus setter callback | No single React Hook equivalent. |
| `watch(source, callback)` | `useEffect(callback, dependencies)` | Similar side-effect purpose; timing and dependency tracking differ. |
| `shallowRef(value)` | `useState(value)` with replacement by reference | Close for render state; `useRef` only if rendering should not react. |
| `readonly(ref)` | Encapsulated state/getter, TypeScript `Readonly` | No exact runtime equivalent. |
| `toValue(valueOrGetter)` | Call getter or use value manually | No standard React equivalent. |
| `onMounted(callback)` | `useEffect(callback, [])` | Close; development/Strict Mode behavior differs. |
| `onBeforeUnmount(callback)` | Cleanup returned by `useEffect` | Close; exact timing is not identical. |
| Vue `useId()` | React `useId()` | Very close and intentionally SSR-stable. |

## `ref()`: reactive component state

Drive Hub uses `ref` extensively:

```ts
const formError = ref('')
const isSubmitting = ref(false)
const sortBy = ref<'recommended' | 'rating' | 'price'>('recommended')
```

`ref(initialValue)` returns an object whose reactive value is stored in
`.value`:

```ts
isSubmitting.value = true
formError.value = 'Unable to save'
```

Vue tracks reads and writes. A component that used the ref during rendering is
updated when `.value` changes. Vue templates automatically unwrap refs:

```vue
<button :disabled="isSubmitting">
  {{ isSubmitting ? 'Saving…' : 'Save' }}
</button>
```

### Closest React equivalent: `useState`

```tsx
const [formError, setFormError] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)

setIsSubmitting(true)
setFormError('Unable to save')
```

The major difference is how a component observes state:

```text
Vue ref
  mutate ref.value
  -> dependency tracker knows which reactive consumers used it
  -> affected rendering/effects update

React useState
  call setter
  -> schedule component render
  -> component function executes again and reads a state snapshot
```

### The naming trap: Vue `ref` is usually not React `useRef`

React `useRef().current` does **not** trigger a render when changed. Vue
`ref().value` normally does. Therefore:

```text
Vue ref('visible UI state')     -> React useState
Vue ref<HTMLElement | null>()  -> React useRef, when bound to an element
```

Drive Hub demonstrates both uses. In
[`app/components/admin/AdminModal.vue`](../../app/components/admin/AdminModal.vue):

```ts
const dialog = ref<HTMLDialogElement>()
```

and:

```vue
<dialog ref="dialog">
```

Here Vue places the mounted DOM node into `dialog.value`. The React equivalent
is close:

```tsx
const dialogRef = useRef<HTMLDialogElement>(null)

return <dialog ref={dialogRef}>...</dialog>
```

In newer Vue code, `useTemplateRef()` can make the DOM-reference intent more
explicit, but Drive Hub currently uses the traditional matching variable name.

## `reactive()`: a deeply reactive object

Forms use `reactive` when several fields belong together:

```ts
const credentials = reactive({
  email: '',
  password: ''
})

credentials.email = 'person@example.com'
```

`reactive` returns a Proxy. Property mutation is tracked, including nested
objects unless a shallow API is used.

### Closest React alternatives

For a small form:

```tsx
const [credentials, setCredentials] = useState({
  email: '',
  password: ''
})

setCredentials(current => ({
  ...current,
  email: 'person@example.com'
}))
```

For a complex state machine:

```tsx
const [state, dispatch] = useReducer(reducer, initialState)
```

The crucial difference is mutation style:

```ts
// Vue reactive Proxy: supported and tracked
credentials.email = nextEmail
```

```tsx
// React state: replace with a new object
setCredentials(current => ({ ...current, email: nextEmail }))
```

Directly mutating a React state object and passing the same reference can fail
to schedule the expected render. Libraries such as Immer can provide a
mutation-like syntax, but that is library behavior, not core React state.

### `ref(object)` versus `reactive(object)`

Both can represent an object in Vue:

```ts
const a = ref({ name: '' })
a.value.name = 'Ana'

const b = reactive({ name: '' })
b.name = 'Ana'
```

Use `ref` when replacing the whole value is useful, when the value may be
primitive/null, or for a consistent `.value` container. Use `reactive` when a
stable object with property-oriented mutation is convenient. Drive Hub uses
`reactive` for form records and `ref` for primitives, nullable editor state,
collections returned by async data, and DOM nodes.

## `computed()`: derived reactive state

Drive Hub derives a filtered school list:

```ts
const schools = computed(() => {
  const items = (drivingSchools.value ?? []).map(toSchoolDirectoryItem)

  if (sortBy.value === 'rating') {
    return items.sort((a, b) => b.rating - a.rating)
  }

  return items
})
```

Vue automatically tracks every reactive value read while the getter runs.
`schools.value` is cached until one of those dependencies changes.

### Closest React equivalent: derived value or `useMemo`

Often React needs no Hook at all:

```tsx
const schools = drivingSchools.map(toSchoolDirectoryItem)
```

The component function reruns, so the value is derived again. When calculation
or reference stability justifies memoization:

```tsx
const schools = useMemo(() => {
  const items = (drivingSchools ?? []).map(toSchoolDirectoryItem)
  if (sortBy === 'rating') return items.sort((a, b) => b.rating - a.rating)
  return items
}, [drivingSchools, sortBy])
```

Differences:

| Vue `computed` | React `useMemo` |
| --- | --- |
| Automatically tracks refs read by the getter. | Requires an explicit dependency list. |
| Returns a reactive ref read through `.value` in script. | Returns the calculated value directly. |
| Lazy and cached as part of Vue reactivity semantics. | Performance optimization; React may discard cached values. |
| Common semantic API for derived reactive state. | Should not be required for correctness. |

Both getters/calculations must be pure. Do not perform requests, mutate other
state, or navigate inside them.

### Writable computed values

Drive Hub uses writable computed values to adapt query state or model shapes:

```ts
const selection = computed({
  get: () => source.value,
  set: value => {
    source.value = normalize(value)
  }
})
```

React has no single equivalent. Express it as a value and callback:

```tsx
const selection = source
const setSelection = (value: string) => {
  setSource(normalize(value))
}
```

This is the same controlled-component shape React normally passes as
`value={selection}` and `onChange={setSelection}`.

## `watch()`: react to a value changing

In [`app/components/SearchPanel.vue`](../../app/components/SearchPanel.vue),
local form state follows route-driven props:

```ts
watch(
  () => props.data.defaultLocation,
  value => {
    location.value = value
  }
)
```

`watch` separates:

- A reactive source: ref, computed ref, getter, reactive object, or array of
  sources.
- A callback that runs when the source changes.

It can receive new and old values and supports options such as `immediate`,
`deep`, `once`, and flush timing.

### Closest React equivalent: `useEffect`

```tsx
useEffect(() => {
  setLocation(data.defaultLocation)
}, [data.defaultLocation])
```

But this is not exact:

| Vue `watch` | React `useEffect` |
| --- | --- |
| Watches explicit Vue reactive sources. | Reruns based on an explicit dependency array. |
| Does not run initially unless `immediate: true`. | Runs after initial committed render and later dependency changes. |
| Can directly provide `newValue` and `oldValue`. | Previous value needs a ref or closure strategy. |
| Supports Vue scheduler flush options. | Effect timing follows React's commit/effect lifecycle. |
| Cleanup is registered with `onCleanup`/return depending on watcher API. | Effect returns a cleanup function. |

### Watch only for side effects or synchronization

If a value can be calculated, use `computed`, not `watch` plus another ref:

```ts
// Prefer
const fullName = computed(() => `${first.value} ${last.value}`)
```

This matches React's advice to derive values during rendering instead of using
an Effect to keep redundant state synchronized.

Appropriate watch effects in Drive Hub include:

- Reset a category when the selected school changes.
- Close an admin editor when the route changes.
- Synchronize a deliberately local form field with a changed prop.

## `shallowRef()`: track replacement, not nested mutation

Drive Hub uses:

```ts
const mutationError = shallowRef<unknown>(null)
```

Changing `mutationError.value` is reactive. If the value is an object, Vue does
not deeply convert its nested properties into reactive proxies. This is useful
for opaque external values such as error objects or large structures that are
replaced wholesale.

### Closest React equivalent

React state already relies primarily on replacement/reference equality:

```tsx
const [mutationError, setMutationError] = useState<unknown>(null)
```

Use React `useRef` only if changing the value should **not** update the UI.
Vue's `shallowRef` still triggers its consumers when `.value` is replaced.

## `readonly()`: expose state without exposing mutation

Custom composables return:

```ts
return {
  mutationStatus: readonly(mutationStatus),
  mutationError: readonly(mutationError)
}
```

The composable retains write access, while consumers receive a read-only
reactive view. This preserves an ownership boundary: callers use `login()` or
`logout()` rather than manually claiming a mutation succeeded.

### React equivalent

React custom Hooks usually achieve this by returning the value but not its
setter:

```tsx
function useAuth() {
  const [mutationStatus, setMutationStatus] = useState('idle')

  return {
    mutationStatus,
    login
    // setMutationStatus is intentionally private
  }
}
```

TypeScript `Readonly<T>` can help at compile time, but it does not create Vue's
read-only runtime Proxy. Encapsulation through the Hook's returned API is the
closest normal React design.

## `toValue()`: accept a value, ref, or getter

The custom composables accept `MaybeRefOrGetter<T>` and normalize it:

```ts
const location = toValue(options.location)
```

`toValue` returns:

- The inner value when given a ref.
- The result when given a getter function.
- The value itself otherwise.

This lets a composable remain reactive when a caller passes a computed ref or
getter.

React has no standard equivalent because React values are snapshots supplied
on each render and Hooks use dependency arrays. A normal React custom Hook
accepts the current value:

```tsx
function useDrivingSchools(location?: string, category?: string) {
  // location/category are current-render values
}
```

If a React utility explicitly accepts `T | (() => T)`, it can normalize with:

```ts
const resolved = typeof input === 'function' ? input() : input
```

but that does not create Vue-style dependency tracking.

## `onMounted()`: browser DOM is ready

[`app/composables/useScrollReveal.ts`](../../app/composables/useScrollReveal.ts)
uses `onMounted` before accessing browser APIs:

```ts
onMounted(() => {
  observer = new IntersectionObserver(...)
  readinessFrame = window.requestAnimationFrame(...)
})
```

`onMounted` runs after Vue mounts the component's DOM in the browser. It does
not run during SSR. This makes it the correct boundary for `window`,
`IntersectionObserver`, and DOM elements.

### Closest React equivalent

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(...)
  // setup
}, [])
```

Both are client-side effect boundaries. React Strict Mode may intentionally run
an extra development-only setup/cleanup cycle to expose unsafe effects, so
React effects must be idempotent. Vue's standard `onMounted` behavior is not the
same Strict Mode mechanism.

If an effect must run before the browser paints a visual adjustment, React's
`useLayoutEffect` may be closer, but it requires SSR care and should not replace
ordinary `useEffect` without a real layout need.

## `onBeforeUnmount()`: clean up owned resources

The scroll-reveal composable cleans up both browser resources:

```ts
onBeforeUnmount(() => {
  observer?.disconnect()
  window.cancelAnimationFrame(readinessFrame)
})
```

React normally co-locates this cleanup with setup:

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(...)
  const frame = requestAnimationFrame(...)

  return () => {
    observer.disconnect()
    cancelAnimationFrame(frame)
  }
}, [])
```

The general ownership rule is the same: the component/composable that opens a
subscription, observer, timer, or event listener should close it.

## `useId()`: stable accessibility identifiers

Drive Hub's modal uses:

```ts
const titleId = useId()
```

```vue
<dialog :aria-labelledby="titleId">
  <h2 :id="titleId">{{ title }}</h2>
</dialog>
```

React has an API with the same name and purpose:

```tsx
const titleId = useId()

return (
  <dialog aria-labelledby={titleId}>
    <h2 id={titleId}>{title}</h2>
  </dialog>
)
```

This is the closest exact mapping in the project. Both generate identifiers
that remain consistent across server rendering and hydration. Neither should
be used as a database ID or list key.

## Component compiler macros used throughout the project

These APIs are not Hooks or composables, but a React developer encounters them
at the top of nearly every Drive Hub component.

### `defineProps()`: declare component inputs

```ts
const props = defineProps<{
  title: string
  busy?: boolean
}>()
```

The Vue compiler creates the component's prop contract and supplies a reactive
`props` object. In a React function component, props are the function argument:

```tsx
type Props = {
  title: string
  busy?: boolean
}

function Modal(props: Props) {
  return <h2>{props.title}</h2>
}
```

Do not destructure Vue props casually if code relies on older/non-reactive
destructuring behavior or passes them to helpers; keeping `props.field` or using
Vue's supported reactive destructuring/to-ref patterns makes the dependency
clear. React props are immutable snapshots for each render.

### `withDefaults()`: defaults for type-only props

```ts
const props = withDefaults(defineProps<{
  threshold?: number
}>(), {
  threshold: 0.18
})
```

The React equivalent is ordinary parameter destructuring/defaulting:

```tsx
function Reveal({ threshold = 0.18 }: Props) {
  // ...
}
```

For arrays or objects in Vue defaults, use a factory when required so component
instances do not unintentionally share a mutable object.

### `defineEmits()`: declare events sent to a parent

```ts
const emit = defineEmits<{
  close: []
  save: [form: AdminFormState]
}>()

emit('save', form)
```

React normally represents child-to-parent events as callback props:

```tsx
type Props = {
  onClose: () => void
  onSave: (form: AdminFormState) => void
}

function Editor({ onClose, onSave }: Props) {
  onSave(form)
}
```

Vue event names are listened to with `@save="handler"`; React callback props
are invoked as normal functions. Neither is a global event bus.

### `defineModel()`: declare a two-way component binding

Drive Hub's admin form sections use:

```ts
const form = defineModel<AdminUserFormValue>({ required: true })
```

The parent binds it with:

```vue
<AdminUserForm v-model="form.value" />
```

Conceptually, `defineModel` declares a prop plus its corresponding update event.
React normally makes that contract explicit as a controlled component:

```tsx
type Props = {
  value: AdminUserFormValue
  onChange: (value: AdminUserFormValue) => void
}

function AdminUserForm({ value, onChange }: Props) {
  return (
    <input
      value={value.name}
      onChange={event => onChange({
        ...value,
        name: event.target.value
      })}
    />
  )
}
```

```text
Vue v-model / defineModel -> modelValue prop + update:modelValue event
React controlled input   -> value prop + onChange callback
```

The React form is not less capable; Vue provides standardized syntax that
removes the repeated prop/event wiring.

### `<script setup>` versus a React function component body

Top-level code in `<script setup>` is component setup code. It runs per
component instance and exposes its bindings to the template. That makes it
conceptually similar to the body of a React function component, but Vue does
not rerun the entire setup function for each reactive update. Vue creates the
instance once and reruns targeted reactive effects/computed getters. React
reruns the component function to obtain the next JSX tree.

## Where these APIs execute

| API | During SSR | During hydration/setup | After hydration |
| --- | ---: | ---: | ---: |
| `ref`, `reactive` | Create initial reactive state | Recreate/restore client state | Continue reacting |
| `computed` | Can calculate render output | Calculates expected client output | Recalculates when dependencies change |
| `watch` | Can be registered; execution depends on options/changes | Registered in client setup | Runs when watched sources change |
| `onMounted` | No | Runs after browser mount | Once per mount |
| `onBeforeUnmount` | No | Registered | Runs before browser component unmount |
| `useId` | Generates SSR-consistent ID | Reproduces matching ID | Stays stable for instance |

Setup code itself can run on both server and browser even when the lifecycle
callback registered inside it is browser-only.

## Common React-to-Vue mistakes

### Reaching for `watch` wherever React used `useEffect`

React effects often compensate for React's render/snapshot model. Vue may need
only a `computed` value or a direct event handler. Use `watch` when synchronizing
with something outside the derived render calculation.

### Using React-style immutable ceremony everywhere

Vue refs and reactive Proxies support direct tracked mutation. Replacing values
is still useful, but spreading an entire form object for every keystroke is not
required.

### Treating Vue `ref` as non-rendering storage

Changing a Vue ref is reactive. Use a plain local variable for internal mutable
state that need not update rendering, as `useScrollReveal` does for its
`IntersectionObserver` instance.

### Forgetting `.value` in script

Templates unwrap refs; TypeScript/JavaScript code normally does not:

```ts
isSubmitting.value = true
```

### Copying React Hook call-order rules literally

Vue does not store ref state by the ordinal position of calls, but lifecycle and
context-dependent composables still belong in synchronous setup. Do not create
composable instances inside arbitrary click handlers; define them during setup
and call the returned action functions later.

## Official references

- [Vue reactivity fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue computed properties](https://vuejs.org/guide/essentials/computed.html)
- [Vue watchers](https://vuejs.org/guide/essentials/watchers.html)
- [Vue lifecycle hooks](https://vuejs.org/guide/essentials/lifecycle.html)
- [Vue template refs](https://vuejs.org/guide/essentials/template-refs.html)
- [React `useState`](https://react.dev/reference/react/useState)
- [React `useEffect`](https://react.dev/reference/react/useEffect)
- [React `useMemo`](https://react.dev/reference/react/useMemo)
- [React `useRef`](https://react.dev/reference/react/useRef)
