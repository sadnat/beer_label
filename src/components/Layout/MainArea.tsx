import React from 'react';

interface MainAreaProps {
  children: React.ReactNode;
}

export const MainArea: React.FC<MainAreaProps> = ({ children }) => {
  return (
    <main className="flex-1 canvas-container overflow-hidden relative">
      {children}
    </main>
  );
};
