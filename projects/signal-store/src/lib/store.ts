import { AppState, StoreConfig } from './models';
import {
  addFeature,
  configureStore as _configureStore,
  dispatch,
  effect,
  selectableAppState,
} from './store-core';
import { Inject, Injectable } from '@angular/core';
import { STORE_CONFIG } from './ng-modules/store.module';

@Injectable()
export class Store {
  feature = addFeature;
  dispatch = dispatch;
  effect = effect;
  select = selectableAppState.select.bind(selectableAppState);

  constructor(@Inject(STORE_CONFIG) config: StoreConfig<AppState>) {
    _configureStore(config);
  }
}
