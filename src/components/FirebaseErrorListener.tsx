
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This component is designed to only be used in a development environment.
// It will not be rendered in production.
export default function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  useEffect(() => {
    if (error) {
      // Throwing the error will cause Next.js to show its development error overlay
      throw error;
    }
  }, [error]);

  return null;
}
