// Announcement Bar Script
document.addEventListener('DOMContentLoaded', function() {
  const announcementBar = document.getElementById('announcement-bar');
  const closeButton = document.getElementById('close-announcement');

  if (announcementBar && closeButton) {
    // Funkcjonalność przycisku zamykania
    closeButton.addEventListener('click', function() {
      announcementBar.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      announcementBar.style.transform = 'translateY(-100%)';
      announcementBar.style.opacity = '0';
      setTimeout(() => {
        announcementBar.style.display = 'none';
      }, 300);
    });

    // Funkcjonalność zmniejszania paska podczas przewijania
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateOnScroll(scrollPos) {
      if (scrollPos > 50) {
        announcementBar.classList.add('scrolled');
      } else {
        announcementBar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', function() {
      lastScrollY = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateOnScroll(lastScrollY);
          ticking = false;
        });
        ticking = true;
      }
    });
  }
});