import {Action, FeatureStore} from '@mini-rx/signal-store';
import {computed, Injectable, signal} from "@angular/core";
import {pipe} from "rxjs";
import {tap} from "rxjs/operators";

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

  updateTrigger = signal<Partial<CounterState>>({count: 1000});

  lastAction: Action | undefined;

  loadEfc = this.rxEffect<number>(pipe(
    tap(v => console.log('load', v))
  ))

  constructor() {
    // Call super with the feature key and the initial state
    super('countFs', counterInitialState);

    // Try rxEffect with a Signal
    this.loadEfc(this.count);

    setInterval(() => {
      this.updateTrigger.update(v => ({count: (v.count ?? 0) + 1}))
    }, 1000);

    // Try update with Signal
    this.update(this.updateTrigger, 'update trigger')
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
