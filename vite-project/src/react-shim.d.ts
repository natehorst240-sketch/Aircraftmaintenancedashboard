declare module 'react' {
  export function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void]
  export function StrictMode(props: { children?: unknown }): unknown
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: unknown): void
  }
}

declare module 'react/jsx-runtime' {
  export const Fragment: unique symbol
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
