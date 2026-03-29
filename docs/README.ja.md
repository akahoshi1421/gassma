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

1. `./gassma/` ディレクトリにPrismaスキーマファイルを作成します:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./generated/gassma"
}

model User {
  id    Int     @id
  name  String
  email String?
  age   Int
}
```

2. `npx gassma generate` を実行して型安全なクライアントコードを生成します。

3. 生成されたクライアントを使用します:

```.ts
import { GassmaClient } from "./generated/gassma/schemaClient";

const gassma = new GassmaClient();

// スプレッドシートからデータを取得
function myFunction(){
    const result = gassma.User.findMany({
        where: {
            age: { gte: 25 }
        },
        orderBy: { name: "asc" }
    });

    console.log(result);
}
```

GASのスクリプトエディタを使用する場合...

```.gs
const gassma = new Gassma.GassmaClient();

// スプレッドシートからデータを取得
function myFunction(){
    const result = gassma.YOUR_SHEET_NAME.findMany({
        where: {
            city: "Tokyo",
            age: 22
        }
    });

    console.log(result);
}
```

## 公式リファレンス

https://akahoshi1421.github.io/gassma-reference/

## バージョン

7