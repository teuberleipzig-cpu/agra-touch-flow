import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, Ticket, Globe } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/de';

moment.locale('de');

export default function EventDetail({ event, getTitle, getDesc, onBack }) {
  const title = getTitle(event);
  const desc = getDesc(event);
  const siteUrl = event.website_url || event.ticket_url || 'https://agramessepark.de/events/';
  const ticketUrl = event.ticket_url;

  const dateStr = event.date_text || (
    moment(event.start_date).format('dddd, D. MMMM YYYY') +
    (event.end_date && moment(event.end_date).format('YYYYMMDD') !== moment(event.start_date).format('YYYYMMDD')
      ? ` – ${moment(event.end_date).format('D. MMMM YYYY')}`
      : '')
  );

  const qr = (url) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=400x400&bgcolor=08090B&color=00F3FF&data=${encodeURIComponent(url)}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="h-screen flex flex-col bg-[#08090B] overflow-hidden"
    >
      {/* Hero image */}
      {event.image_url && (
        <div className="relative flex-none" style={{ height: '40vh' }}>
          <img
            src={event.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#08090B]" />
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 pb-32 pt-5 space-y-6">

        {/* Date */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="font-interface text-primary font-semibold text-lg tracking-wide">
            {dateStr}
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-display font-extrabold text-white leading-tight"
          style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}
        >
          {title}
        </h1>

        {/* Description */}
        {desc && (
          <p className="font-interface text-white/55 text-xl leading-relaxed">
            {desc}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* QR cards */}
        <div className="space-y-4">

          {/* Website QR */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 flex gap-6 items-center">
            <div className="flex-shrink-0 p-2 rounded-xl bg-white/[0.05]">
              <img
                src={qr(siteUrl)}
                alt="QR Website"
                className="w-28 h-28 rounded-lg"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span className="font-interface text-primary font-bold text-sm uppercase tracking-widest">
                  Website öffnen
                </span>
              </div>
              <p className="font-interface text-white/30 text-sm leading-snug break-all">
                {siteUrl}
              </p>
              <p className="font-interface text-white/50 text-base">
                QR-Code mit Ihrem Handy scannen
              </p>
            </div>
          </div>

          {/* Ticket QR — only if ticket URL exists and differs from website */}
          {ticketUrl && ticketUrl !== siteUrl && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 flex gap-6 items-center">
              <div className="flex-shrink-0 p-2 rounded-xl bg-primary/10">
                <img
                  src={qr(ticketUrl)}
                  alt="QR Tickets"
                  className="w-28 h-28 rounded-lg"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="font-interface text-primary font-bold text-sm uppercase tracking-widest">
                    Tickets kaufen
                  </span>
                </div>
                <p className="font-interface text-white/30 text-sm break-all">
                  {ticketUrl}
                </p>
                <p className="font-interface text-white/50 text-base">
                  Direkt zum Ticketkauf
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}