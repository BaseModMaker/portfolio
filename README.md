# 🌌 Interactive Solar System Portfolio

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-Fiber-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen?style=for-the-badge&logo=github&logoColor=white)](https://basemodmaker.github.io/portfolio/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

> 🚀 **An immersive 3D portfolio experience where each planet represents a GitHub repository, complete with interactive exploration and spaceship-style dashboards.**

![Portfolio Preview](https://img.shields.io/badge/Status-Live%20Demo-success?style=for-the-badge)

---

## ✨ What is This?

This is not your typical portfolio website. Instead of boring static pages, explore my projects through an **interactive solar system** where:

- 🪐 **Each planet is a GitHub repository** - Click to explore project details
- 🚀 **Spaceship dashboard interface** - Futuristic UI displays repository data
- 🌟 **Real-time GitHub integration** - Live data from the GitHub API
- 🎮 **3D exploration** - Navigate through space with smooth camera controls
- ⚡ **RPG-style interactions** - Engaging greeting sequence and planet labels

---

## 🎯 Features

### 🌌 Immersive 3D Experience
- **Realistic Planets** - Procedurally generated surfaces with atmospheres and rings
- **Dynamic Lighting** - Animated sun with realistic shadows and glow effects
- **Smooth Navigation** - Orbital camera controls with animated transitions

### 🚀 Interactive Portfolio
- **GitHub Integration** - Automatically fetches repository data via GitHub API
- **Spaceship Dashboard** - Sci-fi interface showing project statistics and details
- **Project Exploration** - View languages, commits, stars, and technical details
- **Live Repository Data** - Real-time information including recent commits

### 🎨 Modern UI/UX
- **RPG-Style Greeting** - Character introduction with typewriter effects
- **Smooth Animations** - Polished transitions and hover effects

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | Core framework with modern hooks |
| **Three.js + Fiber** | 3D graphics and animations |
| **GitHub API** | Real-time repository data |
| **Custom Shaders** | Realistic planet atmospheres and rings |
| **CSS3 Animations** | UI transitions and effects |
| **GitHub Pages** | Deployment and hosting |

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/BaseModMaker/portfolio.git
cd portfolio

# Install dependencies
npm install

# Start development server
npm start

# Open browser to http://localhost:3000
```

### Deployment
```bash
# Build and deploy to GitHub Pages
npm run deploy
```

---

## 🎮 How to Explore

1. **🎬 Watch the Greeting** - Meet Basile and learn about the portfolio
2. **🌌 Navigate the Solar System** - Use mouse/touch to orbit around
3. **🪐 Click a Planet** - Select any planet to explore the repository
4. **📊 View Project Data** - Examine code languages, commits, and statistics
5. **🔗 Visit Projects** - Click links to view live demos or GitHub repos

---

## 🎨 Customization

### Adding New Projects
Update `src/data/planetsData.json` with your repository names:

```json
{
  "name": "your-repo-name",
  "orbitRadius": 4,
  "size": 0.16,
  "props": {
    "surfaceColor": "#6B93D6",
    "hasAtmosphere": true
  }
}
```

### GitHub Configuration
Update your GitHub username in `src/services/githubService.js`:

```javascript
const GITHUB_USERNAME = 'YourUsername';
```

### Visual Styling
- **Colors**: Modify CSS variables in component files
- **Planets**: Adjust properties in `planetsData.json`
- **UI Elements**: Customize styles in component CSS files

---

## 🌐 Live Demo

**[🚀 Explore the Solar System Portfolio](https://basemodmaker.github.io/portfolio/)**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Three.js Community** - For the amazing 3D library
- **React Three Fiber** - For React integration with Three.js
- **GitHub API** - For providing repository data
- **Space Inspiration** - For the cosmic theme and aesthetics

---

<div align="center">

### 🌟 **Experience the Future of Portfolios** 🌟

**[Launch into Space →](https://basemodmaker.github.io/portfolio/)**

*Made with ❤️ and lots of ☕ by [Basile](https://github.com/BaseModMaker)*

![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=flat-square&logo=react)
![Powered by Three.js](https://img.shields.io/badge/Powered%20by-Three.js-000000?style=flat-square&logo=three.js)
![Space Theme](https://img.shields.io/badge/Theme-Space-purple?style=flat-square&logo=rocket)

</div>