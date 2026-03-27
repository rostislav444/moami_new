/**
 * Safe server-side fetch with timeout and no retry loops.
 *
 * Prevents the 400% CPU issue caused by Next.js fetch cache
 * entering infinite revalidation loops on ResponseContentLengthMismatchError.
 */

const API_URL = process.env.API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://web:8000' : 'http://localhost:8000');

const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moami.com.ua';

const FETCH_TIMEOUT = 10000; // 10 seconds

export function fixMediaUrls<T>(data: T): T {
    const json = JSON.stringify(data);
    const fixed = json.replace(/http:\/\/web:8000/g, PUBLIC_URL)
                      .replace(/http:\/\/localhost:8000/g, PUBLIC_URL);
    return JSON.parse(fixed);
}

/**
 * Server-side fetch with:
 * - AbortController timeout (prevents hanging)
 * - cache: 'no-store' (prevents Next.js fetch cache retry loops)
 * - Automatic fixMediaUrls for Docker internal URLs
 */
export async function serverFetch<T>(path: string, fallback: T): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
        const res = await fetch(`${API_URL}${path}`, {
            signal: controller.signal,
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'uk',
            },
        });

        if (!res.ok) {
            return fallback;
        }

        const data = await res.json();
        return fixMediaUrls(data);
    } catch {
        return fallback;
    } finally {
        clearTimeout(timeout);
    }
}

export function getApiUrl(): string {
    return API_URL;
}
