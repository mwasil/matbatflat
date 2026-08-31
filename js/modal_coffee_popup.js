// --- Ustawienia debugowania ---
const coffeeModalDebugMode = false;

// --- Ustawienia Częstotliwości i Czasu ---
const coffeeExperimentName = 'coffee_popup_wait_time_v1';
const coffeeExperimentVariants = [20, 40, 60];
const coffeeExperimentEndpoint = '/stat/modal-coffee/collect.php';
const minMapInteractionsToTrigger = 3;    // minimalna liczba interakcji z mapą, aby uruchomić odliczanie
const intervalInHours = 24;               // minimalna przerwa między pokazaniami (w godzinach)
const daysInLongBreak = 5;                // długość przerwy po zakończeniu cyklu (w dniach)
const maxDisplayDaysInCycle = 2;          // ile razy z rzędu można wyświetlić pop-up w cyklu
const maxMonthlyViews = 10;               // maksymalna liczba wyświetleń w 30 dni
const downloadPopupDelayMs = 700;

// Nazwa zdarzenia do GA4
const eventName = 'modal_coffee_popup_shown';
const buttonClickEventName = 'modal_coffee_button_click';
const externalLinkClickEventName = 'modal_coffee_external_link_click';
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
let mapObserverAttached = false;
let coffeeButtonObserverAttached = false;
let coffeeExternalLinkObserverAttached = false;
let lastCoffeeModalShownSignalTime = 0;
let coffeePopupOpenStartedAt = 0;
let coffeePopupOpenSource = 'manual';

function getCoffeeExperimentContext() {
    const storagePrefix = 'coffeeExperiment_' + coffeeExperimentName + '_';
    const visitorStorageKey = storagePrefix + 'visitorId';
    const variantStorageKey = storagePrefix + 'variantSeconds';

    let visitorId = '';
    let variantSeconds = 0;
    let isNewAssignment = false;

    try {
        visitorId = localStorage.getItem(visitorStorageKey) || '';
        if (!visitorId && window.crypto && typeof window.crypto.randomUUID === 'function') {
            visitorId = window.crypto.randomUUID();
        }
        if (!visitorId) {
            visitorId = 'v-' + Date.now().toString(36) + '-' +
                Math.random().toString(36).slice(2, 12);
        }
        localStorage.setItem(visitorStorageKey, visitorId);

        variantSeconds = parseInt(
            localStorage.getItem(variantStorageKey) || '0',
            10
        );

        if (coffeeExperimentVariants.indexOf(variantSeconds) === -1) {
            variantSeconds = coffeeExperimentVariants[
                Math.floor(Math.random() * coffeeExperimentVariants.length)
            ];
            localStorage.setItem(variantStorageKey, String(variantSeconds));
            isNewAssignment = true;
        }
    } catch (error) {
        visitorId = visitorId || 'session-' + Date.now().toString(36) + '-' +
            Math.random().toString(36).slice(2, 12);
    }

    if (coffeeExperimentVariants.indexOf(variantSeconds) === -1) {
        variantSeconds = coffeeExperimentVariants[0];
        isNewAssignment = true;
    }

    return {
        visitorId: visitorId,
        variantSeconds: variantSeconds,
        isNewAssignment: isNewAssignment
    };
}

const coffeeExperimentContext = getCoffeeExperimentContext();

function getCoffeeDeviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;

    if (width < 768) {
        return 'mobile';
    }
    if (width < 1024) {
        return 'tablet';
    }
    return 'desktop';
}

function getCoffeePageContext() {
    const pageUrl = window.location.href.split('#')[0];
    const parsedUrl = new URL(pageUrl, window.location.origin);
    let referrerHost = '';

    if (document.referrer) {
        try {
            referrerHost = new URL(document.referrer).host;
        } catch (error) {
            referrerHost = '';
        }
    }

    return {
        page_url: pageUrl.slice(0, 1000),
        page_path: (parsedUrl.pathname + parsedUrl.search).slice(0, 500),
        device_type: getCoffeeDeviceType(),
        viewport_width: window.innerWidth || document.documentElement.clientWidth || 0,
        referrer_host: referrerHost.slice(0, 255)
    };
}

function createCoffeeEventId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return 'e-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 14);
}

function sendCoffeeExperimentEvent(eventType, details) {
    const payload = Object.assign({
        event_id: createCoffeeEventId(),
        event_type: eventType,
        experiment_name: coffeeExperimentName,
        variant_seconds: coffeeExperimentContext.variantSeconds,
        visitor_id: coffeeExperimentContext.visitorId,
        client_timestamp: Date.now(),
        popup_type: 'main',
        popup_source: 'map_interaction'
    }, getCoffeePageContext(), details || {});

    const body = JSON.stringify(payload);
    const endpoint = new URL(coffeeExperimentEndpoint, window.location.origin).href;

    try {
        if (navigator.sendBeacon) {
            const accepted = navigator.sendBeacon(
                endpoint,
                new Blob([body], { type: 'application/json' })
            );
            if (accepted) {
                return;
            }
        }
    } catch (error) {
        // Fallback below handles browsers that reject sendBeacon requests.
    }

    if (typeof window.fetch === 'function') {
        window.fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body,
            keepalive: true,
            credentials: 'same-origin'
        }).catch(function () {});
    }
}

function sendCoffeeExperimentAssignmentIfNeeded() {
    if (!coffeeExperimentContext.isNewAssignment) {
        return;
    }

    sendCoffeeExperimentEvent('experiment_assigned', {
        popup_type: 'main',
        popup_source: 'assignment'
    });
}

function recordCoffeePopupClosed(closeReason) {
    if (!coffeePopupOpenStartedAt) {
        return;
    }

    const popupType = $('#modal-coffee-download').hasClass('open') ? 'download' : 'main';
    const popupSource = popupType === 'download' ? 'download' : coffeePopupOpenSource;

    sendCoffeeExperimentEvent('popup_closed', {
        popup_type: popupType,
        popup_source: popupSource,
        close_reason: closeReason || 'modal',
        duration_seconds: Math.max(
            0,
            (Date.now() - coffeePopupOpenStartedAt) / 1000
        )
    });
    coffeePopupOpenStartedAt = 0;
}

window.addEventListener('pagehide', function () {
    recordCoffeePopupClosed('pagehide');
});

// Funkcja do wysyłania zdarzenia do GA4
function sendGA4Event(customEventName, customEventLabel) {
    const ga4EventName = customEventName || eventName;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
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
}

// Funkcja otwierająca popup i aktualizująca storage
function sendCoffeeModalShownEvent() {
    const now = Date.now();

    if (now - lastCoffeeModalShownSignalTime < 1000) {
        return;
    }

    lastCoffeeModalShownSignalTime = now;
    sendGA4Event(eventName, 'Popup_wsparcie_Marcin');
}

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

    coffeePopupOpenSource = 'map_interaction';
    $('#modal-coffee').modal('open');
    sendCoffeeModalShownEvent();
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
    let secondsLeft = coffeeExperimentContext.variantSeconds;

    if (coffeeModalDebugMode) {
        console.log(
            '%c[DEBUG] Osiągnięto ' +
                minMapInteractionsToTrigger +
                ' interakcje z mapą. Start odliczania: ' +
                coffeeExperimentContext.variantSeconds +
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

function getInteractiveMapInstance() {
    if (window.map && typeof window.map.on === 'function') {
        return window.map;
    }

    if (window.ws3dMap && typeof window.ws3dMap.on === 'function') {
        return window.ws3dMap;
    }

    return null;
}

function attachMapInteractionObserver() {
    if (mapObserverAttached) {
        return;
    }

    let attemptsLeft = 40;

    function tryAttach() {
        const interactiveMap = getInteractiveMapInstance();

        if (interactiveMap) {
            mapObserverAttached = true;
            interactiveMap.on('click', function () {
                registerMapInteraction('click');
            });
            interactiveMap.on('dragend', function () {
                registerMapInteraction('dragend');
            });
            interactiveMap.on('zoomend', function () {
                registerMapInteraction('zoomend');
            });
            return;
        }

        attemptsLeft -= 1;
        if (attemptsLeft > 0) {
            window.setTimeout(tryAttach, 250);
        } else if (coffeeModalDebugMode) {
            console.warn('[DEBUG] Nie znaleziono instancji mapy do liczenia interakcji.');
        }
    }

    tryAttach();
}

function attachCoffeeButtonObserver() {
    if (coffeeButtonObserverAttached) {
        return;
    }

    coffeeButtonObserverAttached = true;

    document.addEventListener('click', function (event) {
        const trigger = event.target && event.target.closest ?
            event.target.closest('a[data-target="modal-coffee"]') : null;

        if (!trigger) {
            return;
        }

        coffeePopupOpenSource = 'manual';
        sendGA4Event(buttonClickEventName, 'Postaw_kawe_przycisk');

        window.setTimeout(function () {
            const modal = $('#modal-coffee');

            if (!modal.length) {
                return;
            }

            if (!modal.hasClass('open') && typeof modal.modal === 'function') {
                modal.modal('open');
            }

            if (modal.hasClass('open')) {
                sendCoffeeModalShownEvent();
            }
        }, 0);
    }, true);
}

function attachCoffeeExternalLinkObserver() {
    if (coffeeExternalLinkObserverAttached) {
        return;
    }

    coffeeExternalLinkObserverAttached = true;

    document.addEventListener('click', function (event) {
        const link = event.target && event.target.closest ?
            event.target.closest(
                '#modal-coffee a[href^="https://buycoffee.to/"], ' +
                '#modal-coffee-download a[href^="https://buycoffee.to/"]'
            ) : null;

        if (!link) {
            return;
        }

        sendGA4Event(
            externalLinkClickEventName,
            'Postaw_kawe_link_buycoffee'
        );

        const parentModal = link.closest('#modal-coffee-download');
        if (parentModal || coffeePopupOpenSource === 'map_interaction' || coffeePopupOpenSource === 'manual') {
            sendCoffeeExperimentEvent('buycoffee_click', {
                popup_type: parentModal ? 'download' : 'main',
                popup_source: parentModal ? 'download' : coffeePopupOpenSource
            });
        }
    }, true);
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

attachCoffeeButtonObserver();

$(document).ready(function () {
    $('#modal-coffee').modal({
        preventScrolling: false,
        onOpenStart: function () {
            coffeePopupOpenStartedAt = Date.now();
            if (coffeePopupOpenSource === 'map_interaction' || coffeePopupOpenSource === 'manual') {
                sendCoffeeExperimentEvent('popup_shown', {
                    popup_type: 'main',
                    popup_source: coffeePopupOpenSource
                });
            }
            sendCoffeeModalShownEvent();
        },
        onCloseStart: function () {
            recordCoffeePopupClosed('modal');
        },
        onCloseEnd: function () {
            if (downloadPopupPending) {
                downloadPopupPending = false;
                requestDownloadCoffeePopup();
            }
        }
    });

    $('#modal-coffee-download').modal({
        preventScrolling: false,
        onOpenStart: function () {
            localStorage.setItem('lastCoffeeDownloadPopup', String(Date.now()));
            coffeePopupOpenStartedAt = Date.now();
            sendCoffeeExperimentEvent('popup_shown', {
                popup_type: 'download',
                popup_source: 'download'
            });
            sendGA4Event(
                downloadPopupEventName,
                'Popup_wsparcie_po_pobraniu'
            );
        },
        onCloseStart: function () {
            recordCoffeePopupClosed('modal');
            animateDownloadCoffeeModalClose();
        }
    });

    document.addEventListener(fileDownloadEventName, requestDownloadCoffeePopup);
    attachFileDownloadObserver();
    attachCoffeeButtonObserver();
    attachCoffeeExternalLinkObserver();
    sendCoffeeExperimentAssignmentIfNeeded();

    getPopupEligibilityState();
    attachMapInteractionObserver();
});
