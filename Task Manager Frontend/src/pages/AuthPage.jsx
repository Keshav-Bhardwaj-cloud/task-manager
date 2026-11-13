import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    if (isRegister) {
      if (!form.name.trim()) {
        setError('Your name is required.');
        return;
      }

      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      payload.name = form.name.trim();
    }

    try {
      setIsSubmitting(true);

      if (isRegister) {
        await register(payload);
        navigate('/login');
        return;
      }

      await login(payload);
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message || 'Unable to complete authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <div className="brand-icon">T</div>
            <span>TaskPilot</span>
          </div>
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isRegister ? 'Start organizing your work in one place.' : 'Sign in to pick up where you left off.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isRegister ? (
            <label className="field-label">
              <span>Name</span>
              <div className="input-wrap">
                <UserRound size={18} />
                <input name="name" value={form.name} onChange={handleChange} placeholder="Alex Morgan" />
              </div>
            </label>
          ) : null}

          <label className="field-label">
            <span>Email</span>
            <div className="input-wrap">
              <Mail size={18} />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="hello@taskpilot.com" />
            </div>
          </label>

          <label className="field-label">
            <span>Password</span>
            <div className="input-wrap">
              <LockKeyhole size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={isRegister ? 'Create a strong password' : 'Your password'}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {isRegister ? (
            <label className="field-label">
              <span>Confirm password</span>
              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                />
              </div>
            </label>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="button button-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? (isRegister ? 'Creating account...' : 'Signing in...') : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switcher">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create one'}</Link>
        </p>
      </div>
    </div>
  );
}
