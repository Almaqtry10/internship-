import React, { useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { authenticateUser } from './auth';
import { BU_LOGO_DATA_URL } from './brandAssets';

export default function LoginScreen({ onLogin }: { onLogin: (role: string, username: string, studentId?: string) => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (errorMsg) setErrorMsg('');
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (errorMsg) setErrorMsg('');
        setPassword(e.target.value);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        const trimmedUsername = username.trim();
        if (!trimmedUsername || !password) {
            setErrorMsg('Please enter your username and password.');
            return;
        }

        setErrorMsg('');
        setLoading(true);
        try {
            const session = await authenticateUser(trimmedUsername, password);
            if (!session?.role) {
                setErrorMsg('Invalid username or password.');
                return;
            }
            onLogin(session.role, session.login || trimmedUsername, session.student_id || '');
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="student-home-intro-badge">
                        <img
                            src={BU_LOGO_DATA_URL}
                            alt=""
                            className="login-brand-logo-img"
                        />
                        <span>Benadir University</span>
                    </div>
                    <h2>Welcome to Internship Completion</h2>
                    <p>Sign in to request and manage internship completion certificates</p>
                </div>

                {errorMsg && (
                    <div className="login-error" role="alert">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label htmlFor="login-username">Username</label>
                        <div className="login-input-wrap">
                            <UserRound size={16} className="login-field-icon" />
                            <input
                                id="login-username"
                                type="text"
                                placeholder="Enter username"
                                value={username}
                                onChange={handleUsernameChange}
                                required
                                autoComplete="username"
                                autoFocus
                                disabled={loading}
                                className="login-input"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="login-password">Password</label>
                        <div className="login-input-wrap">
                            <KeyRound size={16} className="login-field-icon" />
                            <input
                                id="login-password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="current-password"
                                disabled={loading}
                                className="login-input"
                            />
                        </div>
                    </div>

                    <button type="submit" className={`login-submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                        <ShieldCheck size={16} />
                        <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                        {!loading && <ArrowRight size={16} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
