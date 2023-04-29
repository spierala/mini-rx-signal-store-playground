import { computed, Signal, signal } from '@angular/core';

export class SignalState<StateType extends object> {
  private _state = signal(this.initialState);

  constructor(private initialState: StateType) {}

  set(v: StateType) {
    console.log('set', v)
    this._state.set(v);
  }

  getValue(): StateType {
    return this._state()
  }

  select(): Signal<StateType>;
  select<R>(mapFn: (state: StateType) => R): Signal<R>;
  select(mapFn?: any): Signal<any> {
    return computed(() => {
      return mapFn ? mapFn(this._state()) : this._state();
    });
  }

  selectFromSignal<R>(mapFn: (stateSignal: Signal<StateType>) => Signal<R>): Signal<R> {
    return mapFn(this._state);
  }
}
