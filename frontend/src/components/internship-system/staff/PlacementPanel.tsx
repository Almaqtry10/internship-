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
import PlacementRequestModal from './PlacementRequestModal';
import type { InternshipPlacementRequest, InternshipRole } from '../types';

const STATE_LABELS: Record<string, string> = {
    submitted: 'Submitted',
    approved: 'Ready for Collection',
    collected: 'Collected',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

const STATE_CLASS: Record<string, string> = {
    submitted: 'status-pill pill-submitted',
    approved: 'status-pill pill-approved',
    collected: 'status-pill pill-collected',
    rejected: 'status-pill pill-rejected',
    cancelled: 'status-pill pill-submitted',
};

const TABS = [
    { id: 'overview', label: 'Overview (All Requests)' },
    { id: 'submitted', label: 'Pending Review' },
    { id: 'approved', label: 'Ready for Collection' },
    { id: 'collected', label: 'Collected' },
    { id: 'archive', label: 'Rejected' },
];

export default function PlacementPanel({ role }: { role: InternshipRole }) {
    const canApprove = role === 'dean' || role === 'admin';
    const canCollect = role === 'dean' || role === 'admin';
    const [requests, setRequests] = useState<InternshipPlacementRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [search, setSearch] = useState('');
    const [selectedReq, setSelectedReq] = useState<InternshipPlacementRequest | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await internshipApi.listPlacementRequests();
            setRequests(result?.data || []);
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Could not load internship requests.');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const handleAction = async (id: number, action: 'approve' | 'reject' | 'collect', reason = '') => {
        try {
            await internshipApi.performPlacementAction(id, action, reason);
            const messages = {
                approve: 'Internship request approved.',
                reject: 'Internship request rejected.',
                collect: 'Letter of Internship marked as collected.',
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
            ? requests.filter((r) => r.state === 'rejected')
            : activeTab === 'overview'
              ? requests.filter((r) => r.state !== 'cancelled')
              : requests.filter((r) => r.state === activeTab);
    const filtered = filterRequestsBySearch(tabRequests, search);
    const currentTabLabel = TABS.find((t) => t.id === activeTab)?.label || 'Requests';

    const actionButtonLabel = (req: InternshipPlacementRequest) => {
        if (canApprove && req.state === 'submitted') return 'Review';
        if (canCollect && req.state === 'approved') return 'Collect';
        return 'View';
    };

    return (
        <>
            <StaffTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            <StaffSearchBar
                value={search}
                onChange={setSearch}
                resultCount={filtered.length}
                totalCount={tabRequests.length}
            />

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
                            No internship requests found.
                        </div>
                    ) : (
                        <table className="enterprise-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '12%' }}>STUDENT ID</th>
                                    <th style={{ width: '18%' }}>NAME</th>
                                    <th style={{ width: '14%' }}>TYPE</th>
                                    <th style={{ width: '16%' }}>HOST ORGANIZATION</th>
                                    <th style={{ width: '12%' }}>DATE</th>
                                    <th style={{ width: '10%' }}>STATUS</th>
                                    <th style={{ width: '18%', textAlign: 'right' }}>ACTION</th>
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
                                        <td style={{ fontSize: '0.85rem' }}>{req.host_organization || '—'}</td>
                                        <td>{formatStaffDate(req.request_date)}</td>
                                        <td>
                                            <span className={STATE_CLASS[req.state] || 'staff-type-pill'}>
                                                {STATE_LABELS[req.state] || req.state}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className={
                                                    (canApprove && req.state === 'submitted') || (canCollect && req.state === 'approved')
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
                <PlacementRequestModal
                    req={selectedReq}
                    canApprove={canApprove}
                    canCollect={canCollect}
                    onClose={() => setSelectedReq(null)}
                    onApprove={(id) => handleAction(id, 'approve')}
                    onReject={(id, reason) => handleAction(id, 'reject', reason)}
                    onCollect={(id) => handleAction(id, 'collect')}
                />
            )}
        </>
    );
}
