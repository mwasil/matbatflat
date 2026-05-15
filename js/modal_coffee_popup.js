// --- Ustawienia debugowania ---
const coffeeModalDebugMode = false;

// --- Ustawienia Częstotliwości i Czasu ---
const secondsUntilPopup = 20;             // ile sekund od 3. interakcji z mapą do pokazania pop-upu
const minMapInteractionsToTrigger = 3;    // minimalna liczba interakcji z mapą, aby uruchomić odliczanie
const intervalInHours = 24;               // minimalna przerwa między pokazaniami (w godzinach)
const daysInLongBreak = 5;                // długość przerwy po zakończeniu cyklu (w dniach)
const maxDisplayDaysInCycle = 2;          // ile razy z rzędu można wyświetlić pop-up w cyklu
const maxMonthlyViews = 10;               // maksymalna liczba wyświetleń w 30 dni

// Nazwa zdarzenia do GA4
const eventName = 'modal_coffee_popup_shown';

// --- Stan sesji dotyczący zaangażowania w mapę ---
let mapInteractionCount = 0;
let popupCountdownStarted = false;
let popupAlreadyShownThisSession = false;
let countdownTimer = null;

// Funkcja do wysyłania zdarzenia do GA4
function sendGA4Event() {
    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            event: eventName,
            event_label: 'Popup_wsparcie_Marcin',
            event_category: 'Engagement'
        });

        if (coffeeModalDebugMode) {
            console.log(
                '%c[DEBUG] GTM Event: ' + eventName + ' pushed to dataLayer.',
                'color: green; font-weight: bold;'
            );
        }
    } else if (coffeeModalDebugMode) {
        console.error('[DEBUG] dataLayer is not defined. GTM event could not be sent.');
    }
}

// Funkcja otwierająca popup i aktualizująca storage
function showCoffeePopup(state) {
    if (popupAlreadyShownThisSession) {
        if (coffeeModalDebugMode) {
            console.warn('[DEBUG] Popup został już pokazany w tej sesji. Pomijam.');
        }
        return;
    }

    const showTime = Date.now();

    if (coffeeModalDebugMode) {
        console.log(
            '%c[DEBUG] Odliczanie zakończone. Otwieram pop-up.',
            'color: #4caf50; font-weight: bold;'
        );
    }

    $('#modal-coffee').modal('open');
    popupAlreadyShownThisSession = true;

    localStorage.setItem('lastCoffeePopup', String(showTime));

    state.popupViewCount += 1;
    localStorage.setItem('coffeePopupViewCount', String(state.popupViewCount));

    state.displayCycleDay += 1;
    localStorage.setItem(
        'coffeePopupDisplayCycleDay',
        String(state.displayCycleDay)
    );

    if (coffeeModalDebugMode) {
        console.log('[DEBUG] displayCycleDay (po):', state.displayCycleDay);
    }

    if (state.displayCycleDay >= maxDisplayDaysInCycle) {
        state.lastLongBreakStart = showTime;
        localStorage.setItem(
            'coffeePopupLastLongBreakStart',
            String(state.lastLongBreakStart)
        );

        state.displayCycleDay = 0;
        localStorage.setItem('coffeePopupDisplayCycleDay', '0');

        if (coffeeModalDebugMode) {
            console.log(
                '%c[DEBUG] Koniec cyklu. Start długiej przerwy (' +
                    daysInLongBreak +
                    ' dni).',
                'color: #f44336; font-weight: bold;'
            );
        }
    }
}

// Główna funkcja sprawdzająca, czy popup w ogóle może być pokazany w tej sesji
function getPopupEligibilityState() {
    const now = Date.now();

    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const intervalInMs = intervalInHours * 60 * 60 * 1000;
    const longBreakInMs = daysInLongBreak * 24 * 60 * 60 * 1000;

    let lastPopupShown = parseInt(localStorage.getItem('lastCoffeePopup') || '0', 10);
    let popupViewCount = parseInt(localStorage.getItem('coffeePopupViewCount') || '0', 10);
    let firstPopupViewTimestamp = parseInt(
        localStorage.getItem('coffeePopupFirstViewTimestamp') || '0',
        10
    );
    let displayCycleDay = parseInt(
        localStorage.getItem('coffeePopupDisplayCycleDay') || '0',
        10
    );
    let lastLongBreakStart = parseInt(
        localStorage.getItem('coffeePopupLastLongBreakStart') || '0',
        10
    );

    if (!firstPopupViewTimestamp) {
        firstPopupViewTimestamp = now;
    }

    if (now - firstPopupViewTimestamp > thirtyDaysInMs) {
        popupViewCount = 0;
        displayCycleDay = 0;
        lastLongBreakStart = 0;
        firstPopupViewTimestamp = now;

        if (coffeeModalDebugMode) {
            console.log(
                '%c[DEBUG] Reset 30-dniowy: zeruję liczniki wyświetleń i cyklu.',
                'color: #2196f3; font-weight: bold;'
            );
        }
    }

    localStorage.setItem(
        'coffeePopupFirstViewTimestamp',
        String(firstPopupViewTimestamp)
    );
    localStorage.setItem('coffeePopupViewCount', String(popupViewCount));
    localStorage.setItem('coffeePopupDisplayCycleDay', String(displayCycleDay));
    localStorage.setItem('coffeePopupLastLongBreakStart', String(lastLongBreakStart));

    const hasViewsLeft = popupViewCount < maxMonthlyViews;
    const popupNotRecentlyShown =
        !lastPopupShown || now - lastPopupShown > intervalInMs;

    let inLongBreak = false;

    if (lastLongBreakStart > 0) {
        if (now - lastLongBreakStart < longBreakInMs) {
            inLongBreak = true;
        } else {
            lastLongBreakStart = 0;
            localStorage.setItem('coffeePopupLastLongBreakStart', '0');

            if (coffeeModalDebugMode) {
                console.log(
                    '%c[DEBUG] Zakończono długą przerwę. Można zacząć nowy cykl.',
                    'color: #ff9800; font-weight: bold;'
                );
            }
        }
    }

    const canDisplayToday = !inLongBreak && displayCycleDay < maxDisplayDaysInCycle;
    const isEligible = popupNotRecentlyShown && hasViewsLeft && canDisplayToday;

    if (coffeeModalDebugMode) {
        console.log('[DEBUG] hasViewsLeft:', hasViewsLeft);
        console.log('[DEBUG] popupNotRecentlyShown:', popupNotRecentlyShown);
        console.log('[DEBUG] inLongBreak:', inLongBreak);
        console.log('[DEBUG] displayCycleDay (przed):', displayCycleDay);
        console.log('[DEBUG] canDisplayToday:', canDisplayToday);
        console.log('[DEBUG] isEligible:', isEligible);
    }

    return {
        isEligible,
        popupViewCount,
        displayCycleDay,
        lastLongBreakStart
    };
}

// Start odliczania po osiągnięciu wymaganej liczby interakcji
function startPopupCountdownIfEligible() {
    if (popupCountdownStarted) {
        if (coffeeModalDebugMode) {
            console.log('[DEBUG] Odliczanie już trwa. Nie uruchamiam ponownie.');
        }
        return;
    }

    if (popupAlreadyShownThisSession) {
        if (coffeeModalDebugMode) {
            console.log('[DEBUG] Popup już pokazany w tej sesji.');
        }
        return;
    }

    const state = getPopupEligibilityState();

    if (!state.isEligible) {
        if (coffeeModalDebugMode) {
            console.warn('[DEBUG] Popup nie może być pokazany w tej sesji z powodu limitów/logiki cyklu.');
        }
        return;
    }

    popupCountdownStarted = true;
    let secondsLeft = secondsUntilPopup;

    if (coffeeModalDebugMode) {
        console.log(
            '%c[DEBUG] Osiągnięto ' +
                minMapInteractionsToTrigger +
                ' interakcje z mapą. Start odliczania: ' +
                secondsUntilPopup +
                's.',
            'color: #4caf50; font-weight: bold;'
        );
    }

    countdownTimer = setInterval(() => {
        if (secondsLeft <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;

            const freshState = getPopupEligibilityState();

            if (!freshState.isEligible) {
                if (coffeeModalDebugMode) {
                    console.warn('[DEBUG] Warunki przestały być spełnione przed końcem odliczania. Popup anulowany.');
                }
                return;
            }

            showCoffeePopup(freshState);
        } else {
            if (coffeeModalDebugMode) {
                console.log('[DEBUG] Sekundy do popupu:', secondsLeft);
            }
            secondsLeft--;
        }
    }, 1000);
}

// Rejestracja interakcji z mapą
function registerMapInteraction(source) {
    if (popupAlreadyShownThisSession) {
        return;
    }

    mapInteractionCount += 1;

    if (coffeeModalDebugMode) {
        console.log(
            '%c[DEBUG] Interakcja mapy #' + mapInteractionCount + ' (' + source + ')',
            'color: #03a9f4; font-weight: bold;'
        );
    }

    if (mapInteractionCount >= minMapInteractionsToTrigger) {
        startPopupCountdownIfEligible();
    }
}

$(document).ready(function () {
    $('#modal-coffee').modal({
        onOpenStart: function () {
            sendGA4Event();
        }
    });

    getPopupEligibilityState();

    map.on('click', function () {
        registerMapInteraction('click');
    });

    map.on('dragend', function () {
        registerMapInteraction('dragend');
    });

    map.on('zoomend', function () {
        registerMapInteraction('zoomend');
    });
});