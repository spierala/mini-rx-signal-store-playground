import { Observable } from 'rxjs';
import {
  Action,
  Actions,
  AppState,
  EFFECT_METADATA_KEY,
  EffectConfig,
  ExtensionId,
  HasEffectMetadata,
  MetaReducer,
  Reducer,
  ReducerDictionary,
  StoreConfig,
  StoreExtension,
} from './models';
import {
  combineMetaReducers,
  hasEffectMetaData,
  miniRxError,
  sortExtensions,
} from './utils';
import { defaultEffectsErrorHandler } from './default-effects-error-handler';
import { combineReducers } from './combine-reducers';
import { createMiniRxAction, MiniRxActionType } from './actions';
import { ActionsOnQueue } from './actions-on-queue';
import {computed, Signal, signal, WritableSignal} from '@angular/core';
import {SignalState} from "./signal-state";

export let hasUndoExtension = false;
let isStoreInitialized = false;

// REDUCER STATE
const reducerState: WritableSignal<
  {
    featureReducers: ReducerDictionary<AppState>;
    metaReducers: MetaReducer<AppState>[];
  }> = signal({
  featureReducers: {},
  metaReducers: []
});

const reducer = computed(() => {
    const combinedMetaReducer: MetaReducer<AppState> = combineMetaReducers(reducerState().metaReducers);
    const combinedReducer: Reducer<AppState> = combineReducers(reducerState().featureReducers);
    return combinedMetaReducer(combinedReducer);
})

function hasFeatureReducers(): boolean {
    return !!Object.keys(reducerState().featureReducers).length;
}

function checkFeatureExists(featureKey: string) {
    if (reducerState().featureReducers.hasOwnProperty(featureKey)) {
        miniRxError(`Feature "${featureKey}" already exists.`);
    }
}

function addReducer(featureKey: string, reducer: Reducer<any>) {
    initStore();

    checkFeatureExists(featureKey);

    reducerState.update((state) => ({
        ...state,
        featureReducers: { ...state.featureReducers, [featureKey]: reducer },
    }));
}

function removeReducer(featureKey: string) {
    reducerState.update((state) => ({
        ...state,
        featureReducers: omit(state.featureReducers, featureKey) as ReducerDictionary<AppState>,
    }));
}

// exported for testing purposes
export function addMetaReducers(...reducers: MetaReducer<AppState>[]) {
    reducerState.update((state) => ({
        ...state,
        metaReducers: [...state.metaReducers, ...reducers],
    }));
}

// ACTIONS
const actionsOnQueue = new ActionsOnQueue();
export const actions$: Actions = actionsOnQueue.actions$;

// APP STATE
export const appState = new SignalState<AppState>({});

// Wire up the Redux Store: Init reducer state, subscribe to the actions and reducer Observable
// Called by `configureStore` and `addReducer`
function initStore() {
    if (isStoreInitialized) {
        return;
    }

    reducerState.set({
        featureReducers: {},
        metaReducers: [],
    });

    // Listen to the Actions stream and update state accordingly
    actionsOnQueue.actions$.subscribe((action) => {
        const newState: AppState = reducer()(
            appState.getValue(),
            action
        );
        appState.set(newState);
    });

    isStoreInitialized = true;
}

export function configureStore(config: StoreConfig<AppState> = {}) {
    initStore();

    if (hasFeatureReducers()) {
        miniRxError(
            '`configureStore` detected reducers. Did you instantiate FeatureStores before calling `configureStore`?'
        );
    }

    if (config.metaReducers?.length) {
        addMetaReducers(...config.metaReducers);
    }

    if (config.extensions?.length) {
        const sortedExtensions: StoreExtension[] = sortExtensions(config.extensions);
        sortedExtensions.forEach((extension) => addExtension(extension));
    }

    if (config.reducers) {
        Object.keys(config.reducers).forEach((featureKey) => {
            addReducer(featureKey, config.reducers![featureKey]); // config.reducers! (prevent TS2532: Object is possibly 'undefined')
        });
    }

    if (config.initialState) {
        appState.set(config.initialState);
    }

    dispatch(createMiniRxAction(MiniRxActionType.INIT));
}

export function addFeature<StateType>(
    featureKey: string,
    reducer: Reducer<StateType>,
    config: {
        metaReducers?: MetaReducer<StateType>[];
        initialState?: StateType;
    } = {}
): void {
    reducer = config.metaReducers?.length
        ? combineMetaReducers<StateType>(config.metaReducers)(reducer)
        : reducer;

    if (typeof config.initialState !== 'undefined') {
        reducer = createReducerWithInitialState(reducer, config.initialState);
    }

    addReducer(featureKey, reducer);
    dispatch(createMiniRxAction(MiniRxActionType.INIT, featureKey));
}

export function removeFeature(featureKey: string) {
    removeReducer(featureKey);
    dispatch(createMiniRxAction(MiniRxActionType.DESTROY, featureKey));
}

export function effect(effect$: Observable<any> & HasEffectMetadata): void;
export function effect(effect$: Observable<Action>): void;
export function effect(effect$: any): void {
    const effectWithErrorHandler$: Observable<Action> = defaultEffectsErrorHandler(effect$);
    effectWithErrorHandler$.subscribe((action) => {
        let shouldDispatch = true;
        if (hasEffectMetaData(effect$)) {
            const metaData: EffectConfig = effect$[EFFECT_METADATA_KEY];
            shouldDispatch = !!metaData.dispatch;
        }

        if (shouldDispatch) {
            dispatch(action);
        }
    });
}

// exported for testing purposes
export function addExtension(extension: StoreExtension) {
    const metaReducer: MetaReducer<any> | void = extension.init();

    if (metaReducer) {
        addMetaReducers(metaReducer);
    }

    if (extension.id === ExtensionId.UNDO) {
        hasUndoExtension = true;
    }
}

export function dispatch(action: Action) {
    actionsOnQueue.dispatch(action);
}

function createReducerWithInitialState<StateType>(
    reducer: Reducer<StateType>,
    initialState: StateType
): Reducer<StateType> {
    return (state: StateType = initialState, action: Action): StateType => {
        return reducer(state, action);
    };
}

function omit<T extends Record<string, any>>(object: T, keyToOmit: keyof T): Partial<T> {
    return Object.keys(object)
        .filter((key) => key !== keyToOmit)
        .reduce<Partial<T>>((prevValue, key: keyof T) => {
            prevValue[key] = object[key];
            return prevValue;
        }, {});
}
