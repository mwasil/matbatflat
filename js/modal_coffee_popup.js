// --- Ustawienia debugowania ---
const coffeeModalDebugMode = false; // Zmień na FALSE, aby wyłączyć logowanie

// Nazwa zdarzenia, którą będziemy wysyłać do GA4
const eventName = 'modal_coffee_popup_shown';

// Funkcja do wysyłania zdarzenia do GA4
// Zaktualizowana funkcja do wysyłania zdarzenia przez GTM
function sendGA4Event() {
    // Sprawdzamy, czy dataLayer istnieje
    if (typeof dataLayer !== 'undefined') {
        // Używamy dataLayer.push() zamiast gtag()
        dataLayer.push({
            'event': eventName, // 'eventName' to wciąż 'modal_coffee_popup_shown'
            'event_label': 'Popup_wsparcie_Marcin',
            'event_category': 'Engagement'
        });

        if (coffeeModalDebugMode) {
            console.log('%c[DEBUG] GTM Event: ' + eventName + ' pushed to dataLayer.', "color: green; font-weight: bold;");
        }
    } else {
        if (coffeeModalDebugMode) {
            console.error('[DEBUG] dataLayer is not defined. GTM event could not be sent.');
        }
    }
}

// Główna funkcja, która kontroluje logikę wyświetlania pop-upu
function checkAndDisplayPopup() {
    const now = new Date().getTime();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    // Pobieramy dane z localStorage
    let lastPopupShown = localStorage.getItem('lastCoffeePopup');
    let popupViewCount = localStorage.getItem('coffeePopupViewCount');
    let firstPopupViewTimestamp = localStorage.getItem('coffeePopupFirstViewTimestamp');

    // Inicjalizacja, jeśli brak danych
    if (!popupViewCount) {
        popupViewCount = 0;
    }
    if (!firstPopupViewTimestamp) {
        firstPopupViewTimestamp = now;
        localStorage.setItem('coffeePopupFirstViewTimestamp', firstPopupViewTimestamp);
    }

    // Sprawdzamy, czy minęło 30 dni od pierwszego wyświetlenia
    if (now - firstPopupViewTimestamp > thirtyDaysInMs) {
        // Jeśli tak, resetujemy licznik i datę
        popupViewCount = 0;
        firstPopupViewTimestamp = now;
        localStorage.setItem('coffeePopupViewCount', popupViewCount);
        localStorage.setItem('coffeePopupFirstViewTimestamp', firstPopupViewTimestamp);
    }

    const hasViewsLeft = popupViewCount < 3;

    // Ustaw interwał w godzinach
    const intervalInHours = 48;
    const intervalInMs = intervalInHours * 60 * 60 * 1000;
    const popupNotRecentlyShown = !lastPopupShown || (now - lastPopupShown) > intervalInMs;

    if (coffeeModalDebugMode) {
        console.log('%c[DEBUG] ----- Stan Pop-upu -----', "color: #ff9800; font-weight: bold;");

        // Informacje o ostatnim wyświetleniu
        if (!lastPopupShown) {
            console.log('%c[DEBUG] Ostatnie wyświetlenie: BRAK DANYCH', "color: #03a9f4;");
        } else {
            const hoursPassed = Math.floor((now - lastPopupShown) / (1000 * 60 * 60));
            console.log(`%c[DEBUG] Ostatnie wyświetlenie: ${hoursPassed} godzin temu.`, "color: #03a9f4;");
        }

        // Informacje o limicie wyświetleń
        const daysLeft = Math.ceil((thirtyDaysInMs - (now - firstPopupViewTimestamp)) / (1000 * 60 * 60 * 24));
        console.log(`%c[DEBUG] Wyświetlono ${popupViewCount} z 3 razy.`, "color: #03a9f4;");
        console.log(`%c[DEBUG] Czas na zresetowanie licznika: ${daysLeft} dni.`, "color: #03a9f4;");

        // Warunki
        console.log(`%c[DEBUG] Warunek "${intervalInHours}h przerwy": ${popupNotRecentlyShown ? 'SPEŁNIONY ✅' : 'NIESPEŁNIONY ❌'}`, "color: #03a9f4;");
        console.log(`%c[DEBUG] Warunek "poniżej 3 wyświetleń": ${hasViewsLeft ? 'SPEŁNIONY ✅' : 'NIESPEŁNIONY ❌'}`, "color: #03a9f4;");
    }

    if (popupNotRecentlyShown && hasViewsLeft) {
        let secondsLeft = 60;
        const countdownTimer = setInterval(() => {
            if (secondsLeft >= 0) {
                if (coffeeModalDebugMode) {
                    console.clear(); // 1. Wyczyść konsolę

                    // 2. Wyświetl ponownie statyczne informacje o statusie
                    console.log('%c[DEBUG] ----- Stan Pop-upu -----', "color: #ff9800; font-weight: bold;");
                    if (!lastPopupShown) {
                        console.log('%c[DEBUG] Ostatnie wyświetlenie: BRAK DANYCH', "color: #03a9f4;");
                    } else {
                        const hoursPassed = Math.floor((now - lastPopupShown) / (1000 * 60 * 60));
                        console.log(`%c[DEBUG] Ostatnie wyświetlenie: ${hoursPassed} godzin temu.`, "color: #03a9f4;");
                    }
                    const daysLeft = Math.ceil((thirtyDaysInMs - (now - firstPopupViewTimestamp)) / (1000 * 60 * 60 * 24));
                    console.log(`%c[DEBUG] Wyświetlono ${popupViewCount} z 3 razy.`, "color: #03a9f4;");
                    console.log(`%c[DEBUG] Czas na zresetowanie licznika: ${daysLeft} dni.`, "color: #03a9f4;");
                    console.log(`%c[DEBUG] Warunek "${intervalInHours}h przerwy": ${popupNotRecentlyShown ? 'SPEŁNIONY ✅' : 'NIESPEŁNIONY ❌'}`, "color: #03a9f4;");
                    console.log(`%c[DEBUG] Warunek "poniżej 3 wyświetleń": ${hasViewsLeft ? 'SPEŁNIONY ✅' : 'NIESPEŁNIONY ❌'}`, "color: #03a9f4;");
                    
                    // 3. Wyświetl zaktualizowany licznik
                    console.log(`%c[DEBUG] Wyświetlenie pop-upu za ${secondsLeft}s...`, "color: #2196f3; font-weight: bold;");
                }
                secondsLeft--;
            } else {
                clearInterval(countdownTimer);
                if (coffeeModalDebugMode) {
                    console.log('%c[DEBUG] Wszystkie warunki spełnione. Wyświetlam pop-up.', "color: #4caf50; font-weight: bold;");
                }

                $('#modal-coffee').modal('open');
                localStorage.setItem('lastCoffeePopup', now);
                
                popupViewCount++;
                localStorage.setItem('coffeePopupViewCount', popupViewCount);
            }
        }, 1000);
    } else if (coffeeModalDebugMode) {
        console.warn('[DEBUG] Popup nie zostanie wyświetlony w tej sesji.');
    }
}

$(document).ready(function(){
    $('#modal-coffee').modal({
        onOpenStart: function(modal, trigger) {
            // Sprawdzamy, czy otwierany modal to ten, który nas interesuje
                sendGA4Event();
        }
    });
    checkAndDisplayPopup();
});