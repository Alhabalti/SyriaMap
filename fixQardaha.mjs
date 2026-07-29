import fs from 'fs/promises';

async function run() {
  const fileData = await fs.readFile('./src/data/wikipediaCache.json', 'utf-8');
  const cache = JSON.parse(fileData);

  if (cache['القرداحة']) {
    let extract = cache['القرداحة'].extract;
    extract = extract.replace(
      "عائلة الأسد، التي حكمت سوريا من عام 1970 حتى عام 2024",
      "عائلة الأسد المجرمة التي احتلت سوريا من عام 1970 حتى عام 2024"
    );
    cache['القرداحة'].extract = extract;
    
    await fs.writeFile('./src/data/wikipediaCache.json', JSON.stringify(cache, null, 2), 'utf-8');
    console.log("Updated Al-Qardaha extract successfully.");
  }
}

run();

