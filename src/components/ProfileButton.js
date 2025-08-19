import React from 'react';
import './ProfileButton.css';

function ProfileButton({ isVisible, onClick, dashboardOpen = false, carouselOpen = false }) {
  if (!isVisible || carouselOpen) return null;

  return (
    <button 
      className={`profile-btn ${dashboardOpen ? 'dashboard-open' : ''}`}
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
