
'use client';

import { useState, useEffect } from 'react';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { BarChart, CheckCircle } from 'lucide-react';

export function BotStartupOverlay({ isStarting }: { isStarting: boolean }) {
  const [countdown, setCountdown] = useState(15);
  const [show, setShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [phase, setPhase] = useState<'analyzing' | 'activating' | 'done'>('analyzing');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarting) {
      setShow(true);
      setIsFadingOut(false);
      setPhase('analyzing');
      setCountdown(15); // Start with analysis countdown

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (phase === 'analyzing') {
              // Move to done phase after analysis
              clearInterval(timer);
              setPhase('done');
              return 0;
            } else {
              clearInterval(timer);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);

    } else {
        if (show) {
            setIsFadingOut(true);
            setTimeout(() => {
                setShow(false);
            }, 500); 
        }
    }

    return () => clearInterval(timer);
  }, [isStarting, show]); // Removed phase from dependency array to prevent re-triggering

  if (!show) {
    return null;
  }

  const analysisBars = 15;
  const activeBars = analysisBars - countdown;

  return (
    <div
      className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-500",
          isFadingOut ? "opacity-0" : "opacity-100"
        )}
    >
      <div className="relative flex flex-col items-center justify-center text-center">
        <div className="absolute inset-0 animated-grid !bg-grid-slate-900/[0.08] dark:!bg-grid-slate-100/[0.05]">
          <div className="scanner-line" style={{animationDuration: '2s'}}></div>
        </div>
        
        <div className="relative z-10 p-8">
            <div className="mb-8">
                {phase === 'done' ? (
                     <CheckCircle className="h-24 w-24 text-green-500 mx-auto" />
                ) : (
                    <Logo className="h-24 w-24 text-primary mx-auto animate-pulse" />
                )}
            </div>
            
            {phase === 'analyzing' && (
                <>
                    <h1 className="font-headline text-5xl font-bold text-primary">
                       Analyzing Market Data...
                    </h1>
                    <p className="mt-4 text-xl text-muted-foreground">Analyzing past 15 days of historical data. {countdown} days remaining.</p>
                    <div className="flex justify-center items-end gap-1 mt-8 h-16">
                        {Array.from({ length: analysisBars }).map((_, i) => (
                           <div key={i} className={cn(
                            "w-3 rounded-t-sm bg-primary/20 transition-all duration-300",
                            i < activeBars ? 'h-full bg-primary' : 'h-4'
                           )} />
                        ))}
                    </div>
                </>
            )}

            {phase === 'activating' && (
                 <>
                    <h1 className="font-headline text-8xl font-bold text-primary animate-pulse">
                        {countdown}
                    </h1>
                    <p className="mt-4 text-xl text-muted-foreground">Initializing MAGNUS Trading Bot...</p>
                </>
            )}

            {phase === 'done' && (
                 <>
                    <h1 className="font-headline text-5xl font-bold text-green-500">
                        Bot Activated
                    </h1>
                    <p className="mt-4 text-xl text-muted-foreground">Automated trading has started.</p>
                </>
            )}
        </div>
      </div>
    </div>
  );
}
