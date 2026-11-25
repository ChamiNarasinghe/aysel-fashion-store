export type ChangePasswordFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordFields, string>>;

/**
 * Client-side per-field validation. Returns a map of field → error message.
 * All fields are checked independently so multiple errors can show at once.
 */
export function validateChangePasswordForm(
  fields: ChangePasswordFields
): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};

  if (!fields.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!fields.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (fields.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  } else if (fields.currentPassword && fields.newPassword === fields.currentPassword) {
    errors.newPassword = "New password must differ from your current password.";
  }

  if (!fields.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (fields.newPassword !== fields.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/**
 * Server-side scalar validation. Returns the first error as a string, or null.
 * Independently enforces all rules — never relies on client-side validation.
 */
export function validateChangePasswordServer(fields: ChangePasswordFields): string | null {
  if (!fields.currentPassword) return "Current password is required.";
  if (!fields.newPassword) return "New password is required.";
  if (fields.newPassword.length < 8) return "Password must be at least 8 characters.";
  if (fields.newPassword === fields.currentPassword)
    return "New password must differ from your current password.";
  if (!fields.confirmPassword) return "Please confirm your new password.";
  if (fields.newPassword !== fields.confirmPassword) return "Passwords do not match.";
  return null;
}
