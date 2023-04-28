/*
 * Public API Surface of signal-store
 */

export {Store, configureStore} from './lib/store';
export {actions$} from './lib/store-core';
export {FeatureStore, createFeatureStore} from './lib/feature-store';
export {
  ComponentStore,
  createComponentStore,
  configureComponentStores,
} from './lib/component-store';
export
  *
 from './lib/selector';
export {
  Action,
  Reducer,
  Actions,
  ReducerDictionary,
  StoreConfig,
  FeatureConfig,
  ComponentStoreConfig,
  StoreExtension,
  ExtensionId,
} from './lib/models';
export {ofType, hasEffectMetaData} from './lib/utils';
export {
  ReduxDevtoolsExtension,
  ReduxDevtoolsOptions,
} from './lib/extensions/redux-devtools.extension';
export {LoggerExtension} from './lib/extensions/logger.extension';
export {ImmutableStateExtension} from './lib/extensions/immutable-state.extension';
export {UndoExtension} from './lib/extensions/undo.extension';
export {tapResponse} from './lib/tap-response';
export {mapResponse} from './lib/map-response';
export {createEffect} from './lib/create-effect';
export {undo} from './lib/actions';

export { StoreRootModule, StoreModule, StoreFeatureModule } from './lib/ng-modules/store.module';
export { EffectsModule } from './lib/ng-modules/effects.module';
export { ComponentStoreModule } from './lib/ng-modules/component-store.module';
