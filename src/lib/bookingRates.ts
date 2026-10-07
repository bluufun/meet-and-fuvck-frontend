export const BOOKING_DURATIONS = [
  { id: "short_time", label: "Short Time", description: "A brief meeting" },
  { id: "hourly", label: "Hourly", description: "Booked by the hour" },
  { id: "extended_time", label: "Extended Time", description: "Several hours" },
  { id: "overnight", label: "Overnight", description: "Available through the night" },
  { id: "weekend", label: "Weekend", description: "Available for a full weekend" },
  { id: "full_day", label: "Full Day", description: "Available for an entire day" },
  { id: "travel_trips", label: "Travel / Trips", description: "Available to accompany someone on a trip" },
] as const;
export type BookingDurationId = (typeof BOOKING_DURATIONS)[number]["id"];
export type BookingRate = { duration: BookingDurationId; incall?: number | string; outcall?: number | string };

export function durationLabel(id: string) {
  return BOOKING_DURATIONS.find((item) => item.id === id)?.label ?? id;
}
