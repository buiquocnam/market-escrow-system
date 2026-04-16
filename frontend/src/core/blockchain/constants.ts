export const MARKET_ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const MARKET_ESCROW_ABI = [
  "function deposit(address _seller) external payable",
  "function release(uint256 _escrowId) external",
  "function refund(uint256 _escrowId) external",
  "function flagEscrow(uint256 _escrowId) external",
  
  "event EscrowCreated(uint256 indexed escrowId, address buyer, address seller, uint256 amount)",
  "event EscrowAction(uint256 indexed escrowId, uint8 newStatus)",

  "function escrows(uint256) view returns (address buyer, address seller, uint256 amount, uint8 status)",
  "function nextEscrowId() view returns (uint256)",
  "function admin() view returns (address)"
];
