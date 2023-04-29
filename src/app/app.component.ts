import {Component, computed, inject, signal, Signal} from '@angular/core';
import {
  configureStore,
  getFeatureState, ImmutableStateExtension,
  ReduxDevtoolsExtension,
  UndoExtension,
} from '@mini-rx/signal-store';
import { action, on, reducer } from 'ts-action';
import { CounterFeatureStore } from './counter-feature-store';
import {AppState} from "mini-rx-store/lib/models";
import {count} from "rxjs";

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

export type Selector<T, V> = (state: Signal<T>) => Signal<V>;

export function createSelector(...args: any[]): Selector<any, any> {
  const selectors = args.slice(0, args.length - 1);
  const projector = args[args.length - 1];

  return (state) => {
    const selectorSignals: Signal<any>[] = selectors.map((fn) => fn(state));
    return computed(() => {
      const selectorSignalResults: any[] = selectorSignals.map(aSignal => aSignal());
      return projector(...selectorSignalResults)
    })
  };
}

// const getCounterState = (appState: Signal<AppState>) => computed(() => appState()['count']);
const getCounterState = createSelector((state: AppState) => state, (state: AppState) => state['count']);
// const getDoubleCount = (appState: Signal<AppState>) => {
//   const signal = getCounterState(appState);
//   return computed(() => signal() * 2);
// }
const getDoubleCount = createSelector(getCounterState, (count: number) => {
  console.log('recalc!', count);
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

    <h3>My state</h3>
    <p>Counter from Signal: {{ myState().count }}</p>
    <p>Counter from Selector: {{ myStateCount() }}</p>
    <p>Counter Double from Selector: {{ myStateDoubleCount() }}</p>
    <button (click)="incMyState()">Inc</button>

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
  count = store.selectFromSignal(getCounterState);
  doubleCount = store.selectFromSignal(getDoubleCount);

  // My State
  protected readonly myState = signal({count: 42});
  myStateCount = getCounterState(this.myState);
  myStateDoubleCount = getDoubleCount(this.myState);

  incMyState() {
    this.myState.update(v => ({...v, count: v.count + 1}))
  }

  inc() {
    store.dispatch(increment());
  }

  dec() {
    store.dispatch(decrement());
  }
}
