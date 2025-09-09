npx hardhat node

npx hardhat compile

npx hardhat ignition deploy ignition/modules/Counter.ts --network localhost

npx hardhat ignition deploy ignition/modules/Counter.ts --network sepolia

npx hardhat ignition deployments

---

Ändra keystore variabler

npx hardhat keystore set SEPOLIA_PRIVATE_KEY

---

TESTING

mocha for testing
npx hardhat test
npx hardhat --coverage

--- Testa alla kontrakt
npx hardhat test

--- Testa bara ETT kontrakt
npx hardhat test/helloworld
