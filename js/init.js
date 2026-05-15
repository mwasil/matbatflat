var searchDropdown, mapDropdown;





(function ($) {
  $(function () {

    $('.sidenav').sidenav();

    $('.tooltipped').tooltip();

    if (window.innerWidth <= 1024) { // Uruchamia się dla urządzeń mobilnych i tabletów (do 1024px szerokości)
      $('.pushpin').pushpin({
        top: 600,
        offset: 90
      });
    }
    $('.dropdown-trigger').dropdown({
      constrainWidth: false
    });

    try {
      resizableColumns();
    } catch (e) {
      // Opcjonalnie: Zaloguj błąd, jeśli chcesz wiedzieć, że funkcja nie zadziałała.
      console.warn("Błąd przy wywoływaniu resizableColumns:", e); 
    }

    if ($('#map').length === 0) {
      $('.switch-map-option').css('display', 'none'); //ukryj opcje mapy w menu jeśli nie ma mapy
    }

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
      constrainWidth: false,
      autoFocus: false
    });

    $('.map-search').on('click', function () {
      // Znajdź pole input z klasą 'leaflet-locationiq-input'
      var inputField = $('input.leaflet-locationiq-input');

      // Sprawdź, czy pole input istnieje
      if (inputField.length > 0) {
        // Ustaw fokus na pole input
        inputField.focus();
        setTimeout(function () {
          inputField.select();
        }, 500);
      } else {
        console.warn('Pole input z klasą "leaflet-locationiq-input" nie zostało znalezione.');
      }
    });

    //$('#search-results-container').append($('.leaflet-locationiq-results'));
    $('.leaflet-locationiq-control').append($('.leaflet-locationiq-results'));

    // Prevent Materialize dropdown keyboard navigation from stealing focus
    // from the embedded LocationIQ input while the user is typing.
    $('#dropdown-search').on('keydown keyup keypress', '.leaflet-locationiq-input', function (e) {
      e.stopPropagation();
    });

    $('#dropdown-search').on('keydown keyup keypress', '.leaflet-locationiq-results', function (e) {
      e.stopPropagation();
    });

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

    $('.leaflet-right .leaflet-control-layers').hide();

    addToToc();

  }); // end of document ready
})(jQuery); // end of jQuery name space
