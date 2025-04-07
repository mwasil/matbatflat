
if (window.location.hash === '#!') {
    // Usuwa fragment #! z URL i przekierowuje na nowy adres
    history.replaceState(null, null, window.location.pathname);
}


let addToToc = function () {
    function createSlug(text) {
      return text.toLowerCase()
        .replace(/[ąĄ]/g, "a")
        .replace(/[ćĆ]/g, "c")
        .replace(/[ęĘ]/g, "e")
        .replace(/[łŁ]/g, "l")
        .replace(/[ńŃ]/g, "n")
        .replace(/[óÓ]/g, "o")
        .replace(/[śŚ]/g, "s")
        .replace(/[źŹżŻ]/g, "z")
        .replace(/[^\w\s]/g, '') // Usuwanie znaków specjalnych
        .replace(/\s+/g, '_'); // Zamiana spacji na podkreślenia
    }
  
    // Znajdź wszystkie nagłówki h1-h6 w elemencie <article>
    const articleElement = document.querySelector('article');
    if (!articleElement) {
      console.warn('Element <article> nie został znaleziony.');
      return;
    }
    const headers = articleElement.querySelectorAll('h1, h2');
  
    // Znajdź element spisu treści (ul#toc)
    const tocElement = document.getElementById('toc');
    if (!tocElement) {
      console.warn('Element #toc nie został znaleziony.');
      return;
    }
  
    let targetHeader = null; // Zmienna do przechowywania pasującego nagłówka
  
    headers.forEach(header => {
      const headerText = header.textContent.trim();
      const headerId = createSlug(headerText);
  
      // Ustawienie identyfikatora dla nagłówka
      header.setAttribute('id', headerId);
  
      // Sprawdzenie, czy hash w URL pasuje do nagłówka
      if (headerId === currentHash) {
        targetHeader = header;
      }
  
      // Tworzenie nowego elementu <li> dla spisu treści
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', `#${headerId}`);
      link.textContent = headerText;
  
      listItem.appendChild(link);
      tocElement.appendChild(listItem); // Dodanie elementu do spisu treści
    });
  
    // Przewinięcie do nagłówka, jeśli pasuje do hasha
    if (targetHeader) {
      setTimeout(() => {
        targetHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  
    $('.scrollspy').scrollSpy({
      scrollOffset: 70
    });
  };

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var embed;

if (getUrlVars()['type']) {
    if (getUrlVars()['type'] === 'embed') {
        document.getElementById("reklama").style.display = "none";
        document.getElementById("reklamowka").style.display = "none";
        embed = true;
    }
}

if (getUrlVars()['type']) {
    if (getUrlVars()['type'] === 'embed') {
        document.getElementById("reklama").style.display = "none";
        document.getElementById("reklamowka").style.display = "none";
        embed = true;
    }
    if (getUrlVars()['type'] === 'static') {
        document.body.classList.add("static");
    }
}

document.addEventListener("DOMContentLoaded", function() {
    /* przycisk do przewijania w górę */
    if (window.innerWidth <= 1024) {
        window.addEventListener('scroll', function () {
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (window.scrollY > 300) { // Pokaż przycisk po przewinięciu 300px
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        });
    }           
})