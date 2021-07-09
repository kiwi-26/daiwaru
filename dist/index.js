"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const ejs_1 = __importDefault(require("ejs"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const commander_1 = require("commander");
const utils_1 = require("./modules/utils");
const config_parser_1 = require("./modules/config-parser");
const program = new commander_1.Command();
program
    .option('-i, --input <file>', 'input yaml file', 'sample.yaml')
    .option('-o, --output <file>', 'output file name', 'result.pdf')
    .addOption(new commander_1.Option('-f, --format <format>', 'file format').default('pdf').choices(['pdf', 'png']));
program.parse(process.argv);
const options = program.opts();
(async () => {
    var _a, _b;
    const config = new config_parser_1.Config(js_yaml_1.default.load(await promises_1.default.readFile(options.input, 'utf8')));
    if (config.document.has_cover && config.contentsLength() < 4) {
        throw new Error('contents length should be at least 4 pages when use document.has_cover');
    }
    let pages = [];
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
                    folio: index
                });
                index += 1;
            }
        }
        else {
            pages.push({
                type: 'page',
                title: pageConfig.title,
                folio: index
            });
            index += 1;
        }
    });
    if (config.document.has_cover) {
        pages[0].folio = '表1';
        pages[1].folio = '表2';
        pages[pages.length - 2].folio = '表3';
        pages[pages.length - 1].folio = '表4';
        const clearPage = { type: 'clear', title: null, folio: null };
        pages.unshift(clearPage);
        pages.push(clearPage);
    }
    const spreads = utils_1.chunk(pages, 2).map((pair) => {
        return { pages: pair };
    });
    // rendering template
    const template = await ejs_1.default.renderFile('templates/index.ejs', {
        document_title: config.document.title,
        spreads: spreads
    }, {
        async: true
    });
    const browser = await puppeteer_1.default.launch({
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
    switch (options.format) {
        case 'pdf':
            await page.pdf({
                path: options.output,
            });
            break;
        case 'png':
            const bodyHandle = await page.$('body');
            const boundingBox = await (bodyHandle === null || bodyHandle === void 0 ? void 0 : bodyHandle.boundingBox());
            await page.screenshot({
                path: options.output,
                clip: {
                    x: 0,
                    y: 0,
                    width: (_a = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.width) !== null && _a !== void 0 ? _a : 800,
                    height: (_b = boundingBox === null || boundingBox === void 0 ? void 0 : boundingBox.height) !== null && _b !== void 0 ? _b : 600
                },
            });
            break;
        default:
            break;
    }
    browser.close();
    console.log('Finish. Output: ' + options.output);
})();
