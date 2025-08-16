import { useState } from 'react';
import './App.css';
import SolarSystem from './components/SolarSystem';
import GreetingSequence from './components/GreetingSequence';

function App() {
  const [greetingComplete, setGreetingComplete] = useState(false);

  const handleGreetingComplete = () => {
    setGreetingComplete(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        {!greetingComplete && (
          <GreetingSequence onComplete={handleGreetingComplete} />
        )}
        <SolarSystem isVisible={greetingComplete} />
      </header>
    </div>
  );
}

export default App;
