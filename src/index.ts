import fs from 'fs/promises';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

const spreads = [
  {
    pages: [
      {type: 'clear'},
      {title: '表紙', folio: '表1'},
    ]
  },
  {
    pages: [
      {title: '表紙', folio: '表2'},
      {title: 'コンテンツ', folio: '1'},
    ]
  },
  {
    pages: [
      {title: 'コンテンツ', folio: '2'},
      {title: 'コンテンツ', folio: '3'},
    ]
  },
  {
    pages: [
      {title: 'コンテンツ', folio: '4'},
      {title: '裏表紙', folio: '表3'},
    ]
  },
  {
    pages: [
      {title: '裏表紙', folio: '表4'},
      {type: 'clear'},
    ]
  },
];

(async() => {
  const template = await ejs.renderFile('templates/index.ejs', {
    document_title: 'My page plot',
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