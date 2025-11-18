(function () {
  const row = document.querySelector('.resizable-columns-row');
  if (!row) {
    console.warn('Nie znaleziono .resizable-columns-row');
    return;
  }

  // --- PARAMETRY KONFIGURACYJNE ---
  const HOLD_TIME = 1000; // ms - Czas blokady po złapaniu. Jak długo ma trzymać.
  const SNAP_WINDOW = 85; // px - Margines, w którym następuje łapanie. Siła "namagnesowania".
  const MOBILE_BREAK_OFFSET = 100; // px - Offset dotyku/wheel potrzebny do natychmiastowego zwolnienia blokady.
  const RELEASE_GUARD_TIME = 1500; // ms - Czas "ochrony" po zwolnieniu, aby zapobiec ponownemu natychmiastowemu snapowi.
  // ---------------------------------
  
  let holding = false;
  let isReleased = false; 
  let needsToExitSnapZone = false; // NOWOŚĆ: Blokuje łapanie, dopóki nie wyjedziemy poza SNAP_WINDOW
  let holdScrollY = 0;
  let lastBottom = null;
  let releaseTimer = null;
  let guardTimer = null;
  let touchStartY = null;
  let isProgrammaticScroll = false; 

  // Funkcja aktywująca okres ochronny po zwolnieniu blokady
  function activateReleaseGuard() {
    isReleased = true;
    if (guardTimer) clearTimeout(guardTimer);
    guardTimer = setTimeout(() => {
      isReleased = false; 
    }, RELEASE_GUARD_TIME);
  }

  // Funkcja kończąca blokadę
  function stopHold() {
    holding = false;
    needsToExitSnapZone = true; // Ustawia trwałą blokadę łapania
  }

  // Funkcja rozpoczynająca blokadę
  function startHold(targetY) {
    // Dodano needsToExitSnapZone do warunku łapania
    if (holding || isReleased || needsToExitSnapZone) return; 

    if (releaseTimer) clearTimeout(releaseTimer);
    if (guardTimer) clearTimeout(guardTimer);
    isReleased = false;
    needsToExitSnapZone = false; // Łapanie resetuje flagę
    
    holding = true;
    holdScrollY = targetY;

    // Ustawiamy timer na zwolnienie po HOLD_TIME
    releaseTimer = setTimeout(() => {
      stopHold();
      activateReleaseGuard();
    }, HOLD_TIME);

    isProgrammaticScroll = true;
    window.scrollTo(0, targetY);
  }

  // --- OBSŁUGA SCROLL (GŁÓWNA LOGIKA) ---
  function onScroll() {
    const rect = row.getBoundingClientRect();
    const vh = window.innerHeight;
    const bottom = rect.bottom;
    const diffNow = bottom - vh;
    const inSnapWindow = Math.abs(diffNow) <= SNAP_WINDOW;

    // WARUNEK NR 1: OKRES OCHRONNY
    if (isReleased) {
        lastBottom = bottom;
        return;
    }

    // NOWOŚĆ: Sprawdzenie, czy możemy ponownie łapać
    if (needsToExitSnapZone) {
      if (!inSnapWindow) {
        // Sekcja opuściła strefę - resetujemy flagę i pozwalamy na ponowne łapanie
        needsToExitSnapZone = false;
      }
      lastBottom = bottom;
      return;
    }

    // WARUNEK NR 2: HOLDING (Cofanie scrolla, aby utrzymać widok)
    if (holding) {
      if (!isProgrammaticScroll && window.scrollY !== holdScrollY) {
        isProgrammaticScroll = true;
        window.scrollTo(0, holdScrollY);
      } else {
        isProgrammaticScroll = false;
      }
      return;
    }

    // WARUNEK NR 3: WYKRYCIE NAMAGNESOWANIA
    if (lastBottom === null) {
      lastBottom = bottom;
      return;
    }

    const diffLast = lastBottom - vh;

    // Wejście w strefę namagnesowania
    let enteredSnapWindow = 
      (diffLast > SNAP_WINDOW && diffNow <= SNAP_WINDOW) || 
      (diffLast < -SNAP_WINDOW && diffNow >= -SNAP_WINDOW);
    
    // Jesteśmy na krawędzi
    const onTheEdge = inSnapWindow;

    if (enteredSnapWindow || onTheEdge) {
      const targetY = window.scrollY + diffNow;
      startHold(targetY);
      lastBottom = bottom;
      return;
    }

    lastBottom = bottom;
  }

  // --- OBSŁUGA TOUCH (natychmiastowe zwolnienie na mobile) ---
  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!holding) return; 
    
    e.preventDefault();

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;

    if (Math.abs(deltaY) >= MOBILE_BREAK_OFFSET) {
      // Natychmiastowe zwolnienie blokady
      clearTimeout(releaseTimer);
      stopHold();
      activateReleaseGuard();
      return; 
    }
    
    // Na mobile, to cofanie scrolla w onScroll musi być natychmiastowe
    if (window.scrollY !== holdScrollY) {
        isProgrammaticScroll = true;
        window.scrollTo(0, holdScrollY);
    }
  }
  
  // --- OBSŁUGA WHEEL ---
  function onWheel(e) {
    if (isReleased || needsToExitSnapZone) return; // NIE ŁAP, jeśli trwa ochrona lub trwa cykl

    if (holding) {
      e.preventDefault();
      if (window.scrollY !== holdScrollY) {
        isProgrammaticScroll = true;
        window.scrollTo(0, holdScrollY);
      }
    }
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });

  console.log(
    `Snap-hold (Cykl Życia Blokady) aktywny. Wymagane pełne wyjście ze strefy (${SNAP_WINDOW}px) aby ponownie łapać.`
  );
})();