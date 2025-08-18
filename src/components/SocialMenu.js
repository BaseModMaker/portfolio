import React from 'react';
import './SocialMenu.css';

function SocialMenu({ isVisible, onClose }) {
  if (!isVisible) return null;

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/basilelt',
      icon: '🐙',
      description: 'Code repositories'
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com/in/basile-letertre',
      icon: '💼',
      description: 'Professional network'
    },
    {
      name: 'Email',
      url: 'mailto:basile.letertre@example.com',
      icon: '📧',
      description: 'Get in touch'
    },
    {
      name: 'Resume',
      url: '/portfolio/resume.pdf',
      icon: '📄',
      description: 'Download CV'
    }
  ];

  return (
    <div className="social-menu-overlay" onClick={onClose}>
      <div className="social-menu" onClick={(e) => e.stopPropagation()}>
        <div className="social-menu-header">
          <h2 className="social-menu-title">Connect with me</h2>
          <button className="social-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="social-menu-content">
          <div className="social-links">
            {socialLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : '_self'}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : ''}
                className="social-link"
              >
                <div className="social-icon">{link.icon}</div>
                <div className="social-info">
                  <div className="social-name">{link.name}</div>
                  <div className="social-description">{link.description}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SocialMenu;
