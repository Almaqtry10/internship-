import { internshipApi } from './api';

export function isPdfBlob(blob: Blob, filename = ''): boolean {
    if ((filename || '').toLowerCase().endsWith('.pdf')) return true;
    return (blob.type || '').includes('pdf');
}

export async function fetchInternshipDocBlob(
    requestId: number,
    filename = 'certificate.pdf',
): Promise<Blob | null> {
    try {
        const response = await fetch(internshipApi.documentUrl(requestId), {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return blob && blob.size > 0 ? blob : null;
    } catch {
        return null;
    }
}

export function downloadInternshipDoc(requestId: number, filename = 'certificate.pdf') {
    const a = document.createElement('a');
    a.href = internshipApi.documentUrl(requestId, true);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
}
