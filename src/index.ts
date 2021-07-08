import fs from 'fs/promises';
import yaml from 'js-yaml';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

function chunk<T extends any[]>(arr: T, size: number) {
  return arr.reduce(
      (newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]),
      [] as T[][]
  )
}

interface DocumentConfig {
  title: string;
  has_cover: boolean;
}

interface PageConfig {
  type: string;
  title: string|null;
  folio: string | number;
}

interface Config {
  document: DocumentConfig;
  contents: PageConfig[]
}

(async() => {
  const config = yaml.load(await fs.readFile('sample.yaml', 'utf8')) as Config;

  let pages: PageConfig[] = config.contents.map((page, index) => {
    return {title: page.title, folio: index + 1, type: 'page'}
  });
  if (config.document.has_cover) {
    const clearPage: PageConfig = {type: 'clear', title: null, folio: ''}
    pages.unshift(clearPage);
    pages.push(clearPage);
  }
  const spreads = chunk(pages, 2).map((pair: PageConfig) => {
    return { pages: pair }
  })

  const template = await ejs.renderFile('templates/index.ejs', {
    document_title: config.document.title,
    spreads: spreads
  }, {
    async: true
  })

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // PDF出力対象ページ
  await page.setContent(template);

  // PDF作成処理
  await page.pdf({
    path: 'result.pdf',
  });

  browser.close();
  console.log('PDF出力完了');
})();