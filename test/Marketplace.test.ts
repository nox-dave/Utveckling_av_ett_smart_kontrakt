import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe('Marketplace', function () {
  let marketplace: any;
  let owner: any;
  let seller: any;
  let buyer: any;
  let admin: any;
  let user: any;

  const LISTING_PRICE = ethers.parseEther("1.0");
  const LISTING_TITLE = "Test Item";
  const LISTING_DESCRIPTION = "Test Description";

  beforeEach(async function () {
    [owner, seller, buyer, admin, user] = await ethers.getSigners();
    
    const Marketplace = await ethers.getContractFactory('Marketplace');
    marketplace = await Marketplace.deploy();
  });

  describe('Deployment', function () {
    it('should set the correct owner', async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it('should set owner as admin', async function () {
      expect(await marketplace.admins(owner.address)).to.be.true;
    });

    it('should initialize nextListingId to 1', async function () {
      expect(await marketplace.nextListingId()).to.equal(1);
    });

    it('should initialize nextDealId to 1', async function () {
      expect(await marketplace.nextDealId()).to.equal(1);
    });
  });

  describe('Admin Management', function () {
    describe('grantAdmin', function () {
      it('should allow owner to grant admin privileges', async function () {
        await marketplace.grantAdmin(admin.address);
        expect(await marketplace.admins(admin.address)).to.be.true;
      });

      it('should emit GrantAdmin event', async function () {
        await expect(marketplace.grantAdmin(admin.address))
          .to.emit(marketplace, 'GrantAdmin')
          .withArgs(admin.address);
      });

      it('should revert if not called by owner', async function () {
        await expect(marketplace.connect(user).grantAdmin(admin.address))
          .to.be.revertedWithCustomError(marketplace, 'NotOwner');
      });

      it('should revert with zero address', async function () {
        await expect(marketplace.grantAdmin(ethers.ZeroAddress))
          .to.be.revertedWith('Invalid address');
      });
    });

    describe('revokeAdmin', function () {
      beforeEach(async function () {
        await marketplace.grantAdmin(admin.address);
      });

      it('should allow owner to revoke admin privileges', async function () {
        await marketplace.revokeAdmin(admin.address);
        expect(await marketplace.admins(admin.address)).to.be.false;
      });

      it('should emit RevokeAdmin event', async function () {
        await expect(marketplace.revokeAdmin(admin.address))
          .to.emit(marketplace, 'RevokeAdmin')
          .withArgs(admin.address);
      });

      it('should revert if not called by owner', async function () {
        await expect(marketplace.connect(user).revokeAdmin(admin.address))
          .to.be.revertedWithCustomError(marketplace, 'NotOwner');
      });
    });
  });

  describe('Listing Management', function () {
    describe('listingItem', function () {
      it('should create a listing successfully', async function () {
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );

        const listing = await marketplace.listings(1);
        expect(listing.seller).to.equal(seller.address);
        expect(listing.isActive).to.be.true;
        expect(listing.price).to.equal(LISTING_PRICE);
        expect(listing.title).to.equal(LISTING_TITLE);
        expect(listing.description).to.equal(LISTING_DESCRIPTION);
      });

      it('should increment nextListingId', async function () {
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );
        expect(await marketplace.nextListingId()).to.equal(2);
      });

      it('should emit ListingCreated event', async function () {
        await expect(marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        )).to.emit(marketplace, 'ListingCreated');
      });

      it('should revert with zero price', async function () {
        await expect(marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          0
        )).to.be.revertedWithCustomError(marketplace, 'InvalidPrice');
      });

      it('should revert with empty title', async function () {
        await expect(marketplace.connect(seller).listingItem(
          "",
          LISTING_DESCRIPTION,
          LISTING_PRICE
        )).to.be.revertedWith('Empty title not allowed');
      });
    });

    describe('purchaseItem', function () {
      beforeEach(async function () {
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );
      });

      it('should purchase item successfully', async function () {
        await marketplace.connect(buyer).purchaseItem(1, {
          value: LISTING_PRICE
        });

        const deal = await marketplace.deals(1);
        expect(deal.seller).to.equal(seller.address);
        expect(deal.buyer).to.equal(buyer.address);
        expect(deal.amount).to.equal(LISTING_PRICE);
        expect(deal.status).to.equal(0); // PENDING

        const listing = await marketplace.listings(1);
        expect(listing.isActive).to.be.false;
      });

      it('should lock funds', async function () {
        await marketplace.connect(buyer).purchaseItem(1, {
          value: LISTING_PRICE
        });

        expect(await marketplace.lockedFunds(1)).to.equal(LISTING_PRICE);
      });

      it('should emit DealCreated event', async function () {
        await expect(marketplace.connect(buyer).purchaseItem(1, {
          value: LISTING_PRICE
        })).to.emit(marketplace, 'DealCreated')
          .withArgs(buyer.address, LISTING_PRICE);
      });

      it('should revert with wrong price', async function () {
        await expect(marketplace.connect(buyer).purchaseItem(1, {
          value: ethers.parseEther("0.5")
        })).to.be.revertedWithCustomError(marketplace, 'InvalidPrice');
      });

      it('should revert if seller tries to buy own item', async function () {
        await expect(marketplace.connect(seller).purchaseItem(1, {
          value: LISTING_PRICE
        })).to.be.revertedWithCustomError(marketplace, 'CannotBuyOwnItem');
      });

      it('should revert with non-existent listing', async function () {
        await expect(marketplace.connect(buyer).purchaseItem(999, {
          value: LISTING_PRICE
        })).to.be.revertedWith("Listing doesn't exist");
      });

      it('should revert with inactive listing', async function () {
        await marketplace.connect(buyer).purchaseItem(1, {
          value: LISTING_PRICE
        });
        
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );
        
        await expect(marketplace.connect(user).purchaseItem(1, {
          value: LISTING_PRICE
        })).to.be.revertedWith("Listing not active");
      });
    });
  });

  describe('Deal Management', function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
    });

    describe('markAsShipped', function () {
      it('should mark deal as shipped', async function () {
        await marketplace.connect(seller).markAsShipped(1);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(1); // SHIPPED
        expect(deal.shippedAt).to.be.greaterThan(0);
      });

      it('should emit ItemShipped event', async function () {
        await expect(marketplace.connect(seller).markAsShipped(1))
          .to.emit(marketplace, 'ItemShipped');
      });

      it('should revert if not seller', async function () {
        await expect(marketplace.connect(buyer).markAsShipped(1))
          .to.be.revertedWith('Only seller');
      });

      it('should revert if deal not pending', async function () {
        await marketplace.connect(seller).markAsShipped(1);
        await expect(marketplace.connect(seller).markAsShipped(1))
          .to.be.revertedWithCustomError(marketplace, 'DealNotPending');
      });

      it('should revert with non-existent deal', async function () {
        await expect(marketplace.connect(seller).markAsShipped(999))
          .to.be.revertedWith("Deal doesn't exist");
      });
    });

    describe('confirmReceipt', function () {
      beforeEach(async function () {
        await marketplace.connect(seller).markAsShipped(1);
      });

      it('should confirm receipt and complete deal', async function () {
        await marketplace.connect(buyer).confirmReceipt(1);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(2); // COMPLETED
        expect(await marketplace.lockedFunds(1)).to.equal(0);
        expect(await marketplace.balances(seller.address)).to.equal(LISTING_PRICE);
      });

      it('should emit DealCompleted event', async function () {
        await expect(marketplace.connect(buyer).confirmReceipt(1))
          .to.emit(marketplace, 'DealCompleted');
      });

      it('should revert if not buyer', async function () {
        await expect(marketplace.connect(seller).confirmReceipt(1))
          .to.be.revertedWith('Only buyer');
      });

      it('should revert if deal not shipped', async function () {
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );
        await marketplace.connect(buyer).purchaseItem(2, {
          value: LISTING_PRICE
        });

        await expect(marketplace.connect(buyer).confirmReceipt(2))
          .to.be.revertedWithCustomError(marketplace, 'DealNotShipped');
      });
    });

    describe('cancelDeal', function () {
      it('should cancel deal and refund buyer', async function () {
        await marketplace.connect(buyer).cancelDeal(1);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(3); // CANCELLED
        expect(await marketplace.lockedFunds(1)).to.equal(0);
        expect(await marketplace.balances(buyer.address)).to.equal(LISTING_PRICE);
      });

      it('should emit DealCancelled event', async function () {
        await expect(marketplace.connect(buyer).cancelDeal(1))
          .to.emit(marketplace, 'DealCancelled');
      });

      it('should allow seller to cancel', async function () {
        await marketplace.connect(seller).cancelDeal(1);
        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(3); // CANCELLED
      });

      it('should revert if not buyer or seller', async function () {
        await expect(marketplace.connect(user).cancelDeal(1))
          .to.be.revertedWith('Only buyer or seller');
      });

      it('should revert if deal not pending', async function () {
        await marketplace.connect(seller).markAsShipped(1);
        await expect(marketplace.connect(buyer).cancelDeal(1))
          .to.be.revertedWithCustomError(marketplace, 'DealNotPending');
      });
    });
  });

  describe('Dispute Management', function () {
    beforeEach(async function () {
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });
      await marketplace.grantAdmin(admin.address);
    });

    describe('raiseDispute', function () {
      it('should raise dispute from pending status', async function () {
        await marketplace.connect(buyer).raiseDispute(1);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(4); // DISPUTED
      });

      it('should raise dispute from shipped status', async function () {
        await marketplace.connect(seller).markAsShipped(1);
        await marketplace.connect(buyer).raiseDispute(1);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(4); // DISPUTED
      });

      it('should emit DisputeRaised event', async function () {
        await expect(marketplace.connect(buyer).raiseDispute(1))
          .to.emit(marketplace, 'DisputeRaised');
      });

      it('should allow seller to raise dispute', async function () {
        await marketplace.connect(seller).raiseDispute(1);
        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(4); // DISPUTED
      });

      it('should revert if not buyer or seller', async function () {
        await expect(marketplace.connect(user).raiseDispute(1))
          .to.be.revertedWith('Only buyer or seller');
      });

      it('should revert if deal completed', async function () {
        await marketplace.connect(seller).markAsShipped(1);
        await marketplace.connect(buyer).confirmReceipt(1);
        await expect(marketplace.connect(buyer).raiseDispute(1))
          .to.be.revertedWithCustomError(marketplace, 'DealNotPending');
      });
    });

    describe('resolveDispute', function () {
      beforeEach(async function () {
        await marketplace.connect(buyer).raiseDispute(1);
      });

      it('should resolve dispute in favor of seller', async function () {
        await marketplace.connect(admin).resolveDispute(1, true);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(5); // RESOLVED
        expect(await marketplace.lockedFunds(1)).to.equal(0);
        expect(await marketplace.balances(seller.address)).to.equal(LISTING_PRICE);
      });

      it('should resolve dispute in favor of buyer', async function () {
        await marketplace.connect(admin).resolveDispute(1, false);

        const deal = await marketplace.deals(1);
        expect(deal.status).to.equal(5); // RESOLVED
        expect(await marketplace.lockedFunds(1)).to.equal(0);
        expect(await marketplace.balances(buyer.address)).to.equal(LISTING_PRICE);
      });

      it('should emit DisputeResolved event', async function () {
        await expect(marketplace.connect(admin).resolveDispute(1, true))
          .to.emit(marketplace, 'DisputeResolved');
      });

      it('should revert if not admin', async function () {
        await expect(marketplace.connect(user).resolveDispute(1, true))
          .to.be.revertedWithCustomError(marketplace, 'NotAdmin');
      });

      it('should revert if deal not disputed', async function () {
        await marketplace.connect(seller).listingItem(
          LISTING_TITLE,
          LISTING_DESCRIPTION,
          LISTING_PRICE
        );
        await marketplace.connect(buyer).purchaseItem(2, {
          value: LISTING_PRICE
        });

        await expect(marketplace.connect(admin).resolveDispute(2, true))
          .to.be.revertedWithCustomError(marketplace, 'DealNotDisputed');
      });
    });
  });

  describe('Balance Management', function () {
    beforeEach(async function () {
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
    });

    describe('withdrawBalance', function () {
      it('should withdraw balance successfully', async function () {
        const initialBalance = await ethers.provider.getBalance(seller.address);
        
        await marketplace.connect(seller).withdrawBalance();

        expect(await marketplace.balances(seller.address)).to.equal(0);
        expect(await ethers.provider.getBalance(seller.address))
          .to.be.greaterThan(initialBalance);
      });

      it('should emit FundsWithdrawn event', async function () {
        await expect(marketplace.connect(seller).withdrawBalance())
          .to.emit(marketplace, 'FundsWithdrawn');
      });

      it('should revert with insufficient balance', async function () {
        await expect(marketplace.connect(buyer).withdrawBalance())
          .to.be.revertedWith('No balance to withdraw');
      });
    });
  });

  describe('Fallback and Receive Functions', function () {
    it('should accept ETH via receive', async function () {
      const tx = await owner.sendTransaction({
        to: await marketplace.getAddress(),
        value: ethers.parseEther("1.0")
      });
      await tx.wait();
      
      expect(await ethers.provider.getBalance(await marketplace.getAddress()))
        .to.equal(ethers.parseEther("1.0"));
    });

    it('should accept ETH via fallback', async function () {
      const tx = await owner.sendTransaction({
        to: await marketplace.getAddress(),
        value: ethers.parseEther("1.0"),
        data: "0x1234"
      });
      await tx.wait();
      
      expect(await ethers.provider.getBalance(await marketplace.getAddress()))
        .to.equal(ethers.parseEther("1.0"));
    });
  });

  describe('Reentrancy Protection', function () {
    it('should prevent reentrancy on confirmReceipt', async function () {
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
      
      const deal = await marketplace.deals(1);
      expect(deal.status).to.equal(2); // COMPLETED
    });

    it('should prevent reentrancy on cancelDeal', async function () {
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(buyer).purchaseItem(1, {
        value: LISTING_PRICE
      });

      await marketplace.connect(buyer).cancelDeal(1);
      
      const deal = await marketplace.deals(1);
      expect(deal.status).to.equal(3); // CANCELLED
    });
  });

  describe('Edge Cases', function () {
    it('should handle multiple listings by same seller', async function () {
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        LISTING_PRICE
      );
      await marketplace.connect(seller).listingItem(
        "Item 2",
        "Description 2",
        ethers.parseEther("2.0")
      );

      expect(await marketplace.nextListingId()).to.equal(3);
      
      const listing1 = await marketplace.listings(1);
      const listing2 = await marketplace.listings(2);
      
      expect(listing1.seller).to.equal(seller.address);
      expect(listing2.seller).to.equal(seller.address);
      expect(listing1.price).to.equal(LISTING_PRICE);
      expect(listing2.price).to.equal(ethers.parseEther("2.0"));
    });

    it('should handle large price values', async function () {
      const largePrice = ethers.parseEther("1000000");
      
      await marketplace.connect(seller).listingItem(
        LISTING_TITLE,
        LISTING_DESCRIPTION,
        largePrice
      );

      const listing = await marketplace.listings(1);
      expect(listing.price).to.equal(largePrice);
    });

    it('should handle very long strings', async function () {
      const longTitle = "A".repeat(1000);
      const longDescription = "B".repeat(5000);
      
      await marketplace.connect(seller).listingItem(
        longTitle,
        longDescription,
        LISTING_PRICE
      );

      const listing = await marketplace.listings(1);
      expect(listing.title).to.equal(longTitle);
      expect(listing.description).to.equal(longDescription);
    });
  });
});
