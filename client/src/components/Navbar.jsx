import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from './Button';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Offer ride', to: '/offer-ride' },
  { label: 'Book ride', to: '/book-ride' },
  { label: 'My rides', to: '/my-rides' },
  { label: 'Contact', to: '/contact' }
];

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">RideShare</Link>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <Button variant="secondary" size="sm" onClick={toggleTheme} type="button">
            {theme === 'light' ? 'Dark' : 'Light'} mode
          </Button>

          {isAuthenticated ? (
            <>
              <Link to="/profile">{user?.name || 'Profile'}</Link>
              <Button variant="primary" size="sm" onClick={logout} type="button">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">
                <Button variant="primary" size="sm" type="button">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
