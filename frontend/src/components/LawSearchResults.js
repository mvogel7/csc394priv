import React, { useState } from 'react';
import axios from 'axios';

function LawSearchResults({ user, setUser, setLogoutMessage }) {
  const [query, setQuery] = useState('');
  const [aiResults, setAiResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    } catch (error) {
      console.error('Fetch error:', error);
      setAiResults([{ title: 'Error', description: 'Failed to fetch results from server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) return alert('New passwords do not match.');

    try {
      await axios.put('/api/users/change-password', {
        username: user,
        currentPassword,
        newPassword,
      });
      alert('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      alert('Failed to change password');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLogoutMessage('Successfully logged out');
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Welcome, {user}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {showPasswordChange && (
        <div className="mb-6">
          <h3 className="text-xl mb-2">Change Password</h3>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="border p-2 block mb-2" />
          <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border p-2 block mb-2" />
          <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="border p-2 block mb-2" />
          <button onClick={handlePasswordChange} className="bg-blue-500 text-white px-4 py-2 rounded">Confirm Change</button>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl mb-2">Search Cyber Laws</h3>
        <input
          type="text"
          placeholder="Enter query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          Search
        </button>
        {loading && <p className="mt-2 text-lg font-semibold">Loading Results...</p>}
      </div>

      <div>
        {Array.isArray(aiResults) && aiResults.length > 0 ? (
          aiResults.map((law, index) => (
            <div key={index} className="border p-4 mb-4 rounded">
              <h3 className="text-xl font-bold mb-1">{law.title}</h3>
              <p>{law.description}</p>
              {law.url && (
                <p className="text-blue-600 underline mt-2">Source: <a href={law.url} target="_blank" rel="noopener noreferrer">{law.url}</a></p>
              )}
              {law.citation && (
                <p className="italic text-sm mt-1">MLA Citation: {law.citation}</p>
              )}
            </div>
          ))
        ) : (
          !loading && <p>No results found.</p>
        )}
      </div>
    </div>
  );
}

export default LawSearchResults;

