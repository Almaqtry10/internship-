import type { ApiResult, InternshipPlacementRequest, InternshipRequest, SessionInfo, StudentProfile, TrackedRequest } from './types';

const API_BASE_URL = '/api/v1/internship';

const RETRYABLE = new Set([502, 503, 504]);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1200;

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function jsonCall<T = unknown>(path: string, params: Record<string, unknown> = {}): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
            await sleep(RETRY_DELAY_MS * attempt);
        }

        let response: Response;
        try {
            response = await fetch(`${API_BASE_URL}${path}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'call',
                    params,
                    id: Date.now(),
                }),
            });
        } catch (networkErr) {
            lastError = networkErr instanceof Error ? networkErr : new Error('Network error');
            continue;
        }

        if (RETRYABLE.has(response.status)) {
            lastError = new Error(`Backend returned ${response.status}`);
            continue;
        }

        if (!response.ok) {
            throw new Error(`Backend returned ${response.status}`);
        }

        const json = await response.json();
        if (json.error) {
            const msg = json.error.data?.message || json.error.message || 'Server error';
            throw new Error(msg);
        }
        const result = json.result as T & { status?: string; message?: string; error?: string };
        if (result && typeof result === 'object' && result.status === 'error') {
            throw new Error(result.error || result.message || 'Request failed');
        }
        return result as T;
    }

    throw lastError ?? new Error('Server unavailable. Please try again in a moment.');
}

async function jsonCallFirst<T = unknown>(paths: string[], params: Record<string, unknown> = {}): Promise<T> {
    let lastError: Error | null = null;
    for (const path of paths) {
        try {
            return await jsonCall<T>(path, params);
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (lastError.message.includes('404')) {
                continue;
            }
            throw lastError;
        }
    }
    throw lastError ?? new Error('Request failed');
}

export const internshipApi = {
    login: async (login: string, password: string) =>
        jsonCall<ApiResult<SessionInfo>>('/auth/login', { login, password }),
    logout: async () => jsonCall<ApiResult<{ logged_out: boolean }>>('/auth/logout', {}),
    getSession: async () => jsonCall<ApiResult<SessionInfo>>('/auth/session', {}),
    changePassword: async (
        current_password: string,
        new_password: string,
        confirm_password: string,
    ) => jsonCall('/auth/change_password', {
        current_password,
        new_password,
        confirm_password,
    }),
    getStudentProfile: async () =>
        jsonCallFirst<ApiResult<StudentProfile>>(['/student_profile', '/profile']),
    listRequests: async () =>
        jsonCallFirst<ApiResult<InternshipRequest[]>>(['/list', '/requests']),
    submitRequest: async (data: Record<string, unknown>) =>
        jsonCall('/submit', data),
    performAction: async (record_id: number, action_type: string, rejection_reason?: string) =>
        jsonCall('/action', {
            record_id,
            request_id: record_id,
            action: action_type,
            action_type,
            reason: rejection_reason || '',
        }),
    documentUrl: (requestId: number, download = false) => {
        const qs = download ? `?download=1&t=${Date.now()}` : `?t=${Date.now()}`;
        return `${API_BASE_URL}/document/${requestId}${qs}`;
    },
    submitPlacementRequest: async (data: Record<string, unknown>) =>
        jsonCall('/placement/submit', data),
    listPlacementRequests: async () =>
        jsonCall<ApiResult<InternshipPlacementRequest[]>>('/placement/list', {}),
    trackRequests: async () =>
        jsonCall<ApiResult<TrackedRequest[]>>('/track', {}),
    performPlacementAction: async (record_id: number, action_type: string, rejection_reason?: string) =>
        jsonCall('/placement/action', {
            request_id: record_id,
            action: action_type,
            reason: rejection_reason || '',
        }),
};
