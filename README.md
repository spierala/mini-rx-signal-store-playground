# MiniRx Signal Store

This is the playground for the Angular Signals version of [MiniRx Store](https://github.com/spierala/mini-rx-store).

### MiniRx in short
MiniRx is a highly flexible **state management** solution and scales with your needs:

* Manage **global state** at large scale with the **Store (Redux) API**
* Manage **global state** with a minimum of boilerplate using **Feature Stores**
* Manage **local component state** with **Component Stores**

### MiniRx Signal Store

MiniRx Signal Store will be a dedicated library for Angular.
It has a lot in common with the original MiniRx library, but the differences are big enough to justify a dedicated library. 

The main differences of the Signal Store are: 
- no lazy state initialisation (Signals encourage to have a meaningful initial state)
- no `select` method / no selectors (with Signals you can "select" state with `computed`)
- state is only available as Signal (internal usages of BehaviorSubject have been removed completely)

### Angular Signals
State is stored and exposed as **Angular Signal**, the new reactive primitive of Angular.

Signals have some advantages in Angular, compared to RxJS:
- write subscription free code, even without using the async pipe
- easier to learn (no pipe, no operators, Signals are always synchronous)
- easier to compose derived state from other Signals with `computed` instead of RxJS `combineLatest`
- potentially more performant Change Detection in the future

### Driven by RxJS
MiniRx is driven by [RxJS](https://rxjs.dev/), which is great for handling async tasks like API calls. 

### MiniRx Signal Store is still MiniRx
MiniRx Signal Store will be a fork of MiniRx Store and has mostly all the features of the original MiniRx (see the Docs to get an impression: https://mini-rx.io/).

Most likely Signal Store and MiniRx Store will depend on a shared library which will provide common code.

MiniRx Store will still be maintained and stays a perfect state management library if you want to go all-in with RxJS. 

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

You should see something like this in the browser:

![mini-rx-signal-store](https://user-images.githubusercontent.com/1272446/234119525-0d6b5265-4f18-46e2-86a0-92b0e815de90.gif)

## Example

The example code is taken from the app.component.ts in this repo.

You will see:
 - Basic usage of the Redux API
 - Basic usage of a Feature Store
 - Usage of extensions: UndoExtension, Redux DevTools Extension, Immutable Extension

```ts
import { Component, computed } from '@angular/core';
import {
  configureStore,
  getFeatureState, ImmutableStateExtension,
  ReduxDevtoolsExtension,
  UndoExtension,
} from '@mini-rx/signal-store';
import { action, on, reducer } from 'ts-action';
import { CounterFeatureStore } from './counter-feature-store';

// Actions
const increment = action('increment');
const decrement = action('decrement');

// Reducer
const counterReducer = reducer(
  1,
  on(increment, (state) => state + 1),
  on(decrement, (state) => state - 1)
);

// Store (Redux) Setup
const store = configureStore({
  reducers: {
    count: counterReducer,
  },
  extensions: [
    new ReduxDevtoolsExtension({
      name: 'Signal Store',
    }),
    new UndoExtension(),
    new ImmutableStateExtension()
  ],
});

@Component({
  selector: 'app-root',
  template: `
    <h3>Store (Redux)</h3>
    <p>Counter: {{ count() }}</p>
    <p>Counter Double: {{ doubleCount() }}</p>
    <button (click)="dec()">Dec</button>
    <button (click)="inc()">Inc</button>

    <h3>Feature Store</h3>
    <p>CounterFs: {{ counterFs.count() }}</p>
    <p>CounterFs Double: {{ counterFs.doubleCount() }}</p>
    <button (click)="counterFs.dec()">Dec</button>
    <button (click)="counterFs.inc()">Inc</button>
    <button (click)="counterFs.undoLast()">Undo Last Action</button>
    <button (click)="counterFs.mutate()">Mutate</button>
  `,
})
export class AppComponent {
  count = getFeatureState<number>(store.state, 'count');
  doubleCount = computed(() => {
    return this.count() * 2;
  });

  inc() {
    store.dispatch(increment());
  }

  dec() {
    store.dispatch(decrement());
  }

  // Feature Store
  counterFs = new CounterFeatureStore();
}
```

### Feature Store

Feature Store offers a simplified API to update and read state. It uses Redux under the hood.

```ts
import {Action, FeatureStore} from '@mini-rx/signal-store';
import {computed, Injectable} from "@angular/core";

// State interface
interface CounterState {
  count: number;
}

// Initial state
const counterInitialState: CounterState = {
  count: 11
};

// Extend FeatureStore and pass the State interface
@Injectable({providedIn: 'root'})
export class CounterFeatureStore extends FeatureStore<CounterState> {
  // State
  count = computed(() => this.state().count);
  doubleCount = computed(() => this.count() * 2);

  lastAction: Action | undefined

  constructor() {
    // Call super with the feature key and the initial state
    super('countFs', counterInitialState);
  }

  // Update state with `setState`
  inc() {
    this.lastAction = this.update(state => ({ count: state.count + 1 }));
  }

  dec() {
    this.lastAction = this.update(state => ({ count: state.count - 1 }));
  }

  undoLast() {
    if (this.lastAction) {
      this.undo(this.lastAction)
    }
  }

  mutate() {
    // Mutating state should throw an error! 
    this.state().count = 123;
  }
}
```
