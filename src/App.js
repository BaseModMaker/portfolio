import './App.css';
import RotatingCube from './components/RotatingCube';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Interactive 3D Cube</h1>
        <p>Use your mouse to rotate, zoom, and pan around the cube!</p>
        <RotatingCube />
        <div style={{ marginTop: '20px', color: '#888' }}>
          <p>• Left click + drag: Rotate view</p>
          <p>• Right click + drag: Pan view</p>
          <p>• Scroll wheel: Zoom in/out</p>
        </div>
      </header>
    </div>
  );
}

export default App;
