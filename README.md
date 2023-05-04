# MiniRx Signal Store (Playground)

This is the playground for the Angular Signals version of [MiniRx Store](https://github.com/spierala/mini-rx-store).

An official RFC in the [MiniRx repo](https://github.com/spierala/mini-rx-store) will follow soon.

This playground is used to form the initial ideas for the RFC.

### MiniRx in short
MiniRx is a highly flexible **state management** solution and scales with your needs:

* Manage **global state** at large scale with the **Store (Redux) API**
* Manage **global state** with a minimum of boilerplate using **Feature Stores**
* Manage **local component state** with **Component Stores**

MiniRx always tries to find the sweet spot between powerful, simple and lightweight.

### MiniRx Signal Store

#### Goal
Take the great concept of MiniRx Store and create a state management library which embraces Angular Signals.

#### Dedicated library
MiniRx Signal Store will probably be a dedicated library for Angular...
It has a lot in common with the original MiniRx library, but the differences are big enough to justify a dedicated library.

The focus on Signals allows (again) to create one of the most lightweight state management libraries for Angular.

Proposed package name: @mini-rx/signal-store

#### The main differences of the Signal Store are: 
- no lazy state initialisation (Signals encourage to have a meaningful initial state)
- state is only available as Signal
  - via the `select` method
  - via the `state` property
  - "memoized selectors" (`createSelector`) use Angular `computed` internally
  - maybe later a `selectObservable` method could be added for selecting state as Observable
- all internal usages of RxJS BehaviorSubject have been refactored to Angular Signal
- RxJS effects APIs use `rxEffect` naming to prevent confusion with Angular Signal `effect` API
- `update` instead of `setState` (inspired by the Angular Signals API)
  - consider alternatives to `update`? updateState? to be very explicit? 

### Based on Angular Signals
Signals are the new reactive primitive of Angular.

MiniRx Signal Store uses Signals internally, and the state of the Store is exposed as Signal.

Signals in Angular have some advantages, compared to RxJS:
- write subscription free code, even without using the async pipe
- easier to learn (no pipe, no operators, Signals are always synchronous)
- easier to compose derived state from other Signals with `computed` instead of RxJS `combineLatest`
- potentially more performant Change Detection in the future

### Driven by RxJS
MiniRx Signal Store is driven by [RxJS](https://rxjs.dev/), which is great for handling async tasks like API calls (e.g. in the MiniRx effects API).

The Usage of RxJS in the Signal Store is limited:
- The actions stream of the Redux Store is a RxJS Subject
- The effects APIs of the Signal Store use the existing action stream or an own Subject (ComponentStore)
- Only the absolute necessary operators are used (as MiniRx Store did already)

### MiniRx Signal Store is still MiniRx
MiniRx Signal Store is based on a straight copy of MiniRx Store and has mostly all the features of the original MiniRx (see the Docs to get an impression: https://mini-rx.io/).

Probably, Signal Store and MiniRx Store will depend on a shared library which will provide common code. All libraries will reside in the same Nx [mono-repo](https://github.com/spierala/mini-rx-store).

The original MiniRx Store will still be maintained and stays a perfect state management library if you want to go all-in with RxJS (...and it is framework agnostic!). 

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

You should see something like this in the browser:

![mini-rx-signal-store](https://user-images.githubusercontent.com/1272446/234119525-0d6b5265-4f18-46e2-86a0-92b0e815de90.gif)

### MiniRx Demo with Signal Store

Or run the MiniRx Demo with the MiniRx Signals Store.

Run `ng serve signal-store-demo`

You should see this:

<img width="1152" alt="image" src="https://user-images.githubusercontent.com/1272446/236310499-405be096-b687-4ca3-999d-79e0a53f79d6.png">

## Example

The example code is taken from the app.component.ts and app.module.ts in this repo.

You will see:
 - Basic usage of the Redux API
 - Basic usage of a Feature Store
 - Usage of extensions: UndoExtension, Redux DevTools Extension, Immutable Extension


App component:
```ts
import {Component, inject} from '@angular/core';
import {createFeatureStateSelector, createSelector, Store,} from '@mini-rx/signal-store';
import {action, on, reducer} from 'ts-action';
import {CounterFeatureStore} from './counter-feature-store';

// Actions
const increment = action('increment');
const decrement = action('decrement');

// Reducer
// The reducer is registered in the App Module
export const counterReducer = reducer(
  1,
  on(increment, (state) => state + 1),
  on(decrement, (state) => state - 1)
);

// Memoized selectors
const getCounterState = createFeatureStateSelector<number>('count');
const getDoubleCount = createSelector(getCounterState, (count) => {
  return count * 2
})

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
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  // Feature Store
  counterFs = inject(CounterFeatureStore);

  // Store (Redux)
  count = this.store.select(getCounterState);
  doubleCount = this.store.select(getDoubleCount);

  constructor(private store: Store) {}

  inc() {
    this.store.dispatch(increment());
  }

  dec() {
    this.store.dispatch(decrement());
  }
}
```

App module:
```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import {AppComponent, counterReducer} from './app.component';
import {ImmutableStateExtension, ReduxDevtoolsExtension, StoreModule, UndoExtension} from "@mini-rx/signal-store";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    StoreModule.forRoot({
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
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
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

  // Update state with `update`
  inc() {
    this.lastAction = this.update(state => ({ count: state.count + 1 }));
  }

  dec() {
    this.lastAction = this.update(state => ({ count: state.count - 1 }));
  }

  undoLast() {
    if (this.lastAction) {
      // Undo an action
      this.undo(this.lastAction)
    }
  }

  mutate() {
    // Try a mutation, but this will throw an error with the Immutable Extension
    this.state().count = 123;
  }
}
```
