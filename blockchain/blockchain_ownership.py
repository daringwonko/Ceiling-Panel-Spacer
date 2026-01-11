#!/usr/bin/env python3
"""
Blockchain Ownership & Provenance System
========================================
Immutable design ownership tracking with smart contracts.

Features:
- Design provenance tracking
- Smart contract execution
- Ownership verification
- Royalty distribution
- Immutable history
- Tokenization support
"""

import json
import hashlib
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from enum import Enum
import uuid


class BlockType(Enum):
    """Types of blockchain blocks"""
    GENESIS = "genesis"
    DESIGN_UPDATE = "design_update"
    OWNERSHIP_TRANSFER = "ownership_transfer"
    ROYALTY_PAYMENT = "royalty_payment"
    SMART_CONTRACT = "smart_contract"


@dataclass
class Transaction:
    """Blockchain transaction"""
    transaction_id: str
    block_type: BlockType
    sender: str
    recipient: str
    design_id: str
    timestamp: datetime
    data: Dict[str, Any]
    signature: str
    fee: float = 0.0


@dataclass
class Block:
    """Blockchain block"""
    block_number: int
    timestamp: datetime
    transactions: List[Transaction]
    previous_hash: str
    merkle_root: str
    nonce: int
    hash: str


@dataclass
class DesignProvenance:
    """Design ownership history"""
    design_id: str
    creator: str
    creation_time: datetime
    ownership_chain: List[Dict[str, Any]]
    total_transfers: int
    current_owner: str
    royalty_info: Dict[str, Any]


@dataclass
class SmartContract:
    """Smart contract for design rights"""
    contract_id: str
    design_id: str
    creator: str
    terms: Dict[str, Any]
    deployed_at: datetime
    active: bool
    execution_count: int


class Blockchain:
    """Simple blockchain implementation for design ownership"""
    
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.difficulty = 4  # Number of leading zeros required
        self.mining_reward = 1.0
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block in the chain"""
        genesis_block = Block(
            block_number=0,
            timestamp=datetime.now(),
            transactions=[],
            previous_hash="0",
            merkle_root="0",
            nonce=0,
            hash=self.calculate_hash(0, "0", [], 0)
        )
        self.chain.append(genesis_block)
    
    def calculate_hash(self, block_number: int, previous_hash: str, 
                      transactions: List[Transaction], nonce: int) -> str:
        """Calculate block hash"""
        transaction_data = json.dumps([t.to_dict() for t in transactions], sort_keys=True)
        block_data = f"{block_number}{previous_hash}{transaction_data}{nonce}"
        return hashlib.sha256(block_data.encode()).hexdigest()
    
    def get_last_block(self) -> Block:
        """Get the last block in the chain"""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Transaction) -> bool:
        """Add transaction to pending pool"""
        # Verify transaction signature (simplified)
        if not self.verify_transaction(transaction):
            return False
        
        self.pending_transactions.append(transaction)
        return True
    
    def verify_transaction(self, transaction: Transaction) -> bool:
        """Verify transaction authenticity"""
        # Simplified verification
        # In production: verify cryptographic signature
        return len(transaction.transaction_id) > 0 and len(transaction.sender) > 0
    
    def mine_pending_transactions(self, miner_address: str) -> bool:
        """Mine pending transactions into a new block"""
        if not self.pending_transactions:
            return False
        
        last_block = self.get_last_block()
        new_block_number = last_block.block_number + 1
        
        # Calculate merkle root (simplified)
        merkle_root = self.calculate_merkle_root(self.pending_transactions)
        
        # Proof of work
        nonce = 0
        hash_attempt = ""
        target = "0" * self.difficulty
        
        print(f"⛏️  Mining block {new_block_number}...")
        
        while not hash_attempt.startswith(target):
            nonce += 1
            hash_attempt = self.calculate_hash(
                new_block_number,
                last_block.hash,
                self.pending_transactions,
                nonce
            )
        
        # Create new block
        new_block = Block(
            block_number=new_block_number,
            timestamp=datetime.now(),
            transactions=self.pending_transactions.copy(),
            previous_hash=last_block.hash,
            merkle_root=merkle_root,
            nonce=nonce,
            hash=hash_attempt
        )
        
        self.chain.append(new_block)
        
        # Add mining reward transaction
        reward_tx = Transaction(
            transaction_id=f"reward-{uuid.uuid4().hex[:8]}",
            block_type=BlockType.ROYALTY_PAYMENT,
            sender="system",
            recipient=miner_address,
            design_id="system",
            timestamp=datetime.now(),
            data={"reward": self.mining_reward, "reason": "mining"},
            signature="system-generated",
            fee=0.0
        )
        self.pending_transactions = [reward_tx]
        
        print(f"✓ Block {new_block_number} mined: {hash_attempt[:16]}...")
        return True
    
    def calculate_merkle_root(self, transactions: List[Transaction]) -> str:
        """Calculate Merkle root for transactions"""
        if not transactions:
            return "0"
        
        # Simplified: hash all transactions together
        tx_data = json.dumps([t.to_dict() for t in transactions], sort_keys=True)
        return hashlib.sha256(tx_data.encode()).hexdigest()[:32]
    
    def get_balance(self, address: str) -> float:
        """Get balance for address (for transaction fees/rewards)"""
        balance = 0.0
        
        for block in self.chain:
            for tx in block.transactions:
                if tx.recipient == address:
                    balance += tx.fee
                if tx.sender == address:
                    balance -= tx.fee
        
        return balance
    
    def get_block_by_number(self, number: int) -> Optional[Block]:
        """Get block by number"""
        if 0 <= number < len(self.chain):
            return self.chain[number]
        return None
    
    def validate_chain(self) -> Tuple[bool, str]:
        """Validate entire blockchain"""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]
            
            # Check hash
            expected_hash = self.calculate_hash(
                current.block_number,
                current.previous_hash,
                current.transactions,
                current.nonce
            )
            
            if current.hash != expected_hash:
                return False, f"Invalid hash at block {i}"
            
            # Check previous hash
            if current.previous_hash != previous.hash:
                return False, f"Invalid previous hash at block {i}"
        
        return True, "Blockchain is valid"


class DesignOwnershipTracker:
    """Track design ownership and provenance"""
    
    def __init__(self, blockchain: Blockchain):
        self.blockchain = blockchain
        self.designs: Dict[str, DesignProvenance] = {}
        self.contracts: Dict[str, SmartContract] = {}
    
    def register_design(self, design_id: str, creator: str, 
                       initial_royalty: float = 0.05) -> bool:
        """Register new design with creator ownership"""
        if design_id in self.designs:
            return False
        
        provenance = DesignProvenance(
            design_id=design_id,
            creator=creator,
            creation_time=datetime.now(),
            ownership_chain=[{
                "owner": creator,
                "timestamp": datetime.now().isoformat(),
                "action": "creation"
            }],
            total_transfers=0,
            current_owner=creator,
            royalty_info={
                "royalty_rate": initial_royalty,
                "total_royalties": 0.0,
                "recipients": {creator: 1.0}  # 100% to creator initially
            }
        )
        
        self.designs[design_id] = provenance
        
        # Create blockchain transaction
        tx = Transaction(
            transaction_id=f"register-{uuid.uuid4().hex[:8]}",
            block_type=BlockType.DESIGN_UPDATE,
            sender=creator,
            recipient=creator,
            design_id=design_id,
            timestamp=datetime.now(),
            data={
                "action": "register",
                "design_id": design_id,
                "royalty_rate": initial_royalty
            },
            signature=f"sig-{uuid.uuid4().hex[:16]}"
        )
        
        self.blockchain.add_transaction(tx)
        
        print(f"✓ Registered design: {design_id} by {creator}")
        return True
    
    def transfer_ownership(self, design_id: str, from_user: str, 
                          to_user: str, price: float = 0.0) -> bool:
        """Transfer design ownership"""
        if design_id not in self.designs:
            return False
        
        provenance = self.designs[design_id]
        
        if provenance.current_owner != from_user:
            return False
        
        # Update provenance
        provenance.ownership_chain.append({
            "from": from_user,
            "to": to_user,
            "timestamp": datetime.now().isoformat(),
            "action": "transfer",
            "price": price
        })
        provenance.total_transfers += 1
        provenance.current_owner = to_user
        
        # Update royalty distribution (simplified)
        if price > 0:
            royalty = price * provenance.royalty_info["royalty_rate"]
            provenance.royalty_info["total_royalties"] += royalty
            
            # Distribute to previous owners
            for owner_data in provenance.ownership_chain[:-1]:
                if "owner" in owner_data:
                    owner = owner_data["owner"]
                    provenance.royalty_info["recipients"][owner] = \
                        provenance.royalty_info["recipients"].get(owner, 0) + royalty * 0.5
        
        # Blockchain transaction
        tx = Transaction(
            transaction_id=f"transfer-{uuid.uuid4().hex[:8]}",
            block_type=BlockType.OWNERSHIP_TRANSFER,
            sender=from_user,
            recipient=to_user,
            design_id=design_id,
            timestamp=datetime.now(),
            data={
                "action": "transfer",
                "price": price,
                "royalty_paid": price * provenance.royalty_info["royalty_rate"] if price > 0 else 0
            },
            signature=f"sig-{uuid.uuid4().hex[:16]}"
        )
        
        self.blockchain.add_transaction(tx)
        
        print(f"✓ Transferred {design_id} from {from_user} to {to_user} for ${price}")
        return True
    
    def deploy_smart_contract(self, design_id: str, creator: str, 
                             terms: Dict[str, Any]) -> Optional[str]:
        """Deploy smart contract for design rights"""
        if design_id not in self.designs:
            return None
        
        contract_id = f"contract-{uuid.uuid4().hex[:8]}"
        
        contract = SmartContract(
            contract_id=contract_id,
            design_id=design_id,
            creator=creator,
            terms=terms,
            deployed_at=datetime.now(),
            active=True,
            execution_count=0
        )
        
        self.contracts[contract_id] = contract
        
        # Blockchain transaction
        tx = Transaction(
            transaction_id=f"deploy-{uuid.uuid4().hex[:8]}",
            block_type=BlockType.SMART_CONTRACT,
            sender=creator,
            recipient="system",
            design_id=design_id,
            timestamp=datetime.now(),
            data={
                "action": "deploy_contract",
                "contract_id": contract_id,
                "terms": terms
            },
            signature=f"sig-{uuid.uuid4().hex[:16]}"
        )
        
        self.blockchain.add_transaction(tx)
        
        print(f"✓ Deployed smart contract: {contract_id}")
        return contract_id
    
    def execute_smart_contract(self, contract_id: str, executor: str, 
                              action: str, params: Dict[str, Any]) -> bool:
        """Execute smart contract action"""
        if contract_id not in self.contracts:
            return False
        
        contract = self.contracts[contract_id]
        
        if not contract.active:
            return False
        
        # Verify terms
        if "allowed_actions" in contract.terms:
            if action not in contract.terms["allowed_actions"]:
                return False
        
        # Execute based on action
        if action == "transfer_ownership":
            success = self.transfer_ownership(
                contract.design_id,
                contract.creator,
                params["new_owner"],
                params.get("price", 0.0)
            )
            if success:
                contract.execution_count += 1
            return success
        
        elif action == "update_royalty":
            if contract.design_id in self.designs:
                provenance = self.designs[contract.design_id]
                provenance.royalty_info["royalty_rate"] = params["new_rate"]
                contract.execution_count += 1
                
                # Blockchain transaction
                tx = Transaction(
                    transaction_id=f"exec-{uuid.uuid4().hex[:8]}",
                    block_type=BlockType.SMART_CONTRACT,
                    sender=executor,
                    recipient="system",
                    design_id=contract.design_id,
                    timestamp=datetime.now(),
                    data={
                        "action": "update_royalty",
                        "contract_id": contract_id,
                        "new_rate": params["new_rate"]
                    },
                    signature=f"sig-{uuid.uuid4().hex[:16]}"
                )
                self.blockchain.add_transaction(tx)
                
                print(f"✓ Executed contract {contract_id}: updated royalty to {params['new_rate']}")
                return True
        
        return False
    
    def get_provenance(self, design_id: str) -> Optional[DesignProvenance]:
        """Get complete provenance for design"""
        return self.designs.get(design_id)
    
    def get_design_value(self, design_id: str) -> float:
        """Estimate design value based on provenance"""
        if design_id not in self.designs:
            return 0.0
        
        provenance = self.designs[design_id]
        
        # Base value
        value = 100.0
        
        # Add value for transfers
        value += provenance.total_transfers * 50.0
        
        # Add value for royalties earned
        value += provenance.royalty_info["total_royalties"] * 10
        
        # Add value for age (scarcity)
        age_days = (datetime.now() - provenance.creation_time).days
        value += min(age_days * 0.1, 50.0)
        
        return value
    
    def get_royalty_report(self, design_id: str) -> Dict[str, Any]:
        """Generate royalty report"""
        if design_id not in self.designs:
            return {}
        
        provenance = self.designs[design_id]
        
        return {
            "design_id": design_id,
            "royalty_rate": provenance.royalty_info["royalty_rate"],
            "total_royalties": provenance.royalty_info["total_royalties"],
            "recipients": provenance.royalty_info["recipients"],
            "total_transfers": provenance.total_transfers
        }


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_blockchain_ownership():
    """Demonstrate blockchain ownership system"""
    print("\n" + "="*80)
    print("BLOCKCHAIN OWNERSHIP & PROVENANCE DEMONSTRATION")
    print("="*80)
    
    # Initialize blockchain
    blockchain = Blockchain()
    tracker = DesignOwnershipTracker(blockchain)
    
    print("\n1. BLOCKCHAIN INITIALIZATION")
    print("-" * 50)
    print(f"✓ Genesis block created")
    print(f"✓ Difficulty: {blockchain.difficulty} leading zeros")
    print(f"✓ Mining reward: {blockchain.mining_reward}")
    
    # Register designs
    print("\n2. REGISTER DESIGNS")
    print("-" * 50)
    
    designs = [
        ("design-house-001", "alice", 0.05),
        ("design-house-002", "bob", 0.03),
        ("design-commercial-001", "charlie", 0.08),
    ]
    
    for design_id, creator, royalty in designs:
        tracker.register_design(design_id, creator, royalty)
    
    # Transfer ownership
    print("\n3. TRANSFER OWNERSHIP")
    print("-" * 50)
    
    transfers = [
        ("design-house-001", "alice", "bob", 5000.0),
        ("design-house-002", "bob", "charlie", 3000.0),
        ("design-house-001", "bob", "diana", 7000.0),
    ]
    
    for design_id, from_user, to_user, price in transfers:
        tracker.transfer_ownership(design_id, from_user, to_user, price)
    
    # Deploy smart contracts
    print("\n4. DEPLOY SMART CONTRACTS")
    print("-" * 50)
    
    contract_terms = {
        "allowed_actions": ["transfer_ownership", "update_royalty"],
        "royalty_floor": 0.02,
        "transfer_fee": 0.01
    }
    
    contract_id = tracker.deploy_smart_contract(
        "design-house-001",
        "alice",
        contract_terms
    )
    
    # Execute smart contract
    print("\n5. EXECUTE SMART CONTRACT")
    print("-" * 50)
    
    if contract_id:
        tracker.execute_smart_contract(
            contract_id,
            "diana",
            "update_royalty",
            {"new_rate": 0.06}
        )
    
    # Get provenance
    print("\n6. DESIGN PROVENANCE")
    print("-" * 50)
    
    provenance = tracker.get_provenance("design-house-001")
    if provenance:
        print(f"Design: {provenance.design_id}")
        print(f"Creator: {provenance.creator}")
        print(f"Current Owner: {provenance.current_owner}")
        print(f"Total Transfers: {provenance.total_transfers}")
        print(f"Royalty Rate: {provenance.royalty_info['royalty_rate']:.2%}")
        print(f"Total Royalties: ${provenance.royalty_info['total_royalties']:.2f}")
        print(f"Ownership Chain:")
        for entry in provenance.ownership_chain[-3:]:
            print(f"  {entry}")
    
    # Design value
    print("\n7. DESIGN VALUATION")
    print("-" * 50)
    
    for design_id, _, _ in designs:
        value = tracker.get_design_value(design_id)
        print(f"{design_id}: ${value:.2f}")
    
    # Royalty report
    print("\n8. ROYALTY REPORT")
    print("-" * 50)
    
    report = tracker.get_royalty_report("design-house-001")
    if report:
        print(f"Design: {report['design_id']}")
        print(f"Royalty Rate: {report['royalty_rate']:.2%}")
        print(f"Total Collected: ${report['total_royalties']:.2f}")
        print(f"Recipients:")
        for recipient, amount in report['recipients'].items():
            print(f"  {recipient}: ${amount:.2f}")
    
    # Blockchain stats
    print("\n9. BLOCKCHAIN STATISTICS")
    print("-" * 50)
    
    print(f"Chain Length: {len(blockchain.chain)} blocks")
    print(f"Pending Transactions: {len(blockchain.pending_transactions)}")
    
    # Mine pending transactions
    print("\n10. MINING")
    print("-" * 50)
    
    blockchain.mine_pending_transactions("miner-001")
    
    # Validate chain
    print("\n11. CHAIN VALIDATION")
    print("-" * 50)
    
    is_valid, message = blockchain.validate_chain()
    print(f"Chain Valid: {is_valid}")
    print(f"Message: {message}")
    
    # Get balance
    print("\n12. ADDRESS BALANCES")
    print("-" * 50)
    
    addresses = ["alice", "bob", "charlie", "diana", "miner-001"]
    for addr in addresses:
        balance = blockchain.get_balance(addr)
        print(f"{addr}: ${balance:.2f}")
    
    print("\n" + "="*80)
    print("BLOCKCHAIN OWNERSHIP COMPLETE")
    print("Ready for marketplace integration!")
    print("="*80)


if __name__ == "__main__":
    demonstrate_blockchain_ownership()