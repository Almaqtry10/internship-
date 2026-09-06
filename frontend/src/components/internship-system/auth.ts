/**
 * Session-based authentication against Odoo users/groups only.
 * No client-side demo accounts — fake local login left staff dashboards empty
 * (UI role without an Odoo session cookie → API returned nothing).
 */
import type { InternshipRole, SessionInfo } from './types';
import { internshipApi } from './api';

const SESSION_KEYS = {
    role: 'internship_role',
    username: 'internship_username',
    studentId: 'internship_student_id',
    name: 'internship_display_name',
};

export function readStoredSession(): { role: InternshipRole | null; username: string; studentId: string } {
    return {
        role: (localStorage.getItem(SESSION_KEYS.role) as InternshipRole) || null,
        username: localStorage.getItem(SESSION_KEYS.username) || '',
        studentId: localStorage.getItem(SESSION_KEYS.studentId) || '',
    };
}

export function persistSession(session: SessionInfo) {
    if (!session.role) {
        clearStoredSession();
        return;
    }
    localStorage.setItem(SESSION_KEYS.role, session.role);
    localStorage.setItem(SESSION_KEYS.username, session.login || '');
    if (session.student_id) {
        localStorage.setItem(SESSION_KEYS.studentId, session.student_id);
    } else {
        localStorage.removeItem(SESSION_KEYS.studentId);
    }
    if (session.name) {
        localStorage.setItem(SESSION_KEYS.name, session.name);
    }
}

export function clearStoredSession() {
    Object.values(SESSION_KEYS).forEach((k) => localStorage.removeItem(k));
}

/**
 * Authenticate via Odoo session only.
 * After login, round-trip /auth/session so the session cookie is confirmed
 * before the dashboard mounts.
 */
export async function authenticateUser(username: string, password: string): Promise<SessionInfo | null> {
    try {
        const result = await internshipApi.login(username.trim(), password);
        if (!result || result.status === 'error' || !result.data?.role) {
            throw new Error(
                (result && typeof result.error === 'string' && result.error)
                    || 'Invalid username or password.',
            );
        }
        const session = result.data as SessionInfo;
        persistSession(session);

        try {
            const confirmed = await internshipApi.getSession();
            if (confirmed?.data?.authenticated && confirmed.data.role) {
                persistSession(confirmed.data as SessionInfo);
                return confirmed.data as SessionInfo;
            }
        } catch {
            /* profile hook will retry if the first post-login call still races */
        }
        return session;
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Login failed.');
    }
}

export async function logoutUser() {
    try {
        await internshipApi.logout();
    } catch {
        /* session may already be gone */
    }
    clearStoredSession();
}

export async function refreshSession(): Promise<SessionInfo | null> {
    try {
        const result = await internshipApi.getSession();
        if (result?.data?.authenticated && result.data.role) {
            persistSession(result.data);
            return result.data;
        }
    } catch {
        /* ignore */
    }
    clearStoredSession();
    return null;
}
