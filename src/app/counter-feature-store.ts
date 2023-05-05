import {Action, FeatureStore} from '@mini-rx/signal-store';
import {computed, Injectable} from "@angular/core";

// State interface
interface CounterState {
  count: number;
}

// Initial state
const counterInitialState: CounterState = {
  count: 1
};

// Extend FeatureStore and pass the State interface
@Injectable({providedIn: 'root'})
export class CounterFeatureStore extends FeatureStore<CounterState> {
  // State
  count = computed(() => this.state().count);
  doubleCount = computed(() => this.count() * 2);

  lastAction: Action | undefined;

  constructor() {
    // Call super with the feature key and the initial state
    super('countFs', counterInitialState);
  }

  // Update state with `update`
  inc() {
    this.lastAction = this.update(state => ({ count: state.count + 1 }), 'inc');
  }

  dec() {
    this.lastAction = this.update(state => ({ count: state.count - 1 }), 'dec');
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
