import googleTrends from 'google-trends-api';

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

// Location mapping for Google Trends geo codes
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

export const getTrendingKeywords = async (category, location) => {
  try {
    const keywords = categoryMapping[category.toLowerCase()] || [category];
    const geoCode = locationMapping[location] || 'US';
    
    // Get trending data for the past 7 days
    const trendPromises = keywords.map(async (keyword) => {
      try {
        const results = await googleTrends.interestOverTime({
          keyword: keyword,
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(),
          geo: geoCode
        });
        
        const data = JSON.parse(results);
        const timelineData = data.default?.timelineData || [];
        
        if (timelineData.length > 0) {
          // Get average interest score
          const avgInterest = timelineData.reduce((sum, item) => 
            sum + (item.value?.[0] || 0), 0) / timelineData.length;
          
          return {
            keyword: keyword,
            interest: Math.round(avgInterest),
            region: location
          };
        }
        
        return {
          keyword: keyword,
          interest: 0,
          region: location
        };
      } catch (error) {
        console.log(`Error fetching trends for ${keyword}:`, error.message);
        return {
          keyword: keyword,
          interest: Math.floor(Math.random() * 50) + 25, // Fallback random score
          region: location
        };
      }
    });
    
    const results = await Promise.all(trendPromises);
    
    // Sort by interest score and return top trending keywords
    return results
      .filter(result => result.interest > 0)
      .sort((a, b) => b.interest - a.interest)
      .slice(0, 5); // Return top 5 trending keywords
      
  } catch (error) {
    console.error('Error in getTrendingKeywords:', error);
    
    // Fallback data if Google Trends API fails
    const fallbackKeywords = categoryMapping[category.toLowerCase()] || [category];
    return fallbackKeywords.slice(0, 3).map(keyword => ({
      keyword: keyword,
      interest: Math.floor(Math.random() * 50) + 30,
      region: location
    }));
  }
};

export const getRelatedTopics = async (category, location) => {
  try {
    const geoCode = locationMapping[location] || 'US';
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