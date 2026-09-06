import React, { useEffect, useState } from 'react';
import { ChevronDown, FileCheck, Upload } from 'lucide-react';
import { internshipApi } from '../api';
import { notify } from '../notify';
import type { StudentProfile } from '../types';

export default function NewRequestForm({
    onSubmitted,
    onBack,
}: {
    onSubmitted: () => void;
    onBack: () => void;
}) {
    const [formData, setFormData] = useState({
        enrolled_date: '',
        graduated_date: '',
        is_transfer_student: false,
        transferred_university: '',
        is_requesting: false,
    });
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [file, setFile] = useState<{ name: string; data: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showRequirements, setShowRequirements] = useState(true);

    useEffect(() => {
        internshipApi.getStudentProfile().then((result) => {
            const data = result?.data;
            if (data) {
                setProfile(data);
                // Prefill enrolled/graduated date only when the university actually has
                // one on record; otherwise leave blank for the student to fill in —
                // never show a fabricated date as if it were real.
                setFormData((prev) => ({
                    ...prev,
                    enrolled_date: data.enrolled_date || prev.enrolled_date,
                    graduated_date: data.graduated_date || prev.graduated_date,
                }));
            }
        }).catch(() => {
            setError('Failed to load profile data.');
        }).finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        const reader = new FileReader();
        reader.onload = (ev) => setFile({ name: selected.name, data: String(ev.target?.result || '') });
        reader.readAsDataURL(selected);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.is_requesting) {
            setError('You must confirm the declaration checkbox before submitting.');
            return;
        }
        if (!file?.data) {
            setError('Please attach a certificate copy before submitting.');
            return;
        }

        const ok = await notify.confirm(
            'Are you sure you want to SUBMIT this internship completion request? Once submitted, it cannot be edited.',
            { title: 'Submit Request?', confirmLabel: 'Yes, Submit' },
        );
        if (!ok) return;

        setSubmitting(true);
        try {
            await internshipApi.submitRequest({
                ...formData,
                certificate_attachment: file?.data,
                certificate_filename: file?.name,
            });
            notify.success('Internship request submitted.');
            onSubmitted();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit request.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="student-form-layout">
                <p style={{ textAlign: 'center', padding: '40px', color: 'var(--portal-text-muted)' }}>
                    Loading profile data...
                </p>
            </div>
        );
    }

    return (
        <div className="student-form-layout">
            <div className="student-form-main">
                <button type="button" onClick={onBack} className="student-back-btn">
                    &larr; Back to Dashboard
                </button>

                <form onSubmit={handleSubmit} className="unified-form-section">
                    {error && <div className="form-banner error">{error}</div>}

                    <div style={{ marginBottom: '20px' }}>
                        <button
                            type="button"
                            onClick={() => setShowRequirements(!showRequirements)}
                            className="requirements-toggle"
                            aria-expanded={showRequirements}
                        >
                            <span>Requirements &amp; Processing Rules</span>
                            <ChevronDown
                                size={18}
                                className={`chevron${showRequirements ? ' open' : ''}`}
                            />
                        </button>
                        {showRequirements && (
                            <div className="requirements-panel">
                                <p>
                                    <strong>Certificate copy:</strong> Please note that the certificate copy is
                                    attached to this form. You must upload it before submitting.
                                </p>
                                <p>
                                    <strong>Processing time:</strong> Letters of Internship Completion are typically
                                    processed within 2–4 working days.
                                </p>
                                <p>
                                    Please note that processing times may be longer during holidays or periods of
                                    high volume.
                                </p>
                            </div>
                        )}
                    </div>

                    <h3 className="step-title">Personal &amp; Academic Information</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Student ID</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.student_id || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>Full Name</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.full_name || ''} />
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" className="readonly-field" readOnly value={profile?.dob || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>Place of Birth</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.place_of_birth || ''} />
                        </div>
                        <div className="form-group">
                            <label>{profile?.degree === 'Master' || profile?.degree === 'PhD' ? 'School' : 'Faculty'}</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.faculty || ''} />
                        </div>
                        <div className="form-group">
                            <label>Department</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.department || profile?.master_program || ''} />
                        </div>
                        <div className="form-group">
                            <label>Degree</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.degree || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>University Enrolled Date</label>
                            <input type="date" name="enrolled_date" value={formData.enrolled_date} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-2">
                            <label>University Graduated Date</label>
                            <input type="date" name="graduated_date" value={formData.graduated_date} onChange={handleChange} required />
                        </div>
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Step 1: Your Approved Internship</h3>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label>Internship Type</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.approved_internship_request?.internship_type_display || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>Host Organization</label>
                            <input type="text" className="readonly-field" readOnly value={profile?.approved_internship_request?.host_organization || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>Internship Start Date</label>
                            <input type="date" className="readonly-field" readOnly value={profile?.approved_internship_request?.internship_start_date || ''} />
                        </div>
                        <div className="form-group span-2">
                            <label>Internship End Date</label>
                            <input type="date" className="readonly-field" readOnly value={profile?.approved_internship_request?.internship_end_date || ''} />
                        </div>
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Step 2: Transfer Details</h3>
                    <div className="form-grid">
                        <div className="form-group checkbox-group span-2">
                            <label>
                                <input type="checkbox" name="is_transfer_student" checked={formData.is_transfer_student} onChange={handleChange} />
                                I am a transfer student
                            </label>
                        </div>
                        {formData.is_transfer_student && (
                            <div className="form-group span-2">
                                <label>Transferred From (University)</label>
                                <input
                                    type="text"
                                    name="transferred_university"
                                    value={formData.transferred_university}
                                    onChange={handleChange}
                                    placeholder="Name of previous university"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Step 3: Upload Certificate</h3>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label>Certificate Document</label>
                            {file ? (
                                <div className="upload-success-bar">
                                    <FileCheck size={18} className="upload-success-icon" />
                                    <span className="upload-success-name">{file.name}</span>
                                    <button type="button" className="upload-remove-btn" onClick={() => setFile(null)}>Remove</button>
                                </div>
                            ) : (
                                <label htmlFor="cert-upload" className="upload-drop-zone">
                                    <Upload size={24} className="upload-drop-icon" />
                                    <span>Click to upload PDF or Image</span>
                                    <small>PDF, JPG, PNG accepted</small>
                                    <input type="file" id="cert-upload" onChange={handleFileChange} accept=".pdf,image/*" required style={{ display: 'none' }} />
                                </label>
                            )}
                        </div>
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Declaration</h3>
                    <div className="form-grid">
                        <div className="form-group checkbox-group span-2">
                            <label>
                                <input type="checkbox" name="is_requesting" checked={formData.is_requesting} onChange={handleChange} />
                                I hereby confirm that I am requesting my Internship Completion Certificate and all information provided is accurate.
                            </label>
                        </div>
                    </div>

                    <div className="form-submit-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn-secondary" onClick={onBack}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
