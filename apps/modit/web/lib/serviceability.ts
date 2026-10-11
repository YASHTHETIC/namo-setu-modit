/**
 * Serviceability: pincodes we currently deliver to.
 * Matched by leading digits so nearby pincodes in the same zone work too.
 */
export const SERVICEABLE_PREFIXES = [
  "110", // Delhi
  "121", // Faridabad (NCR)
  "122", // Gurgaon (NCR)
  "201", // Noida / Greater Noida / Ghaziabad (home zone)
  "400", "401", "410", // Mumbai / Thane / Navi Mumbai
  "560", "561", "562", // Bengaluru
  "600", "601", // Chennai
  "700", "711", // Kolkata / Howrah
  "411", // Pune
  "500", "501", // Hyderabad
  "302", "303", // Jaipur
  "380", "382", // Ahmedabad / Gandhinagar
];

export function isServiceablePin(pincode: string | null | undefined): boolean {
  if (!pincode) return false;
  const digits = pincode.replace(/\D/g, "");
  if (digits.length !== 6) return false;
  return SERVICEABLE_PREFIXES.some((prefix) => digits.startsWith(prefix));
}
