import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';

  return (
    <div className="container page">
      <div className="form-box">
        <Card title={isLogin ? 'Welcome back' : 'Create your account'} subtitle={isLogin ? 'Sign in to continue your rides.' : 'Join RideShare and start sharing routes.'}>
          <div className="form-grid">
            {!isLogin && (
              <div className="field">
                <label>Full name</label>
                <input type="text" placeholder="Your name" />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="muted">Remember me</label>
                <Link to="/forgot-password" className="muted">Forgot password?</Link>
              </div>
            )}
            <Button>{isLogin ? 'Login' : 'Register'}</Button>
            <p className="muted" style={{ margin: 0 }}>
              {isLogin ? 'New here?' : 'Already have an account?'}{' '}
              <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Register' : 'Login'}</Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
