/** Shared TypeScript contracts for the Internship Completion portal. */

export type InternshipRole = 'student' | 'dean' | 'chief_registrar' | 'registrar_office' | 'general_registrar' | 'admin';

export interface SessionInfo {
    authenticated?: boolean;
    uid: number | false;
    login: string | null;
    name: string | null;
    role: InternshipRole | null;
    student_id: string | null;
}

export interface ApiResult<T = unknown> {
    status: string;
    data?: T;
    error?: string;
    code?: number;
    id?: number;
}

export interface InternshipRequest {
    id: number;
    student_id: string;
    full_name: string;
    state: 'draft' | 'submitted' | 'approved' | 'collected' | 'rejected' | 'cancelled';
    request_date?: string;
    rejection_reason?: string;
    enrolled_date?: string;
    graduated_date?: string;
    internship_start_date?: string;
    internship_end_date?: string;
    is_transfer_student?: boolean;
    transferred_university?: string;
    faculty?: string;
    department?: string;
    degree?: string;
    master_program?: string;
    dob?: string;
    place_of_birth?: string;
    internship_type?: 'mbchb' | 'other' | string;
    internship_type_other?: string;
    internship_type_display?: string;
    has_certificate?: boolean;
    certificate_filename?: string;
    collected_date?: string;
}

export interface StudentProfile {
    student_id: string;
    full_name: string;
    dob?: string;
    place_of_birth?: string;
    faculty?: string;
    department?: string;
    degree?: string;
    master_program?: string;
    batch?: string;
    semester?: string;
    current_semester?: string;
    enrolled_date?: string;
    graduated_date?: string;
    internship_start_date?: string;
    internship_end_date?: string;
    suggested_internship_type?: 'mbchb' | 'other' | string;
    email?: string;
    student_photo_url?: string;
    has_approved_internship_request?: boolean;
    approved_internship_request?: {
        host_organization?: string;
        internship_type_display?: string;
        internship_start_date?: string;
        internship_end_date?: string;
    } | null;
}

export interface TrackedRequest {
    id: number;
    request_kind: 'placement' | 'completion';
    student_id: string;
    full_name: string;
    faculty?: string;
    department?: string;
    degree?: string;
    internship_type?: 'mbchb' | 'other' | string;
    internship_type_other?: string;
    internship_type_display?: string;
    host_organization?: string;
    supervisor_name?: string;
    supervisor_contact?: string;
    internship_start_date?: string;
    internship_end_date?: string;
    request_date?: string;
    state: string;
    rejection_reason?: string;
    dob?: string;
    place_of_birth?: string;
    enrolled_date?: string;
    graduated_date?: string;
    is_transfer_student?: boolean;
    transferred_university?: string;
    has_certificate?: boolean;
    certificate_filename?: string;
}

export interface InternshipPlacementRequest {
    id: number;
    student_id: string;
    full_name: string;
    faculty?: string;
    department?: string;
    degree?: string;
    internship_type?: 'mbchb' | 'other' | string;
    internship_type_other?: string;
    internship_type_display?: string;
    host_organization?: string;
    supervisor_name?: string;
    supervisor_contact?: string;
    internship_start_date?: string;
    internship_end_date?: string;
    request_date?: string;
    state: 'submitted' | 'approved' | 'collected' | 'rejected' | 'cancelled';
    rejection_reason?: string;
}
