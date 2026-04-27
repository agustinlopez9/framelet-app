import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
};

type ToastQueueAction =
  | { type: 'ADD'; toast: ToasterToast }
  | { type: 'UPDATE'; toast: Partial<ToasterToast> & { id: string } }
  | { type: 'DISMISS'; id?: string }
  | { type: 'REMOVE'; id?: string };

interface State {
  toasts: ToasterToast[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const removeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
function queueRemove(id: string) {
  if (removeTimeouts.has(id)) return;
  const t = setTimeout(() => {
    removeTimeouts.delete(id);
    dispatch({ type: 'REMOVE', id });
  }, TOAST_REMOVE_DELAY);
  removeTimeouts.set(id, t);
}

function reducer(state: State, action: ToastQueueAction): State {
  switch (action.type) {
    case 'ADD':
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'UPDATE':
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    case 'DISMISS': {
      const { id } = action;
      if (id) queueRemove(id);
      else state.toasts.forEach((t) => queueRemove(t.id));
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id || id === undefined ? { ...t, open: false } : t,
        ),
      };
    }
    case 'REMOVE':
      return {
        ...state,
        toasts: action.id ? state.toasts.filter((t) => t.id !== action.id) : [],
      };
  }
}

function dispatch(action: ToastQueueAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

type ToastInput = Omit<ToasterToast, 'id'>;

export function toast(props: ToastInput) {
  const id = genId();
  const update = (next: Partial<ToasterToast>) => dispatch({ type: 'UPDATE', toast: { ...next, id } });
  const dismiss = () => dispatch({ type: 'DISMISS', id });
  dispatch({
    type: 'ADD',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });
  return { id, update, dismiss };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return {
    ...state,
    toast,
    dismiss: (id?: string) => dispatch({ type: 'DISMISS', id }),
  };
}
