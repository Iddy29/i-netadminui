import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineHome, HiOutlineTag, HiOutlineCube, HiOutlineLogout, HiOutlineClipboardList, HiOutlineCog } from 'react-icons/hi';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2><span className="accent">i</span>-net</h2>
          <span className="badge">Admin</span>
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
