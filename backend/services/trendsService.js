import { json } from 'express';
import googleTrends from 'google-trends-api';
import { getJson } from "serpapi";

// Category mapping for Google Trends
const categoryMapping = {
  'luxury': ['luxury goods', 'premium products', 'high-end'],
  'apparel': ['clothing', 'fashion', 'apparel', 'style'],
  'Technology': ['Technology', 'gadgets', 'technology', 'smart devices'],
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
  'Germany': 'DE',
  'United States': 'US',
  'United Kingdom': 'GB',
  'France': 'FR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Japan': 'JP',
  'Canada': 'CA',
  'Australia': 'AU',
  'Brazil': 'BR',
  'India': 'IN',
  'China': 'CN'
};
function getTopQueries(data,category,topN = 3, region = "US") {
  if (
    !data ||
    !Array.isArray(data.trending_searches) ||
    data.trending_searches.length === 0
  ) {
    return [];
  }

  return data.trending_searches
    .filter(item => typeof item.search_volume === "number")
    .filter(item => {
      if (!category) return true;
      return Array.isArray(item.categories) &&
             item.categories.some(catObj =>
               catObj.name.toLowerCase() === category.toLowerCase()
             );
    })
    .sort((a, b) => b.increase_percentage - a.increase_percentage)
    .slice(0, topN)
    .map(item => ({
      keyword: item.query,
      interest: item.increase_percentage,
      region: region
    }));
  }
export const getTrendingKeywords = async (category, location) => {
  const apiKey = process.env.SERPAPI_KEY;
  const geo = locationMapping[location] || 'us';
  const response = await getJson
   ({
    engine: 'google_trends_trending_now',
    geo,
    api_key: apiKey,
    q: category,
    hours: '168'
  })
    try {
    let keywords = [];
    keywords = getTopQueries(response,category,undefined, geo);
    return keywords;
    }
    catch (error) {
    console.error('Error in getTrendingKeywords:', error);
    const fallbackKeywords = categoryMapping[category.toLowerCase()] || [category];
    return fallbackKeywords.slice(0, 3).map(keyword => ({
      keyword,
      interest: Math.floor(Math.random() * 50) + 30,
      region: location
    }));
  } 
  }
;

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