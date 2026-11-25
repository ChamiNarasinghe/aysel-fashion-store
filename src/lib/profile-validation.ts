/**
 * Shared profile field validation.
 *
 * This module is imported by both the Server Action (actions.ts) and the
 * client-side form (profile-form.tsx) so the rules are never duplicated.
 *
 * It has no Next.js or Supabase dependencies and can be imported in any
 * environment, including the Node test runner.
 */

export type ProfileFields = {
  first_name: string;
  last_name: string;
  phone: string;
};

export type ProfileFieldErrors = Partial<Record<keyof ProfileFields, string>>;

/**
 * Returns the first validation error as a plain string, or null if all fields
 * are valid. Used by the Server Action where a single error message is enough.
 */
export function validateProfileFields(fields: ProfileFields): string | null {
  const first = fields.first_name.trim();
  const last = fields.last_name.trim();
  if (!first) return "First name is required.";
  if (!last) return "Last name is required.";
  if (first.length > 100) return "First name is too long.";
  if (last.length > 100) return "Last name is too long.";
  if (fields.phone.trim().length > 30) return "Phone number is too long.";
  return null;
}

/**
 * Returns a per-field error map. Used by the client form to display inline
 * errors beneath each input. All fields are checked independently so multiple
 * errors can be shown at once.
 */
export function validateProfileForm(
  fields: ProfileFields
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  if (!fields.first_name.trim())
    errors.first_name = "First name is required.";
  else if (fields.first_name.trim().length > 100)
    errors.first_name = "First name is too long.";
  if (!fields.last_name.trim())
    errors.last_name = "Last name is required.";
  else if (fields.last_name.trim().length > 100)
    errors.last_name = "Last name is too long.";
  if (fields.phone.trim().length > 30)
    errors.phone = "Phone number is too long.";
  return errors;
}
