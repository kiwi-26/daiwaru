"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunk = void 0;
function chunk(arr, size) {
    return arr.reduce((newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]), []);
}
exports.chunk = chunk;
