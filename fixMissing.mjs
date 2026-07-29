import fs from 'fs/promises';

const missingFixes = {
  "كفرسوسة": {
    title: "كفرسوسة",
    extract: "كفرسوسة هو أحد أحياء مدينة دمشق الحديثة والراقية، يقع في القسم الجنوبي الغربي للمدينة ويضم العديد من المراكز الحكومية والتجارية الهامة."
  },
  "التل": {
    title: "مدينة التل",
    extract: "التل هي مدينة سورية تتبع محافظة ريف دمشق، تقع شمال العاصمة وتمتاز بمناخها الجبلي المعتدل وطبيعتها الخضراء."
  },
  "السخنة": {
    title: "السخنة",
    extract: "السخنة هي بلدة سورية تقع في البادية السورية ضمن ريف حمص الشرقي، وهي واحة تاريخية ومحطة هامة على طرق القوافل قديماً."
  },
  "السلمية": {
    title: "السلمية",
    extract: "السلمية هي مدينة تاريخية تابعة لمحافظة حماة، تقع على أطراف البادية السورية وتتميز بتنوعها الثقافي وإنتاجها الزراعي المتميز."
  },
  "الغاب": {
    title: "سهل الغاب",
    extract: "سهل الغاب هو منطقة زراعية واسعة وخصبة تابعة لمحافظة حماة، يمر عبره نهر العاصي ويعد من أهم مصادر الإنتاج الزراعي والسمكي في سوريا."
  },
  "أريحة": {
    title: "أريحة",
    extract: "أريحة مدينة سورية في محافظة إدلب، تتميز بطبيعتها الجبلية الخلابة وإطلالتها من جبل الأربعين، وتشتهر بزراعة الكرز والزيتون والمحاصيل المتنوعة."
  },
  "رأس العين": {
    title: "رأس العين",
    extract: "رأس العين هي مدينة سورية تقع في محافظة الحسكة شمال شرق البلاد على الحدود السورية التركية، تشتهر بينابيعها العذبة وتنوعها السكاني."
  },
  "الحضر": {
    title: "قرية حضر",
    extract: "حضر هي بلدة سورية جبلية تقع في محافظة القنيطرة على السفوح الشرقية لجبل الشيخ، وتشتهر بمناخها البارد شتاءً وإنتاجها الزراعي الكثيف للكرز والتفاح."
  }
};

async function run() {
  const fileData = await fs.readFile('./src/data/wikipediaCache.json', 'utf-8');
  const cache = JSON.parse(fileData);

  for (const [key, fix] of Object.entries(missingFixes)) {
    if (cache[key]) {
      cache[key].title = fix.title;
      cache[key].extract = fix.extract;
      cache[key].thumbnailUrl = null;
      cache[key].originalImageUrl = null;
      console.log("Fixed missing data for:", key);
    }
  }

  await fs.writeFile('./src/data/wikipediaCache.json', JSON.stringify(cache, null, 2), 'utf-8');
  console.log("Successfully updated cache with missing entries.");
}

run();
