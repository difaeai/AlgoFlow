
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { BotStartupOverlay } from '@/components/bot-startup-overlay';
import { BotShutdownOverlay } from '@/components/bot-shutdown-overlay';

type BotContextType = {
  isBotActive: boolean;
  setIsBotActive: (isActive: boolean) => void;
  isStartingUp: boolean;
};

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: ReactNode }) {
  const [isBotActive, _setIsBotActive] = useState(false);
  const [isStartingUp, setIsStartingUp] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);

  const handleSetIsBotActive = (isActive: boolean) => {
    if (isActive && !isBotActive) {
      // Starting the bot
      setIsStartingUp(true);
      setTimeout(() => {
        _setIsBotActive(true);
        setIsStartingUp(false);
      }, 16000); // 15s for analysis + 1s buffer
    } else if (!isActive && isBotActive) {
      // Stopping the bot
      _setIsBotActive(false);
      setIsShuttingDown(true);
      setTimeout(() => {
          setIsShuttingDown(false);
      }, 2000); // 2-second shutdown message
    } else {
      // No change in state
      _setIsBotActive(isActive);
      setIsStartingUp(false);
      setIsShuttingDown(false);
    }
  };


  return (
    <BotContext.Provider value={{ isBotActive, setIsBotActive: handleSetIsBotActive, isStartingUp }}>
      {children}
      <BotStartupOverlay isStarting={isStartingUp} />
      <BotShutdownOverlay isShuttingDown={isShuttingDown} />
    </BotContext.Provider>
  );
}

export function useBotContext() {
  const context = useContext(BotContext);
  if (context === undefined) {
    throw new Error('useBotContext must be used within a BotProvider');
  }
  return context;
}
