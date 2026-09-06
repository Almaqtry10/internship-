import React, { useEffect, useState } from 'react';
import { internshipApi } from '../api';
import { notify } from '../notify';
import {
    StaffTabs,
    StaffTableCard,
    StaffSearchBar,
    filterRequestsBySearch,
    formatStaffDate,
} from '../StaffPortal';
import RequestModal from './RequestModal';
import StaffArchiveReports from './StaffArchiveReports';
import type { InternshipRequest, InternshipRole } from '../types';

const STATE_LABELS: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Ready for Collection',
    collected: 'Collected',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

const STATE_CLASS: Record<string, string> = {
    draft: 'staff-type-pill',
    submitted: 'status-pill pill-submitted',
    approved: 'status-pill pill-approved',
    collected: 'status-pill pill-collected',
    rejected: 'status-pill pill-rejected',
    cancelled: 'status-pill pill-submitted',
};

function roleMeta(role: InternshipRole) {
    if (role === 'admin') {
        return {
            roleLabel: 'Administrator',
            title: 'Internship Administration',
            description:
                'Overview all requests, process submissions, and mark certificates collected.',
            canProcess: true,
            defaultTab: 'overview',
            tabs: [
                { id: 'overview', label: 'Overview (All Requests)' },
                { id: 'submitted', label: 'Submitted (Processing)' },
                { id: 'approved', label: 'Ready for Collection' },
                { id: 'archive', label: 'Archive & Reports' },
            ],
        };
    }
    if (role === 'registrar_office' || role === 'general_registrar' || role === 'chief_registrar') {
        return {
            roleLabel:
                role === 'registrar_office' ? 'Registrar Office'
                    : role === 'general_registrar' ? 'General Registrar'
                        : 'Chief Registrar',
            title: 'Internship Completion Processing',
            description:
                'Review submitted requests, mark certificates ready for collection, and mark them collected at the desk.',
            canProcess: true,
            defaultTab: 'submitted',
            tabs: [
                { id: 'overview', label: 'Overview (All Requests)' },
                { id: 'submitted', label: 'Submitted (Processing)' },
                { id: 'approved', label: 'Ready for Collection' },
                { id: 'archive', label: 'Archive & Reports' },
            ],
        };
    }
    return {
        roleLabel: 'Dean',
        title: 'Internship Completion Tracking',
        description:
            'Monitor all completion requests and the ready-for-collection queue. Processing is handled by Chief Registrar and Registrar Office.',
        canProcess: false,
        defaultTab: 'overview',
        tabs: [
            { id: 'overview', label: 'Overview (All Requests)' },
            { id: 'approved', label: 'Ready for Collection' },
            { id: 'archive', label: 'Archive & Reports' },
        ],
    };
}

export default function ChiefDashboard({
    role,
}: {
    role: InternshipRole;
}) {
    const meta = roleMeta(role);
    const [requests, setRequests] = useState<InternshipRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(meta.defaultTab);
    const [search, setSearch] = useState('');
    const [archiveFilter, setArchiveFilter] = useState<'collected' | 'rejected'>('collected');
    const [selectedReq, setSelectedReq] = useState<InternshipRequest | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await internshipApi.listRequests();
            setRequests(result?.data || []);
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Could not load requests.');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    useEffect(() => {
        setActiveTab(meta.defaultTab);
    }, [role, meta.defaultTab]);

    const handleAction = async (
        id: number,
        action: 'approve' | 'reject' | 'collect',
        reason = '',
    ) => {
        if (!meta.canProcess) {
            notify.error('Only Administrator or Registrar Office can process requests.');
            return;
        }
        try {
            await internshipApi.performAction(id, action, reason);
            const messages = {
                approve: 'Approved — ready for collection.',
                reject: 'Request rejected.',
                collect: 'Marked as collected.',
            };
            notify.success(messages[action]);
            setSelectedReq(null);
            await loadData();
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Action failed.');
        }
    };

    const tabRequests =
        activeTab === 'archive'
            ? requests.filter((r) => r.state === archiveFilter)
            : activeTab === 'overview'
              ? requests.filter((r) => r.state !== 'cancelled')
              : requests.filter((r) => r.state === activeTab);
    const filtered = filterRequestsBySearch(tabRequests, search);
    const currentTabLabel =
        activeTab === 'archive'
            ? archiveFilter === 'collected'
                ? 'Collected Archive'
                : 'Rejected Archive'
            : activeTab === 'overview'
              ? 'Overview (All Requests)'
              : activeTab === 'approved'
                ? 'Ready for Collection'
                : 'Submitted (Processing)';

    const actionButtonLabel = (req: InternshipRequest) => {
        if (meta.canProcess && req.state === 'submitted') return 'Review';
        if (meta.canProcess && req.state === 'approved') return 'Collect';
        return 'View';
    };

    return (
        <>
            <StaffTabs tabs={meta.tabs} activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === 'archive' && <StaffArchiveReports requests={requests} />}

            <StaffSearchBar
                value={search}
                onChange={setSearch}
                resultCount={filtered.length}
                totalCount={tabRequests.length}
            />

            {activeTab === 'archive' && (
                <div className="staff-report-presets" style={{ marginBottom: 16 }}>
                    <button
                        type="button"
                        className={archiveFilter === 'collected' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setArchiveFilter('collected')}
                    >
                        Collected
                    </button>
                    <button
                        type="button"
                        className={archiveFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setArchiveFilter('rejected')}
                    >
                        Rejected
                    </button>
                </div>
            )}

            <StaffTableCard title={currentTabLabel} count={filtered.length}>
                <div className="table-container">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--portal-text-muted)' }}>
                            Loading...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div
                            style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: 'var(--portal-text-muted)',
                                fontStyle: 'italic',
                                fontSize: '0.95rem',
                            }}
                        >
                            No applications found.
                        </div>
                    ) : (
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '12%' }}>STUDENT ID</th>
                                    <th style={{ width: '20%' }}>NAME</th>
                                    <th style={{ width: '14%' }}>TYPE</th>
                                    <th style={{ width: '12%' }}>DATE</th>
                                    <th style={{ width: '18%' }}>INTERNSHIP PERIOD</th>
                                    <th style={{ width: '10%' }}>STATUS</th>
                                    <th style={{ width: '14%', textAlign: 'right' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((req) => (
                                    <tr key={req.id}>
                                        <td style={{ fontWeight: 600 }}>{req.student_id}</td>
                                        <td>{req.full_name}</td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {req.internship_type_display
                                                || (req.internship_type === 'mbchb' ? 'MBChB Internship' : req.internship_type_other)
                                                || '—'}
                                        </td>
                                        <td>{formatStaffDate(req.request_date)}</td>
                                        <td style={{ fontSize: '0.85rem', color: 'var(--portal-text-muted)' }}>
                                            {req.internship_start_date} &rarr; {req.internship_end_date}
                                        </td>
                                        <td>
                                            <span className={STATE_CLASS[req.state] || 'staff-type-pill'}>
                                                {STATE_LABELS[req.state] || req.state}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className={
                                                    meta.canProcess && (req.state === 'submitted' || req.state === 'approved')
                                                        ? 'btn-primary'
                                                        : 'btn-secondary'
                                                }
                                                style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                                                onClick={() => setSelectedReq(req)}
                                            >
                                                {actionButtonLabel(req)}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </StaffTableCard>

            {selectedReq && (
                <RequestModal
                    req={selectedReq}
                    canProcess={meta.canProcess}
                    onClose={() => setSelectedReq(null)}
                    onApprove={(id) => handleAction(id, 'approve')}
                    onReject={(id, reason) => handleAction(id, 'reject', reason)}
                    onCollect={(id) => handleAction(id, 'collect')}
                />
            )}
        </>
    );
}
