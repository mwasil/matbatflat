var searchDropdown, mapDropdown;





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