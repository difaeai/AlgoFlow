
'use client';
import { useState, useEffect } from 'react';
import { onSnapshot, doc, DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T>(path: string, id?: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !id) {
      setLoading(false);
      setData(null);
      return;
    }

    const docRef = doc(firestore, path, id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      async (error) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path, id]);

  return { data, loading };
}
