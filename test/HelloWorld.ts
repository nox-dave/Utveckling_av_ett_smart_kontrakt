import { expect } from 'chai';
import { network } from 'hardhat';

const { ethers } = await network.connect();

describe('HelloWorld', function () {
  async function deployHelloWorldFixture() {
    const initialMessage = 'Hello world';

    const HelloWorld = await ethers.getContractFactory('HelloWorld');
    const helloWorld = await HelloWorld.deploy(initialMessage);

    return { helloWorld, initialMessage };
  }

  describe('Deployment', function () {
    it('Should set the correct initial message', async function () {
      const { helloWorld, initialMessage } = await deployHelloWorldFixture();

      expect(await helloWorld.message()).to.equal(initialMessage);
      console.log('Initial message is ', initialMessage);
    });
  });

  describe('Message update', function () {
    it('Should update the message', async function () {
      const { helloWorld } = await deployHelloWorldFixture();

      const newMessage = 'BCU24D';

      await helloWorld.setMessage(newMessage);
      expect(await helloWorld.message()).to.equal(newMessage);
    });

    it('Should allow for multiple updates of the message variable', async function () {
      const { helloWorld } = await deployHelloWorldFixture();
      const firstMessage = 'This is the first message';
      const secondMessage = 'This is the second message';

      await helloWorld.setMessage(firstMessage);
      expect(await helloWorld.message()).to.equal(firstMessage);

      await helloWorld.setMessage(secondMessage);
      expect(await helloWorld.message()).to.equal(secondMessage);
    });
  });
});
