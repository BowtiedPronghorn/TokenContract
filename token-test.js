const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const Token = artifacts.require("PickleToken");

contract("Token", accounts => {
    const owner = accounts[0];
    const recipient = accounts[1];

    it("Should be ERC20 compliant", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        // totalSupply method returns amount of tokens in existence
        assert.equal(await tokenInstance.totalSupply(), 1000);
        // balanceOf returns amount of tokens held by address
        assert.equal(await tokenInstance.balanceOf(owner), 1000);
        // transfer method transfers tokens from sender to address
        await tokenInstance.transfer(recipient, 500, {from: owner});
        assert.equal(await tokenInstance.balanceOf(owner), 550);
        assert.equal(await tokenInstance.balanceOf(recipient), 450);
        assert.equal(await tokenInstance.allowance(owner, recipient), 0);
        // approve method allows spender to spend tokens for owner
        await tokenInstance.approve(recipient, 500, {from: owner});
        // allowance method returns number of tokens that recipient can spend on owners behalf
        assert.equal(await tokenInstance.allowance(owner, recipient), 500);
        // transferFrom method moves n tokens from owner to recipient
        await tokenInstance.transferFrom(owner, recipient, 500, {from: recipient});
        assert.equal(await tokenInstance.balanceOf(recipient), 850);
        assert.equal(await tokenInstance.balanceOf(owner), 150);
    });

    it("Should mint token to owner with fixed supply", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        assert.equal(await tokenInstance.balanceOf(owner), 1000);
        assert.equal(await tokenInstance.balanceOf(recipient), 0);
        assert.equal(await tokenInstance.totalSupply(), 1000);
    });

    it("Should be burnable", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        await tokenInstance.burn(1000, {from: owner});
        assert.equal(await tokenInstance.balanceOf(owner), 0);
        assert.equal(await tokenInstance.totalSupply(), 0);
    });

    it("Should be pausable only by the owner of the contract", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        await expectRevert(tokenInstance.pause({from: recipient}), "Only the owner can pause the contract");
        await tokenInstance.pause({from: owner});
    });

    it("Should be unable to execute transactions or other allowances when paused", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        await tokenInstance.pause({from: owner});
        await expectRevert(tokenInstance.burn(1000, {from: owner}),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.transfer(recipient, 500, {from: owner}),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.allowance(owner, recipient),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.approve(recipient, 500, {from: owner}),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.transferFrom(owner, recipient, 500, {from: recipient}),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.increaseAllowance(recipient, 1000, {from: owner}),
            "Cannot initiate transactions while contract is paused")
        await expectRevert(tokenInstance.decreaseAllowance(recipient, 1000, {from: owner}),
            "Cannot initiate transactions while contract is paused")
    });

    it("Should have a transfer tax that is sent to the owner", async () => {
        const tokenInstance = await Token.new(1000, 'Pickle', 'PICK', {from: owner});
        // Transfer tax works for transfer method
        await tokenInstance.transfer(recipient, 1000, {from: owner});
        assert.equal(await tokenInstance.balanceOf(recipient), 1000 - (1000* await tokenInstance.taxPercentage()/100));
        assert.equal(await tokenInstance.balanceOf(owner), 1000* await tokenInstance.taxPercentage()/100);
        // Transfer tax works for transferFrom method
        await tokenInstance.approve(owner, 100, {from: owner});
        await tokenInstance.transferFrom(owner, recipient, 100, {from: owner});
        assert.equal(await tokenInstance.balanceOf(owner), 100* await tokenInstance.taxPercentage()/100);
        assert.equal(await tokenInstance.balanceOf(recipient), 1000 - (100* await tokenInstance.taxPercentage()/100));
    });

});