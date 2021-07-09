"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
class Config {
    constructor({ document, contents }) {
        this.document = { title: '', has_cover: false };
        this.contents = [];
        this.document = document;
        this.contents = contents;
    }
    contentsLength() {
        return this.contents.reduce((prev, curr) => {
            if (curr.repeat) {
                return prev + curr.repeat;
            }
            return prev + 1;
        }, 0);
    }
}
exports.Config = Config;
