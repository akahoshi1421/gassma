# GASsma

[日本語](docs/README.ja.md) | English

GASsma is Google Apps Script(GAS) of SpreadSheet library that can be used like prisma.

GASsma allows you to treat Google Sheets as a database with Prisma-like syntax. You can perform CRUD operations, filtering, sorting, and aggregation on your spreadsheet data using familiar TypeScript/JavaScript methods. Perfect for building applications that need simple data persistence without setting up a traditional database.

## Installation

```
npm i gassma
```

## Gassma Script ID

```
1ZVuWMUYs4hVKDCcP3nVw74AY48VqLm50wRceKIQLFKL0wf4Hyou-FIBH
```

## Getting Started

When using Clasp...

1. Create a Prisma schema file under `./gassma/` directory:

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

2. Run `npx gassma generate` to generate type-safe client code.

3. Use the generated client:

```.ts
import { GassmaClient } from "./generated/gassma/schemaClient";

const gassma = new GassmaClient();

// Getting data from the SpreadSheet
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

When using script editor in GAS...

```.gs
const gassma = new Gassma.GassmaClient();

// Getting data from the SpreadSheet
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

## Official Reference

https://akahoshi1421.github.io/gassma-reference/en

## version

7
