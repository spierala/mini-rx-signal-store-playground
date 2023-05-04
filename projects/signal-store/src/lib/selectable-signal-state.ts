import {computed, Signal} from '@angular/core';

export class SelectableSignalState<StateType extends object> {
  constructor(private _state: Signal<StateType>) {}

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
