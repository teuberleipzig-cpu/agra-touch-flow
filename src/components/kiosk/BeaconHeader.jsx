import React, { useState, useEffect } from 'react';
import moment from 'moment';

export default function BeaconHeader({ subtitle }) {
  const [time, setTime] = useState(moment());

  useEffect(() => {
    const interval = setInterval(() => setTime(moment()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-8 pt-6 pb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="font-interface font-light text-xl text-muted-foreground tracking-widest uppercase">
          {time.format('HH:mm')}
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className="font-interface font-light text-xl text-muted-foreground tracking-widest uppercase">
          LEIPZIG
        </span>
      </div>
      {subtitle && (
        <span className="font-interface text-lg text-primary/70 tracking-wide">
          {subtitle}
        </span>
      )}
    </div>
  );
}