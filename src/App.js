import { useState } from 'react';
import './App.css';
import SolarSystem, { StarryBackground } from './components/SolarSystem';
import GreetingSequence from './components/GreetingSequence';
import SpaceMusic from './components/SpaceMusic';
import ProfileButton from './components/ProfileButton';
import SocialMenu from './components/SocialMenu';
import CrewCabin from './components/CrewCabin';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

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
    <BrowserRouter>
      <div className="App">
        {/* Starry background always visible */}
        <StarryBackground starCount={400} />
        <header className="App-header">
          <Routes>
            <Route path="/space" element={<SolarSystem isVisible={true} onDashboardStateChange={handleDashboardStateChange} onCarouselStateChange={handleCarouselStateChange} />} />
            <Route path="/picture-on-the-table" element={<GreetingSequence onComplete={handleGreetingComplete} />} />
            <Route path="/*" element={<CrewCabin />} />
          </Routes>
          {/*
          <ProfileButton 
            isVisible={showProfile}
            onClick={handleProfileClick}
            dashboardOpen={dashboardOpen}
            carouselOpen={carouselOpen}
          />
          <SpaceMusic 
            isPlaying={true}
            volume={0.2}
            dashboardOpen={dashboardOpen}
            carouselOpen={carouselOpen}
          />
          <SocialMenu 
            isVisible={showSocialMenu}
            onClose={handleCloseSocialMenu}
          />
          */}
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;
