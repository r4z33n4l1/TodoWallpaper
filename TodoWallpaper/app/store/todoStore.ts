import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearTodos: () => void;
}

const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [],
      addTodo: (text: string) => {
        console.log('Store - Adding todo:', text);
        const newTodo = {
          id: Date.now().toString(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          console.log('Store - Current state:', state.todos);
          console.log('Store - New todo:', newTodo);
          return {
            todos: [...state.todos, newTodo],
          };
        });
        console.log('Store - Updated todos:', get().todos);
      },
      toggleTodo: (id: string) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),
      deleteTodo: (id: string) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      clearTodos: () => set({ todos: [] }),
    }),
    {
      name: 'todo-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Store - Rehydrated state:', state?.todos);
      },
    }
  )
);

export default useTodoStore; 