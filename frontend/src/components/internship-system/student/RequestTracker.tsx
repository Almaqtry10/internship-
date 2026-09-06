import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarDays, FileCheck, User } from 'lucide-react';
import { internshipApi } from '../api';
import { notify } from '../notify';
import type { TrackedRequest } from '../types';

const COMPLETION_STEPS = ['Submitted', 'Under Review', 'Ready for Collection', 'Collected'];

function getCompletionStepIndex(state: string): number {
    if (state === 'collected') return 3;
    if (state === 'approved') return 2;
    if (state === 'submitted') return 1;
    return 0;
}

function getPillClass(state: string): string {
    const map: Record<string, string> = {
        approved: 'pill-approved',
        collected: 'pill-collected',
        submitted: 'pill-submitted',
        rejected: 'pill-rejected',
        cancelled: 'pill-submitted',
    };
    return map[state] || 'pill-submitted';
}

function getPillLabel(kind: 'placement' | 'completion', state: string): string {
    if (kind === 'completion') {
        const map: Record<string, string> = {
            submitted: 'Submitted',
            approved: 'Ready for Collection',
            collected: 'Collected',
            rejected: 'Rejected',
            cancelled: 'Cancelled',
        };
        return map[state] || state;
    }
    const map: Record<string, string> = {
        submitted: 'Submitted',
        approved: 'Ready for Collection',
        collected: 'Collected',
        rejected: 'Rejected',
        cancelled: 'Cancelled',
    };
    return map[state] || state;
}

export default function RequestTracker({ onBack }: { onBack: () => void }) {
    const [requests, setRequests] = useState<TrackedRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const result = await internshipApi.trackRequests();
                setRequests(Array.isArray(result?.data) ? result.data : []);
            } catch (err) {
                notify.error(err instanceof Error ? err.message : 'Could not load requests.');
                setRequests([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="tracker-layout">
            <div style={{ marginBottom: '10px' }}>
                <button type="button" onClick={onBack} className="student-back-btn">
                    <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Dashboard
                </button>
            </div>

            {loading && (
                <div className="card-section" style={{ padding: '32px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--portal-text-muted)' }}>Loading your requests&hellip;</p>
                </div>
            )}

            {!loading && requests.length === 0 && (
                <div className="card-section" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <FileCheck size={40} style={{ opacity: 0.25, marginBottom: '12px' }} />
                    <p style={{ fontWeight: 600, marginBottom: '6px' }}>No requests yet</p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--portal-text-muted)' }}>
                        Go back and submit a New Internship Request or a New Completion Request.
                    </p>
                </div>
            )}

            {!loading && requests.map((req) => {
                const isCompletion = req.request_kind === 'completion';
                const isRejected = req.state === 'rejected';
                const currentIndex = isRejected ? -1 : getCompletionStepIndex(req.state);

                return (
                    <div key={`${req.request_kind}-${req.id}`} className="wizard-card">
                        <div className="wizard-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                    {isCompletion ? 'Internship Completion Request' : 'New Internship Request'}
                                </h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--portal-text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <span><User size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{req.student_id}</span>
                                    {req.request_date && <span><CalendarDays size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{req.request_date}</span>}
                                </p>
                            </div>
                            <span className={`status-pill ${getPillClass(req.state)}`}>
                                {getPillLabel(req.request_kind, req.state)}
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', padding: '10px 0', borderTop: '1px solid var(--portal-border)', borderBottom: '1px solid var(--portal-border)', margin: '12px 0', fontSize: '0.85rem', color: 'var(--portal-text-muted)', flexWrap: 'wrap' }}>
                            <span><strong>Type:</strong> {req.internship_type_display || (req.internship_type === 'mbchb' ? 'MBChB Internship' : req.internship_type_other) || '—'}</span>
                            {!isCompletion && req.host_organization && (
                                <span><Building2 size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} /><strong>Host:</strong> {req.host_organization}</span>
                            )}
                            {req.internship_start_date && <span><strong>Start:</strong> {req.internship_start_date}</span>}
                            {req.internship_end_date && <span><strong>End:</strong> {req.internship_end_date}</span>}
                        </div>

                        {isCompletion && !isRejected && (
                            <div className="stepper" style={{ marginTop: '16px' }}>
                                {COMPLETION_STEPS.map((label, index) => (
                                    <div key={label} className={`step ${index <= currentIndex ? 'completed' : ''}`}>
                                        <div className="step-circle">{index + 1}</div>
                                        <div className="step-label">{label}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {req.state === 'approved' && (
                            <div className="notice-box notice-success" style={{ marginTop: '16px' }}>
                                <h4 style={{ margin: '0 0 6px' }}>Ready for Collection</h4>
                                <p className="notice-text success" style={{ margin: 0 }}>
                                    {isCompletion
                                        ? 'Your internship completion certificate is ready. Please visit the Registrar Office desk to collect it with your Student ID.'
                                        : 'Your internship request has been approved. Your Letter of Internship is ready — visit the Registrar Office desk to collect it as evidence for your host organization. Once your internship is finished, you can submit a Completion Request for your certificate.'}
                                </p>
                            </div>
                        )}

                        {req.state === 'collected' && (
                            <div className="notice-box notice-success" style={{ marginTop: '16px' }}>
                                <h4 style={{ margin: '0 0 6px' }}>{isCompletion ? 'Certificate Collected' : 'Letter of Internship Collected'}</h4>
                                <p className="notice-text success" style={{ margin: 0 }}>
                                    {isCompletion
                                        ? 'Your internship completion certificate has been collected.'
                                        : 'Your Letter of Internship has been collected. Once your internship is finished, you can submit a Completion Request for your certificate.'}
                                </p>
                            </div>
                        )}

                        {isRejected && (
                            <div className="notice-box notice-danger" style={{ marginTop: '16px' }}>
                                <h4 style={{ margin: '0 0 8px' }}>Request Rejected</h4>
                                <p className="notice-text" style={{ margin: 0 }}>
                                    {req.rejection_reason
                                        ? <><strong>Reason:</strong> {req.rejection_reason}</>
                                        : "Please contact the Registrar's office for more information."}
                                </p>
                            </div>
                        )}

                        {req.state === 'submitted' && (
                            <div className="notice-box notice-neutral" style={{ marginTop: '16px' }}>
                                <p className="notice-text muted" style={{ margin: 0 }}>
                                    Your request is under review by the Registrar's office. You will be notified once a decision is made.
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
