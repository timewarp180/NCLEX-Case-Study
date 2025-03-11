# Case Study Practice Platform :hospital: 

A web-based quiz application designed for medical professionals to practice clinical case studies with detailed analytics.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Bootstrap Version](https://img.shields.io/badge/Bootstrap-5.3-blue)
![Chart.js Version](https://img.shields.io/badge/Chart.js-4.4-green)

## Features :sparkles:
- **Interactive Case Studies**: Multiple medical scenarios with configurable questions
- **Real-time Analytics**:
  - Progress tracking over time
  - Performance breakdown by case study
  - Time management statistics
- **Question Flagging**: Mark questions for later review
- **Confidence Meter**: Rate your certainty in answers (1-5 scale)
- **Progress Tracking**: Visual indicators for answered/flagged questions
- **Session Persistence**: Resume interrupted quizzes

## Tech Stack :computer:
| Component          | Technology                                                                 |
|---------------------|---------------------------------------------------------------------------|
| **Frontend**        | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black) |
| **UI Framework**    | ![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white) |
| **Data Visualization** | ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?logo=chartdotjs&logoColor=white) |
| **State Management** | `localStorage` (Browser-based persistence)                              |
| **Build Tools**     | Vanilla JS (No build system required)                                   |

## Key Dependencies :package:
```javascript
// package.json equivalent
{
  "dependencies": {
    "bootstrap": "^5.3.0",        // Responsive UI components
    "chart.js": "^4.4.0",         // Data visualization
    "bootstrap-icons": "^1.10.0"  // UI icons
  }
}
