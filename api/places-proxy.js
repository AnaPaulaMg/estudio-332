/**
 * Estudio 332 - Google Places API Proxy
 * 
 * Secure server-side proxy for Google Places API (v1).
 * Handles both place search (searchText) and place details.
 * 
 * To use:
 * 1. Add GOOGLE_PLACES_API_KEY to your Vercel Project Settings > Environment Variables
 * 2. Deploy this file to /api/places-proxy.js
 * 3. Frontend calls:
 *    - Search: /api/places-proxy?textQuery=YOUR_QUERY&languageCode=pt-BR
 *    - Details: /api/places-proxy?placeId=PLACE_ID&fields=displayName,rating,userRatingCount,reviews
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { textQuery, placeId, languageCode, fields, regionCode } = req.query;

  // Get API key SECURELY from Vercel environment variables
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('Google Places API key not configured in Vercel environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Determine which Google API endpoint to call
  let googleUrl;
  let requestOptions = {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
  };

  if (placeId && typeof placeId === 'string') {
    // Place Details endpoint
    googleUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
    const fieldList = fields || 'displayName,rating,userRatingCount,reviews';
    googleUrl.searchParams.set('fields', fieldList);
    // Optional parameters
    if (languageCode && typeof languageCode === 'string') googleUrl.searchParams.set('languageCode', languageCode);
    if (regionCode && typeof regionCode === 'string') googleUrl.searchParams.set('regionCode', regionCode);
  } else if (textQuery && typeof textQuery === 'string') {
    // Place Search (searchText) endpoint
    googleUrl = new URL('https://places.googleapis.com/v1/places:searchText');
    requestOptions.method = 'POST';
    requestOptions.headers['Content-Type'] = 'application/json';
    
    // Field mask for search response
    const fieldMask = fields || 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount';
    requestOptions.headers['X-Goog-FieldMask'] = fieldMask;
    
    // Request body
    const body = {
      textQuery: textQuery.trim(),
    };
    if (languageCode && typeof languageCode === 'string') body.languageCode = languageCode;
    if (regionCode && typeof regionCode === 'string') body.regionCode = regionCode;
    
    requestOptions.body = JSON.stringify(body);
  } else {
    return res.status(400).json({ 
      error: 'Missing required parameters. Provide either placeId or textQuery.' 
    });
  }

  try {
    const response = await fetch(googleUrl.toString(), requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Google API error: ${response.status}`;
      console.error('Google Places API error:', errorMessage);
      // Don't expose internal error details to client
      return res.status(response.status).json({ error: 'Failed to fetch place data' });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}