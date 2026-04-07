/**
 * COMPATIBILITY SHIM
 *
 * performanceApi.ts previously created calls via a second Axios
 * instance (apiClient) that bypassed withCredentials and the Vite
 * proxy. All calls now go through src/lib/api.ts.
 *
 * Re-exporting from lib/api so any file still importing from here
 * continues to work without changes.
 */
export { performanceApi } from '@/lib/api';