/**
 * COMPATIBILITY SHIM
 *
 * apiClient.ts previously created a second Axios instance pointing
 * directly to http://localhost:8000 — this broke on any deployment
 * and bypassed withCredentials (auth cookies never sent).
 *
 * All API calls now go through src/lib/api.ts which uses the Vite
 * proxy (/api → http://localhost:8000) and has withCredentials: true.
 *
 * This file re-exports the single apiClient from lib/api so that
 * any file still importing from here continues to work without changes.
 */

export { api as apiClient } from '@/lib/api';