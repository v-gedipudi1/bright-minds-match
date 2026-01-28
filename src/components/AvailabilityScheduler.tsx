import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Globe } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "17:00" };

export const getDefaultAvailability = (): WeeklyAvailability => ({
  monday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
  tuesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
  wednesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
  thursday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
  friday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
});

export const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "Pacific Time (PST)" },
  { value: "America/New_York", label: "Eastern Time (EST)" },
] as const;

interface AvailabilitySchedulerProps {
  availability: WeeklyAvailability;
  onChange: (availability: WeeklyAvailability) => void;
  timezone: string;
  onTimezoneChange: (timezone: string) => void;
}

const AvailabilityScheduler = ({ availability, onChange, timezone, onTimezoneChange }: AvailabilitySchedulerProps) => {
  // Ensure we have a complete availability object with all days
  const safeAvailability: WeeklyAvailability = {
    monday: availability?.monday || { enabled: false, slots: [] },
    tuesday: availability?.tuesday || { enabled: false, slots: [] },
    wednesday: availability?.wednesday || { enabled: false, slots: [] },
    thursday: availability?.thursday || { enabled: false, slots: [] },
    friday: availability?.friday || { enabled: false, slots: [] },
    saturday: availability?.saturday || { enabled: false, slots: [] },
    sunday: availability?.sunday || { enabled: false, slots: [] },
  };

  const handleDayToggle = (day: keyof WeeklyAvailability) => {
    const currentDay = safeAvailability[day];
    const newAvailability = {
      ...safeAvailability,
      [day]: {
        enabled: !currentDay.enabled,
        slots: !currentDay.enabled ? [{ ...DEFAULT_SLOT }] : [],
      },
    };
    onChange(newAvailability);
  };

  const handleSlotChange = (
    day: keyof WeeklyAvailability,
    slotIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    const currentDay = safeAvailability[day];
    const newAvailability = {
      ...safeAvailability,
      [day]: {
        ...currentDay,
        slots: currentDay.slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    };
    onChange(newAvailability);
  };

  const addSlot = (day: keyof WeeklyAvailability) => {
    const currentDay = safeAvailability[day];
    const newAvailability = {
      ...safeAvailability,
      [day]: {
        ...currentDay,
        slots: [...currentDay.slots, { ...DEFAULT_SLOT }],
      },
    };
    onChange(newAvailability);
  };

  const removeSlot = (day: keyof WeeklyAvailability, slotIndex: number) => {
    const currentDay = safeAvailability[day];
    const newAvailability = {
      ...safeAvailability,
      [day]: {
        ...currentDay,
        slots: currentDay.slots.filter((_, i) => i !== slotIndex),
      },
    };
    onChange(newAvailability);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Schedule</CardTitle>
        <CardDescription>
          Set your weekly availability so students can book sessions during your open hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timezone Selector */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-base font-semibold">Your Timezone</Label>
              <p className="text-sm text-muted-foreground">
                Students will see your availability converted to their timezone
              </p>
            </div>
          </div>
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select your timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Days */}
        <div className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const dayAvailability = safeAvailability[key];
          return (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={dayAvailability.enabled}
                    onCheckedChange={() => handleDayToggle(key)}
                  />
                  <Label htmlFor={key} className="font-medium cursor-pointer">
                    {label}
                  </Label>
                </div>
                {dayAvailability.enabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSlot(key)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Slot
                  </Button>
                )}
              </div>

              {dayAvailability.enabled && dayAvailability.slots.length > 0 && (
                <div className="space-y-2 ml-7">
                  {dayAvailability.slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          handleSlotChange(key, slotIndex, "start", e.target.value)
                        }
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          handleSlotChange(key, slotIndex, "end", e.target.value)
                        }
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      {dayAvailability.slots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSlot(key, slotIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dayAvailability.enabled && dayAvailability.slots.length === 0 && (
                <p className="text-sm text-muted-foreground ml-7">
                  No time slots added. Click "Add Slot" to add availability.
                </p>
              )}
            </div>
          );
        })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityScheduler;
