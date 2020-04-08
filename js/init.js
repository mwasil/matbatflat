var searchDropdown, mapDropdown;

(function ($) {
  $(function () {

    $('.sidenav').sidenav();

    $('#dropdown-map').append($('.leaflet-control-layers-list'));
    mapDropdown = $(".dropdown-trigger[data-target='dropdown-map']").dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    $('#dropdown-search').append($('.leaflet-pelias-control'));
    searchDropdown = $(".dropdown-trigger[data-target='dropdown-search']").dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    $('#search-results-container').append($('.leaflet-pelias-results'));


    $( ".dropdown" ).each(function( index ) {
      console.log(index);
      $(this).children('a').attr("data-target", "dropdown"+index).addClass('dropdown-trigger');
      $(this).children('ul').attr("id", "dropdown"+index);
      $(this).children('ul').addClass('dropdown-content');
    });

    $('.dropdown>a').dropdown({
      closeOnClick: false,
      hover: false,
      constrainWidth: false
    });

    if ($('#map').length==0) $(".map-dropdown").hide();

    $('.leaflet-pelias-input').addClass('browser-default').attr('type','text');

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

    function getUrlVars() {
      var vars = {};
      var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
      });
      return vars;
    }
    var embed;
  
    if (getUrlVars()['type']) {
      if (getUrlVars()['type'] = 'embed') {
        $("#reklama").hide();
        $("#reklamowka").hide();
        embed = true;
      }
    };

    $('.leaflet-right .leaflet-control-layers').hide();
  }); // end of document ready
})(jQuery); // end of jQuery name space