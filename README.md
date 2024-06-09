# gassma

gassma is Google Apps Script(GAS) of SpreadSheet library that can be used like prisma.

## Installation

```
npm i gassma
```

## Gassma Script ID

```
1ZVuWMUYs4hVKDCcP3nVw74AY48VqLm50wRceKIQLFKL0wf4Hyou-FIBH
```

## Getting Started

```.ts
import { GassmaClient } from "gassma";

const gassma = new Gassma.GassmaClient();

// getData from SpreadSheet
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

0.6.1
