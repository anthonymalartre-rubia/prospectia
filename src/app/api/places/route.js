import { DEPTS, PLACES_API_URL, FIELD_MASK } from '@/lib/constants';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  // Health check — no auth needed, just checks if API key is set
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return Response.json({ configured: false }, { status: 503 });
  }
  return Response.json({ configured: true });
}

export async function POST(request) {
  // Auth check
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { query, dept } = await request.json();

    if (!query || typeof query !== 'string' || query.length > 200) {
      return Response.json(
        { error: 'Invalid query: must be a string under 200 characters' },
        { status: 400 }
      );
    }

    if (!dept || typeof dept !== 'string') {
      return Response.json(
        { error: 'Missing required field: dept' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GOOGLE_PLACES_API_KEY not configured' },
        { status: 500 }
      );
    }

    const deptData = DEPTS[dept];
    if (!deptData) {
      return Response.json(
        { error: `Department not found: ${dept}` },
        { status: 400 }
      );
    }

    const allPlaces = [];
    let pageToken = null;
    const MAX_PAGES = 5; // Up to 100 results per query

    for (let page = 0; page < MAX_PAGES; page++) {
      const requestBody = {
        textQuery: query,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: {
              latitude: deptData.lat,
              longitude: deptData.lng,
            },
            radius: deptData.r,
          },
        },
      };

      if (pageToken) {
        requestBody.pageToken = pageToken;
      }

      const response = await fetch(PLACES_API_URL, {
        method: 'POST',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Google Places API error:', errorData);
        // If first page fails, return error; otherwise return what we have
        if (page === 0) {
          return Response.json(
            { error: `Google Places API error: ${response.status}` },
            { status: response.status }
          );
        }
        break;
      }

      const data = await response.json();

      const pagePlaces = (data.places || []).map((place) => ({
        place_id: place.id || '',
        nom: place.displayName?.text || '',
        adresse: place.formattedAddress || '',
        telephone: place.nationalPhoneNumber || place.internationalPhoneNumber || '',
        site_web: place.websiteUri || '',
        note: place.rating || null,
        nb_avis: place.userRatingCount || 0,
      }));

      allPlaces.push(...pagePlaces);

      // Check for next page
      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        break; // No more pages
      }
    }

    return Response.json({ places: allPlaces });
  } catch (error) {
    console.error('Places API route error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
