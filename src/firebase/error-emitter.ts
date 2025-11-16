
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

// This is a type-safe event emitter
interface TypedEventEmitter {
  on(event: 'permission-error', listener: (error: FirestorePermissionError) => void): this;
  off(event: 'permission-error', listener: (error: FirestorePermissionError) => void): this;
  emit(event: 'permission-error', error: FirestorePermissionError): boolean;
}

class TypedEventEmitter extends EventEmitter {}

// We export a single instance of the emitter for the whole application
export const errorEmitter = new TypedEventEmitter();
