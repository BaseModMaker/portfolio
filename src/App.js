import { useState } from 'react';
import './App.css';
import SolarSystem from './components/SolarSystem';
import GreetingSequence from './components/GreetingSequence';
import SpaceMusic from './components/SpaceMusic';
import ProfileButton from './components/ProfileButton';
import SocialMenu from './components/SocialMenu';

function App() {
  const [greetingComplete, setGreetingComplete] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);

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

  return (
    <div className="App">
      <header className="App-header">
        {!greetingComplete && (
          <GreetingSequence onComplete={handleGreetingComplete} />
        )}
        <SolarSystem isVisible={greetingComplete} />
        <SpaceMusic 
          isPlaying={true}
          volume={0.2}
        />
        <ProfileButton 
          isVisible={showProfile}
          onClick={handleProfileClick}
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
