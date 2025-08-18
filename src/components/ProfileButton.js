import React from 'react';
import './ProfileButton.css';

function ProfileButton({ isVisible, onClick }) {
  if (!isVisible) return null;

  return (
    <button 
      className="profile-btn"
      onClick={onClick}
      aria-label="Profile"
    >
      <img 
        src="/portfolio/basile/basile_wave.png" 
        alt="Basile" 
        className="profile-avatar"
      />
    </button>
  );
}

export default ProfileButton;
