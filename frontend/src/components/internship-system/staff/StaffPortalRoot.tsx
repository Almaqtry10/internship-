import React, { useState } from 'react';
import { StaffPortalShell } from '../StaffPortal';
import ChiefDashboard from './ChiefDashboard';
import PlacementPanel from './PlacementPanel';
import type { InternshipRole } from '../types';

type Section = 'placement' | 'completion';

function roleLabelFor(role: InternshipRole) {
    if (role === 'admin') return 'Administrator';
    if (role === 'dean') return 'Dean';
    if (role === 'registrar_office') return 'Registrar Office';
    if (role === 'general_registrar') return 'General Registrar';
    return 'Chief Registrar';
}

function defaultSectionFor(role: InternshipRole): Section {
    // Land each role on the section they actually act on — Dean owns
    // Internship Requests end-to-end, everyone else owns Completion.
    return role === 'dean' ? 'placement' : 'completion';
}

export default function StaffPortalRoot({
    role,
    onLogout,
}: {
    role: InternshipRole;
    username?: string;
    onLogout: () => void;
}) {
    const [section, setSection] = useState<Section>(() => defaultSectionFor(role));
    const actsOnPlacement = role === 'dean' || role === 'admin';
    const actsOnCompletion = role !== 'dean';

    return (
        <StaffPortalShell
            roleLabel={roleLabelFor(role)}
            title={section === 'placement' ? 'Internship Requests' : 'Internship Completion'}
            description={
                section === 'placement'
                    ? actsOnPlacement
                        ? 'Review and approve student internship placements before they start.'
                        : 'Monitor internship placement requests — processed by the student’s Dean.'
                    : actsOnCompletion
                        ? 'Process completion certificate requests for approved internships.'
                        : 'Monitor completion certificate requests — processed by Chief Registrar and Registrar Office.'
            }
            onLogout={onLogout}
        >
            <div className="staff-tabs" role="tablist" style={{ marginBottom: 16 }}>
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'placement'}
                    className={`staff-tab ${section === 'placement' ? 'active' : ''}`}
                    onClick={() => setSection('placement')}
                >
                    <span className="staff-tab-label">Internship Requests</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={section === 'completion'}
                    className={`staff-tab ${section === 'completion' ? 'active' : ''}`}
                    onClick={() => setSection('completion')}
                >
                    <span className="staff-tab-label">Internship Completion</span>
                </button>
            </div>

            {section === 'placement' ? <PlacementPanel role={role} /> : <ChiefDashboard role={role} />}
        </StaffPortalShell>
    );
}
