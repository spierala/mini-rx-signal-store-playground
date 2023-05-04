import {Injectable, Signal} from '@angular/core';
import { Todo } from '../../todos-shared/models/todo';
import { TodoFilter } from '../../todos-shared/models/todo-filter';
import { pipe } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import {
    Action,
    createFeatureStateSelector,
    createSelector,
    FeatureStore,
    tapResponse,
} from '@mini-rx/signal-store';
import { TodosApiService } from '../../todos-shared/services/todos-api.service';

// STATE INTERFACE
interface TodosState {
    todos: Todo[];
    filter: TodoFilter;
    selectedTodo: Todo | undefined;
}

// INITIAL STATE
const initialState: TodosState = {
    todos: [],
    selectedTodo: undefined,
    filter: {
        search: '',
        category: {
            isBusiness: false,
            isPrivate: false,
        },
    },
};

// MEMOIZED SELECTORS
const getTodosFeatureSelector = createFeatureStateSelector<TodosState>();
const getTodos = createSelector(getTodosFeatureSelector, (state) => state.todos);
const getSelectedTodo = createSelector(getTodosFeatureSelector, (state) => state.selectedTodo);
const getFilter = createSelector(getTodosFeatureSelector, (state) => state.filter);
const getTodosFiltered = createSelector(getTodos, getFilter, (todos, filter) => {
    return todos.filter((item) => {
        return (
            item.title.toUpperCase().indexOf(filter.search.toUpperCase()) > -1 &&
            (filter.category.isBusiness ? item.isBusiness : true) &&
            (filter.category.isPrivate ? item.isPrivate : true)
        );
    });
});
const getTodosDone = createSelector(getTodosFiltered, (todos) =>
    todos.filter((todo) => todo.isDone)
);
const getTodosNotDone = createSelector(getTodosFiltered, (todos) =>
    todos.filter((todo) => !todo.isDone)
);

@Injectable({
    providedIn: 'root',
})
export class TodosStore extends FeatureStore<TodosState> {
    // STATE OBSERVABLES
    todosDone: Signal<Todo[]> = this.select(getTodosDone);
    todosNotDone: Signal<Todo[]> = this.select(getTodosNotDone);
    filter: Signal<TodoFilter> = this.select(getFilter);
    selectedTodo: Signal<Todo | undefined> = this.select(getSelectedTodo);

    constructor(private apiService: TodosApiService) {
        super('todos', initialState);

        this.load();
    }

    // UPDATE STATE
    selectTodo(todo: Todo) {
        this.update({ selectedTodo: todo }, 'selectTodo');
    }

    initNewTodo() {
        const newTodo = new Todo();
        newTodo.tempId = uuid();
        this.update({ selectedTodo: newTodo }, 'initNewTodo');
    }

    clearSelectedTodo() {
        this.update(
            {
                selectedTodo: undefined,
            },
            'clearSelectedTodo'
        );
    }

    updateFilter(filter: TodoFilter) {
        this.update(
            (state) => ({
                filter: {
                    ...state.filter,
                    ...filter,
                },
            }),
            'updateFilter'
        );
    }

    // API CALLS...
    // Effect using the RxJS standalone pipe
    load = this.rxEffect<void>(
        pipe(
            mergeMap(() =>
                this.apiService.getTodos().pipe(
                    tapResponse(
                        (todos) => this.update({ todos }, 'loadSuccess'),
                        (err) => {
                            console.error(err);
                        }
                    )
                )
            )
        )
    );

    // Effect + optimistic update / undo
    // We can skip the standalone pipe when using just one RxJS operator
    create = this.rxEffect<Todo>(
        mergeMap((todo) => {
            const optimisticUpdate: Action = this.update((state) => {
                // Create a new Todo object to prevent the Immutable Extension from making the current form model immutable
                // This is only a concern if the create call fails (A successful create call would return a new Todo object)
                const newTodo: Todo = { ...todo };
                return {
                    todos: [...state.todos, newTodo],
                };
            }, 'createOptimistic');

            return this.apiService.createTodo(todo).pipe(
                tapResponse(
                    (createdTodo) => {
                        this.update(
                            (state) => ({
                                todos: state.todos.map((item) =>
                                    item.tempId === todo.tempId ? createdTodo : item
                                ),
                                selectedTodo: createdTodo,
                            }),
                            'createSuccess'
                        );
                    },
                    (err) => {
                        console.error(err);
                        this.undo(optimisticUpdate);
                    }
                )
            );
        })
    );

    // Classic subscribe + optimistic update / undo
    updateTodo(todo: Todo) {
        const optimisticUpdate: Action = this.update(
            (state) => ({
                todos: updateTodoInList(state.todos, todo),
            }),
            'updateOptimistic'
        );

        this.apiService.updateTodo(todo).subscribe({
            next: (updatedTodo) => {
                this.update(
                    (state) => ({
                        todos: updateTodoInList(state.todos, updatedTodo),
                    }),
                    'updateSuccess'
                );
            },
            error: (err) => {
                console.error(err);
                this.undo(optimisticUpdate);
            },
        });
    }

    // Classic subscribe + optimistic update / undo
    delete(todo: Todo) {
        const optimisticUpdate: Action = this.update(
            (state) => ({
                selectedTodo: undefined,
                todos: state.todos.filter((item) => item.id !== todo.id),
            }),
            'deleteOptimistic'
        );

        this.apiService.deleteTodo(todo).subscribe({
            error: (err) => {
                console.error(err);
                this.undo(optimisticUpdate);
            },
        });
    }
}

function updateTodoInList(todos: Todo[], updatedTodo: Todo): Todo[] {
    return todos.map((item) =>
        item.id === updatedTodo.id
            ? {
                  ...item,
                  ...updatedTodo,
              }
            : item
    );
}
