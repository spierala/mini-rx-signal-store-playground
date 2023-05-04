import {Component, computed, inject, Signal} from '@angular/core';
import {createFeatureStateSelector, createSelector, Store,} from '@mini-rx/signal-store';
import {action, on, reducer} from 'ts-action';
import {CounterFeatureStore} from './counter-feature-store';

// Actions
const increment = action('increment');
const decrement = action('decrement');

// Reducer
export const counterReducer = reducer(
  1,
  on(increment, (state) => state + 1),
  on(decrement, (state) => state - 1)
);

// Store (Redux) Setup
const getCounterState = createFeatureStateSelector<number>('count');
const getDoubleCount = createSelector(getCounterState, (count) => {
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

  constructor(private store: Store) {

  }

  inc() {
    this.store.dispatch(increment());
  }

  dec() {
    this.store.dispatch(decrement());
  }
}
