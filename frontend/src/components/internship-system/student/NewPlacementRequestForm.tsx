import React, { useEffect, useState } from 'react';
import { internshipApi } from '../api';
import { notify } from '../notify';
import type { StudentProfile } from '../types';

export default function NewPlacementRequestForm({
    onSubmitted,
    onBack,
}: {
    onSubmitted: () => void;
    onBack: () => void;
}) {
    const [formData, setFormData] = useState({
        internship_type: '' as '' | 'mbchb' | 'other',
        internship_type_other: '',
        host_organization: '',
        supervisor_name: '',
        supervisor_contact: '',
        internship_start_date: '',
        internship_end_date: '',
    });
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        internshipApi.getStudentProfile().then((result) => {
            const data = result?.data;
            if (data) setProfile(data);
        }).catch(() => {
            setError('Failed to load profile data.');
        }).finally(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'internship_type' && value !== 'other' ? { internship_type_other: '' } : {}),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.internship_type) {
            setError('Please choose an internship type.');
            return;
        }
        if (formData.internship_type === 'other' && !formData.internship_type_other.trim()) {
            setError('Please describe your internship type.');
            return;
        }
        if (!formData.host_organization.trim()) {
            setError('Please provide the host organization for your internship.');
            return;
        }
        if (!formData.internship_start_date || !formData.internship_end_date) {
            setError('Please provide the internship start and end dates.');
            return;
        }

        const ok = await notify.confirm(
            'Are you sure you want to SUBMIT this internship request?',
            { title: 'Submit Request?', confirmLabel: 'Yes, Submit' },
        );
        if (!ok) return;

        setSubmitting(true);
        try {
            await internshipApi.submitPlacementRequest({
                ...formData,
                internship_type_other:
                    formData.internship_type === 'other' ? formData.internship_type_other.trim() : '',
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
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Step 1: Internship Type</h3>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label>Internship Type</label>
                            <select
                                name="internship_type"
                                value={formData.internship_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>
                                    Choose internship type
                                </option>
                                <option value="mbchb">MBChB Internship</option>
                                <option value="other">Other Internship</option>
                            </select>
                            <small style={{ display: 'block', marginTop: 6, color: 'var(--portal-text-muted)' }}>
                                Choose MBChB Internship for Medicine, Dentistry, and Health Science clinical internship.
                                Otherwise choose Other Internship and describe it.
                            </small>
                        </div>
                        {formData.internship_type === 'other' && (
                            <div className="form-group span-2">
                                <label>Describe Internship Type</label>
                                <input
                                    type="text"
                                    name="internship_type_other"
                                    value={formData.internship_type_other}
                                    onChange={handleChange}
                                    placeholder="e.g. Teaching practice, Industrial attachment, Clinical rotation…"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <hr className="step-divider" />
                    <h3 className="step-title">Step 2: Placement Details</h3>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label>Host Organization</label>
                            <input
                                type="text"
                                name="host_organization"
                                value={formData.host_organization}
                                onChange={handleChange}
                                placeholder="Company, hospital, or organization name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Supervisor Name</label>
                            <input
                                type="text"
                                name="supervisor_name"
                                value={formData.supervisor_name}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="form-group">
                            <label>Supervisor Contact</label>
                            <input
                                type="text"
                                name="supervisor_contact"
                                value={formData.supervisor_contact}
                                onChange={handleChange}
                                placeholder="Optional"
                            />
                        </div>
                        <div className="form-group span-2">
                            <label>Internship Start Date</label>
                            <input type="date" name="internship_start_date" value={formData.internship_start_date} onChange={handleChange} required />
                        </div>
                        <div className="form-group span-2">
                            <label>Internship End Date</label>
                            <input type="date" name="internship_end_date" value={formData.internship_end_date} onChange={handleChange} required />
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
