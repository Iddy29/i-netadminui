import { useState, useEffect } from 'react';
import api from '../api';
import { HiOutlineCube, HiOutlineTag, HiOutlineCheckCircle, HiOutlineUsers } from 'react-icons/hi';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your i-net platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><HiOutlineCube size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalServices || 0}</span>
            <span className="stat-label">Total Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><HiOutlineCheckCircle size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.activeServices || 0}</span>
            <span className="stat-label">Active Services</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><HiOutlineTag size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalCategories || 0}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><HiOutlineUsers size={24} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalUsers || 0}</span>
            <span className="stat-label">Registered Users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
