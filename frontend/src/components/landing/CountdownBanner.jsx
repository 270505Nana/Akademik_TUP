import { useEffect, useMemo, useState } from "react";

const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

export const getCountdownParts = (targetDate, now = new Date()) => {
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  if (Number.isNaN(target.getTime()) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const CountdownBanner = ({ title, subtitle, targetDate }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = useMemo(() => getCountdownParts(targetDate, now), [targetDate, now]);

  const units = [
    { key: "days", label: "HARI", value: pad(parts.days) },
    { key: "hours", label: "JAM", value: pad(parts.hours) },
    { key: "minutes", label: "MENIT", value: pad(parts.minutes) },
    { key: "seconds", label: "DETIK", value: pad(parts.seconds) },
  ];

  return (
    <div className="lp-countdown">
      <div className="lp-countdown-copy">
        <p className="lp-countdown-title">{title}</p>
        <p className="lp-countdown-sub">{subtitle}</p>
      </div>
      <div className="lp-countdown-units" aria-live="polite">
        {units.map((unit) => (
          <div className="lp-countdown-unit" key={unit.key}>
            <span className="lp-countdown-value">{unit.value}</span>
            <span className="lp-countdown-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownBanner;
