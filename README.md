# Marketplace Smart Contract

Ett smart kontrakt för säker handel mellan köpare och säljare på Ethereum blockchain.

## Projektöversikt

Detta projekt implementerar en decentraliserad marknadsplats där användare kan:
- Lägga ut varor till försäljning
- Köpa varor med säker betalning
- Hantera leveranser och bekräftelser
- Lösa tvister genom administratörer

## Uppfyllda Krav för VG

### Grundläggande Krav (G)
- ✅ **Struct och Enum**: `Deal`, `Listing` structs och `DealStatus` enum
- ✅ **Mappings och Arrays**: Flera mappings för användare, deals, listings och balancer
- ✅ **Constructor**: Sätter ägare och initial admin
- ✅ **Custom Modifiers**: `onlyOwner`, `onlyAdmin`, `validListing`, `lock`, etc.
- ✅ **Events**: 8 olika events för att logga viktiga händelser
- ✅ **Test Coverage**: 98% test coverage

### VG-Krav
- ✅ **Custom Errors**: 8 custom errors implementerade (t.ex. `NotOwner()`, `InvalidPrice()`)
- ✅ **Require, Assert, Revert**: Alla tre används i kontraktet
- ✅ **Fallback/Receive**: Båda funktioner implementerade för att ta emot ETH
- ✅ **Sepolia Deployment**: Kontraktet är deployat och verifierat på Sepolia
- ✅ **Test Coverage 90%+**: 98% test coverage uppnått

**Verifierat Kontrakt på Etherscan:**
https://sepolia.etherscan.io/address/0x986264ea75511244F7b153Ca453FE4a8b624aE9b#code

## Gas-Optimeringar och Säkerhetsåtgärder

### Gas-Optimeringar

1. **Struct Packing (Storage Slot Optimering)**
   - `Deal` struct: Reducerad från 8 till 3 storage slots genom smart packning
   - `Listing` struct: Optimerad layout för minimalt storage användning
   - Använder mindre datatyper: `uint128`, `uint64`, `uint32` istället för `uint256`

2. **Custom Errors istället för Strings**
   - Sparar gas genom att använda custom errors istället för require strings
   - Exempel: `revert InvalidPrice()` istället för `require(price > 0, "Invalid price")`

3. **Calldata istället för Memory**
   - Funktionsparametrar använder `calldata` för strings
   - Sparar gas vid funktionsanrop

4. **Unchecked Math**
   - Använder `unchecked` blocks för säkra incrementeringar
   - Förhindrar onödig overflow-kontroll när det är säkert

### Säkerhetsåtgärder

1. **Reentrancy Guard**
   - Egen implementation av reentrancy protection med `lock` modifier
   - Skyddar kritiska funktioner som `confirmReceipt`, `cancelDeal`, `resolveDispute`

2. **Checks-Effects-Interactions Pattern**
   - State uppdateras innan externa anrop
   - Förhindrar reentrancy attacks

3. **Access Control**
   - Rollbaserad åtkomstkontroll med owner och admins
   - Funktioner är skyddade med lämpliga modifiers

4. **Input Validation**
   - Validering av alla inputs med custom errors
   - Kontroll av deal status innan operationer

5. **Safe ETH Transfer**
   - Använder `.call{value: amount}("")` för säkra ETH-överföringar
   - Kontrollerar returvärde och revertar vid misslyckade överföringar

## Funktionalitet

### Grundläggande Funktioner
- `listingItem()`: Skapa ny listing
- `purchaseItem()`: Köp vara och starta deal
- `markAsShipped()`: Säljare markerar som skickad
- `confirmReceipt()`: Köpare bekräftar mottagning
- `cancelDeal()`: Avbryt deal (endast pending status)

### Tvist-hantering
- `raiseDispute()`: Starta tvist
- `resolveDispute()`: Admin löser tvist

### Admin-funktioner
- `grantAdmin()`: Ge admin-rättigheter
- `revokeAdmin()`: Ta bort admin-rättigheter

### Balans-hantering
- `withdrawBalance()`: Ta ut intjänade medel

## Testning

Projektet innehåller omfattande tester:
- **Marketplace.test.ts**: Funktionalitetstester (584 rader)
- **MarketplaceGas.test.ts**: Gas-optimeringstester (356 rader)
- **Test Coverage**: 98%

Kör tester med:
```bash
npx hardhat test
npx hardhat coverage
```

## Deployment

Kontraktet är deployat på Sepolia testnet:
```bash
npx hardhat compile
npx hardhat ignition deploy ignition/modules/Marketplace.ts --network sepolia
npx hardhat verify --network sepolia [CONTRACT_ADDRESS]
```

## Teknik Stack

- **Solidity**: ^0.8.28
- **Hardhat**: Development environment
- **Ethers.js**: Ethereum library
- **Mocha/Chai**: Testing framework
- **TypeScript**: Type safety

## Säkerhetsöverväganden

Kontraktet implementerar flera säkerhetsbestpraktiker men bör genomgå professionell säkerhetsgranskning innan produktionsanvändning. Den egna reentrancy guard-implementationen är ett proof of concept - OpenZeppelin's ReentrancyGuard rekommenderas för produktion.