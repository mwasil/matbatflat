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