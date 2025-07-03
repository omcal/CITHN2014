import axios from 'axios';

const BASE_URL = 'https://serpapi.com/search.json';

// Map common country names to ISO codes for SerpAPI
const locationMapping = {
  'Germany': 'de',
  'United States': 'us',
  'United Kingdom': 'gb',
  'France': 'fr',
  'Italy': 'it',
  'Spain': 'es',
  'Japan': 'jp',
  'Canada': 'ca',
  'Australia': 'au',
  'Brazil': 'br',
  'India': 'in',
  'China': 'cn'
};

export const getTrendingNow = async (category, location) => {
  const apiKey = process.env.SERPAPI_KEY;
  const geo = locationMapping[location] || 'us';
  const params = {
    engine: 'google_trends',
    api_key: apiKey,
    geo,
    q: category,
    timeframe: 'now 7-d'
  };

  try {
    const { data } = await axios.get(BASE_URL, { params });
    const trends = [];

    if (Array.isArray(data.trendingSearchesDays)) {
      const day = data.trendingSearchesDays[0];
      day.trendingSearches.forEach(search => {
        trends.push({
          title: search.title,
          formattedTraffic: search.formattedTraffic,
          articles: search.articles || []
        });
      });
    }

    return trends;
  } catch (error) {
    console.error('SerpAPI trending fetch failed:', error.message);
    return [];
  }
};
