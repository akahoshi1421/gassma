# Gassma

Gassma is Google Apps Script(GAS) of SpreadSheet library that can be used like prisma.

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

```.ts
import { Gassma } from "gassma";

const gassma = new Gassma.GassmaClient();

// Getting data from the SpreadSheet
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

When using script editor in GAS...

```.gs
const gassma = new Gassma.GassmaClient();

// Getting data from the SpreadSheet
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

## version

0.7.0
