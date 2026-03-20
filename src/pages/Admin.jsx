import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Monitor, CalendarDays, Shield } from 'lucide-react';

export default function Admin() {
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const configs = await base44.entities.KioskConfig.list();
      if (configs.length > 0) setConfig(configs[0]);
      const evts = await base44.entities.Event.list('start_date');
      setEvents(evts);
    };
    load();
  }, []);

  const updateConfig = async (updates) => {
    setSaving(true);
    const newConfig = { ...config, ...updates };
    await base44.entities.KioskConfig.update(config.id, updates);
    setConfig(newConfig);
    setSaving(false);
  };

  if (!config) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-lg">Loading configuration...</p>
    </div>
  );

  const modeIcons = {
    week: <Monitor className="w-5 h-5" />,
    event: <CalendarDays className="w-5 h-5" />,
    emergency: <AlertTriangle className="w-5 h-5 text-red-500" />,
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Kiosk Steuerung</h1>
          <p className="text-muted-foreground mt-1">Control panel for the AGRA information steles</p>
        </div>

        {/* System Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              System Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {['week', 'event', 'emergency'].map(mode => (
                <Button
                  key={mode}
                  variant={config.system_mode === mode ? 'default' : 'outline'}
                  className={`h-20 flex flex-col gap-2 ${mode === 'emergency' && config.system_mode === mode ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                  onClick={() => updateConfig({ system_mode: mode })}
                  disabled={saving}
                >
                  {modeIcons[mode]}
                  <span className="capitalize">{mode}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Settings */}
        {config.system_mode === 'emergency' && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Emergency Type</Label>
                <Select
                  value={config.emergency_type || 'evacuation'}
                  onValueChange={v => updateConfig({ emergency_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evacuation">Evacuation</SelectItem>
                    <SelectItem value="weather">Weather Warning</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Emergency Message</Label>
                <Input
                  value={config.emergency_message || ''}
                  onChange={e => updateConfig({ emergency_message: e.target.value })}
                  placeholder="Custom emergency message..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Selection */}
        {config.system_mode === 'event' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Active Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={config.active_event_id || ''}
                onValueChange={v => {
                  updateConfig({ active_event_id: v });
                  // Also mark the event as active
                  events.forEach(async e => {
                    await base44.entities.Event.update(e.id, { is_active: e.id === v });
                  });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select event..." /></SelectTrigger>
                <SelectContent>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Status indicator */}
        <div className="text-center text-sm text-muted-foreground">
          Current mode: <span className="font-bold text-foreground capitalize">{config.system_mode}</span>
          {saving && ' · Saving...'}
        </div>
      </div>
    </div>
  );
}