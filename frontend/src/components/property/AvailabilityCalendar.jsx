import React, { useState } from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function AvailabilityCalendar({
  checkIn,
  checkOut,
  bookedDates = new Set(),
  onDateRangeChange,
}) {
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectingCI, setSelectingCI] = useState(true);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dateStr) => {
    const clickedDate = new Date(dateStr);

    if (selectingCI || !checkIn || (checkIn && checkOut)) {
      onDateRangeChange(dateStr, null);
      setSelectingCI(false);
    } else {
      const ciDate = new Date(checkIn);
      if (clickedDate <= ciDate) {
        onDateRangeChange(dateStr, null);
        setSelectingCI(false);
        return;
      }
      onDateRangeChange(checkIn, dateStr);
      setSelectingCI(true);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const emptyDays = Array.from({ length: firstDay });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-wrap">
      <div className="cal-nav">
        <button className="cal-btn" id="cal-prev" type="button" onClick={prevMonth}>
          ‹
        </button>
        <div className="cal-title" id="cal-month-title">
          {MONTHS[calMonth]} {calYear}
        </div>
        <button className="cal-btn" id="cal-next" type="button" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="cal-days-hdr" id="cal-days-hdr">
        {DAYS.map((d) => (
          <div key={d} className="cal-day-name">
            {d}
          </div>
        ))}
      </div>

      <div className="cal-days" id="cal-days">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="cal-day empty" />
        ))}

        {monthDays.map((d) => {
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const date = new Date(calYear, calMonth, d);
          const isPast = date < today;
          const isBooked = bookedDates.has(dateStr);

          let cls = 'cal-day';
          if (isPast || isBooked) {
            cls += isPast ? ' past' : ' booked';
          } else if (checkIn && checkOut) {
            const ci = new Date(checkIn);
            const co = new Date(checkOut);
            if (date.getTime() === ci.getTime()) cls += ' rs';
            else if (date.getTime() === co.getTime()) cls += ' re';
            else if (date > ci && date < co) cls += ' ir';
          } else if (checkIn && date.getTime() === new Date(checkIn).getTime()) {
            cls += ' sel';
          }

          const canClick = !isPast && !isBooked;

          return (
            <div
              key={dateStr}
              className={cls}
              onClick={canClick ? () => handleDayClick(dateStr) : undefined}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
