import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Moon, Sun } from 'lucide-react';
import LoginScreen from './LoginScreen';
import ProfileMenu, { StudentProfileCard } from './ProfileMenu';
import StudentDashboard from './student/StudentDashboard';
import StaffPortalRoot from './staff/StaffPortalRoot';
import { logoutUser, refreshSession, readStoredSession } from './auth';
import { ToastHost } from './notify';
import { BU_LOGO_DATA_URL } from './brandAssets';
import './styles.css';
import './internship-extras.css';

const THEME_KEY = 'bu_internship_theme';
const STAFF_ROLES = new Set(['admin', 'dean', 'chief_registrar', 'registrar_office', 'general_registrar']);

function getInitialTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
    } catch {
        /* ignore */
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

export default function InternshipSystem() {
    const stored = readStoredSession();
    const [role, setRole] = useState(stored.role);
    const [username, setUsername] = useState(stored.username);
    const [studentId, setStudentId] = useState(stored.studentId || stored.username);
    const [uid, setUid] = useState<number | false>(false);
    const [theme, setTheme] = useState(getInitialTheme);
    const [sessionChecked, setSessionChecked] = useState(!stored.role);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch {
            /* ignore */
        }
    }, [theme]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!stored.role) {
                setSessionChecked(true);
                return;
            }
            const session = await refreshSession();
            if (cancelled) return;
            if (!session?.role) {
                setRole(null);
                setUsername('');
                setStudentId('');
                setUid(false);
            } else {
                setRole(session.role);
                setUsername(session.login || '');
                setStudentId(session.student_id || session.login || '');
                setUid(session.uid || false);
            }
            setSessionChecked(true);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

    const handleLogin = (selectedRole: string, enteredUsername: string, enteredStudentId = '') => {
        const sid = (enteredStudentId || enteredUsername || '').trim();
        setRole(selectedRole as typeof role);
        setUsername(enteredUsername);
        setStudentId(sid);
        void refreshSession().then((session) => {
            if (session?.uid) setUid(session.uid);
        });
    };

    const handleLogout = async () => {
        await logoutUser();
        setRole(null);
        setUsername('');
        setStudentId('');
        setUid(false);
    };

    if (!sessionChecked) {
        return (
            <div className="login-container" style={{ textAlign: 'center', paddingTop: '20vh' }}>
                <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '0.95rem' }}>
                    Connecting to server…
                </p>
            </div>
        );
    }

    if (!role) {
        return (
            <>
                <ToastHost />
                <LoginScreen onLogin={handleLogin} />
            </>
        );
    }

    if (role !== 'student') {
        if (!STAFF_ROLES.has(role)) {
            return (
                <div className="login-container">
                    <p>This account does not have internship completion access.</p>
                    <button type="button" className="btn-secondary" onClick={handleLogout} style={{ marginTop: 12 }}>
                        Sign out
                    </button>
                </div>
            );
        }
        return (
            <>
                <ToastHost />
                <StaffPortalRoot role={role as Exclude<typeof role, 'student' | null>} username={username || ''} onLogout={handleLogout} />
            </>
        );
    }

    return (
        <div className="portal-layout">
            <ToastHost />
            <div className="portal-main">
                <header className="portal-header">
                    <div className="header-left">
                        <div className="portal-brand-logo">
                            <img
                                src={BU_LOGO_DATA_URL}
                                alt="Benadir University"
                                className="portal-brand-logo-img"
                            />
                        </div>
                        <div className="portal-brand-group">
                            <span className="portal-brand-kicker">Benadir University</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <button
                            type="button"
                            className="icon-btn"
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                        <ProfileMenu username={studentId || username} uid={uid} onLogout={handleLogout} />
                    </div>
                </header>

                <div className="student-profile-strip">
                    <StudentProfileCard username={studentId || username} uid={uid} />
                </div>

                <div className="portal-content-wrapper">
                    <div className="tab-content">
                        <div className="student-home-intro">
                            <div className="student-home-intro-badge">
                                <LayoutDashboard size={14} />
                                <span>Student Services &amp; Academic Affairs</span>
                            </div>
                            <h2>Internship Completion</h2>
                            <p>
                                Submit your internship completion request — then track its progress until approval.
                            </p>
                        </div>
                        <StudentDashboard />
                    </div>
                </div>
            </div>
        </div>
    );
}
