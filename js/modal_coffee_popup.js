// --- Ustawienia debugowania ---
const coffeeModalDebugMode = false;

// --- Ustawienia Częstotliwości i Czasu ---
const secondsUntilPopup = 20;             // ile sekund od 3. interakcji z mapą do pokazania pop-upu
const minMapInteractionsToTrigger = 3;    // minimalna liczba interakcji z mapą, aby uruchomić odliczanie
const intervalInHours = 24;               // minimalna przerwa między pokazaniami (w godzinach)
const daysInLongBreak = 5;                // długość przerwy po zakończeniu cyklu (w dniach)
const maxDisplayDaysInCycle = 2;          // ile razy z rzędu można wyświetlić pop-up w cyklu
const maxMonthlyViews = 10;               // maksymalna liczba wyświetleń w 30 dni
const downloadPopupDelayMs = 700;

// Nazwa zdarzenia do GA4
const eventName = 'modal_coffee_popup_shown';
const downloadPopupEventName = 'modal_coffee_download_popup_shown';
const fileDownloadEventName = 'map:file-download';

// --- Stan sesji dotyczący zaangażowania w mapę ---
let mapInteractionCount = 0;
let popupCountdownStarted = false;
let popupAlreadyShownThisSession = false;
let countdownTimer = null;
let downloadPopupScheduled = false;
let downloadPopupPending = false;
let lastDownloadSignalKey = '';
let lastDownloadSignalTime = 0;

// Funkcja do wysyłania zdarzenia do GA4
function sendGA4Event(customEventName, customEventLabel) {
    const ga4EventName = customEventName || eventName;

    if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
            event: ga4EventName,
            event_label: customEventLabel || 'Popup_wsparcie_Marcin',
            event_category: 'Engagement'
        });

        if (coffeeModalDebugMode) {
            console.log(
                '%c[DEBUG] GTM Event: ' + ga4EventName + ' pushed to dataLayer.',
                'color: green; font-weight: bold;'
            );
        }
    } else if (coffeeModalDebugMode) {
        console.error('[DEBUG] dataLayer is not defined. GTM event could not be sent.');
    }
}

// Funkcja otwierająca popup i aktualizująca storage
function showCoffeePopup(state) {
    if ($('#modal-coffee-download').hasClass('open')) {
        popupCountdownStarted = false;
        return;
    }

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

function isElementVisibleInViewport(element) {
    if (!element) {
        return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;
}

function findVisibleCoffeeReturnTarget() {
    function findBestMatch(selector) {
        return Array.from(document.querySelectorAll(selector))
            .filter(isElementVisibleInViewport)
            .sort(function (first, second) {
                const firstRect = first.getBoundingClientRect();
                const secondRect = second.getBoundingClientRect();

                return firstRect.top - secondRect.top || secondRect.right - firstRect.right;
            })[0] || null;
    }

    return findBestMatch(
        'header .navbar-fixed a.modal-trigger[data-target="modal-coffee"]'
    ) || findBestMatch(
        'header .navbar-fixed a.sidenav-trigger[data-target="sidenav-left"]'
    );
}

function animateCoffeeReturnTarget(target) {
    const indicator = target && target.querySelector('img, i') || target;

    if (!indicator || typeof indicator.animate !== 'function') {
        return;
    }

    indicator.animate([
        { transform: 'scale(1)', filter: 'brightness(1)' },
        { transform: 'scale(1.18)', filter: 'brightness(1.25)' },
        { transform: 'scale(1)', filter: 'brightness(1)' }
    ], {
        duration: 520,
        easing: 'ease-out'
    });
}

function animateDownloadCoffeeModalClose() {
    const modal = document.getElementById('modal-coffee-download');
    const target = findVisibleCoffeeReturnTarget();

    if (!modal || !target ||
        typeof modal.animate !== 'function' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const modalRect = modal.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const clone = modal.cloneNode(true);
    const deltaX = targetRect.left + targetRect.width / 2 -
        (modalRect.left + modalRect.width / 2);
    const deltaY = targetRect.top + targetRect.height / 2 -
        (modalRect.top + modalRect.height / 2);
    const scaleX = Math.max(targetRect.width / modalRect.width, 0.05);
    const scaleY = Math.max(targetRect.height / modalRect.height, 0.05);

    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('[id]').forEach(function (element) {
        element.removeAttribute('id');
    });

    Object.assign(clone.style, {
        display: 'block',
        position: 'fixed',
        left: modalRect.left + 'px',
        right: 'auto',
        top: modalRect.top + 'px',
        bottom: 'auto',
        width: modalRect.width + 'px',
        height: modalRect.height + 'px',
        maxHeight: 'none',
        margin: '0',
        opacity: '1',
        overflow: 'hidden',
        pointerEvents: 'none',
        transform: 'none',
        transformOrigin: 'center center',
        zIndex: '10001'
    });

    document.body.appendChild(clone);

    const animation = clone.animate([
        {
            opacity: 1,
            transform: 'translate(0, 0) scale(1, 1)'
        },
        {
            opacity: 0.15,
            transform: 'translate(' + deltaX + 'px, ' + deltaY + 'px) scale(' +
                scaleX + ', ' + scaleY + ')'
        }
    ], {
        duration: 480,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
    });

    animation.finished.then(function () {
        clone.remove();
        animateCoffeeReturnTarget(target);
    }).catch(function () {
        clone.remove();
    });
}

function canShowDownloadCoffeePopup() {
    const lastShown = parseInt(
        localStorage.getItem('lastCoffeeDownloadPopup') || '0',
        10
    );
    const intervalInMs = intervalInHours * 60 * 60 * 1000;

    return !lastShown || Date.now() - lastShown > intervalInMs;
}

function requestDownloadCoffeePopup() {
    if (downloadPopupScheduled || !canShowDownloadCoffeePopup()) {
        return;
    }

    downloadPopupScheduled = true;

    window.setTimeout(function () {
        downloadPopupScheduled = false;

        if (!canShowDownloadCoffeePopup()) {
            return;
        }

        if ($('#modal-coffee').hasClass('open')) {
            downloadPopupPending = true;
            return;
        }

        $('#modal-coffee-download').modal('open');
    }, downloadPopupDelayMs);
}

function emitFileDownloadSignal(fileName, source) {
    const now = Date.now();
    const normalizedFileName = (fileName || '').toString();

    if (normalizedFileName === lastDownloadSignalKey &&
        now - lastDownloadSignalTime < 1000) {
        return;
    }

    lastDownloadSignalKey = normalizedFileName;
    lastDownloadSignalTime = now;

    document.dispatchEvent(new CustomEvent(fileDownloadEventName, {
        detail: {
            fileName: normalizedFileName,
            source: source
        }
    }));
}

function attachFileDownloadObserver() {
    function wrapFileSaver() {
        const originalSaveAs = window.saveAs;

        if (typeof originalSaveAs !== 'function') {
            return false;
        }

        if (originalSaveAs.__coffeeDownloadObserved) {
            return true;
        }

        function trackedSaveAs(blob, fileName) {
            const result = originalSaveAs.apply(this, arguments);
            emitFileDownloadSignal(fileName, 'saveAs');
            return result;
        }

        trackedSaveAs.__coffeeDownloadObserved = true;
        window.saveAs = trackedSaveAs;
        return true;
    }

    document.addEventListener('click', function (event) {
        const link = event.target && event.target.closest ?
            event.target.closest('a[download]') : null;

        if (!link) {
            return;
        }

        window.setTimeout(function () {
            if (!event.defaultPrevented) {
                emitFileDownloadSignal(link.download, 'download-attribute');
            }
        }, 0);
    }, true);

    if (!wrapFileSaver()) {
        let attempts = 0;
        const fileSaverTimer = window.setInterval(function () {
            attempts += 1;
            if (wrapFileSaver() || attempts >= 40) {
                window.clearInterval(fileSaverTimer);
            }
        }, 250);
    }
}

$(document).ready(function () {
    $('#modal-coffee').modal({
        onOpenStart: function () {
            sendGA4Event();
        },
        onCloseEnd: function () {
            if (downloadPopupPending) {
                downloadPopupPending = false;
                requestDownloadCoffeePopup();
            }
        }
    });

    $('#modal-coffee-download').modal({
        onOpenStart: function () {
            localStorage.setItem('lastCoffeeDownloadPopup', String(Date.now()));
            sendGA4Event(
                downloadPopupEventName,
                'Popup_wsparcie_po_pobraniu'
            );
        },
        onCloseStart: function () {
            animateDownloadCoffeeModalClose();
        }
    });

    document.addEventListener(fileDownloadEventName, requestDownloadCoffeePopup);
    attachFileDownloadObserver();

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
