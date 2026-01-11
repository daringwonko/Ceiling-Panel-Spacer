"""
Blockchain module for Ceiling Panel Calculator.

Contains material verification blockchain and
ownership tracking capabilities.
"""

from .blockchain_verifier import (
    MaterialBlockchain,
    MaterialCertificate,
    Block,
    Transaction,
)

from .blockchain_ownership import (
    OwnershipBlockchain,
    OwnershipRecord,
    TransferRecord,
)

__all__ = [
    # Material verification
    'MaterialBlockchain',
    'MaterialCertificate',
    'Block',
    'Transaction',
    # Ownership
    'OwnershipBlockchain',
    'OwnershipRecord',
    'TransferRecord',
]
