/** Admin panel URL for storefront links (build-time). */
export function getAdminUrl(): string {
  const explicit = import.meta.env.PUBLIC_ADMIN_URL?.trim();
  if (explicit) return explicit;

  const site = import.meta.env.PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      const u = new URL(site);
      return `${u.protocol}//admin.${u.hostname}`;
    } catch {
      /* ignore invalid site URL */
    }
  }

  return import.meta.env.DEV ? "http://localhost:3000" : "http://admin.medalino.ir";
}
