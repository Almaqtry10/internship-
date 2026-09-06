import React, { useMemo, useState } from 'react';
import { notify } from '../notify';
import { openApprovedListPrint, openSummaryReportPrint } from '../shared/printEngine';
import type { InternshipRequest } from '../types';

function inDateRange(requestDate: string | undefined, from: string, to: string) {
    if (!requestDate) return !from && !to;
    if (from && requestDate < from) return false;
    if (to && requestDate > to) return false;
    return true;
}

export default function StaffArchiveReports({ requests }: { requests: InternshipRequest[] }) {
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [printBusy, setPrintBusy] = useState('');

    const applyPreset = (offset: number) => {
        const d = new Date();
        d.setMonth(d.getMonth() + offset);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const fm = String(m).padStart(2, '0');
        setFrom(`${y}-${fm}-01`);
        setTo(`${y}-${fm}-${new Date(y, m, 0).getDate()}`);
    };

    const filtered = useMemo(
        () => requests.filter((r) => inDateRange(r.request_date, from, to)),
        [requests, from, to],
    );

    const total = filtered.length;
    const open = filtered.filter((r) => r.state === 'submitted').length;
    const ready = filtered.filter((r) => r.state === 'approved').length;
    const collected = filtered.filter((r) => r.state === 'collected').length;
    const rejected = filtered.filter((r) => r.state === 'rejected').length;
    const completed = ready + collected;
    const approvalRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const handlePrintSummary = async () => {
        setPrintBusy('summary');
        try {
            await openSummaryReportPrint(
                { total, open, approved: completed, rejected, approvalRate },
                { from, to, printedOn: new Date().toLocaleString() },
            );
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Could not open summary report.');
        } finally {
            setPrintBusy('');
        }
    };

    const handlePrintApproved = async () => {
        const readyList = filtered.filter((r) => r.state === 'approved' || r.state === 'collected');
        if (!readyList.length) {
            notify.warning('No ready/collected requests match the selected filters.');
            return;
        }
        setPrintBusy('approved');
        try {
            await openApprovedListPrint(readyList, {
                from,
                to,
                printedOn: new Date().toLocaleString(),
            });
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Could not open approved report.');
        } finally {
            setPrintBusy('');
        }
    };

    return (
        <div className="staff-reports-layout" style={{ marginBottom: 20 }}>
            <div className="staff-report-toolbar">
                <div className="staff-report-toolbar-copy">
                    <h3>Internship Reporting</h3>
                    <p>Processing queue, ready-for-collection, and collection outcomes.</p>
                </div>
                <div className="staff-report-filters">
                    <label className="staff-report-filter">
                        <span>From</span>
                        <input type="date" className="staff-report-select" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="staff-report-filter">
                        <span>To</span>
                        <input type="date" className="staff-report-select" value={to} onChange={(e) => setTo(e.target.value)} />
                    </label>
                    <div className="staff-report-presets">
                        <button type="button" className="btn-secondary staff-report-preset-btn" onClick={() => applyPreset(0)}>This month</button>
                        <button type="button" className="btn-secondary staff-report-preset-btn" onClick={() => applyPreset(-1)}>Last month</button>
                    </div>
                </div>
            </div>

            <div className="staff-report-print-bar">
                <button type="button" className="btn-primary" onClick={handlePrintApproved} disabled={!!printBusy}>
                    {printBusy === 'approved' ? 'Preparing...' : 'Print Ready / Collected'}
                </button>
                <button type="button" className="btn-secondary" onClick={handlePrintSummary} disabled={!!printBusy}>
                    {printBusy === 'summary' ? 'Preparing...' : 'Print Summary'}
                </button>
            </div>

            <div className="staff-report-kpis">
                <div className="staff-report-kpi staff-report-kpi--hero">
                    <p>Total in Filter</p>
                    <strong>{total}</strong>
                </div>
                <div className="staff-report-kpi">
                    <p>Processing</p>
                    <strong>{open}</strong>
                </div>
                <div className="staff-report-kpi tone-success">
                    <p>Ready for Collection</p>
                    <strong>{ready}</strong>
                </div>
                <div className="staff-report-kpi tone-success">
                    <p>Collected</p>
                    <strong>{collected}</strong>
                </div>
                <div className="staff-report-kpi tone-danger">
                    <p>Rejected</p>
                    <strong>{rejected}</strong>
                </div>
            </div>
        </div>
    );
}
