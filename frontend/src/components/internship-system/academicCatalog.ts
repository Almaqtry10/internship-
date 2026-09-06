/** Shared academic catalog — mirrors backend/models/academic_catalog.py (BU Clearance / bu.edu.so). */

export const BACHELOR_FACULTIES = [
    'Faculty of Medicine and Surgery',
    'Faculty of Dentistry',
    'Faculty of Health Science',
    'Faculty of Computer Science and IT',
    'Faculty of Engineering and Technology',
    'Faculty of Agriculture',
    'Faculty of Veterinary Science',
    'Faculty of Geoscience and Environment',
    'Faculty of Marine Science and Nautical Studies',
    'Faculty of Sharia and Law',
    'Faculty of Economics and Management',
    'Faculty of Education',
    'Faculty of Social Science',
];

export const POSTGRADUATE_SCHOOL = 'School of Postgraduate Studies and Research Center';

export const MASTER_PROGRAMS = [
    'Master of General Surgery',
    'Master of Internal Medicine',
    'Master of Public Health',
    'Master of Public Health in Nutrition',
    'Master of Medical Laboratory',
    'Master of Tropical and Infectious Diseases',
    'Master of Medicine in Pediatrics and Child Health',
    'Master of Medicine in Obstetrics and Gynecology',
    'Master of Business Administration (MBA)',
    'Master of Accounting and Finance',
    'Master of Banking and Finance',
    'Master of Economics',
    'Master of Project Management',
    'Master of Procurement and Logistics',
    'Master of Applied Statistics and Research Methodology',
    'Master of Public Administration',
    'Master of Political Science & International Relations',
    'Master of Public Law',
];

export const PHD_PROGRAMS = [
    'PhD in Law in Private Law',
    'PhD in Principles of Jurisprudence',
    'PhD in Legitimate Policy',
    'PhD in Hadith and Its Sciences',
    'PhD in Quranic Interpretation',
    'PhD in Islamic Belief and Thought',
    'PhD in Prophetic Biography',
    'PhD in Jurisprudence',
    'PhD in Interpretation and Quranic Sciences',
    'PhD in Prophetic Biography and Islamic Propagation',
];

export function isPostgraduateDegree(degree: string) {
    const d = String(degree || '');
    return d === 'Master' || d === 'PhD' || d.toLowerCase().startsWith('phd');
}

export function stripProgramPrefix(value: string) {
    return String(value || '')
        .replace(/^Master of\s+/i, '')
        .replace(/^PhD in\s+/i, '')
        .trim();
}

export function facultyLabel(degree: string, faculty?: string) {
    if (isPostgraduateDegree(degree)) return POSTGRADUATE_SCHOOL;
    return faculty || '';
}

export function departmentLabel(degree: string, department?: string, masterProgram?: string) {
    if (isPostgraduateDegree(degree)) {
        return stripProgramPrefix(masterProgram || department || '') || '—';
    }
    return department || '—';
}
