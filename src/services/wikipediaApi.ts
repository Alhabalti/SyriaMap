/**
 * @file wikipediaApi.ts
 * @description خدمة لجلب معلومات المحافظات والمدن من قاعدة بيانات محلية سريعة
 */

import localCache from "../data/wikipediaCache.json";

export interface WikiData {
  extract: string;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  title: string;
}

/**
 * دالة لجلب معلومات المحافظة/المدينة محلياً
 * @param locationName اسم المكان (مثلاً "دمشق"، "حلب"، أو "المزة")
 * @param isCity هل المكان هو مدينة/منطقة بدلاً من محافظة؟ (افتراضي: false)
 * @returns {Promise<WikiData>} بيانات ويكيبيديا محلياً وبشكل فوري
 */
export async function fetchGovernorateWikiData(locationName: string, isCity: boolean = false): Promise<WikiData> {
  // للسرعة العالية، نستخدم async لمحاكاة واجهة التطبيق السابقة دون كسر الكود
  return new Promise((resolve, reject) => {
    let key = locationName.trim();
    if (!isCity && !key.startsWith("محافظة")) {
      key = `محافظة ${key}`;
    }
    
    // @ts-ignore - indexing JSON
    const data = localCache[key] || localCache[locationName.trim()];

    if (data) {
      resolve({
        title: data.title || locationName,
        extract: data.extract,
        thumbnailUrl: data.thumbnailUrl,
        originalImageUrl: data.originalImageUrl,
      });
    } else {
      resolve({
        title: locationName,
        extract: "المعلومات غير متوفرة محلياً لهذه المنطقة.",
        thumbnailUrl: null,
        originalImageUrl: null
      });
    }
  });
}
