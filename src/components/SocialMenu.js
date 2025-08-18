import React from 'react';
import './SocialMenu.css';

function SocialMenu({ isVisible, onClose }) {
  if (!isVisible) return null;

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/BaseModMaker',
      icon: '/portfolio/github.png',
      description: 'Code repositories'
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/basile-donnay-programming/',
      icon: '/portfolio/linkedin.png',
      description: 'Professional network'
    },
    {
      name: 'Email',
      url: 'mailto:basiledonnay4444@gmail.com',
      icon: '/portfolio/gmail.png',
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
                download={link.name === 'Resume' ? 'resume.pdf' : undefined}
              >
                <div className="social-icon">
                  {link.icon.startsWith('/') ? (
                    <img 
                      src={link.icon} 
                      alt={link.name} 
                      className="social-icon-image"
                    />
                  ) : (
                    link.icon
                  )}
                </div>
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
