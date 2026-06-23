import { CSRF_FIELD_NAME, createCsrfToken } from "@/lib/auth/csrf";

export async function CsrfField() {
  const token = await createCsrfToken();

  return <input type="hidden" name={CSRF_FIELD_NAME} value={token} />;
}
