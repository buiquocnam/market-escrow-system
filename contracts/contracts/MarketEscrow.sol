// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MarketEscrow {
    enum EscrowStatus { Pending, Approved, Flagged, Released, Refunded }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        EscrowStatus status;
    }

    address public admin;
    uint256 public nextEscrowId;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, address buyer, address seller, uint256 amount);
    event EscrowAction(uint256 indexed escrowId, EscrowStatus newStatus);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function deposit(address _seller) external payable {
        require(msg.value > 0, "Deposit > 0");
        escrows[nextEscrowId] = Escrow({
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            status: EscrowStatus.Pending
        });
        emit EscrowCreated(nextEscrowId, msg.sender, _seller, msg.value);
        nextEscrowId++;
    }

    function release(uint256 _escrowId) external {
        Escrow storage e = escrows[_escrowId];
        require(e.status == EscrowStatus.Pending || e.status == EscrowStatus.Approved, "Invalid status");
        require(msg.sender == e.buyer || msg.sender == admin, "Only buyer or admin can release");
        
        e.status = EscrowStatus.Released;
        payable(e.seller).transfer(e.amount);
        emit EscrowAction(_escrowId, EscrowStatus.Released);
    }

    // Used in Dispute Resolutions or AI Overrides
    function refund(uint256 _escrowId) external onlyAdmin {
        Escrow storage e = escrows[_escrowId];
        require(e.status != EscrowStatus.Released && e.status != EscrowStatus.Refunded, "Cannot refund completed escrow");
        
        e.status = EscrowStatus.Refunded;
        payable(e.buyer).transfer(e.amount);
        emit EscrowAction(_escrowId, EscrowStatus.Refunded);
    }

    // AI Engine or Reviewer integration
    function flagEscrow(uint256 _escrowId) external onlyAdmin {
        Escrow storage e = escrows[_escrowId];
        require(e.status == EscrowStatus.Pending || e.status == EscrowStatus.Approved, "Cannot flag completed escrow");
        e.status = EscrowStatus.Flagged;
        emit EscrowAction(_escrowId, EscrowStatus.Flagged);
    }
}
