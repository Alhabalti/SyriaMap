import fs from 'fs/promises';

const cities = [
  "مدينة دمشق", "المزة", "الميدان", "ركن الدين", "المهاجرين", "كفرسوسة", "الشاغور", "الصالحية", "مشروع دمر", "القابون",
  "دوما", "حرستا", "جرمانا", "صيدنايا", "معلولا", "التل", "يبرود", "الزبداني", "قدسيا", "السيدة زينب", "ببيلا", "القطيفة", "النبك", "داريا", "الكسوة",
  "مدينة حلب", "عفرين", "عين العرب", "منبج", "الباب", "إعزاز", "جرابلس", "السفيرة", "الأتارب", "نبل", "الزهراء", "دارة عزة",
  "مدينة حمص", "تدمر", "الرستن", "القصير", "تلكلخ", "المخرم", "الحصن", "القريتين", "شين", "السخنة", "صدد",
  "مدينة حماة", "السلمية", "مصياف", "محردة", "السقيلبية", "صوران", "طيبة الإمام", "شيزر", "الغاب", "حلفايا", "كفرزيتا",
  "مدينة اللاذقية", "جبلة", "القرداحة", "الحفة", "كسب", "صلنفة", "بيت ياشوط", "برج إسلام", "أوغاريت",
  "مدينة طرطوس", "بانياس", "صافيتا", "الدريكيش", "الشيخ بدر", "القدموس", "مشتى الحلو", "الصفصافة", "عمريت", "أرواد",
  "مدينة إدلب", "أريحة", "معرة النعمان", "جسر الشغور", "حارم", "سراقب", "بنش", "الدانا", "سلقين", "كفرنبل", "تفتناز",
  "مدينة الرقة", "الطبقة", "تل أبيض", "معدان", "عين عيسى", "السبخة", "سلوك",
  "مدينة دير الزور", "الميادين", "البوكمال", "هجين", "الشحيل", "موحسن", "الصور", "القورية", "التبني",
  "مدينة الحسكة", "القامشلي", "رأس العين", "المالكية", "عامودا", "الدرباسية", "الشدادي", "اليعربية", "القحطانية", "تل تمر",
  "مدينة درعا", "نوى", "طفس", "إزرع", "بصرى الشام", "الحراك", "الصنمين", "جاسم", "داعل", "خربة غزالة", "المزيريب", "الشيخ مسكين",
  "مدينة السويداء", "صلخد", "شهبا", "القريا", "شقا", "المشنف", "القنوات",
  "القنيطرة", "خان أرنبة", "جباتا الخشب", "فيق", "مسعدة", "الحضر", "مجدل شمس",
  "محافظة دمشق", "محافظة حلب", "محافظة حمص", "محافظة حماة", "محافظة اللاذقية", "محافظة طرطوس", "محافظة إدلب", 
  "محافظة الرقة", "محافظة دير الزور", "محافظة الحسكة", "محافظة درعا", "محافظة السويداء", "محافظة القنيطرة", "محافظة ريف دمشق"
];

const cache = {};

async function fetchWiki(title) {
  try {
    let queryTitle = title.replace(/ /g, "_");
    const res = await fetch(`https://ar.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(queryTitle)}`, {
      headers: { "User-Agent": "SyriaMapApp/1.0 (admin@example.com)" }
    });
    if (!res.ok) {
        // Fallback without "مدينة" if starts with it
        if (title.startsWith("مدينة ")) {
            return fetchWiki(title.replace("مدينة ", ""));
        }
        return null;
    }
    const data = await res.json();
    return {
      title: data.title || title,
      extract: data.extract || "المعلومات غير متوفرة محلياً لهذه المنطقة.",
      thumbnailUrl: data.thumbnail ? data.thumbnail.source : null,
      originalImageUrl: data.originalimage ? data.originalimage.source : null
    };
  } catch(e) {
    return null;
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log("Fetching " + cities.length + " locations...");
  for (const city of cities) {
    await delay(100); // 100ms delay to avoid rate limiting
    const data = await fetchWiki(city);
    if (data) {
      cache[city] = data;
      process.stdout.write(".");
    } else {
      cache[city] = {
        title: city,
        extract: "المعلومات غير متوفرة محلياً لهذه المنطقة.",
        thumbnailUrl: null,
        originalImageUrl: null
      };
      process.stdout.write("x");
    }
  }
  console.log("\nDone!");
  await fs.writeFile('src/data/wikipediaCache.json', JSON.stringify(cache, null, 2), 'utf-8');
}

run();
