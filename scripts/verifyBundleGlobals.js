"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.join(__dirname, "..");
const dtsPath = path.join(rootDir, "src", "index.d.ts");
const bundlePath = path.join(rootDir, "dist", "bundle.js");

const parsePublicDeclarations = (dtsSource) => {
  const decls = new Map();
  dtsSource.split("\n").forEach((line) => {
    const matched = line.match(
      /^ {2}(class|const|function) ([A-Za-z_$][A-Za-z0-9_$]*)(.*)$/,
    );
    if (!matched) return;
    const keyword = matched[1];
    const name = matched[2];
    const rest = matched[3];
    if (decls.has(name)) return;
    if (keyword === "class") {
      decls.set(name, rest.includes("extends Error") ? "errorClass" : "class");
      return;
    }
    if (keyword === "function") {
      decls.set(name, "function");
      return;
    }
    if (rest.includes("unique symbol")) {
      decls.set(name, "symbol");
      return;
    }
    decls.set(name, /:\s*new\b/.test(rest) ? "class" : "value");
  });
  return decls;
};

const fakeGasSetupCode = `
globalThis.SpreadsheetApp = (() => {
  const makeSheet = (name, initial) => {
    const data = initial.map((row) => row.slice());
    return {
      getName: () => name,
      getLastRow: () => data.length,
      getLastColumn: () => data[0].length,
      getDataRange: () => ({ getValues: () => data.map((row) => row.slice()) }),
      getRange: (row, col, numRows, numCols) => ({
        getValues: () =>
          data
            .slice(row - 1, row - 1 + numRows)
            .map((r) => r.slice(col - 1, col - 1 + numCols)),
        setValues: (values) => {
          values.forEach((rowValues, i) => {
            while (data.length < row + i)
              data.push(new Array(data[0].length).fill(""));
            rowValues.forEach((value, j) => {
              data[row - 1 + i][col - 1 + j] = value;
            });
          });
        },
      }),
      deleteRow: (rowIndex) => {
        data.splice(rowIndex - 1, 1);
      },
    };
  };
  const sheets = [
    makeSheet("Users", [
      ["id", "name", "age"],
      [1, "Alice", 20],
      [2, "Bob", 30],
    ]),
  ];
  const spreadsheet = {
    getId: () => "verify-bundle",
    getSheets: () => sheets,
    getSheetByName: (name) =>
      sheets.find((sheet) => sheet.getName() === name) ?? null,
  };
  return { getActiveSpreadsheet: () => spreadsheet };
})();
`;

const scenarioCode = `
JSON.stringify((() => {
  const results = {};
  const client = new GassmaClient();
  results.clientInstanceOk = client instanceof GassmaClient;
  results.controllerInstanceOk = client.Users instanceof GassmaController;
  results.findAllCount = client.Users.findMany({}).length;
  results.createdName = client.Users.create({
    data: { id: 3, name: "Carol", age: 40 },
  }).name;
  results.afterCreateCount = client.Users.count({});
  results.skipFilteredCount = client.Users.findMany({
    where: { name: skip },
  }).length;
  const strictClient = new GassmaClient({ strictUndefinedChecks: true });
  results.strictSkipCount = strictClient.Users.findMany({
    where: { name: skip },
  }).length;
  try {
    strictClient.Users.findMany({ where: { name: undefined } });
    results.strictUndefined = "no-throw";
  } catch (e) {
    results.strictUndefined =
      e instanceof GassmaUndefinedValueError
        ? "GassmaUndefinedValueError"
        : "other: " + e.name;
  }
  try {
    client.Users.findFirstOrThrow({ where: { id: 999 } });
    results.notFound = "no-throw";
  } catch (e) {
    results.notFound =
      e instanceof NotFoundError ? "NotFoundError" : "other: " + e.name;
  }
  results.updatedAge = client.Users.update({
    where: { id: 1 },
    data: { age: 21 },
  }).age;
  results.deletedName = client.Users.delete({ where: { id: 2 } }).name;
  results.finalCount = client.Users.count({});
  return results;
})())
`;

const instantiationCode = (names) => `
JSON.stringify(${JSON.stringify(names)}.map((name) => {
  const Ctor = globalThis[name];
  const report = { name };
  try {
    const instance = new Ctor("arg1", "arg2", "arg3", "arg4");
    report.instanceOk = instance instanceof Ctor;
    report.errorChainOk = Error.prototype.isPrototypeOf(instance);
  } catch (e) {
    report.thrown = String(e);
  }
  return report;
}))
`;

const typeOfKind = { class: "function", errorClass: "function", function: "function", symbol: "symbol" };

const main = () => {
  if (!fs.existsSync(bundlePath)) {
    console.error("dist/bundle.js がありません。先に npm run build を実行してください。");
    process.exit(1);
  }
  const expected = parsePublicDeclarations(fs.readFileSync(dtsPath, "utf8"));
  if (expected.size === 0) {
    console.error("src/index.d.ts から公開宣言を抽出できませんでした。");
    process.exit(1);
  }

  const failures = [];
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(fakeGasSetupCode, sandbox, { filename: "fakeGas.js" });
  const preBundleNames = new Set(Object.getOwnPropertyNames(sandbox));
  vm.runInContext(fs.readFileSync(bundlePath, "utf8"), sandbox, {
    filename: "bundle.js",
  });

  const introduced = Object.getOwnPropertyNames(sandbox).filter(
    (name) => !preBundleNames.has(name),
  );
  introduced.forEach((name) => {
    if (!expected.has(name))
      failures.push(`公開対象外のシンボルが露出しています: ${name}`);
  });
  expected.forEach((kind, name) => {
    if (!introduced.includes(name)) {
      failures.push(`公開シンボルが bundle に存在しません: ${name}`);
      return;
    }
    const expectedType = typeOfKind[kind];
    const actualType = typeof sandbox[name];
    if (expectedType && actualType !== expectedType)
      failures.push(
        `型不一致: ${name} は ${expectedType} のはずですが ${actualType} でした`,
      );
    if (!expectedType && sandbox[name] === undefined)
      failures.push(`公開シンボルが undefined です: ${name}`);
  });

  const errorClassNames = [];
  expected.forEach((kind, name) => {
    if (kind === "errorClass") errorClassNames.push(name);
  });
  if (failures.length === 0) {
    const reports = JSON.parse(
      vm.runInContext(instantiationCode(errorClassNames), sandbox),
    );
    reports.forEach((report) => {
      if (report.thrown)
        failures.push(`${report.name} の new に失敗: ${report.thrown}`);
      else if (!report.instanceOk)
        failures.push(`${report.name}: instanceof が成立しません`);
      else if (!report.errorChainOk)
        failures.push(`${report.name}: Error の prototype チェーンにありません`);
    });

    const fieldRef = JSON.parse(
      vm.runInContext(
        'JSON.stringify({ ok: new FieldRef("m", "f") instanceof FieldRef, chain: Error.prototype.isPrototypeOf(new FieldRef("m", "f")), modelName: new FieldRef("m", "f").modelName })',
        sandbox,
      ),
    );
    if (!fieldRef.ok || fieldRef.chain || fieldRef.modelName !== "m")
      failures.push("FieldRef の instanceof / プロパティ検証に失敗しました");

    const scenario = JSON.parse(vm.runInContext(scenarioCode, sandbox));
    const expectations = {
      clientInstanceOk: true,
      controllerInstanceOk: true,
      findAllCount: 2,
      createdName: "Carol",
      afterCreateCount: 3,
      skipFilteredCount: 3,
      strictSkipCount: 3,
      strictUndefined: "GassmaUndefinedValueError",
      notFound: "NotFoundError",
      updatedAge: 21,
      deletedName: "Bob",
      finalCount: 2,
    };
    Object.keys(expectations).forEach((key) => {
      if (scenario[key] !== expectations[key])
        failures.push(
          `シナリオ検証に失敗: ${key} の期待値 ${expectations[key]} に対し実際は ${scenario[key]}`,
        );
    });
  }

  if (failures.length > 0) {
    failures.forEach((failure) => console.error(`NG: ${failure}`));
    console.error(
      `\nbundle 検証に失敗しました (失敗 ${failures.length} 件 / 公開シンボル ${expected.size} 件 / トップレベル ${introduced.length} 件)`,
    );
    process.exit(1);
  }
  console.log(
    `bundle 検証 OK: 公開シンボル ${expected.size} 件 (トップレベル宣言 ${introduced.length} 件、エラークラス ${errorClassNames.length} 件)、サイズ ${fs.statSync(bundlePath).size} bytes`,
  );
};

main();
