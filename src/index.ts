import fs from 'fs/promises';
import yaml from 'js-yaml';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import { Command, Option } from 'commander';
import { chunk } from './modules/utils'
import './modules/config-parser'

interface PageOutput {
  type: string;
  title: string | null;
  folio: number | string | null;
}

const program = new Command();
program
  .option('-i, --input <file>', 'input yaml file', 'sample.yaml')
  .option('-o, --output <file>', 'output file name', 'result.pdf')
  .addOption(new Option('-f, --format <format>', 'file format').default('pdf').choices(['pdf', 'png']));
program.parse(process.argv);
const options = program.opts();

(async() => {
  const config = yaml.load(await fs.readFile(options.input, 'utf8')) as Config;

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

  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 800,
      height: 100,
      deviceScaleFactor: 1.5
    }
  });
  const page = await browser.newPage();

  // PDF出力対象ページ
  await page.setContent(template);

  // PDF作成処理
  switch(options.format) {
    case 'pdf':
      await page.pdf({
        path: options.output,
      });
      break;
    case 'png':
      const bodyHandle = await page.$('body');
      const boundingBox = await bodyHandle?.boundingBox();
      await page.screenshot({
        path: options.output,
        clip: {
          x: 0,
          y: 0,
          width: boundingBox?.width ?? 800,
          height: boundingBox?.height ?? 600
        },
      })
      break;
    default:
      break;
  }


  browser.close();
  console.log('PDF出力完了');
})();
