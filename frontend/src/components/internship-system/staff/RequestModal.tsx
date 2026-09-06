import React, { useEffect, useState } from 'react';
import { X, Eye, Check, Download } from 'lucide-react';
import { downloadInternshipDoc, fetchInternshipDocBlob, isPdfBlob } from '../documentUtils';
import { notify } from '../notify';
import type { InternshipRequest } from '../types';

type FullScreenDoc = {
    objectUrl: string;
    filename: string;
    isPdf: boolean;
};

export default function RequestModal({
    req,
    onClose,
    onApprove,
    onReject,
    onCollect,
    canProcess = false,
}: {
    req: InternshipRequest;
    onClose: () => void;
    onApprove: (id: number) => void | Promise<void>;
    onReject: (id: number, reason: string) => void | Promise<void>;
    onCollect?: (id: number) => void | Promise<void>;
    canProcess?: boolean;
}) {
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [openingDoc, setOpeningDoc] = useState(false);
    const [fullScreenDoc, setFullScreenDoc] = useState<FullScreenDoc | null>(null);

    useEffect(() => () => {
        if (fullScreenDoc?.objectUrl) URL.revokeObjectURL(fullScreenDoc.objectUrl);
    }, [fullScreenDoc]);

    const closeDocument = () => {
        setFullScreenDoc((prev) => {
            if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
            return null;
        });
    };

    const openDocument = async () => {
        const filename = req.certificate_filename || 'Internship Certificate.pdf';
        setOpeningDoc(true);
        try {
            const blob = await fetchInternshipDocBlob(req.id, filename);
            if (!blob) {
                notify.error('Could not open this document.');
                return;
            }
            const objectUrl = URL.createObjectURL(blob);
            setFullScreenDoc((prev) => {
                if (prev?.objectUrl) URL.revokeObjectURL(prev.objectUrl);
                return {
                    objectUrl,
                    filename,
                    isPdf: isPdfBlob(blob, filename),
                };
            });
        } catch {
            notify.error('Could not open this document.');
        } finally {
            setOpeningDoc(false);
        }
    };

    const handleDownload = () => {
        downloadInternshipDoc(req.id, req.certificate_filename || 'Internship Certificate.pdf');
    };

    const showReviewActions = canProcess && req.state === 'submitted';
    const showCollectActions = canProcess && req.state === 'approved' && Boolean(onCollect);

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
            'Approve this request? The certificate will become ready for collection.',
            { title: 'Approve — Ready for Collection', confirmLabel: 'Approve' },
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
        if (!onCollect) return;
        const ok = await notify.confirm(
            'Confirm the student collected the internship completion certificate?',
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
            : req.state === 'collected'
              ? 'Collected'
              : req.state
                ? req.state.charAt(0).toUpperCase() + req.state.slice(1)
                : '—';

    return (
        <>
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: 980, width: '95vw', maxHeight: '92vh', overflowY: 'auto', padding: 0 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px' }}>
                    <h3 className="request-modal-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                        Internship Details: {req.student_id}
                        <span style={{ opacity: 0.5, fontWeight: 300, fontSize: '0.9rem' }}>|</span>
                        <span className="request-modal-subtitle" style={{ fontWeight: 400, opacity: 0.85, fontSize: '0.9rem' }}>Completion Certificate</span>
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
                            {submitting ? 'Processing...' : 'Approve & Ready'}
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

                <div className="modal-body" style={{ padding: 0 }}>
                    <div className="odoo-form-sheet" style={{ borderRadius: 0, boxShadow: 'none' }}>
                        <div className="odoo-form-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '20px 24px', borderBottom: '1px solid var(--portal-border)' }}>
                            <div style={{ width: 80, height: 80, borderRadius: 8, background: '#e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aab4be" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--portal-primary)', textTransform: 'uppercase' }}>Full Name</p>
                                <h1 className="request-hero-name" style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--portal-text)' }}>{req.full_name}</h1>
                                <p style={{ margin: '0 0 2px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--portal-primary)', textTransform: 'uppercase' }}>Student ID</p>
                                <h3 className="request-hero-id" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--portal-primary)' }}>{req.student_id}</h3>
                            </div>
                        </div>

                        <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                            {[
                                { label: 'Application Type', value: 'Internship Completion' },
                                { label: 'Internship Type', value: req.internship_type_display || (req.internship_type === 'mbchb' ? 'MBChB Internship' : req.internship_type_other) || '—' },
                                { label: 'Degree', value: req.degree || '—' },
                                { label: 'Request Date', value: req.request_date || '—' },
                                { label: 'Faculty / School', value: req.faculty || '—' },
                                { label: 'DOB', value: req.dob || '—' },
                                { label: 'Enrolled Date', value: req.enrolled_date || '—' },
                                { label: 'Place of Birth', value: req.place_of_birth || '—' },
                                { label: 'Graduated Date', value: req.graduated_date || '—' },
                                { label: 'Department', value: req.department || req.master_program || '—' },
                                { label: 'Internship Period', value: req.internship_start_date && req.internship_end_date ? `${req.internship_start_date} → ${req.internship_end_date}` : '—' },
                                { label: 'Status', value: statusLabel },
                                ...(req.collected_date
                                    ? [{ label: 'Collected Date', value: req.collected_date }]
                                    : []),
                                ...(req.is_transfer_student
                                    ? [
                                          { label: 'Transfer Status', value: 'Transferred Student' },
                                          { label: 'Previous University', value: req.transferred_university || '—' },
                                      ]
                                    : []),
                                ...(req.rejection_reason
                                    ? [{ label: 'Rejection Reason', value: req.rejection_reason }]
                                    : []),
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 0, padding: '10px 0', borderBottom: '1px solid var(--portal-border)', paddingRight: 32 }}>
                                    <div style={{ minWidth: 140, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--portal-primary)', flexShrink: 0 }}>{label}</div>
                                    <div style={{ fontSize: '0.95rem', color: 'var(--portal-text)', fontWeight: 400 }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {req.has_certificate ? (
                            <div style={{ padding: '16px 24px 24px' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--portal-text-muted)' }}>
                                    Attached Documents
                                </h4>
                                <div className="document-card" style={{ maxWidth: 280 }}>
                                    <div className="document-card-icon"><Check size={14} /></div>
                                    <h5>{req.certificate_filename || 'Internship Certificate'}</h5>
                                    <div className="document-action" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={openDocument}
                                            className="btn-secondary document-action-btn"
                                            disabled={openingDoc}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Eye size={14} /> {openingDoc ? 'Opening…' : 'View'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDownload}
                                            className="btn-secondary document-action-btn"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <Download size={14} /> Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '12px 24px 20px' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--portal-text-muted)', fontStyle: 'italic', margin: 0 }}>
                                    No certificate file was attached to this request.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {fullScreenDoc && (
            <div className="doc-lightbox" onClick={closeDocument}>
                <button type="button" onClick={closeDocument} className="doc-lightbox-close">
                    <X size={20} />
                </button>
                <div className="doc-lightbox-body" onClick={(e) => e.stopPropagation()}>
                    {fullScreenDoc.isPdf ? (
                        <iframe
                            title={fullScreenDoc.filename}
                            src={fullScreenDoc.objectUrl}
                            className="doc-lightbox-frame"
                        />
                    ) : (
                        <img
                            src={fullScreenDoc.objectUrl}
                            alt={fullScreenDoc.filename}
                            className="doc-lightbox-image"
                        />
                    )}
                </div>
            </div>
        )}
        </>
    );
}
