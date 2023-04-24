import {computed, Signal} from "@angular/core";
import {AppState} from "./models";

export function getFeatureState<T>(state: Signal<AppState>, featureKey: keyof AppState): Signal<T> {
  return computed(() => {
    return state()[featureKey];
  })
}
