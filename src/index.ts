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
  repeat: number|null;
}

interface PageOutput {
  type: string;
  title: string|null;
  folio: number|string|null;
}

interface Config {
  document: DocumentConfig;
  contents: PageConfig[]
}

(async() => {
  const config = yaml.load(await fs.readFile('sample.yaml', 'utf8')) as Config;

  let pages: PageOutput[] = [];
  const clearPage: PageOutput = {type: 'clear', title: null, folio: null}
  if (config.document.has_cover) {
    pages.unshift(clearPage);
  }
  let index = 1;
  config.contents.forEach((pageConfig) => {
    if (pageConfig.repeat) {
      for (let i = 0; i < pageConfig.repeat; i++) {
        pages.push({
          type: 'page',
          title: pageConfig.title,
          folio: index
        });
        index += 1;
      }
    } else {
      pages.push({
        type: 'page',
        title: pageConfig.title,
        folio: index
      });
      index += 1;
    }
  });
  if (config.document.has_cover) {
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