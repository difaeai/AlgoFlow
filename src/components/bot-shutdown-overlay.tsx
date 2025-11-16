'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PowerOff } from 'lucide-react';

export function BotShutdownOverlay({
  isShuttingDown,
}: {
  isShuttingDown: boolean;
}) {
  const [show, setShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (isShuttingDown) {
      setShow(true);
      setIsFadingOut(false);
    } else {
      if (show) {
        setIsFadingOut(true);
        setTimeout(() => {
          setShow(false);
        }, 500); // Match fade-out duration
      }
    }
  }, [isShuttingDown, show]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-500',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="relative flex flex-col items-center justify-center text-center">
        <div className="relative z-10 p-8">
          <div className="mb-8">
            <PowerOff className="h-24 w-24 text-destructive mx-auto animate-pulse" />
          </div>
          <h1 className="font-headline text-5xl font-bold text-destructive">
            MAGNUS Deactivated
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            You have turned off the Magnus bot.
          </p>
        </div>
      </div>
    </div>
  );
}
