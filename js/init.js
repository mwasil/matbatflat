var searchDropdown, mapDropdown;

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
  if (window.innerWidth <= 1024) { // Uruchamia się dla urządzeń mobilnych i tabletów (do 1024px szerokości)
    // Znajdź wszystkie nagłówki h1-h6 w elemencie #wsmap-content
    const contentElement = document.getElementById('wsmap-content');
    const headers = contentElement.querySelectorAll('h1, h2');

    // Znajdź element spisu treści (ul#toc)
    const tocElement = document.getElementById('toc');

    headers.forEach(header => {
      const headerText = header.textContent;
      const headerId = createSlug(headerText);

      // Ustawienie identyfikatora dla nagłówka
      header.setAttribute('id', headerId);

      // Dodanie klasy CSS scrollspy
      header.classList.add('scrollspy');

      // Tworzenie nowego elementu <li> dla spisu treści
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', `#${headerId}`);
      link.textContent = headerText;

      listItem.appendChild(link);
      tocElement.appendChild(listItem); // Dodanie elementu do spisu treści



    });


  }
  $('.scrollspy').scrollSpy({
    scrollOffset: 70
  });
};

(function ($) {
  $(function () {


    $('.leaflet-control-layers-list').appendTo($('#dropdown-map'));
    mapDropdown = $(".dropdown-trigger[data-target='dropdown-map']").dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    $('#dropdown-search').append($('.leaflet-locationiq-control'));
    searchDropdown = $(".dropdown-trigger[data-target='dropdown-search']").dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    //$('#search-results-container').append($('.leaflet-locationiq-results'));
    $('.leaflet-locationiq-control').append($('.leaflet-locationiq-results'));

    $(".dropdown").each(function (index) {

      $(this).children('a').attr("data-target", "dropdown" + index).addClass('dropdown-trigger');
      $(this).children('ul').attr("id", "dropdown" + index);
      $(this).children('ul').addClass('dropdown-content');
    });

    $('.dropdown>a').dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    if ($('#map').length == 0) $(".map-dropdown").hide();

    $('.leaflet-locationiq-input').addClass('browser-default').attr('type', 'text');

    $('.sledz').click(function () {
      ga('send', 'event', {
        eventCategory: 'Mapa',
        eventAction: 'Klik',
        eventLabel: this.id
      });
    });

    $('#przycisk_szukaj').click(function () {
      ga('send', 'event', {
        eventCategory: 'Mapa',
        eventAction: 'Szukaj',
        eventLabel: $('#pole_szukaj').val()
      });
    });

    $('#zamknij_reklame').on("click", function () {
      $('#reklamowka').fadeOut();
    })



    $('.leaflet-right .leaflet-control-layers').hide();

    addToToc();

  }); // end of document ready
})(jQuery); // end of jQuery name space