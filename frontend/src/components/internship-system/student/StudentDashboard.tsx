import React, { useEffect, useState } from 'react';
import { Building2, FilePenLine, SearchCheck } from 'lucide-react';
import NewRequestForm from './NewRequestForm';
import NewPlacementRequestForm from './NewPlacementRequestForm';
import RequestTracker from './RequestTracker';
import { internshipApi } from '../api';

type View = 'dashboard' | 'placement-form' | 'completion-form' | 'tracker';

export default function StudentDashboard() {
    const [view, setView] = useState<View>('dashboard');
    const [hasApprovedPlacement, setHasApprovedPlacement] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(true);

    const refreshEligibility = () => {
        setCheckingEligibility(true);
        internshipApi.getStudentProfile()
            .then((result) => setHasApprovedPlacement(Boolean(result?.data?.has_approved_internship_request)))
            .catch(() => setHasApprovedPlacement(false))
            .finally(() => setCheckingEligibility(false));
    };

    useEffect(() => {
        refreshEligibility();
    }, []);

    if (view === 'placement-form') {
        return (
            <NewPlacementRequestForm
                onSubmitted={() => setView('tracker')}
                onBack={() => setView('dashboard')}
            />
        );
    }

    if (view === 'completion-form') {
        return (
            <NewRequestForm
                onSubmitted={() => setView('tracker')}
                onBack={() => setView('dashboard')}
            />
        );
    }

    if (view === 'tracker') {
        return <RequestTracker onBack={() => { refreshEligibility(); setView('dashboard'); }} />;
    }

    return (
        <div className="student-home">
            <h3 className="step-title" style={{ marginTop: 0 }}>Internship Request</h3>
            <p style={{ color: 'var(--portal-text-muted)', fontSize: '0.88rem', marginTop: '-6px' }}>
                Register your internship placement for approval before you start.
            </p>
            <div className="dashboard-cards">
                <div className="dashboard-card action-card" onClick={() => setView('placement-form')}>
                    <div className="action-card-icon" aria-hidden="true"><Building2 size={16} /></div>
                    <h3>New Internship Request</h3>
                    <p>Register your internship placement for approval</p>
                </div>
                <div className="dashboard-card action-card" onClick={() => setView('tracker')}>
                    <div className="action-card-icon" aria-hidden="true"><SearchCheck size={16} /></div>
                    <h3>Track Request</h3>
                    <p>Check the status of your internship &amp; completion requests</p>
                </div>
            </div>

            <h3 className="step-title" style={{ marginTop: '32px' }}>Internship Completion</h3>
            <p style={{ color: 'var(--portal-text-muted)', fontSize: '0.88rem', marginTop: '-6px' }}>
                Once your internship is finished, request your completion certificate.
            </p>
            <div className="dashboard-cards">
                <div
                    className={`dashboard-card action-card${hasApprovedPlacement ? '' : ' disabled'}`}
                    onClick={() => { if (hasApprovedPlacement) setView('completion-form'); }}
                    title={hasApprovedPlacement ? '' : 'Your internship must be approved and finished first'}
                >
                    <div className="action-card-icon" aria-hidden="true"><FilePenLine size={16} /></div>
                    <h3>New Completion Request</h3>
                    <p>
                        {checkingEligibility
                            ? 'Checking eligibility…'
                            : hasApprovedPlacement
                                ? 'Start a new internship completion request'
                                : 'Requires an approved Internship Request that has finished'}
                    </p>
                </div>
            </div>
        </div>
    );
}
