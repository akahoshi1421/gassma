# gassma

gassma is Google Apps Script(GAS) of SpreadSheet library that can be used like prisma.

## Installation

coming soon...

## Script ID

```
1r51w0nT8oUA0sUV7-Pu6jUqkuyWlH3DrAp1413SRvu0rDtntpU2FP50d
```

## Getting Started

```.ts
import { GassmaClient } from "gassma";

const gassma = new GassmaClient();

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

0.5.0
