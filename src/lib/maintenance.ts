/**
 * Maintenance mode flag.
 *
 * Controlled by `NEXT_PUBLIC_MAINTENANCE_MODE` ("on" / "off"), which is
 * inlined into both the client bundle and the server runtime. A server-only
 * `MAINTENANCE_MODE` is also honored as a fallback. Defaults to "off" when
 * unset or set to anything other than "on".
 */
export function isMaintenanceMode(): boolean {
  const flag =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE ?? process.env.MAINTENANCE_MODE;
  return flag?.trim().toLowerCase() === "on";
}
