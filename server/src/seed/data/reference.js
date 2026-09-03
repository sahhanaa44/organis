// Fictional reference data used to generate realistic-looking demo records.
// None of this represents real people, hospitals, or medical records.

export const FIRST_NAMES = [
  "Aarav", "Vihaan", "Aditya", "Ishaan", "Kabir", "Arjun", "Reyansh", "Krishna",
  "Sai", "Rohan", "Ananya", "Diya", "Ira", "Myra", "Anika", "Saanvi", "Kavya",
  "Meera", "Priya", "Riya", "Nikhil", "Farhan", "Zoya", "Aisha", "Karthik",
  "Deepak", "Lakshmi", "Divya", "Sanjay", "Nisha", "Ravi", "Pooja", "Vikram",
  "Sneha", "Arun", "Kiran", "Manoj", "Sunita", "Rajesh", "Anjali",
];

export const LAST_NAMES = [
  "Sharma", "Verma", "Iyer", "Nair", "Menon", "Reddy", "Rao", "Gupta",
  "Patel", "Krishnan", "Subramaniam", "Pillai", "Bose", "Chatterjee",
  "Mukherjee", "Desai", "Kulkarni", "Joshi", "Nambiar", "Raghavan",
];

export const CITIES = [
  { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { city: "Madurai", state: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867 },
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
  { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209 },
  { city: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2673 },
  { city: "Vizag", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
];

export const HOSPITAL_NAMES = [
  "Meridian General Hospital",
  "St. Aldwyn Medical Center",
  "Coastal Institute of Transplant Sciences",
  "Fortis Grace Hospital",
  "Ashoka Multispecialty Hospital",
  "Lakeview Transplant Institute",
  "National Organ Care Centre",
  "Harborview Clinical Institute",
];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
export const ORGAN_TYPES = ["kidney", "liver", "heart", "lung", "pancreas", "cornea", "small_intestine"];
export const URGENCY_LEVELS = ["low", "medium", "high", "critical"];

export const HLA_MARKER_POOL = ["A1", "A2", "A3", "B7", "B8", "B27", "DR1", "DR3", "DR4", "DR15"];

export const PRIOR_CONDITIONS_POOL = [
  "hypertension",
  "type 2 diabetes",
  "mild coronary artery disease",
  "prior minor surgery",
  "asthma",
];

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickMany(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDateWithinDays(daysAgoMax) {
  const days = randomInt(0, daysAgoMax);
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function fullName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
