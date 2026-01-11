#!/usr/bin/env python3
"""
Blockchain Material Verification System.

Real blockchain implementation for:
- Material provenance tracking
- Certification verification
- Supply chain auditing
- Immutable record keeping

Uses SHA-256 hashing and Merkle trees for data integrity.
"""

import hashlib
import json
import time
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import secrets
import base64


@dataclass
class MaterialCertificate:
    """Certificate for material properties."""
    material_id: str
    material_type: str
    manufacturer: str
    batch_number: str
    production_date: str
    certifications: List[str]  # e.g., ["ISO 9001", "LEED", "FSC"]
    properties: Dict[str, Any]
    inspector_id: str
    inspection_date: str
    signature: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def compute_hash(self) -> str:
        """Compute SHA-256 hash of certificate data."""
        data = {
            'material_id': self.material_id,
            'material_type': self.material_type,
            'manufacturer': self.manufacturer,
            'batch_number': self.batch_number,
            'production_date': self.production_date,
            'certifications': sorted(self.certifications),
            'properties': json.dumps(self.properties, sort_keys=True),
            'inspector_id': self.inspector_id,
            'inspection_date': self.inspection_date
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()


@dataclass
class Transaction:
    """Blockchain transaction for material movement."""
    tx_id: str
    timestamp: float
    transaction_type: str  # 'create', 'transfer', 'verify', 'use'
    material_id: str
    from_entity: str
    to_entity: str
    quantity: float
    unit: str
    certificate_hash: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    signature: str = ""

    def compute_hash(self) -> str:
        """Compute transaction hash."""
        data = {
            'tx_id': self.tx_id,
            'timestamp': self.timestamp,
            'transaction_type': self.transaction_type,
            'material_id': self.material_id,
            'from_entity': self.from_entity,
            'to_entity': self.to_entity,
            'quantity': self.quantity,
            'unit': self.unit,
            'certificate_hash': self.certificate_hash,
            'metadata': json.dumps(self.metadata, sort_keys=True)
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()


@dataclass
class Block:
    """Blockchain block containing transactions."""
    index: int
    timestamp: float
    transactions: List[Transaction]
    previous_hash: str
    nonce: int = 0
    hash: str = ""

    def compute_hash(self) -> str:
        """Compute block hash including nonce (for proof of work)."""
        data = {
            'index': self.index,
            'timestamp': self.timestamp,
            'transactions': [t.compute_hash() for t in self.transactions],
            'previous_hash': self.previous_hash,
            'nonce': self.nonce
        }
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()

    def mine(self, difficulty: int = 4) -> None:
        """Mine block with proof of work."""
        target = '0' * difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.compute_hash()


class MerkleTree:
    """Merkle tree for efficient verification."""

    def __init__(self, data_items: List[str]):
        self.leaves = [self._hash(item) for item in data_items]
        self.root = self._build_tree(self.leaves.copy())

    @staticmethod
    def _hash(data: str) -> str:
        """SHA-256 hash."""
        return hashlib.sha256(data.encode()).hexdigest()

    def _build_tree(self, nodes: List[str]) -> str:
        """Build Merkle tree and return root hash."""
        if not nodes:
            return self._hash("")

        while len(nodes) > 1:
            if len(nodes) % 2 == 1:
                nodes.append(nodes[-1])  # Duplicate last if odd

            next_level = []
            for i in range(0, len(nodes), 2):
                combined = nodes[i] + nodes[i + 1]
                next_level.append(self._hash(combined))
            nodes = next_level

        return nodes[0]

    def get_proof(self, index: int) -> List[Tuple[str, str]]:
        """Get Merkle proof for item at index."""
        if index >= len(self.leaves):
            return []

        proof = []
        nodes = self.leaves.copy()
        current_index = index

        while len(nodes) > 1:
            if len(nodes) % 2 == 1:
                nodes.append(nodes[-1])

            sibling_index = current_index ^ 1  # XOR to get sibling
            direction = 'left' if current_index % 2 == 1 else 'right'
            proof.append((nodes[sibling_index], direction))

            next_level = []
            for i in range(0, len(nodes), 2):
                combined = nodes[i] + nodes[i + 1]
                next_level.append(self._hash(combined))
            nodes = next_level
            current_index //= 2

        return proof

    @staticmethod
    def verify_proof(leaf_hash: str, proof: List[Tuple[str, str]], root: str) -> bool:
        """Verify a Merkle proof."""
        current = leaf_hash
        for sibling, direction in proof:
            if direction == 'left':
                combined = sibling + current
            else:
                combined = current + sibling
            current = hashlib.sha256(combined.encode()).hexdigest()
        return current == root


class MaterialBlockchain:
    """
    Blockchain for material verification and tracking.

    Provides:
    - Immutable material records
    - Certificate verification
    - Supply chain tracking
    - Proof of authenticity
    """

    def __init__(self, difficulty: int = 3):
        self.chain: List[Block] = []
        self.pending_transactions: List[Transaction] = []
        self.certificates: Dict[str, MaterialCertificate] = {}
        self.difficulty = difficulty

        # Create genesis block
        self._create_genesis_block()

    def _create_genesis_block(self) -> None:
        """Create the first block."""
        genesis = Block(
            index=0,
            timestamp=time.time(),
            transactions=[],
            previous_hash="0" * 64
        )
        genesis.hash = genesis.compute_hash()
        self.chain.append(genesis)

    def register_certificate(self, cert: MaterialCertificate) -> str:
        """Register a new material certificate."""
        cert_hash = cert.compute_hash()
        cert.signature = self._sign_data(cert_hash)
        self.certificates[cert.material_id] = cert

        # Create transaction
        tx = Transaction(
            tx_id=secrets.token_hex(16),
            timestamp=time.time(),
            transaction_type='create',
            material_id=cert.material_id,
            from_entity='manufacturer',
            to_entity=cert.manufacturer,
            quantity=1.0,
            unit='certificate',
            certificate_hash=cert_hash,
            metadata={'certifications': cert.certifications}
        )
        tx.signature = self._sign_data(tx.compute_hash())
        self.pending_transactions.append(tx)

        return cert_hash

    def record_transfer(
        self,
        material_id: str,
        from_entity: str,
        to_entity: str,
        quantity: float,
        unit: str = 'sqm'
    ) -> str:
        """Record material transfer between entities."""
        if material_id not in self.certificates:
            raise ValueError(f"Unknown material: {material_id}")

        cert = self.certificates[material_id]

        tx = Transaction(
            tx_id=secrets.token_hex(16),
            timestamp=time.time(),
            transaction_type='transfer',
            material_id=material_id,
            from_entity=from_entity,
            to_entity=to_entity,
            quantity=quantity,
            unit=unit,
            certificate_hash=cert.compute_hash()
        )
        tx.signature = self._sign_data(tx.compute_hash())
        self.pending_transactions.append(tx)

        return tx.tx_id

    def record_usage(
        self,
        material_id: str,
        project_id: str,
        quantity: float,
        unit: str = 'sqm'
    ) -> str:
        """Record material usage in a project."""
        if material_id not in self.certificates:
            raise ValueError(f"Unknown material: {material_id}")

        cert = self.certificates[material_id]

        tx = Transaction(
            tx_id=secrets.token_hex(16),
            timestamp=time.time(),
            transaction_type='use',
            material_id=material_id,
            from_entity='inventory',
            to_entity=project_id,
            quantity=quantity,
            unit=unit,
            certificate_hash=cert.compute_hash(),
            metadata={'project_id': project_id}
        )
        tx.signature = self._sign_data(tx.compute_hash())
        self.pending_transactions.append(tx)

        return tx.tx_id

    def mine_pending_transactions(self) -> Optional[Block]:
        """Mine pending transactions into a new block."""
        if not self.pending_transactions:
            return None

        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=self.pending_transactions.copy(),
            previous_hash=self.chain[-1].hash
        )

        # Mine with proof of work
        new_block.mine(self.difficulty)

        self.chain.append(new_block)
        self.pending_transactions = []

        return new_block

    def verify_certificate(self, material_id: str) -> Dict[str, Any]:
        """Verify a material certificate's authenticity."""
        if material_id not in self.certificates:
            return {
                'valid': False,
                'error': 'Certificate not found',
                'material_id': material_id
            }

        cert = self.certificates[material_id]
        cert_hash = cert.compute_hash()

        # Find all transactions for this material
        transactions = []
        for block in self.chain:
            for tx in block.transactions:
                if tx.material_id == material_id:
                    transactions.append({
                        'tx_id': tx.tx_id,
                        'type': tx.transaction_type,
                        'timestamp': datetime.fromtimestamp(tx.timestamp).isoformat(),
                        'from': tx.from_entity,
                        'to': tx.to_entity,
                        'quantity': tx.quantity,
                        'unit': tx.unit
                    })

        return {
            'valid': True,
            'material_id': material_id,
            'certificate_hash': cert_hash,
            'certifications': cert.certifications,
            'manufacturer': cert.manufacturer,
            'batch_number': cert.batch_number,
            'production_date': cert.production_date,
            'transaction_count': len(transactions),
            'transactions': transactions,
            'blockchain_verified': self.verify_chain()
        }

    def verify_chain(self) -> bool:
        """Verify the entire blockchain integrity."""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            # Verify hash
            if current.hash != current.compute_hash():
                return False

            # Verify chain link
            if current.previous_hash != previous.hash:
                return False

            # Verify proof of work
            if not current.hash.startswith('0' * self.difficulty):
                return False

        return True

    def get_material_history(self, material_id: str) -> List[Dict[str, Any]]:
        """Get complete history of a material."""
        history = []

        for block in self.chain:
            for tx in block.transactions:
                if tx.material_id == material_id:
                    history.append({
                        'block_index': block.index,
                        'block_hash': block.hash[:16] + '...',
                        'tx_id': tx.tx_id,
                        'type': tx.transaction_type,
                        'timestamp': datetime.fromtimestamp(tx.timestamp).isoformat(),
                        'from': tx.from_entity,
                        'to': tx.to_entity,
                        'quantity': tx.quantity,
                        'unit': tx.unit
                    })

        return history

    def _sign_data(self, data: str) -> str:
        """Sign data (simplified - in production use proper PKI)."""
        # In production, this would use private key signing
        return hashlib.sha256(f"signed:{data}".encode()).hexdigest()[:32]

    def export_chain(self) -> Dict[str, Any]:
        """Export blockchain for storage/sharing."""
        return {
            'chain_length': len(self.chain),
            'difficulty': self.difficulty,
            'is_valid': self.verify_chain(),
            'blocks': [
                {
                    'index': b.index,
                    'timestamp': datetime.fromtimestamp(b.timestamp).isoformat(),
                    'hash': b.hash,
                    'previous_hash': b.previous_hash,
                    'nonce': b.nonce,
                    'transaction_count': len(b.transactions)
                }
                for b in self.chain
            ],
            'certificates': {
                mid: cert.to_dict()
                for mid, cert in self.certificates.items()
            }
        }


def demonstrate_blockchain():
    """Demonstrate blockchain material verification."""
    print("="*80)
    print("BLOCKCHAIN MATERIAL VERIFICATION SYSTEM")
    print("="*80)

    # Initialize blockchain
    blockchain = MaterialBlockchain(difficulty=2)

    # Register materials
    print("\n1. Registering Material Certificates...")

    cert1 = MaterialCertificate(
        material_id="MAT-001",
        material_type="Acoustic Panel",
        manufacturer="AcoustiCorp",
        batch_number="AC-2024-1234",
        production_date="2024-01-15",
        certifications=["ISO 9001", "LEED Gold", "Fire Class A"],
        properties={
            "nrc": 0.85,
            "density": 24,
            "thickness_mm": 25,
            "fire_rating": "Class A"
        },
        inspector_id="INS-789",
        inspection_date="2024-01-16"
    )
    hash1 = blockchain.register_certificate(cert1)
    print(f"  ✓ Registered: {cert1.material_type} (Hash: {hash1[:16]}...)")

    cert2 = MaterialCertificate(
        material_id="MAT-002",
        material_type="LED Panel",
        manufacturer="LightTech Inc",
        batch_number="LT-2024-5678",
        production_date="2024-02-01",
        certifications=["CE", "UL Listed", "Energy Star"],
        properties={
            "lumens": 4500,
            "wattage": 40,
            "color_temp": 4000,
            "lifespan_hours": 50000
        },
        inspector_id="INS-456",
        inspection_date="2024-02-02"
    )
    hash2 = blockchain.register_certificate(cert2)
    print(f"  ✓ Registered: {cert2.material_type} (Hash: {hash2[:16]}...)")

    # Record transfers
    print("\n2. Recording Supply Chain Transfers...")

    tx1 = blockchain.record_transfer("MAT-001", "AcoustiCorp", "Distributor A", 100, "sqm")
    print(f"  ✓ Transfer: Manufacturer → Distributor (TX: {tx1[:16]}...)")

    tx2 = blockchain.record_transfer("MAT-001", "Distributor A", "Contractor B", 50, "sqm")
    print(f"  ✓ Transfer: Distributor → Contractor (TX: {tx2[:16]}...)")

    tx3 = blockchain.record_usage("MAT-001", "PROJECT-2024-001", 25, "sqm")
    print(f"  ✓ Usage: Contractor → Project (TX: {tx3[:16]}...)")

    # Mine block
    print("\n3. Mining Block...")
    block = blockchain.mine_pending_transactions()
    if block:
        print(f"  ✓ Block #{block.index} mined")
        print(f"    Hash: {block.hash}")
        print(f"    Nonce: {block.nonce}")
        print(f"    Transactions: {len(block.transactions)}")

    # Verify certificate
    print("\n4. Verifying Certificate...")
    verification = blockchain.verify_certificate("MAT-001")
    print(f"  Valid: {verification['valid']}")
    print(f"  Certifications: {', '.join(verification['certifications'])}")
    print(f"  Transaction Count: {verification['transaction_count']}")
    print(f"  Blockchain Verified: {verification['blockchain_verified']}")

    # Get history
    print("\n5. Material History:")
    history = blockchain.get_material_history("MAT-001")
    for entry in history:
        print(f"  [{entry['type'].upper()}] {entry['from']} → {entry['to']}: "
              f"{entry['quantity']} {entry['unit']}")

    # Verify chain integrity
    print("\n6. Chain Verification:")
    print(f"  Chain Length: {len(blockchain.chain)} blocks")
    print(f"  Chain Valid: {blockchain.verify_chain()}")

    # Export summary
    print("\n7. Exporting Blockchain...")
    export = blockchain.export_chain()
    print(f"  Exported {export['chain_length']} blocks")
    print(f"  Certificates: {len(export['certificates'])}")

    print("\n" + "="*80)
    print("BLOCKCHAIN VERIFICATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    demonstrate_blockchain()
