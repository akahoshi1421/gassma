# GASsma

日本語 | [English](../README.md)

GASsmaはPrismaライクに使えるGoogle Apps Script（GAS）のスプレッドシートライブラリです。

GASsmaを使うことで、Googleスプレッドシートをデータベースのように扱うことができます。Prismaに慣れ親しんだ構文で、CRUD操作、フィルタリング、ソート、集計などの操作を簡単に実行できます。従来のデータベースを構築することなく、シンプルなデータ永続化が必要なアプリケーションの構築に最適です。

## インストール

```
npm i gassma
```

## Gassma Script ID

```
1ZVuWMUYs4hVKDCcP3nVw74AY48VqLm50wRceKIQLFKL0wf4Hyou-FIBH
```

## 始め方

Claspを使用する場合...

```.ts
import { Gassma } from "gassma";

const gassma = new Gassma.GassmaClient();

// スプレッドシートからデータを取得
function myFunction(){
    const result = gassma.sheets.YOUR_SHEET_NAME.findMany({
        where: {
            city: "Tokyo",
            age: 22
        }
    });

    console.log(result);
}
```

GASのスクリプトエディタを使用する場合...

```.gs
const gassma = new Gassma.GassmaClient();

// スプレッドシートからデータを取得
function myFunction(){
    const result = gassma.sheets.YOUR_SHEET_NAME.findMany({
        where: {
            city: "Tokyo",
            age: 22
        }
    });

    console.log(result);
}
```

## 型ファイルのインストール方法

```
$ npm i gassma
```

## 公式リファレンス

https://akahoshi1421.github.io/gassma-reference/

## バージョン

0.8.0