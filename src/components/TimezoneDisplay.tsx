import { Clock, Globe } from "lucide-react";

interface TimezoneDisplayProps {
  timezone: string;
  time?: string; // Optional time in 24hr format to show conversions
  showConversion?: boolean;
}

const TIMEZONE_LABELS: Record<string, { short: string; full: string }> = {
  "America/Los_Angeles": { short: "PST", full: "Pacific Time (PST)" },
  "America/New_York": { short: "EST", full: "Eastern Time (EST)" },
};

// Convert time from one timezone to another
export const convertTime = (time: string, fromTz: string, toTz: string): string => {
  // Get timezone offsets (simplified for PST/EST)
  const offsets: Record<string, number> = {
    "America/Los_Angeles": -8, // PST
    "America/New_York": -5, // EST
  };

  const fromOffset = offsets[fromTz] ?? -8;
  const toOffset = offsets[toTz] ?? -5;
  const diff = toOffset - fromOffset;

  const [hours, minutes] = time.split(":").map(Number);
  let newHours = hours + diff;
  
  if (newHours < 0) newHours += 24;
  if (newHours >= 24) newHours -= 24;

  return `${String(newHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// Format time to 12hr format
export const formatTime12hr = (time24: string): string => {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
};

// Get the other timezone for comparison
export const getOtherTimezone = (tz: string): string => {
  return tz === "America/Los_Angeles" ? "America/New_York" : "America/Los_Angeles";
};

// Get short label for timezone
export const getTimezoneLabel = (tz: string, type: "short" | "full" = "short"): string => {
  return TIMEZONE_LABELS[tz]?.[type] ?? tz;
};

const TimezoneDisplay = ({ timezone, time, showConversion = false }: TimezoneDisplayProps) => {
  const tzLabel = TIMEZONE_LABELS[timezone] || { short: timezone, full: timezone };
  const otherTz = getOtherTimezone(timezone);
  const otherTzLabel = TIMEZONE_LABELS[otherTz] || { short: otherTz, full: otherTz };

  if (time && showConversion) {
    const convertedTime = convertTime(time, timezone, otherTz);
    return (
      <div className="flex items-center gap-2 text-sm">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{formatTime12hr(time)}</span>
        <span className="text-primary font-semibold">{tzLabel.short}</span>
        <span className="text-muted-foreground">=</span>
        <span className="font-medium">{formatTime12hr(convertedTime)}</span>
        <span className="text-muted-foreground">{otherTzLabel.short}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-sm">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-medium text-foreground">{tzLabel.short}</span>
      <span className="text-muted-foreground text-xs">({tzLabel.full})</span>
    </div>
  );
};

export default TimezoneDisplay;