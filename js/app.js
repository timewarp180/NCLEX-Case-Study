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




// Install Logic
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const installToast = document.querySelector('.pwa-install-toast');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show both button and toast
  installBtn.classList.remove('d-none');
  installToast.classList.remove('hide');
  installToast.classList.add('show');
});

document.getElementById('installToastBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    installToast.classList.remove('show');
    installToast.classList.add('hide');
  }
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    installBtn.classList.add('d-none');
  }
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}