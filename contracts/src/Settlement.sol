// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Settlement {
    IERC20 public usdc;

    event TradeSettled(address target, uint256 value, bytes data);
    event Withdrawn(address to, uint256 amount);

    constructor(address _usdc)
    {
        usdc = IERC20(_usdc);
    }

    function settleTrade(bytes memory route, uint256 amount) internal {
        (address target, uint256 value, bytes memory data) =
            abi.decode(route, (address, uint256, bytes));

        require(usdc.approve(target, amount), "USDC approve failed");

        (bool success, bytes memory returndata) =
            target.call{value: value}(data);

        if (!success) {
            assembly {
                revert(add(returndata, 32), mload(returndata))
            }
        }

        emit TradeSettled(target, value, data);
    }
}