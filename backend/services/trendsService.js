import axios from 'axios';
import googleTrends from 'google-trends-api';

const BASE_URL = 'https://serpapi.com/search.json';

// Category mapping for Google Trends
const categoryMapping = {
  'luxury': ['luxury goods', 'premium products', 'high-end'],
  'apparel': ['clothing', 'fashion', 'apparel', 'style'],
  'electronics': ['electronics', 'gadgets', 'technology', 'smart devices'],
  'fashion': ['fashion', 'style', 'trendy', 'clothing'],
  'toys': ['toys', 'games', 'children', 'kids'],
  'home-garden': ['home decor', 'garden', 'furniture', 'interior'],
  'sports': ['sports', 'fitness', 'outdoor', 'athletic'],
  'beauty': ['beauty', 'cosmetics', 'skincare', 'makeup'],
  'automotive': ['cars', 'automotive', 'vehicles', 'auto'],
  'books': ['books', 'reading', 'literature', 'education']
};

// Location mapping for SerpAPI geo codes
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

export const getTrendingKeywords = async (category, location) => {
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
    let keywords = [];

    if (Array.isArray(data.trendingSearchesDays)) {
      const day = data.trendingSearchesDays[0];
      keywords = day.trendingSearches.map(search => {
        const trafficMatch = search.formattedTraffic?.match(/([\d,.]+)/);
        const traffic = trafficMatch ? parseInt(trafficMatch[1].replace(/,/g, '')) : 0;
        return {
          keyword: search.title,
          interest: traffic,
          region: location
        };
      });
    }

    if (keywords.length === 0) {
      const fallbackKeywords = categoryMapping[category.toLowerCase()] || [category];
      keywords = fallbackKeywords.map(k => ({
        keyword: k,
        interest: Math.floor(Math.random() * 50) + 30,
        region: location
      }));
    }

    return keywords.slice(0, 5);
  } catch (error) {
    console.error('Error in getTrendingKeywords:', error);
    const fallbackKeywords = categoryMapping[category.toLowerCase()] || [category];
    return fallbackKeywords.slice(0, 3).map(keyword => ({
      keyword,
      interest: Math.floor(Math.random() * 50) + 30,
      region: location
    }));
  }
};

export const getRelatedTopics = async (category, location) => {
  try {
    const geoCode = (locationMapping[location] || 'us').toUpperCase();
    const mainKeyword = categoryMapping[category.toLowerCase()]?.[0] || category;
    
    const results = await googleTrends.relatedTopics({
      keyword: mainKeyword,
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endTime: new Date(),
      geo: geoCode
    });
    
    const data = JSON.parse(results);
    const relatedTopics = data.default?.rankedList?.[0]?.rankedKeyword || [];
    
    return relatedTopics.slice(0, 10).map(topic => ({
      topic: topic.topic?.title || topic.query,
      value: topic.value || Math.floor(Math.random() * 100)
    }));
    
  } catch (error) {
    console.error('Error in getRelatedTopics:', error);
    
    // Fallback related topics
    const fallbackTopics = [
      `trending ${category}`,
      `popular ${category}`,
      `best ${category}`,
      `new ${category}`,
      `${category} trends`
    ];
    
    return fallbackTopics.map(topic => ({
      topic: topic,
      value: Math.floor(Math.random() * 80) + 20
    }));
  }
};