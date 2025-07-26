"use strict";
/**
 * Jest setup file
 * t_wada's approach: power-assert integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
// power-assertの設定
require("power-assert");
// テスト環境のグローバル設定
beforeEach(() => {
    // 各テストの実行前にモックをリセット
    jest.clearAllMocks();
});
// テスト後のクリーンアップ
afterEach(() => {
    // 必要に応じてリソースのクリーンアップ
});
// テスト用のタイムアウト設定
jest.setTimeout(10000);
//# sourceMappingURL=setup.js.map