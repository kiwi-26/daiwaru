import fs from 'fs/promises';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

(async() => {
  const template = await ejs.renderFile('templates/index.ejs', {
    document_title: 'My page plot'
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