// Augment React types to allow children on RefAttributes/forwardRef results where sources omit explicit props
import 'react';

declare module 'react' {
  interface RefAttributes<T> {
    children?: any;
  }
  interface PropsWithChildren<P> {
    children?: any;
  }
}
