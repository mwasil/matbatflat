document.addEventListener('DOMContentLoaded', function () {
  if (!window.matchMedia || !window.matchMedia('(max-width: 600px)').matches) return;

  var lastScroll = window.pageYOffset || document.documentElement.scrollTop;
  var ticking = false;
  var threshold = 100; // minimalne przewinięcie przed reakcją

  // Jeśli chcesz ustawić margines startu chowania, ustaw w nagłówku:
  // window.headerCoffeeMargin = <liczba_px>
  var coffeeHideMargin = (typeof window.headerCoffeeMargin === 'number') ? window.headerCoffeeMargin : 0;

  // NOWE: klasa ma zostać zdjęta dopiero, gdy wrócisz blisko góry strony
  var showLogoTopMargin = 300; // px od góry

  function handleScroll() {
    var st = window.pageYOffset || document.documentElement.scrollTop;
    var delta = st - lastScroll;

    // Reaguj dopiero na większe ruchy, żeby nie "mrugało"
    if (Math.abs(delta) > threshold) {
      if (delta > 0 && st > coffeeHideMargin && st > threshold) {
        // Scroll w dół: chowaj logo / pokazuj coffee
        document.body.classList.add('hide-logo-show-coffee');
      } else if (delta < 0) {
        // Scroll w górę: zdejmuj klasę dopiero blisko góry
        if (st <= showLogoTopMargin) {
          document.body.classList.remove('hide-logo-show-coffee');
        }
      }

      lastScroll = st <= 0 ? 0 : st;
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
});
