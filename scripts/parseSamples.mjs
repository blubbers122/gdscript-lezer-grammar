import { join, dirname, extname } from "path";
import { readFile, readdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { printTree } from "./printLezerTree.mts";
import { parser } from "../src/index.mts";
var FILE_PATH = dirname(fileURLToPath(import.meta.url));
var SAMPLES_PATH = join(FILE_PATH, "..", "samples");
var files = await readdir(SAMPLES_PATH);
for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
    var file = files_1[_i];
    if (extname(file) !== ".gd") {
        continue;
    }
    var filePath = join(SAMPLES_PATH, file);
    var fileContent = await readFile(filePath, { encoding: "utf-8" });
    var tree = parser.parse(fileContent);
    await writeFile(join(SAMPLES_PATH, "".concat(file, ".out")), printTree(tree, fileContent, { doNotColorize: true }));
}
