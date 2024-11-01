/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@jsquash/oxipng/codec/pkg-parallel/snippets/wasm-bindgen-rayon-3d2df09ebec17a22/src/workerHelpers.js":
/*!***************************************************************************************************************************!*\
  !*** ./node_modules/@jsquash/oxipng/codec/pkg-parallel/snippets/wasm-bindgen-rayon-3d2df09ebec17a22/src/workerHelpers.js ***!
  \***************************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"startWorkers\": () => (/* binding */ startWorkers)\n/* harmony export */ });\n/**\n * Copyright 2021 Google Inc. All Rights Reserved.\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *     http://www.apache.org/licenses/LICENSE-2.0\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n// Note: we use `wasm_bindgen_worker_`-prefixed message types to make sure\n// we can handle bundling into other files, which might happen to have their\n// own `postMessage`/`onmessage` communication channels.\n//\n// If we didn't take that into the account, we could send much simpler signals\n// like just `0` or whatever, but the code would be less resilient.\n\nfunction waitForMsgType(target, type) {\n  return new Promise(resolve => {\n    target.addEventListener('message', function onMsg({ data }) {\n      if (data == null || data.type !== type) return;\n      target.removeEventListener('message', onMsg);\n      resolve(data);\n    });\n  });\n}\n\nwaitForMsgType(self, 'wasm_bindgen_worker_init').then(async data => {\n  // # Note 1\n  // Our JS should have been generated in\n  // `[out-dir]/snippets/wasm-bindgen-rayon-[hash]/workerHelpers.js`,\n  // resolve the main module via `../../..`.\n  //\n  // This might need updating if the generated structure changes on wasm-bindgen\n  // side ever in the future, but works well with bundlers today. The whole\n  // point of this crate, after all, is to abstract away unstable features\n  // and temporary bugs so that you don't need to deal with them in your code.\n  //\n  // # Note 2\n  // This could be a regular import, but then some bundlers complain about\n  // circular deps.\n  //\n  // Dynamic import could be cheap if this file was inlined into the parent,\n  // which would require us just using `../../..` in `new Worker` below,\n  // but that doesn't work because wasm-pack unconditionally adds\n  // \"sideEffects\":false (see below).\n  //\n  // OTOH, even though it can't be inlined, it should be still reasonably\n  // cheap since the requested file is already in cache (it was loaded by\n  // the main thread).\n  const pkg = await __webpack_require__.e(/*! import() */ \"vendors-node_modules_jsquash_oxipng_codec_pkg-parallel_squoosh_oxipng_js\").then(__webpack_require__.bind(__webpack_require__, /*! ../../../squoosh_oxipng */ \"./node_modules/@jsquash/oxipng/codec/pkg-parallel/squoosh_oxipng.js\"));\n  await pkg.default(data.module, data.memory);\n  postMessage({ type: 'wasm_bindgen_worker_ready' });\n  pkg.wbg_rayon_start_worker(data.receiver);\n});\n\nasync function startWorkers(module, memory, builder) {\n  const workerInit = {\n    type: 'wasm_bindgen_worker_init',\n    module,\n    memory,\n    receiver: builder.receiver()\n  };\n\n  try {\n    await Promise.all(\n      Array.from({ length: builder.numThreads() }, () => {\n        // Self-spawn into a new Worker.\n        //\n        // TODO: while `new URL('...', import.meta.url) becomes a semi-standard\n        // way to get asset URLs relative to the module across various bundlers\n        // and browser, ideally we should switch to `import.meta.resolve`\n        // once it becomes a standard.\n        //\n        // Note: we could use `../../..` as the URL here to inline workerHelpers.js\n        // into the parent entry instead of creating another split point -\n        // this would be preferable from optimization perspective -\n        // however, Webpack then eliminates all message handler code\n        // because wasm-pack produces \"sideEffects\":false in package.json\n        // unconditionally.\n        //\n        // The only way to work around that is to have side effect code\n        // in an entry point such as Worker file itself.\n        const worker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u(\"node_modules_jsquash_oxipng_codec_pkg-parallel_snippets_wasm-bindgen-rayon-3d2df09ebec17a22_s-312b0a0\"), __webpack_require__.b), {\n          type: undefined\n        });\n        worker.postMessage(workerInit);\n        return waitForMsgType(worker, 'wasm_bindgen_worker_ready');\n      })\n    );\n    builder.build();\n  } finally {\n    builder.free();\n  }\n}\n\n\n//# sourceURL=webpack:///./node_modules/@jsquash/oxipng/codec/pkg-parallel/snippets/wasm-bindgen-rayon-3d2df09ebec17a22/src/workerHelpers.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/test/wp-content/plugins/squeeze/assets/js/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = self.location + "";
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"node_modules_jsquash_oxipng_codec_pkg-parallel_snippets_wasm-bindgen-rayon-3d2df09ebec17a22_s-312b0a0": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunk"] = self["webpackChunk"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./node_modules/@jsquash/oxipng/codec/pkg-parallel/snippets/wasm-bindgen-rayon-3d2df09ebec17a22/src/workerHelpers.js");
/******/ 	
/******/ })()
;