// Accessibility Features
document.addEventListener('DOMContentLoaded', () => {
    // Night Mode Toggle
    const nightModeBtn = document.getElementById('nightModeBtn');
    nightModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
    });

    // Text Size Toggle
    const textSizeBtn = document.getElementById('textSizeBtn');
    textSizeBtn.addEventListener('click', () => {
        document.body.classList.toggle('large-text');
    });

    // Start Quiz Button
    document.querySelector('.start-quiz-btn').addEventListener('click', () => {
        window.location.href = 'quiz.html';
    });
});