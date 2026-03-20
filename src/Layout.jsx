import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}