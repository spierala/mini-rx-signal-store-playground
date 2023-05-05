Angular 16 has been released with support for Signals: https://blog.angular.io/angular-v16-is-here-4d7a28ec680d

In this RFC, we want to present some ideas around Signal-based state management with MiniRx.

If you are new to MiniRx, feel free to take a look at the docs: https://mini-rx.io/

#### MiniRx in short
MiniRx is a highly flexible **state management** solution and scales with your needs:

* Manage **global state** at large scale with the **Store (Redux) API**
* Manage **global state** with a minimum of boilerplate using **Feature Stores**
* Manage **local component state** with **Component Stores**

#### Playground
There is a playground repo which helped to form the ideas for MiniRx Signal Store: https://github.com/spierala/mini-rx-signal-store-playground

The playground contains a prototype of the Signal Store library and the MiniRx Demo app using the new Signal Store.

## MiniRx Signal Store

### Goals

- Take the great concept of MiniRx Store and create a state management library which embraces Angular Signals
- Use Signals for (synchronous) state
- Use RxJS only where it is really useful (for asynchronous tasks)
- It should be easy to refactor from the original MiniRx Store to the Signal Store and vice versa

### Key principles

- Simple, but powerful
- Flexible and highly integrated
- Focused and small API surface 
- Lightweight and tree-shakable
- Strongly typed
- Object-oriented style by default
- Opinionated

### Package name suggestion

- `@mini-rx/signal-store`

### Why Signals?
Signals in Angular have some advantages, compared to RxJS:
- Write subscription free code, even without using the `async` pipe
- Easier to learn (no pipe, no operators, Signals are always synchronous)
- Easier to compose derived state from other Signals with `computed` instead of RxJS `combineLatest`
- Potentially more performant Change Detection in the future

### Why a dedicated Signal Store library?
The original MiniRx Store has an [Angular Integration](https://mini-rx.io/docs/angular) already...: `mini-rx-store-ng`.
It is a thin wrapper around the framework-agnostic MiniRx Store providing `StoreModule`, injectable `Store`, `Actions` and more.

So why not extend the existing Angular integration?
- MiniRx wants to be lightweight. Supporting RxJS and Signals would increase the bundle size
- MiniRx aims to have a small and focused API surface. Having Signal APIs next to the RxJS APIs would create a bigger API surface
- Existing MiniRx APIs like `effect` would be confusing together with Angular `effect` APIs for Signals

### Main differences of the Signal Store

In general, the Signal Store will have a very similar API as the original MiniRx Store.

Let's have a look at the main differences:

- No lazy state initialisation (Signals encourage to have a meaningful initial state)
- State is **only** available as Signal
  - The `select` method returns a Signal
  - The `state` property returns a Signal
  - Memoized selectors (`createSelector`) use Angular `computed` internally
- Effect APIs use `rxEffect` naming to prevent confusion with Angular Signal `effect` API
- `update` instead of `setState` (inspired by the Angular Signals API)
  - consider alternatives to `update`, which is a very generic name and could be conflicting with other class methods
  - E.g. `updateState` would be very specific. It would be also more clear that `updateState` is a little bit different from Signal `update`.
- Framework-agnostic APIs like `configureStore` will be removed
- RxJS usage: The Signal Store uses RxJS only where it makes sense:
  - The action stream of the Redux Store is a RxJS Subject
  - The Effect APIs of the Signal Store use the existing action stream or an own Subject (ComponentStore)
  - Only the absolute necessary operators are used internally (as MiniRx Store did already)
  - RxJS BehaviorSubject has been refactored to Signal internally

#### Standalone APIs

The Signal Store should also come with modern Angular standalone APIs.

### The future of the original MiniRx Store

The original MiniRx Store will still be maintained and stays a perfect state management library if you want to go all-in with RxJS (...and it is framework agnostic!).

The goal of MiniRx is to provide very similar features for both the Signal Store and the MiniRx Store.

Probably, Signal Store and MiniRx Store will depend on a shared library which will provide common code. 
All libraries will reside in the same Nx [mono-repo](https://github.com/spierala/mini-rx-store). E.g. the extensions, models and several util functions could be easily shared.

## Signal Store in Action

Let's have a look at some code examples from the [playground](https://github.com/spierala/mini-rx-signal-store-playground).

### Store (Redux)

#### Actions, reducer, memoized selectors

MiniRx recommends to use [ts-action](https://github.com/cartant/ts-action) for creating actions and reducers.

```ts
import {createFeatureStateSelector, createSelector} from '@mini-rx/signal-store';
import {action, on, reducer} from 'ts-action';

// Actions
export const increment = action('increment');
export const decrement = action('decrement');

// Reducer
// The reducer is registered in the App Module
export const counterReducer = reducer(
  1,
  on(increment, (state) => state + 1),
  on(decrement, (state) => state - 1)
);

// Memoized selectors
export const getCounterState = createFeatureStateSelector<number>('count');
export const getDoubleCount = createSelector(getCounterState, (count) => {
  return count * 2
})
```
#### Memoized selectors

Memoized selectors in the Signal Store use Angular `computed` internally. 
The memoization is based purely on Signals!

This has some advantages: 
- The Signal Store can become more lightweight (no own memoization code is needed)
- You can easily create your derived Signal state without using the Signals API (your code is more framework-agnostic!)

`createSelector` returns a function which takes a Signal and returns a Signal.

See the `createSelector` implementation here: https://github.com/spierala/mini-rx-signal-store-playground/blob/main/projects/signal-store/src/lib/signal-selector.ts#L107-L120

#### Register the Store

```ts
import {AppComponent} from './app.component';
import {counterReducer} from './counter-state';
import {ImmutableStateExtension, ReduxDevtoolsExtension, StoreModule, UndoExtension} from "@mini-rx/signal-store";

@NgModule({
  imports: [
    // Setup the Store
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
  ]
})
export class AppModule { }
```

Yes, we need standalone APIs! Now! :)

#### Use the Store in the component

```ts
@Component({
  selector: 'app-root',
  template: `
    <h3>Store (Redux)</h3>
    <p>Counter: {{ count() }}</p>
    <p>Counter Double: {{ doubleCount() }}</p>

    <button (click)="dec()">Dec</button>
    <button (click)="inc()">Inc</button>
  `,
})
export class AppComponent {
  // Store (Redux)
  private store = inject(Store);
  count = this.store.select(getCounterState);
  doubleCount = this.store.select(getDoubleCount);

  inc() {
    this.store.dispatch(increment());
  }

  dec() {
    this.store.dispatch(decrement());
  }
}
```
The Store can be injected in any component, service or directive.

#### Select state

We can select state with the `select` method. 

The `select` method accepts different types of selector functions:
- Classic state selector functions: a function which takes a state object and returns a piece of state
- Signal selector functions: a function which takes a Signal (with some state) and returns a Signal (with a piece of state)
  - `createSelector` returns a "Signal selector function"

The Store also exposes a `state` property which holds the state as Signal.
This allows to create your own computed Signals if you want. 

### Create and register effects

The effects API is pretty much unchanged. Just `createEffect` has been renamed to `createRxEffect`.

```ts
// ...
import {
  Actions,
  createRxEffect,
  mapResponse,
} from '@mini-rx/signal-store';
import { ofType } from 'ts-action-operators';

@Injectable()
export class ProductsEffects {
    constructor(
        private productService: ProductsApiService,
        private actions$: Actions
    ) {
    }

    loadProducts$ = createRxEffect(
        this.actions$.pipe(
            ofType(load),
            mergeMap(() =>
                this.productService.getProducts().pipe(
                    mapResponse(
                        (products) => loadSuccess(products),
                        (error) => loadFail(error)
                    )
                )
            )
        )
    );
}  
```

#### Register via the Effects Module

Use effects to trigger side effects like API calls and handle race conditions with RxJS flattening operators (e.g. `switchMap`)

```ts
import { NgModule } from '@angular/core';
import { EffectsModule, StoreModule } from '@mini-rx/signal-store';
import { ProductsEffects } from './products.effects';
import { productsReducer } from './products.reducer';

@NgModule({
  declarations: [],
  imports: [
    EffectsModule.register([ProductsEffects]),
    StoreModule.forFeature('products', productsReducer),
  ],
})
export class ProductsStateModule {}
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
#### Update state
You can use `update` to update state.
The `update` method works pretty much as the original `setState` method ([docs](https://mini-rx.io/docs/update-feature-state)).
Additionally, the `update` method also accepts a Signal (or Observable) to update state whenever the Signal/Observable has a new value. 

#### Select state
Signal State is available via the `state` property. Like that, you can directly create your own computed Signals. 
Alternatively, you can also use the `select` method to select state with state selector functions: e.g. `count: Signal<number> = this.select(state => state.count)`

FYI You can also use memoized selectors in the Feature Store. See an example here: https://github.com/spierala/mini-rx-signal-store-playground/blob/main/projects/signal-store-demo/src/app/modules/todos/state/todos-store.service.ts#L56-L59

#### Use the Feature Store in the component

```ts
@Component({
  selector: 'app-root',
  template: `
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
  // Feature Store
  counterFs = inject(CounterFeatureStore);
}
```
#### Feature Store Effects

The `effect` method has been renamed to `rxEffect`.

`rxEffect` returns a function which accepts a Signal / Observable / Raw value to trigger side effects.

### Component Store

With Component Store you can manage local state which is independent of the global state object.

Component Store has the same API has Feature Store. So it will also have `update`, `select`, `rxEffect`, `state`.
