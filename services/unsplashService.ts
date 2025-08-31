/**
 * Unsplash API Service for fetching promotional images
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  console.warn("UNSPLASH_ACCESS_KEY environment variable is not set. Using fallback image.");
}

// Define supported aspect ratios
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

// Map aspect ratios to Unsplash orientation
function getOrientation(aspectRatio: AspectRatio): string {
  switch(aspectRatio) {
    case "9:16":
      return "portrait";
    case "16:9":
      return "landscape";
    case "1:1":
      return "squarish";
    default:
      return "landscape";
  }
}

// Korean to English keyword mapping for common promotional terms
const keywordMap: { [key: string]: string } = {
  // Food & Restaurant
  '버거': 'burger',
  '피자': 'pizza',
  '치킨': 'chicken',
  '커피': 'coffee',
  '카페': 'cafe',
  '음식': 'food',
  '맛있는': 'delicious',
  '레스토랑': 'restaurant',
  '음료': 'beverage drink',
  '디저트': 'dessert',
  '케이크': 'cake',
  '빵': 'bread bakery',
  '비건': 'vegan',
  '샐러드': 'salad',
  '스테이크': 'steak',
  '파스타': 'pasta',
  '초밥': 'sushi',
  '라면': 'ramen noodle',
  
  // Shopping & Sale
  '할인': 'sale discount',
  '세일': 'sale',
  '쇼핑': 'shopping',
  '패션': 'fashion',
  '옷': 'clothing clothes',
  '신발': 'shoes',
  '가방': 'bag handbag',
  '화장품': 'cosmetics beauty',
  '뷰티': 'beauty',
  '선물': 'gift present',
  '이벤트': 'event',
  '무료': 'free',
  '배송': 'delivery shipping',
  '신상품': 'new product',
  '한정': 'limited edition',
  
  // Tech & Digital
  '스마트폰': 'smartphone mobile',
  '컴퓨터': 'computer laptop',
  '노트북': 'laptop notebook',
  '전자제품': 'electronics',
  '게임': 'gaming game',
  '앱': 'app application',
  '소프트웨어': 'software',
  '기술': 'technology tech',
  'AI': 'artificial intelligence AI',
  
  // Business & Service
  '비즈니스': 'business',
  '회사': 'company corporate',
  '서비스': 'service',
  '상담': 'consultation consulting',
  '교육': 'education training',
  '강의': 'lecture course',
  '스타트업': 'startup',
  '투자': 'investment',
  '금융': 'finance',
  '부동산': 'real estate',
  '보험': 'insurance',
  
  // Health & Fitness
  '건강': 'health healthy',
  '운동': 'fitness exercise',
  '헬스': 'gym fitness',
  '요가': 'yoga',
  '다이어트': 'diet weight loss',
  '피트니스': 'fitness',
  '스포츠': 'sports',
  
  // Travel & Leisure
  '여행': 'travel',
  '호텔': 'hotel',
  '휴가': 'vacation holiday',
  '관광': 'tourism',
  '항공': 'airline flight',
  
  // Descriptive terms
  '최고': 'best',
  '프리미엄': 'premium',
  '럭셔리': 'luxury',
  '특별한': 'special',
  '새로운': 'new',
  '인기': 'popular',
  '추천': 'recommend',
  '오늘': 'today',
  '내일': 'tomorrow',
  '주말': 'weekend',
  '여름': 'summer',
  '겨울': 'winter',
  '봄': 'spring',
  '가을': 'autumn fall'
};

/**
 * Extract and translate keywords from Korean promotional text
 */
function extractKeywords(koreanText: string): string {
  const words = koreanText.split(/\s+/);
  const keywords: string[] = [];
  
  // Check each word against our keyword map
  for (const word of words) {
    // Check for exact matches
    if (keywordMap[word]) {
      keywords.push(keywordMap[word]);
    } else {
      // Check if the word contains any mapped keywords
      for (const [korean, english] of Object.entries(keywordMap)) {
        if (word.includes(korean)) {
          keywords.push(english);
          break;
        }
      }
    }
  }
  
  // If we found keywords, use them; otherwise, use generic terms based on common patterns
  if (keywords.length > 0) {
    // Limit to 3-4 most relevant keywords for better search results
    return keywords.slice(0, 4).join(' ');
  }
  
  // Fallback: detect patterns and return appropriate generic search
  if (koreanText.includes('할인') || koreanText.includes('세일') || koreanText.includes('%')) {
    return 'sale promotion discount shopping';
  }
  if (koreanText.includes('음식') || koreanText.includes('맛')) {
    return 'food restaurant delicious';
  }
  if (koreanText.includes('신상') || koreanText.includes('새로운')) {
    return 'new product launch';
  }
  
  // Ultimate fallback
  return 'promotion marketing business';
}

/**
 * Fetches a promotional background image from Unsplash based on Korean text
 * @param promoText The Korean promotional text to find relevant images
 * @param aspectRatio The desired aspect ratio for the image
 * @returns A promise that resolves to an image URL
 */
export async function fetchPromoImage(promoText: string, aspectRatio: AspectRatio): Promise<string> {
  try {
    // If no API key, return a placeholder
    if (!UNSPLASH_ACCESS_KEY) {
      return `https://via.placeholder.com/1920x1080.png?text=No+API+Key`;
    }

    // Extract and translate keywords for better search results
    const keywords = extractKeywords(promoText);
    console.log('Searching Unsplash with keywords:', keywords);
    
    const searchQuery = encodeURIComponent(keywords);
    const orientation = getOrientation(aspectRatio);
    
    // Add randomness for more variety
    const randomPage = Math.floor(Math.random() * 3) + 1; // Random page 1-3
    const orderOptions = ['relevant', 'latest', 'popular'];
    const randomOrder = orderOptions[Math.floor(Math.random() * orderOptions.length)];
    
    // Unsplash API endpoint - search for high quality images
    const url = `https://api.unsplash.com/search/photos?query=${searchQuery}&orientation=${orientation}&per_page=10&page=${randomPage}&order_by=${randomOrder}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Randomly select one image from the results for variety
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const image = data.results[randomIndex];
      console.log(`Found image (${randomIndex + 1}/${data.results.length}): ${image.description || image.alt_description || 'No description'}`);
      return image.urls.regular || image.urls.full;
    } else {
      console.log('No results found for keywords, trying fallback...');
      
      // If no results, try with a more generic query
      const fallbackKeywords = 'modern business promotion marketing professional';
      const fallbackUrl = `https://api.unsplash.com/search/photos?query=${fallbackKeywords}&orientation=${orientation}&per_page=3`;
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.results && fallbackData.results.length > 0) {
          // Also randomize fallback selection
          const randomFallbackIndex = Math.floor(Math.random() * fallbackData.results.length);
          return fallbackData.results[randomFallbackIndex].urls.regular;
        }
      }
      
      // Ultimate fallback
      return `https://via.placeholder.com/1920x1080.png?text=No+Image+Found`;
    }

  } catch (error) {
    console.error("Error fetching image from Unsplash:", error);
    // Return a placeholder image on error
    return `https://via.placeholder.com/1920x1080.png?text=Error+Loading+Image`;
  }
}