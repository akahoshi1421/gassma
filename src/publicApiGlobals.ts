import * as publicApi from "./publicApi";

// GAS のライブラリとして公開するため、publicApi の export をそのままグローバルに置く。
// バンドルの entry はこのファイル。
Object.assign(globalThis, publicApi);
