import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard({ user, setUser, setLogoutMessage }) {
  const [deleteUsername, setDeleteUsername] = useState('');
  const [query, setQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user !== 'admin') navigate('/search');
  }, [user, navigate]);

  const handleLogout = () => {
    setUser(null);
    setLogoutMessage('Successfully logged out');
    navigate('/');
  };

  const handleDeleteUser = async () => {
    if (deleteUsername === 'admin') {
      alert("Cannot delete the default admin user.");
      return;
    }
    try {
      await axios.delete(`/api/users/${deleteUsername}`);
      alert('User deleted successfully');
    } catch {
      alert('Failed to delete user');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      return alert('New passwords do not match.');
    }
    try {
      await axios.put('/api/users/admin-change-password', {
        username: passwordTarget,
        newPassword,
      });
      alert('Password changed successfully');
      setPasswordTarget('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      alert('Failed to change password');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setAiResults([]);
    try {
      const response = await axios.get(`/api/openai-laws?query=${encodeURIComponent(query)}`);
      if (Array.isArray(response.data.results)) {
        setAiResults(response.data.results);
      } else if (response.data.error) {
        setAiResults([{ title: 'Error', description: response.data.error }]);
      } else {
        setAiResults([{ title: 'Error', description: 'Unexpected format returned from API.' }]);
      }
    } catch {
      setAiResults([{ title: 'Error', description: 'Failed to fetch results from server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
          Logout
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl mb-2">Delete User</h3>
        <input type="text" value={deleteUsername} onChange={(e) => setDeleteUsername(e.target.value)} placeholder="Enter username" className="border p-2 mr-2" />
        <button onClick={handleDeleteUser} className="bg-red-500 text-white px-4 py-2 rounded">Delete User</button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl mb-2">Change User Password</h3>
        <input type="text" placeholder="Username" value={passwordTarget} onChange={(e) => setPasswordTarget(e.target.value)} className="border p-2 block mb-2" />
        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border p-2 block mb-2" />
        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border p-2 block mb-2" />
        <button onClick={handlePasswordChange} className="bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
      </div>

      <div className="mb-6">
        <h3 className="text-xl mb-2">Search Laws</h3>
        <input type="text" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="border p-2 mr-2" />
        <button onClick={handleSearch} disabled={loading} className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>Search</button>
        {loading && <p className="text-xl mt-4 font-semibold">Loading Results...</p>}
        <div className="mt-6">
          {aiResults.map((law, idx) => (
            <div key={idx} className="border p-4 mb-4 rounded">
              <h4 className="text-xl font-bold mb-2">{law.title}</h4>
              <p className="mb-2">{law.description}</p>
              {law.url && (
                <p className="mb-1">
                  <strong>Source:</strong>{' '}
                  <a href={law.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {law.url}
                  </a>
                </p>
              )}
              {law.citation && <p className="italic text-sm">MLA Citation: {law.citation}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
