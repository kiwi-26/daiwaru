import fs from 'fs/promises';
import yaml from 'js-yaml';
import ejs from 'ejs';
import puppeteer from 'puppeteer';
import { Command, Option } from 'commander';
import { chunk } from './modules/utils'
import { Config } from './modules/config-parser'

interface PageOutput {
  type: string;
  title: string | null;
  folio: number | string | null;
  background: string | null;
}

const program = new Command();
program
  .option('-i, --input <file>', 'input yaml file', 'sample.yaml')
  .option('-o, --output <file>', 'output file name', 'result.pdf')
  .addOption(new Option('-f, --format <format>', 'file format').default('pdf').choices(['pdf', 'png']));
program.parse(process.argv);
const options = program.opts();

(async() => {
  const config = new Config(yaml.load(await fs.readFile(options.input, 'utf8')));
  if (config.document.has_cover && config.contentsLength() < 4) {
    throw new Error('contents length should be at least 4 pages when use document.has_cover');
  }

  let pages: PageOutput[] = [];
  let index = 1;
  if (config.document.has_cover) {
    index = -1;
  }
  config.contents.forEach((pageConfig) => {
    if (pageConfig.repeat) {
      for (let i = 0; i < pageConfig.repeat; i++) {
        pages.push({
          type: 'page',
          title: pageConfig.title,
          folio: index,
          background: pageConfig.background
        });
        index += 1;
      }
    } else {
      pages.push({
        type: 'page',
        title: pageConfig.title,
        folio: index,
        background: pageConfig.background
      });
      index += 1;
    }
  });

  const pageTotal = pages.length;
  if (pageTotal % 2 == 1) {
    throw new Error('ページ数が奇数になっています');
  }

  if (config.document.has_cover) {
    pages[0].folio = '表1';
    pages[1].folio = '表2';
    pages[pages.length - 2].folio = '表3';
    pages[pages.length - 1].folio = '表4';

    const clearPage: PageOutput = {type: 'clear', title: null, folio: null, background: null}
    pages.unshift(clearPage);
    pages.push(clearPage);
  }

  const spreads = chunk(pages, 2).map((pair: PageOutput) => {
    return { pages: pair }
  });

  // rendering template
  const template = await ejs.renderFile('templates/index.ejs', {
    document_title: config.document.title,
    spreads: spreads
  }, {
    async: true
  });

  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 800,
      height: 100,
      deviceScaleFactor: 1.5
    }
  });
  const page = await browser.newPage();

  // load rendered html
  await page.setContent(template);

  // output
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
  console.log('Finish. Output: ' + options.output);
})();
