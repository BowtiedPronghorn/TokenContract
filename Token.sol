// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.13;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract PickleToken is ERC20 {
    address public _owner;
    bool public isActive;
    uint256 public taxPercentage;

    constructor(uint256 supply, string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, supply);
        _owner = msg.sender;
        isActive = true;
        taxPercentage = 10;
    }

    modifier onlyOwner {
        require(msg.sender == _owner, "Only the owner can pause the contract");
        _;
    }

    modifier onlyActive {
        require(isActive, "Cannot initiate transactions while contract is paused");
        _;
    }

    function burn(uint256 amount) public onlyActive {
        _burn(msg.sender, amount);
    }

    function pause() public onlyOwner {
        if (isActive) {
            isActive = false;
        }
        else {
            isActive = true;
        }
    }

    function _payTax(uint256 amount) internal returns (uint256) {
        uint256 tax = (amount * taxPercentage / 100);
        _transfer(msg.sender, _owner, tax);
        amount = (amount - tax);
    return amount;
    }

    // Override parent methods with onlyActive modifier to make contract pausable
    function transfer(address to, uint256 amount) public virtual override onlyActive returns (bool) {
        amount = _payTax(amount);
        return super.transfer(to, amount);
    }

    function allowance(address owner, address spender) public view virtual override onlyActive returns (uint256) {
        return super.allowance(owner, spender);
    }

    function approve(address spender, uint256 amount) public virtual override onlyActive returns (bool) {
        return super.approve(spender, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override onlyActive returns (bool) {
        amount = _payTax(amount);
        return super.transferFrom(from, to, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public virtual override onlyActive returns (bool) {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual override onlyActive returns (bool) {
        return super.decreaseAllowance(spender, subtractedValue);
    }

}
