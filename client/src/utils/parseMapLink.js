/**
 * Parse Google Maps and Apple Maps URLs to extract coordinates and place names.
 * 
 * Supported formats:
 * - https://www.google.com/maps/place/.../@40.758,-73.985,...
 * - https://www.google.com/maps?q=40.758,-73.985
 * - https://www.google.com/maps/dir/.../@40.758,-73.985,...
 * - https://maps.google.com/...
 * - https://goo.gl/maps/... (won't extract coords, but detected as map link)
 * - https://maps.apple.com/?ll=40.758,-73.985
 * - https://maps.apple.com/?daddr=40.758,-73.985
 * - https://maps.apple.com/?q=Place+Name&ll=40.758,-73.985
 */

export function isMapLink(text) {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    return (
        t.includes('google.com/maps') ||
        t.includes('maps.google.com') ||
        t.includes('goo.gl/maps') ||
        t.includes('maps.apple.com') ||
        t.includes('maps.app.goo.gl')
    );
}

export function parseMapLink(url) {
    if (!url) return null;
    const text = url.trim();

    // Google Maps: /@lat,lng,zoom
    const atMatch = text.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
        return {
            lat: parseFloat(atMatch[1]),
            lng: parseFloat(atMatch[2]),
            name: extractGooglePlaceName(text)
        };
    }

    // Google Maps: ?q=lat,lng or &q=lat,lng
    const qMatch = text.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (qMatch) {
        return {
            lat: parseFloat(qMatch[1]),
            lng: parseFloat(qMatch[2]),
            name: null
        };
    }

    // Google Maps: ?q=Place+Name (text query without coords)
    const qTextMatch = text.match(/[?&]q=([^&]+)/);
    if (qTextMatch && text.includes('google')) {
        return {
            searchQuery: decodeURIComponent(qTextMatch[1].replace(/\+/g, ' ')),
            lat: null,
            lng: null,
            name: decodeURIComponent(qTextMatch[1].replace(/\+/g, ' '))
        };
    }

    // Apple Maps: ll=lat,lng
    const llMatch = text.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (llMatch) {
        return {
            lat: parseFloat(llMatch[1]),
            lng: parseFloat(llMatch[2]),
            name: extractApplePlaceName(text)
        };
    }

    // Apple Maps: daddr=lat,lng
    const daddrMatch = text.match(/[?&]daddr=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (daddrMatch) {
        return {
            lat: parseFloat(daddrMatch[1]),
            lng: parseFloat(daddrMatch[2]),
            name: null
        };
    }

    // Google Maps place URL: /place/Place+Name/
    const placeMatch = text.match(/\/place\/([^/]+)/);
    if (placeMatch) {
        return {
            searchQuery: decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')),
            lat: null,
            lng: null,
            name: decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
        };
    }

    return null;
}

function extractGooglePlaceName(url) {
    const placeMatch = url.match(/\/place\/([^/@]+)/);
    if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }
    return null;
}

function extractApplePlaceName(url) {
    const qMatch = url.match(/[?&]q=([^&]+)/);
    if (qMatch) {
        return decodeURIComponent(qMatch[1].replace(/\+/g, ' '));
    }
    return null;
}
