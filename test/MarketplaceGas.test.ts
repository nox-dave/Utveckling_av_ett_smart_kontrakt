import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe('Marketplace Gas Tests', function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, admin] = await ethers.getSigners();
    
    const Marketplace = await ethers.getContractFactory('Marketplace');
    const marketplace = await Marketplace.deploy();
    
    return { marketplace, owner, seller, buyer, admin };
  }

  const LISTING_PRICE = ethers.parseEther("1.0");
  const LISTING_TITLE = "Test Item";
  const LISTING_DESCRIPTION = "Test Description";

  describe('Admin Functions Gas Usage', function () {
    it('should measure gas for grantAdmin', async function () {
      const { marketplace, admin } = await deployMarketplaceFixture();
      
      const tx = await marketplace.grantAdmin(admin.address);
      const receipt = await tx.wait();
      
      console.log(`Grant Admin Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(52000);
    });

    it('should measure gas for revokeAdmin', async function () {
      const { marketplace, admin } = await deployMarketplaceFixture();
      
      await marketplace.grantAdmin(admin.address);
      const tx = await marketplace.revokeAdmin(admin.address);
      const receipt = await tx.wait();
      
      console.log(`Revoke Admin Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(30000);
    });
  });

  describe('Listing Functions Gas Usage', function () {
    it('should measure gas for creating listing', async function () {
      const { marketplace, seller } = await deployMarketplaceFixture();
      
      const tx = await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      const receipt = await tx.wait();
      
      console.log(`Create Listing Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(200000);
    });

    it('should measure gas for purchasing item', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );

      const tx = await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      const receipt = await tx.wait();
      
      console.log(`Purchase Item Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(300000);
    });
  });

  describe('Deal Lifecycle Gas Usage', function () {
    it('should measure gas for marking as shipped', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });

      const tx = await marketplace.connect(seller).markAsShipped(1);
      const receipt = await tx.wait();
      
      console.log(`Mark as Shipped Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(80000);
    });

    it('should measure gas for confirming receipt', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      await marketplace.connect(seller).markAsShipped(1);
      
      const tx = await marketplace.connect(buyer).confirmReceipt(1);
      const receipt = await tx.wait();
      
      console.log(`Confirm Receipt Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(80000);
    });

    it('should measure gas for cancelling deal', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });

      const tx = await marketplace.connect(buyer).cancelDeal(1);
      const receipt = await tx.wait();
      
      console.log(`Cancel Deal Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(85000);
    });
  });

  describe('Dispute Functions Gas Usage', function () {
    it('should measure gas for raising dispute', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });

      const tx = await marketplace.connect(buyer).raiseDispute(1);
      const receipt = await tx.wait();
      
      console.log(`Raise Dispute Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(54000);
    });

    it('should measure gas for resolving dispute (favor seller)', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      await marketplace.connect(buyer).raiseDispute(1);
      
      const tx = await marketplace.resolveDispute(1, true);
      const receipt = await tx.wait();
      
      console.log(`Resolve Dispute (Seller) Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(80000);
    });

    it('should measure gas for resolving dispute (favor buyer)', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      await marketplace.connect(buyer).raiseDispute(1);
      
      const tx = await marketplace.resolveDispute(1, false);
      const receipt = await tx.wait();
      
      console.log(`Resolve Dispute (Buyer) Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(80000);
    });
  });

  describe('Balance Withdrawal Gas Usage', function () {
    it('should measure gas for withdrawing balance', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      await marketplace.connect(seller).markAsShipped(1);
      await marketplace.connect(buyer).confirmReceipt(1);

      const tx = await marketplace.connect(seller).withdrawBalance();
      const receipt = await tx.wait();
      
      console.log(`Withdraw Balance Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(50000);
    });
  });

  describe('Gas Optimization Analysis', function () {
    it('should compare gas usage between different operations', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      const operations = [];

      const listingTx = await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      const listingReceipt = await listingTx.wait();
      operations.push({
        operation: "Create Listing",
        gasUsed: listingReceipt!.gasUsed
      });

      const purchaseTx = await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      const purchaseReceipt = await purchaseTx.wait();
      operations.push({
        operation: "Purchase Item",
        gasUsed: purchaseReceipt!.gasUsed
      });

      const shipTx = await marketplace.connect(seller).markAsShipped(1);
      const shipReceipt = await shipTx.wait();
      operations.push({
        operation: "Mark as Shipped",
        gasUsed: shipReceipt!.gasUsed
      });

      const confirmTx = await marketplace.connect(buyer).confirmReceipt(1);
      const confirmReceipt = await confirmTx.wait();
      operations.push({
        operation: "Confirm Receipt",
        gasUsed: confirmReceipt!.gasUsed
      });

      const withdrawTx = await marketplace.connect(seller).withdrawBalance();
      const withdrawReceipt = await withdrawTx.wait();
      operations.push({
        operation: "Withdraw Balance",
        gasUsed: withdrawReceipt!.gasUsed
      });

      console.log("\n=== Gas Usage Comparison ===");
      operations.sort((a, b) => Number(b.gasUsed - a.gasUsed));
      operations.forEach((op, index) => {
        console.log(`${index + 1}. ${op.operation}: ${op.gasUsed.toString()} gas`);
      });

      const totalGas = operations.reduce((sum, op) => sum + op.gasUsed, 0n);
      console.log(`\nTotal Gas for Complete Transaction: ${totalGas.toString()} gas`);
    });

    it('should test batch operations gas efficiency', async function () {
      const { marketplace, seller } = await deployMarketplaceFixture();
      const batchSize = 5;
      let totalGasUsed = 0n;

      console.log(`\n=== Batch Operations Test (${batchSize} listings) ===`);

      for (let i = 0; i < batchSize; i++) {
        const tx = await marketplace.connect(seller).listingItem(
          `${LISTING_TITLE} ${i + 1}`,
          `${LISTING_DESCRIPTION} ${i + 1}`,
          LISTING_PRICE
        );
        const receipt = await tx.wait();
        totalGasUsed += receipt!.gasUsed;
        
        console.log(`Listing ${i + 1} Gas Used: ${receipt!.gasUsed.toString()}`);
      }

      const averageGas = totalGasUsed / BigInt(batchSize);
      console.log(`Average Gas per Listing: ${averageGas.toString()}`);
      console.log(`Total Gas for ${batchSize} Listings: ${totalGasUsed.toString()}`);

      expect(averageGas).to.be.lessThan(200000);
    });
  });

  describe('Edge Cases Gas Usage', function () {
    it('should measure gas for operations with long strings', async function () {
      const { marketplace, seller } = await deployMarketplaceFixture();
      
      const longTitle = "A".repeat(100);
      const longDescription = "B".repeat(500);

      const tx = await marketplace.connect(seller).listingItem(
        longTitle,
        longDescription,
        LISTING_PRICE
      );
      const receipt = await tx.wait();
      
      console.log(`Long String Listing Gas Used: ${receipt!.gasUsed.toString()}`);
      expect(receipt!.gasUsed).to.be.lessThan(700000);
    });

    it('should measure gas for multiple deals sequence', async function () {
      const { marketplace, seller, buyer } = await deployMarketplaceFixture();
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );

      const tx1 = await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      const receipt1 = await tx1.wait();
      
      await marketplace.connect(buyer).cancelDeal(1);
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );

      const tx2 = await marketplace.connect(buyer).purchaseItem(2, {
        value: LISTING_PRICE
      });
      const receipt2 = await tx2.wait();

      console.log(`First Purchase Gas: ${receipt1!.gasUsed.toString()}`);
      console.log(`Second Purchase Gas: ${receipt2!.gasUsed.toString()}`);
      
      expect(receipt1!.gasUsed).to.be.approximately(receipt2!.gasUsed, 20000);
    });
  });
});
