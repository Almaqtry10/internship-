import React, { useState } from 'react';
import { X } from 'lucide-react';
import { notify } from '../notify';
import type { InternshipPlacementRequest } from '../types';

export default function PlacementRequestModal({
    req,
    onClose,
    onApprove,
    onReject,
    onCollect,
    canApprove = false,
    canCollect = false,
}: {
    req: InternshipPlacementRequest;
    onClose: () => void;
    onApprove: (id: number) => void | Promise<void>;
    onReject: (id: number, reason: string) => void | Promise<void>;
    onCollect: (id: number) => void | Promise<void>;
    canApprove?: boolean;
    canCollect?: boolean;
}) {
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const showReviewActions = canApprove && req.state === 'submitted';
    const showCollectActions = canCollect && req.state === 'approved';

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            notify.warning('Please enter a rejection reason.');
            return;
        }
        setSubmitting(true);
        try {
            await onReject(req.id, rejectReason);
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        const ok = await notify.confirm(
            'Approve this internship request? The Letter of Internship will become ready for the student to collect.',
            { title: 'Approve Internship Request', confirmLabel: 'Approve' },
        );
        if (!ok) return;
        setSubmitting(true);
        try {
            await onApprove(req.id);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCollect = async () => {
        const ok = await notify.confirm(
            'Confirm the student collected their Letter of Internship?',
            { title: 'Mark as Collected', confirmLabel: 'Yes, Collected' },
        );
        if (!ok) return;
        setSubmitting(true);
        try {
            await onCollect(req.id);
        } finally {
            setSubmitting(false);
        }
    };

    const statusLabel =
        req.state === 'approved'
            ? 'Ready for Collection'
            : req.state
                ? req.state.charAt(0).toUpperCase() + req.state.slice(1)
                : '—';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: 780, width: '95vw', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        Internship Request: {req.student_id}
                    </h3>
                    <button type="button" onClick={onClose} className="close-btn"><X size={16} /></button>
                </div>

                {showReviewActions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--portal-border)', background: 'var(--portal-hover, #f8fafc)' }}>
                        <input
                            type="text"
                            placeholder="Reject reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            disabled={submitting}
                            style={{
                                flex: 1,
                                padding: '8px 14px',
                                border: '1px solid var(--portal-border)',
                                borderRadius: 6,
                                fontSize: '0.9rem',
                                background: 'var(--portal-surface, #fff)',
                                outline: 'none',
                            }}
                        />
                        <button type="button" className="btn-danger" onClick={handleReject} disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
                            {submitting ? '...' : 'Reject'}
                        </button>
                        <button type="button" className="btn-primary" onClick={handleApprove} disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
                            {submitting ? 'Processing...' : 'Approve'}
                        </button>
                    </div>
                )}

                {showCollectActions && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, padding: '10px 20px', borderBottom: '1px solid var(--portal-border)', background: 'var(--portal-hover, #f8fafc)' }}>
                        <button type="button" className="btn-primary" onClick={handleCollect} disabled={submitting} style={{ whiteSpace: 'nowrap' }}>
                            {submitting ? 'Processing...' : 'Mark as Collected'}
                        </button>
                    </div>
                )}

                <div className="modal-body" style={{ padding: '0 24px' }}>
                    {[
                        { label: 'Full Name', value: req.full_name || '—' },
                        { label: 'Student ID', value: req.student_id || '—' },
                        { label: 'Faculty / School', value: req.faculty || '—' },
                        { label: 'Department', value: req.department || '—' },
                        { label: 'Degree', value: req.degree || '—' },
                        { label: 'Internship Type', value: req.internship_type_display || (req.internship_type === 'mbchb' ? 'MBChB Internship' : req.internship_type_other) || '—' },
                        { label: 'Host Organization', value: req.host_organization || '—' },
                        { label: 'Supervisor Name', value: req.supervisor_name || '—' },
                        { label: 'Supervisor Contact', value: req.supervisor_contact || '—' },
                        { label: 'Internship Period', value: req.internship_start_date && req.internship_end_date ? `${req.internship_start_date} → ${req.internship_end_date}` : '—' },
                        { label: 'Request Date', value: req.request_date || '—' },
                        { label: 'Status', value: statusLabel },
                        ...(req.rejection_reason
                            ? [{ label: 'Rejection Reason', value: req.rejection_reason }]
                            : []),
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 0, padding: '10px 0', borderBottom: '1px solid var(--portal-border)' }}>
                            <div style={{ minWidth: 160, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--portal-primary)', flexShrink: 0 }}>{label}</div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--portal-text)', fontWeight: 400 }}>{value}</div>
                        </div>
                    ))}
                </div>
                <div style={{ height: 20 }} />
            </div>
        </div>
    );
}
