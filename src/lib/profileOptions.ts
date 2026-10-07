// lib/profileOptions.ts
export const INTENTS = [
  { id: "fun", label: "Fun & good times" },
  { id: "relationship", label: "Relationship" },
  { id: "both", label: "Open to both" },
];

export const EDUCATION_LEVELS = [
  { id: "secondary", label: "Secondary School" },
  { id: "diploma", label: "Diploma / OND / HND" },
  { id: "bsc", label: "Bachelor's Degree (BSc)" },
  { id: "msc", label: "Master's Degree (MSc)" },
  { id: "phd", label: "PhD / Doctorate" },
  { id: "vocational", label: "Vocational Training" },
  { id: "none", label: "Prefer not to say" },
];

export const OCCUPATIONS = [
  { id: "corporate", label: "Corporate / Office worker" },
  { id: "business", label: "Business owner / Entrepreneur" },
  { id: "corper", label: "NYSC Corper" },
  { id: "student", label: "Student" },
  { id: "creative", label: "Creative (artist, musician, etc.)" },
  { id: "tech", label: "Tech professional" },
  { id: "medical", label: "Medical / Healthcare" },
  { id: "handwork", label: "Skilled trade / Handwork" },
  { id: "civil_service", label: "Civil servant" },
  { id: "freelance", label: "Freelancer / Self-employed" },
  { id: "unemployed", label: "Currently unemployed" },
  { id: "prefer_not", label: "Prefer not to say" },
];

export const GENDERS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "trans", label: "Transgender" },
  { id: "nonbinary", label: "Non-binary" },
  { id: "prefer_not", label: "Prefer not to say" },
];

export const ORIENTATIONS = [
  { id: "straight", label: "Straight / Heterosexual" },
  { id: "bisexual", label: "Bisexual" },
  { id: "gay", label: "Gay" },
  { id: "lesbian", label: "Lesbian" },
  { id: "prefer_not", label: "Prefer not to say" },
];

// Single source of truth for body type options — imported by onboarding,
// dashboard editing, and every read-only display surface. Do not redefine
// this list locally anywhere else.
//
// NOTE: height used to be folded into this list ("Tall" / "Short"). It was
// split out into its own HEIGHTS list below on 2026-08-04. Existing users'
// data was backfilled by scripts/migrate-body-type-height.js — see that
// script for the exact legacy → new id mapping.
export const BODY_TYPES = [
  { id: "petite", label: "Petite" },
  { id: "slim", label: "Slim" },
  { id: "average", label: "Average" },
  { id: "athletic", label: "Athletic / Fit" },
  { id: "curvy", label: "Curvy" },
  { id: "thick", label: "Thick" },
  { id: "plus", label: "Plus Size" },
];

// Single-select height bucket, split out from BODY_TYPES so appearance and
// height can be asked (and filtered on) independently.
export const HEIGHTS = [
  { id: "under_150", label: "Under 150 cm (4'11\")" },
  { id: "150_159", label: "150–159 cm (4'11\"–5'2\")" },
  { id: "160_169", label: "160–169 cm (5'3\"–5'6\")" },
  { id: "170_179", label: "170–179 cm (5'7\"–5'10\")" },
  { id: "180_plus", label: "180+ cm (5'11\"+)" },
];

// NOTE: "light_brown" was added 2026-08-04. All previously-existing ids
// (fair, brown, dark, mixed) are unchanged, so no data migration was needed
// for this field — existing selections remain valid as-is.
export const SKIN_TONES = [
  { id: "fair", label: "Fair" },
  { id: "light_brown", label: "Light Brown" },
  { id: "brown", label: "Brown" },
  { id: "dark", label: "Dark" },
  { id: "mixed", label: "Mixed" },
];

// NOTE: ids renamed 2026-08-04 from a generic small/medium/large/na scale to
// a cup-size-based scale. Existing users were backfilled by
// scripts/migrate-bust-size.js — see that script for the exact mapping,
// including how the old "na" ("prefer not to say") id was handled, since
// the new scale has no direct equivalent for it.
export const BUST_SIZES = [
  { id: "petite", label: "Petite (A–B cup)" },
  { id: "average", label: "Average (C cup)" },
  { id: "full", label: "Full (D–DD cup)" },
  { id: "voluptuous", label: "Voluptuous (DDD+ cup)" },
];

export const EXPERIENCES = [
  { id: "fun", label: "Fun & entertainment" },
  { id: "party", label: "Party partner" },
  { id: "clubbing", label: "Clubbing / nightlife" },
  { id: "travel", label: "Travel companion" },
  { id: "date", label: "Date night" },
  { id: "relationship", label: "Serious relationship" },
  { id: "fwb", label: "Friends with benefits" },
  { id: "cook", label: "Good cook" },
  { id: "listener", label: "Good listener" },
  { id: "advisor", label: "Problem solver" },
  { id: "gym", label: "Gym buddy" },
  { id: "movies", label: "Movie partner" },
  { id: "gaming", label: "Gaming partner" },
  { id: "outdoor", label: "Outdoor adventures" },
  { id: "shopping", label: "Shopping partner" },
  { id: "networking", label: "Networking" },
  { id: "spiritual", label: "Spiritual partner" },
  { id: "mentorship", label: "Mentorship" },
  { id: "luxury_date", label: "Luxury date vibe" },
  { id: "romance_lover", label: "Romance lover" },
  { id: "cuddles_affection", label: "Cuddles & affection" },
  { id: "kissing_chemistry", label: "Kissing and chemistry" },
  { id: "intimacy_first", label: "Intimacy first" },
  { id: "late_night_talker", label: "Late-night talker" },
  { id: "spoil_me_energy", label: "Spoil me energy" },
  { id: "dominant_energy", label: "Dominant energy" },
  { id: "no_strings_fun", label: "No-strings fun" },
  { id: "fwb_boundaries", label: "FWB with boundaries" },
  { id: "bedroom_confidence", label: "Bedroom confidence" },
  { id: "mature_connection", label: "Mature connection" },
  { id: "private_fun", label: "Private fun" },
  { id: "roleplay_interested", label: "Roleplay interested" },
  { id: "karaoke", label: "Karaoke / music" },
  { id: "road_trip", label: "Road trips" },
  { id: "beach", label: "Beach / pool days" },
  { id: "conversation", label: "Deep conversation" },
  { id: "spontaneous", label: "Spontaneous plans" },
];

export const CURRENT_WANTS = [
  { id: "just_chilling", label: "Just chilling, no pressure" },
  { id: "meet_asap", label: "Ready to meet someone now" },
  { id: "good_convo", label: "Looking for good conversation" },
  { id: "weekend_plan", label: "Need weekend plans" },
  { id: "travel_buddy", label: "Need a travel buddy" },
  { id: "date_night", label: "Planning a date night" },
  { id: "gym_partner", label: "Want a gym partner" },
  { id: "movie_night", label: "Movie night partner" },
  { id: "emotional_support", label: "Need emotional support" },
  { id: "networking_now", label: "Networking right now" },
  { id: "exploring", label: "Just exploring" },
  { id: "serious_connection", label: "Seeking a serious connection" },
];

export const labelOf = (list: { id: string; label: string }[], id?: string) =>
  list.find((x) => x.id === id)?.label ?? id ?? "—";
