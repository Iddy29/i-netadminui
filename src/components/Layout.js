import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineTag, HiOutlineCube, HiOutlineLogout,
  HiOutlineClipboardList, HiOutlineCog, HiOutlinePlay, HiOutlineFilm,
  HiOutlineCreditCard, HiMenu, HiX
} from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  // Get current page title from path
  const getPageTitle = useCallback(() => {
    const titles = {
      '/': 'Dashboard',
      '/categories': 'Categories',
      '/services': 'Services',
      '/orders': 'Orders',
      '/videos': 'Video Channels',
      '/adult-videos': 'Adult Videos',
      '/subscriptions': 'Subscriptions',
      '/settings': 'Settings',
    };
    return titles[location.pathname] || 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <HiMenu size={24} />
        </button>
        <div className="mobile-header-title">
          <h1><span className="accent">i</span>-net</h1>
          <span className="mobile-page-title">{getPageTitle()}</span>
        </div>
        <div className="mobile-header-avatar" onClick={() => setSidebarOpen(true)}>
          {user?.fullName?.charAt(0) || 'A'}
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2><span className="accent">i</span>-net</h2>
          <span className="badge">Admin</span>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <HiX size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={linkClass}>
            <HiOutlineHome size={20} /> Dashboard
          </NavLink>
          <NavLink to="/categories" className={linkClass}>
            <HiOutlineTag size={20} /> Categories
          </NavLink>
          <NavLink to="/services" className={linkClass}>
            <HiOutlineCube size={20} /> Services
          </NavLink>
          <NavLink to="/orders" className={linkClass}>
            <HiOutlineClipboardList size={20} /> Orders
          </NavLink>
          <NavLink to="/videos" className={linkClass}>
            <HiOutlinePlay size={20} /> Video Channels
          </NavLink>
          <NavLink to="/adult-videos" className={linkClass}>
            <HiOutlineFilm size={20} /> Adult Videos (18+)
          </NavLink>
          <NavLink to="/subscriptions" className={linkClass}>
            <HiOutlineCreditCard size={20} /> Subscriptions
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            <HiOutlineCog size={20} /> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.fullName?.charAt(0) || 'A'}</div>
            <div className="user-details">
              <span className="user-name">{user?.fullName || 'Admin'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <HiOutlineLogout size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
