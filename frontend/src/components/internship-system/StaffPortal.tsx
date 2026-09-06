import React from 'react';
import {
    LogOut,
    Search,
    ShieldCheck,
    X,
} from 'lucide-react';
import { BU_LOGO_DATA_URL } from './brandAssets';

export const formatStaffDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
};

/** Normalize IDs for search (case / spaces / dashes). */
export function normalizeSearchId(value) {
    return String(value || '').toLowerCase().replace(/[\s\-_]/g, '');
}

/** Filter requests by student ID or name. */
export function filterRequestsBySearch(requests, query) {
    const raw = String(query || '').trim();
    if (!raw) return requests || [];
    const q = raw.toLowerCase();
    const qId = normalizeSearchId(raw);
    return (requests || []).filter((req) => {
        const id = String(req.student_id_str || req.student_id || '');
        const idNorm = normalizeSearchId(id);
        const idMatch = Boolean(qId) && (idNorm.includes(qId) || id.toLowerCase().includes(q));
        const names = [
            req.student_name,
            req.full_name,
            req.new_name,
            req.old_name,
            req.original_profile?.full_name,
        ]
            .filter(Boolean)
            .map((n) => String(n).toLowerCase());
        const nameMatch = names.some((n) => n.includes(q));
        return idMatch || nameMatch;
    });
}

export function StaffSearchBar({
    value,
    onChange,
    placeholder = 'Search by Student ID or Name…',
    resultCount = null,
    totalCount = null,
}) {
    const searching = Boolean(String(value || '').trim());
    return (
        <div className="staff-search-wrap">
            <div className="staff-search-bar">
                <Search className="staff-search-icon" size={14} aria-hidden="true" />
                <input
                    type="text"
                    className="staff-search-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    aria-label="Search by Student ID or Name"
                    autoComplete="off"
                    spellCheck={false}
                />
                {value ? (
                    <button
                        type="button"
                        className="staff-search-clear"
                        onClick={() => onChange('')}
                        aria-label="Clear search"
                    >
                        <X size={14} aria-hidden="true" />
                    </button>
                ) : null}
            </div>
            {searching && resultCount != null && totalCount != null && (
                <p className="staff-search-status" role="status">
                    {resultCount === 0
                        ? `No results for “${value.trim()}”`
                        : `Showing ${resultCount} of ${totalCount} matching “${value.trim()}”`}
                </p>
            )}
        </div>
    );
}

export function StaffPortalShell({ roleLabel, title, description, onLogout, children }) {
    return (
        <div className="portal-layout staff-portal">
            <div className="portal-main">
                <header className="portal-header staff-portal-header">
                    <div className="header-left">
                        <div className="portal-brand-logo">
                            <img
                                src={BU_LOGO_DATA_URL}
                                alt="Benadir University"
                                className="portal-brand-logo-img"
                            />
                        </div>
                        <div className="staff-header-titles">
                            <span className="portal-brand-kicker">Benadir University</span>
                        </div>
                    </div>
                    <div className="header-right">
                        {onLogout && (
                            <button type="button" className="staff-signout-btn" onClick={onLogout}>
                                <LogOut size={14} aria-hidden="true" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </header>

                <div className="portal-content-wrapper staff-portal-content">
                    {(title || description) && (
                        <div className="staff-masthead">
                            <div className="staff-masthead-badge">
                                <ShieldCheck size={14} aria-hidden="true" />
                                <span>Staff Workspace</span>
                            </div>
                            {title && <h2 className="staff-masthead-title">{title}</h2>}
                            {description && <p className="staff-masthead-desc">{description}</p>}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}

export function StaffTabs({ tabs, activeTab, onChange }) {
    return (
        <div className="staff-tabs" role="tablist">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    className={`staff-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onChange(tab.id)}
                >
                    <span className="staff-tab-label">{tab.label}</span>
                    {tab.phase && <span className="staff-tab-phase">{tab.phase}</span>}
                </button>
            ))}
        </div>
    );
}

export function StaffTableCard({ title, count, children }) {
    return (
        <div className="staff-table-card">
            <div className="staff-table-card-header">
                <div className="staff-table-card-heading">
                    <h3>{title}</h3>
                    <p className="staff-table-card-subtitle">Live request overview</p>
                </div>
                <span className="staff-count-badge">{count}</span>
            </div>
            {children}
        </div>
    );
}
