import React, { useEffect, useRef, useState } from 'react';
import { notify } from './notify';
import { internshipApi } from './api';
import { ChevronDown, Lock, LogOut, ShieldUser, UserRound } from 'lucide-react';
import type { StudentProfile } from './types';
import { departmentLabel, facultyLabel, isPostgraduateDegree } from './academicCatalog';

type LiveProfile = {
    studentId: string;
    name: string;
    email: string;
    faculty: string;
    department: string;
    degree: string;
    batch: string;
    semester: string;
    photoUrl: string;
};

function fallbackProfile(username: string): LiveProfile {
    const id = (username || '').trim();
    let storedName = '';
    try {
        storedName = sessionStorage.getItem(`display_name:${id}`) || '';
    } catch {
        /* ignore */
    }
    return {
        studentId: id,
        name: storedName || id,
        email: '',
        faculty: '',
        department: '',
        degree: '',
        batch: id.slice(0, 6).toUpperCase(),
        semester: '',
        photoUrl: '',
    };
}

function mapProfilePayload(data: StudentProfile, username: string): LiveProfile {
    const degree = String(data.degree || 'Bachelor');
    const studentId = String(data.student_id || username);
    return {
        studentId,
        name: String(data.full_name || username),
        email: String(data.email || ''),
        faculty: facultyLabel(degree, data.faculty),
        department: departmentLabel(degree, data.department, data.master_program),
        degree,
        batch: String(data.batch || studentId.slice(0, 6).toUpperCase()),
        semester: String(data.semester || data.current_semester || ''),
        photoUrl: String(data.student_photo_url || ''),
    };
}

function useLiveStudentProfile(username: string) {
    const [profile, setProfile] = useState<LiveProfile>(() => fallbackProfile(username));
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    useEffect(() => {
        const key = (username || '').trim();
        if (!key) {
            return undefined;
        }

        let cancelled = false;
        let requestSeq = 0;

        const loadProfile = async () => {
            const seq = ++requestSeq;
            setProfile(fallbackProfile(key));
            setPhotoUrl(null);

            const attempt = async (): Promise<StudentProfile | null | undefined> => {
                try {
                    const result = await internshipApi.getStudentProfile();
                    return result?.data || null;
                } catch {
                    return undefined;
                }
            };

            let data = await attempt();
            if ((data === undefined || data === null) && !cancelled && seq === requestSeq) {
                data = await attempt();
            }

            if (cancelled || seq !== requestSeq) {
                return;
            }
            if (!data) {
                return;
            }

            setProfile(mapProfilePayload(data, key));
            setPhotoUrl(String(data.student_photo_url || '') || null);
            try {
                const liveName = String(data.full_name || '').trim();
                const sid = String(data.student_id || key).trim();
                if (liveName && sid) {
                    sessionStorage.setItem(`display_name:${sid}`, liveName);
                    sessionStorage.setItem('display_name', liveName);
                    sessionStorage.setItem('display_name_for', sid);
                }
            } catch {
                /* ignore */
            }
        };

        void loadProfile();
        return () => {
            cancelled = true;
        };
    }, [username]);

    return { profile, photoUrl, setPhotoUrl };
}

export function StudentProfileCard({ username, uid }: { username: string; uid?: number | false }) {
    const { profile, photoUrl } = useLiveStudentProfile(username);
    const avatarSrc = photoUrl || profile.photoUrl || (uid ? `/web/image?model=res.users&field=avatar_128&id=${uid}` : '');
    const postgrad = isPostgraduateDegree(profile.degree);

    return (
        <div className="student-profile-header">
            <div className="profile-avatar">
                {avatarSrc ? (
                    <img src={avatarSrc} alt={profile.name} className="profile-avatar-img" />
                ) : (
                    <UserRound size={22} />
                )}
            </div>
            <div className="profile-info-grid">
                <div className="info-item info-item-id">
                    <span className="label">Student ID :</span>
                    <span className="value">{profile.studentId}</span>
                </div>
                <div className="info-item info-item-name">
                    <span className="label">Student Name :</span>
                    <span className="value">{profile.name}</span>
                </div>
                <div className="info-item info-item-faculty">
                    <span className="label">{postgrad ? 'School :' : 'Faculty :'}</span>
                    <span className="value">{profile.faculty || '—'}</span>
                </div>
                <div className="info-item info-item-department">
                    <span className="label">Department :</span>
                    <span className="value">{profile.department || '—'}</span>
                </div>
                <div className="info-item info-item-batch">
                    <span className="label">{postgrad ? 'Degree :' : 'Batch :'}</span>
                    <span className="value">{postgrad ? (profile.degree || '—') : (profile.batch || '—')}</span>
                </div>
                <div className="info-item info-item-semester">
                    <span className="label">Current semester :</span>
                    <span className="value">{profile.semester || '—'}</span>
                </div>
            </div>
        </div>
    );
}

function ChangePasswordModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSaving(false);
        }
    }, [open]);

    if (!open) return null;

    const handleSubmit = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await internshipApi.changePassword(currentPassword, newPassword, confirmPassword);
            notify.success('Password changed.');
            onClose();
        } catch (err) {
            notify.error(err instanceof Error ? err.message : 'Could not change password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-confirm-overlay" role="dialog" aria-modal="true" onClick={onClose}>
            <div className="app-confirm-card" onClick={(e) => e.stopPropagation()}>
                <h3>Change password</h3>
                <p>Enter your current password and a new password.</p>
                <div className="password-modal-fields">
                    <label>
                        Current password
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            autoFocus
                        />
                    </label>
                    <label>
                        New password
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </label>
                    <label>
                        Confirm new password
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                        />
                    </label>
                </div>
                <div className="app-confirm-actions">
                    <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Update password'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ProfileMenu({
    username,
    uid,
    onLogout,
}: {
    username: string;
    uid?: number | false;
    onLogout: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const { profile } = useLiveStudentProfile(username);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const avatarSrc = uid ? `/web/image?model=res.users&field=avatar_128&id=${uid}` : '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleProfile = () => {
        setOpen(false);
        notify.info('Profile settings will open here.');
    };

    const handleChangePassword = () => {
        setOpen(false);
        setPasswordOpen(true);
    };

    const handleSignOut = () => {
        setOpen(false);
        onLogout();
    };

    return (
        <>
            <div className="profile-menu-wrap" ref={menuRef}>
                <button
                    type="button"
                    className="profile-menu-trigger"
                    onClick={() => setOpen((prev) => !prev)}
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-label={`Account menu for ${profile.name}`}
                    title={profile.name}
                >
                    {avatarSrc ? (
                        <img src={avatarSrc} alt="" className="profile-menu-trigger-img" />
                    ) : (
                        <span className="profile-menu-trigger-fallback" aria-hidden="true">
                            <UserRound size={18} />
                        </span>
                    )}
                    <ChevronDown
                        size={14}
                        className={`profile-menu-trigger-caret${open ? ' is-open' : ''}`}
                        aria-hidden="true"
                    />
                </button>

                {open && (
                    <div className="profile-dropdown" role="menu">
                        <div className="profile-dropdown-header">
                            <div className="profile-dropdown-avatar">
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={profile.name} />
                                ) : (
                                    <UserRound size={22} />
                                )}
                            </div>
                            <div className="profile-dropdown-meta">
                                <div className="profile-dropdown-name">{profile.name}</div>
                                <div className="profile-dropdown-email">{profile.email || profile.studentId || 'no email'}</div>
                            </div>
                        </div>

                        <button type="button" className="profile-dropdown-item" onClick={handleProfile} role="menuitem">
                            <ShieldUser size={16} />
                            <span>Profile</span>
                        </button>
                        <button type="button" className="profile-dropdown-item" onClick={handleChangePassword} role="menuitem">
                            <Lock size={16} />
                            <span>Change password</span>
                        </button>
                        <button type="button" className="profile-dropdown-item danger" onClick={handleSignOut} role="menuitem">
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                )}
            </div>
            <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
        </>
    );
}
