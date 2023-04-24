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
  styleUrls: ['./app.component.scss'],
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
