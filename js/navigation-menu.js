(function () {
  'use strict';

  function setExpanded(item, expanded, mobile) {
    var toggle = item.querySelector(':scope > .nav-menu-toggle');
    if (!toggle) return;

    var submenu = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!submenu) return;

    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    item.classList.toggle('is-open', expanded);

    if (mobile) {
      submenu.hidden = !expanded;
    }

    var label = item.querySelector(':scope > .nav-menu-link');
    if (label) {
      toggle.setAttribute('aria-label', (expanded ? 'Zwiń podmenu: ' : 'Rozwiń podmenu: ') + label.textContent.trim());
    }
  }

  function closeSiblings(item, mobile) {
    var parent = item.parentElement;
    if (!parent) return;

    Array.prototype.forEach.call(parent.children, function (sibling) {
      if (sibling !== item && sibling.classList.contains('nav-menu-mobile-entry')) {
        setExpanded(sibling, false, mobile);
      }
    });
  }

  document.querySelectorAll('.nav-menu-toggle[aria-expanded="true"]').forEach(function (toggle) {
    var item = toggle.closest('.nav-menu-mobile-entry, .nav-menu-desktop-entry');
    if (item) item.classList.add('is-open');
  });

  document.addEventListener('pointerover', function (event) {
    var item = event.target.closest('.nav-menu-desktop-entry');
    if (item && item.querySelector(':scope > .nav-menu-toggle')) setExpanded(item, true, false);
  });

  document.addEventListener('pointerout', function (event) {
    var item = event.target.closest('.nav-menu-desktop-entry');
    if (item && !item.contains(event.relatedTarget)) setExpanded(item, false, false);
  });

  document.addEventListener('focusin', function (event) {
    var item = event.target.closest('.nav-menu-desktop-entry');
    if (item && item.querySelector(':scope > .nav-menu-toggle')) setExpanded(item, true, false);
  });

  document.addEventListener('focusout', function (event) {
    var item = event.target.closest('.nav-menu-desktop-entry');
    if (item && !item.contains(event.relatedTarget)) setExpanded(item, false, false);
  });

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('.nav-menu-toggle');
    if (toggle) {
      event.preventDefault();
      var item = toggle.closest('.nav-menu-mobile-entry, .nav-menu-desktop-entry');
      var mobile = !!toggle.closest('.sidenav');
      var expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (!expanded && mobile) closeSiblings(item, true);
      setExpanded(item, !expanded, mobile);
      return;
    }

    if (!event.target.closest('.nav-desktop-list')) {
      document.querySelectorAll('.nav-desktop-list .nav-menu-desktop-entry.is-open').forEach(function (item) {
        setExpanded(item, false, false);
      });
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;

    var openItem = document.querySelector('.nav-menu-mobile-entry.is-open, .nav-menu-desktop-entry.is-open');
    if (!openItem) return;

    setExpanded(openItem, false, !!openItem.closest('.sidenav'));
    var toggle = openItem.querySelector(':scope > .nav-menu-toggle');
    if (toggle) toggle.focus();
  });
})();
