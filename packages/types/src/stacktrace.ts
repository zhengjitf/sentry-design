import { StackFrame } from './stackframe';

export interface Stacktrace {
  frames?: StackFrame[];
  frames_omitted?: [number, number];
}
