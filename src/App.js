import { useState } from 'react';
import './App.css';
import SolarSystem, { StarryBackground } from './components/SolarSystem';
import GreetingSequence from './components/GreetingSequence';
import SpaceMusic from './components/SpaceMusic';
import ProfileButton from './components/ProfileButton';
import SocialMenu from './components/SocialMenu';

function App() {
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);

  const handleGreetingComplete = () => {
    setGreetingComplete(true);
    // Show profile button after the transformation animation completes
    setTimeout(() => {
      setShowProfile(true);
    }, 200);
  };

  const handleProfileClick = () => {
    setShowSocialMenu(true);
  };

  const handleCloseSocialMenu = () => {
    setShowSocialMenu(false);
  };

  const handleDashboardStateChange = (isOpen) => {
    setDashboardOpen(isOpen);
  };

  const handleCarouselStateChange = (isOpen) => {
    setCarouselOpen(isOpen);
  };

  return (
    <div className="App">
      {/* Starry background always visible */}
      <StarryBackground starCount={400} />
      <header className="App-header">
        {!greetingComplete && (
          <GreetingSequence onComplete={handleGreetingComplete} />
        )}
        <SolarSystem 
          isVisible={greetingComplete} 
          onDashboardStateChange={handleDashboardStateChange}
          onCarouselStateChange={handleCarouselStateChange}
        />
        <SpaceMusic 
          isPlaying={true}
          volume={0.2}
          dashboardOpen={dashboardOpen}
          carouselOpen={carouselOpen}
        />
        <ProfileButton 
          isVisible={showProfile}
          onClick={handleProfileClick}
          dashboardOpen={dashboardOpen}
          carouselOpen={carouselOpen}
        />
        <SocialMenu 
          isVisible={showSocialMenu}
          onClose={handleCloseSocialMenu}
        />
      </header>
    </div>
  );
}

export default App;
