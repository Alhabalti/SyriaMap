/**
 * @file wikipediaApi.ts
 * @description خدمة لجلب بيانات ويكيبيديا عن المحافظات السورية
 */

export interface WikiData {
  extract: string;
  thumbnailUrl: string | null;
  originalImageUrl: string | null;
  title: string;
}

/**
 * دالة لجلب معلومات المحافظة من ويكيبيديا العربية
 * @param locationName اسم المكان (مثلاً "دمشق"، "حلب"، أو "المزة")
 * @param isCity هل المكان هو مدينة/منطقة بدلاً من محافظة؟ (افتراضي: false)
 * @returns {Promise<WikiData>} بيانات ويكيبيديا بتنسيق JSON نظيف
 */
export async function fetchGovernorateWikiData(locationName: string, isCity: boolean = false): Promise<WikiData> {
  try {
    // تنسيق اسم المقالة للبحث في ويكيبيديا.
    let articleTitle = locationName.trim();
    
    // إذا لم تكن مدينة، نضيف كلمة "محافظة" لتخصيص البحث
    if (!isCity && !articleTitle.startsWith("محافظة")) {
      articleTitle = `محافظة_${articleTitle.replace(/ /g, "_")}`;
    } else if (isCity) {
      // للمدن، قد نحتاج استبدال الفراغات بشرطة سفلية 
      articleTitle = articleTitle.replace(/ /g, "_");
      // ملاحظة: قد تحتاج بعض المناطق (مثل "المزة (دمشق)") لمعالجة خاصة إذا كان الاسم متكرراً،
      // لكن كبداية سنعتمد على الاسم المباشر.
    }

    // نقطة النهاية (Endpoint) لواجهة برمجة تطبيقات ويكيبيديا (REST API)
    const endpoint = `https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(articleTitle)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        // يُفضل دائماً تمرير User-Agent واضح عند استخدام Wikipedia API
        "User-Agent": "SyriaMapApp/1.0 (Contact: admin@example.com)"
      }
    });

    if (!response.ok) {
      // إذا لم يتم العثور على الصفحة (404) أو حدث خطأ آخر
      if (response.status === 404) {
        throw new Error(`لم يتم العثور على معلومات لـ: ${locationName}`);
      }
      throw new Error(`خطأ في جلب البيانات: ${response.statusText}`);
    }

    const data = await response.json();

    // معالجة وإرجاع البيانات بتنسيق نظيف
    return {
      title: data.title || locationName,
      extract: data.extract || "لا يتوفر ملخص نصي لهذا الموقع حالياً.",
      thumbnailUrl: data.thumbnail ? data.thumbnail.source : null,
      originalImageUrl: data.originalimage ? data.originalimage.source : null,
    };
  } catch (error) {
    // معالجة الأخطاء وطباعتها للمطور، ثم تمرير الخطأ
    console.error("Wikipedia API Error:", error);
    throw error;
  }
}
