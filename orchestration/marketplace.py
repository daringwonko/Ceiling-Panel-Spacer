#!/usr/bin/env python3
"""
Design Marketplace & Plugin Ecosystem
=====================================
User-generated content marketplace with plugin system and revenue sharing.

Features:
- Design listing and discovery
- Plugin marketplace
- Revenue sharing (smart contracts)
- User reviews and ratings
- Search and filtering
- Payment processing
- License management
"""

import json
import uuid
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from enum import Enum


class ListingType(Enum):
    """Types of marketplace listings"""
    DESIGN = "design"
    PLUGIN = "plugin"
    TEMPLATE = "template"
    MATERIAL = "material"


class LicenseType(Enum):
    """License types"""
    PERSONAL = "personal"
    COMMERCIAL = "commercial"
    ENTERPRISE = "enterprise"
    OPEN_SOURCE = "open_source"


@dataclass
class User:
    """Marketplace user"""
    user_id: str
    username: str
    email: str
    reputation_score: float  # 0-5
    total_sales: float
    joined_at: datetime
    verified: bool


@dataclass
class Listing:
    """Marketplace listing"""
    listing_id: str
    seller_id: str
    title: str
    description: str
    listing_type: ListingType
    category: str
    price: float
    license: LicenseType
    tags: List[str]
    rating: float  # 0-5
    review_count: int
    downloads: int
    created_at: datetime
    last_updated: datetime
    content_hash: str  # For verification
    revenue_split: Dict[str, float]  # user_id -> percentage


@dataclass
class Plugin:
    """Plugin listing"""
    listing_id: str
    name: str
    version: str
    description: str
    price: float
    category: str
    compatibility: List[str]  # Compatible versions
    downloads: int
    rating: float
    developer: str
    source_url: str
    documentation: str


@dataclass
class Review:
    """User review"""
    review_id: str
    listing_id: str
    user_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime
    verified_purchase: bool


@dataclass
class Transaction:
    """Marketplace transaction"""
    transaction_id: str
    listing_id: str
    buyer_id: str
    seller_id: str
    amount: float
    license_key: str
    timestamp: datetime
    status: str  # "pending", "completed", "refunded"


@dataclass
class RevenueShare:
    """Revenue sharing distribution"""
    transaction_id: str
    total_amount: float
    platform_fee: float
    seller_share: float
    creator_share: float  # For templates/plugins with original creators
    affiliate_share: float
    distributions: List[Dict[str, Any]]


class Marketplace:
    """Main marketplace engine"""
    
    def __init__(self, platform_fee: float = 0.10):
        self.platform_fee = platform_fee
        self.users: Dict[str, User] = {}
        self.listings: Dict[str, Listing] = {}
        self.plugins: Dict[str, Plugin] = {}
        self.reviews: Dict[str, List[Review]] = {}
        self.transactions: List[Transaction] = {}
        self.licenses: Dict[str, Dict[str, Any]] = {}
    
    def register_user(self, username: str, email: str) -> str:
        """Register new user"""
        user_id = f"user-{uuid.uuid4().hex[:8]}"
        
        user = User(
            user_id=user_id,
            username=username,
            email=email,
            reputation_score=0.0,
            total_sales=0.0,
            joined_at=datetime.now(),
            verified=False
        )
        
        self.users[user_id] = user
        print(f"✓ Registered user: {username} ({user_id})")
        return user_id
    
    def verify_user(self, user_id: str) -> bool:
        """Verify user identity"""
        if user_id in self.users:
            self.users[user_id].verified = True
            print(f"✓ Verified user: {self.users[user_id].username}")
            return True
        return False
    
    def create_listing(self, seller_id: str, title: str, description: str,
                      listing_type: ListingType, category: str, price: float,
                      license: LicenseType, tags: List[str],
                      revenue_split: Optional[Dict[str, float]] = None) -> str:
        """Create marketplace listing"""
        if seller_id not in self.users:
            return ""
        
        listing_id = f"listing-{uuid.uuid4().hex[:8]}"
        
        # Default revenue split: 90% seller, 10% platform
        if revenue_split is None:
            revenue_split = {seller_id: 0.90, "platform": 0.10}
        
        listing = Listing(
            listing_id=listing_id,
            seller_id=seller_id,
            title=title,
            description=description,
            listing_type=listing_type,
            category=category,
            price=price,
            license=license,
            tags=tags,
            rating=0.0,
            review_count=0,
            downloads=0,
            created_at=datetime.now(),
            last_updated=datetime.now(),
            content_hash=f"hash-{uuid.uuid4().hex[:16]}",
            revenue_split=revenue_split
        )
        
        self.listings[listing_id] = listing
        self.reviews[listing_id] = []
        
        print(f"✓ Created listing: {title} ({listing_id})")
        return listing_id
    
    def create_plugin(self, developer_id: str, name: str, version: str,
                     description: str, price: float, category: str,
                     compatibility: List[str], source_url: str,
                     documentation: str) -> str:
        """Create plugin listing"""
        if developer_id not in self.users:
            return ""
        
        plugin_id = f"plugin-{uuid.uuid4().hex[:8]}"
        
        plugin = Plugin(
            listing_id=plugin_id,
            name=name,
            version=version,
            description=description,
            price=price,
            category=category,
            compatibility=compatibility,
            downloads=0,
            rating=0.0,
            developer=developer_id,
            source_url=source_url,
            documentation=documentation
        )
        
        self.plugins[plugin_id] = plugin
        
        # Also create as marketplace listing
        self.create_listing(
            developer_id,
            name,
            description,
            ListingType.PLUGIN,
            category,
            price,
            LicenseType.COMMERCIAL,
            ["plugin", category],
            {developer_id: 0.85, "platform": 0.10, "affiliate": 0.05}
        )
        
        print(f"✓ Created plugin: {name} v{version} ({plugin_id})")
        return plugin_id
    
    def add_review(self, listing_id: str, user_id: str, rating: int,
                  comment: str, verified: bool = True) -> str:
        """Add review to listing"""
        if listing_id not in self.listings:
            return ""
        
        if user_id not in self.users:
            return ""
        
        if not (1 <= rating <= 5):
            return ""
        
        review_id = f"review-{uuid.uuid4().hex[:8]}"
        
        review = Review(
            review_id=review_id,
            listing_id=listing_id,
            user_id=user_id,
            rating=rating,
            comment=comment,
            created_at=datetime.now(),
            verified_purchase=verified
        )
        
        if listing_id not in self.reviews:
            self.reviews[listing_id] = []
        
        self.reviews[listing_id].append(review)
        
        # Update listing rating
        self._update_listing_rating(listing_id)
        
        print(f"✓ Added review for {listing_id}: {rating} stars")
        return review_id
    
    def _update_listing_rating(self, listing_id: str):
        """Update listing average rating"""
        if listing_id not in self.reviews or not self.reviews[listing_id]:
            return
        
        reviews = self.reviews[listing_id]
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        
        if listing_id in self.listings:
            self.listings[listing_id].rating = avg_rating
            self.listings[listing_id].review_count = len(reviews)
        
        if listing_id in self.plugins:
            self.plugins[listing_id].rating = avg_rating
    
    def search_listings(self, query: str = "", category: str = "",
                       min_price: float = 0, max_price: float = float('inf'),
                       listing_type: Optional[ListingType] = None,
                       min_rating: float = 0) -> List[Listing]:
        """Search marketplace listings"""
        results = []
        
        for listing in self.listings.values():
            # Filter by query
            if query:
                query_lower = query.lower()
                if (query_lower not in listing.title.lower() and
                    query_lower not in listing.description.lower() and
                    not any(query_lower in tag.lower() for tag in listing.tags)):
                    continue
            
            # Filter by category
            if category and listing.category != category:
                continue
            
            # Filter by price
            if listing.price < min_price or listing.price > max_price:
                continue
            
            # Filter by type
            if listing_type and listing.listing_type != listing_type:
                continue
            
            # Filter by rating
            if listing.rating < min_rating:
                continue
            
            results.append(listing)
        
        return results
    
    def search_plugins(self, query: str = "", category: str = "",
                      min_rating: float = 0,
                      compatibility: str = "") -> List[Plugin]:
        """Search plugins"""
        results = []
        
        for plugin in self.plugins.values():
            # Filter by query
            if query:
                query_lower = query.lower()
                if (query_lower not in plugin.name.lower() and
                    query_lower not in plugin.description.lower()):
                    continue
            
            # Filter by category
            if category and plugin.category != category:
                continue
            
            # Filter by rating
            if plugin.rating < min_rating:
                continue
            
            # Filter by compatibility
            if compatibility and compatibility not in plugin.compatibility:
                continue
            
            results.append(plugin)
        
        return results
    
    def purchase(self, listing_id: str, buyer_id: str) -> Optional[Transaction]:
        """Purchase listing"""
        if listing_id not in self.listings:
            return None
        
        if buyer_id not in self.users:
            return None
        
        listing = self.listings[listing_id]
        
        # Generate license key
        license_key = f"license-{uuid.uuid4().hex[:16]}"
        
        # Create transaction
        transaction_id = f"tx-{uuid.uuid4().hex[:8]}"
        
        transaction = Transaction(
            transaction_id=transaction_id,
            listing_id=listing_id,
            buyer_id=buyer_id,
            seller_id=listing.seller_id,
            amount=listing.price,
            license_key=license_key,
            timestamp=datetime.now(),
            status="completed"
        )
        
        self.transactions[transaction_id] = transaction
        
        # Update download count
        listing.downloads += 1
        
        # Update seller sales
        if listing.seller_id in self.users:
            self.users[listing.seller_id].total_sales += listing.price
        
        # Store license
        self.licenses[license_key] = {
            "listing_id": listing_id,
            "buyer_id": buyer_id,
            "license_type": listing.license,
            "expires": None,  # Lifetime for now
            "valid": True
        }
        
        print(f"✓ Purchase completed: {listing.title}")
        print(f"  License: {license_key}")
        print(f"  Amount: ${listing.price:.2f}")
        
        return transaction
    
    def calculate_revenue_share(self, transaction: Transaction) -> RevenueShare:
        """Calculate revenue distribution"""
        if transaction.listing_id not in self.listings:
            return None
        
        listing = self.listings[transaction.listing_id]
        total_amount = transaction.amount
        
        # Platform fee
        platform_fee = total_amount * self.platform_fee
        
        # Remaining amount
        remaining = total_amount - platform_fee
        
        # Distribute based on revenue split
        distributions = []
        creator_share = 0.0
        seller_share = 0.0
        affiliate_share = 0.0
        
        for recipient, percentage in listing.revenue_split.items():
            amount = remaining * percentage
            distributions.append({
                "recipient": recipient,
                "amount": amount,
                "percentage": percentage
            })
            
            if recipient == "platform":
                pass  # Already calculated
            elif recipient == "affiliate":
                affiliate_share = amount
            elif recipient == listing.seller_id:
                seller_share = amount
            else:
                creator_share = amount
        
        return RevenueShare(
            transaction_id=transaction.transaction_id,
            total_amount=total_amount,
            platform_fee=platform_fee,
            seller_share=seller_share,
            creator_share=creator_share,
            affiliate_share=affiliate_share,
            distributions=distributions
        )
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user marketplace statistics"""
        if user_id not in self.users:
            return {}
        
        user = self.users[user_id]
        
        # Count listings
        user_listings = [l for l in self.listings.values() if l.seller_id == user_id]
        
        # Count sales
        user_sales = [t for t in self.transactions.values() if t.seller_id == user_id]
        
        # Total revenue
        total_revenue = sum(t.amount for t in user_sales)
        
        # Average rating
        avg_rating = 0.0
        if user_listings:
            avg_rating = sum(l.rating for l in user_listings) / len(user_listings)
        
        return {
            "username": user.username,
            "reputation": user.reputation_score,
            "verified": user.verified,
            "total_sales": len(user_sales),
            "total_revenue": total_revenue,
            "listings_count": len(user_listings),
            "average_rating": avg_rating
        }
    
    def get_marketplace_stats(self) -> Dict[str, Any]:
        """Get overall marketplace statistics"""
        total_listings = len(self.listings)
        total_plugins = len(self.plugins)
        total_users = len(self.users)
        total_transactions = len(self.transactions)
        total_revenue = sum(t.amount for t in self.transactions.values())
        
        # Top listings
        top_listings = sorted(
            self.listings.values(),
            key=lambda l: l.downloads,
            reverse=True
        )[:5]
        
        top_sellers = []
        for user_id, user in self.users.items():
            sales = sum(1 for t in self.transactions.values() if t.seller_id == user_id)
            if sales > 0:
                top_sellers.append((user.username, sales, user.total_sales))
        
        top_sellers.sort(key=lambda x: x[2], reverse=True)
        
        return {
            "total_listings": total_listings,
            "total_plugins": total_plugins,
            "total_users": total_users,
            "total_transactions": total_transactions,
            "total_revenue": total_revenue,
            "top_listings": [{"title": l.title, "downloads": l.downloads} for l in top_listings],
            "top_sellers": [{"username": s[0], "sales": s[1], "revenue": s[2]} for s in top_sellers[:3]]
        }


# ============================================================================
# DEMONSTRATION
# ============================================================================

def demonstrate_marketplace():
    """Demonstrate marketplace capabilities"""
    print("\n" + "="*80)
    print("MARKETPLACE & PLUGIN ECOSYSTEM DEMONSTRATION")
    print("="*80)
    
    marketplace = Marketplace(platform_fee=0.10)
    
    # Register users
    print("\n1. REGISTER USERS")
    print("-" * 50)
    
    users = [
        ("alice", "alice@design.com"),
        ("bob", "bob@design.com"),
        ("charlie", "charlie@design.com"),
        ("diana", "diana@design.com"),
    ]
    
    user_ids = {}
    for username, email in users:
        user_id = marketplace.register_user(username, email)
        user_ids[username] = user_id
    
    # Verify users
    print("\n2. VERIFY USERS")
    print("-" * 50)
    
    for username, user_id in user_ids.items():
        if username in ["alice", "bob"]:
            marketplace.verify_user(user_id)
    
    # Create design listings
    print("\n3. CREATE DESIGN LISTINGS")
    print("-" * 50)
    
    marketplace.create_listing(
        user_ids["alice"],
        "Modern House Design - 3 Bed",
        "Complete architectural design for modern 3-bedroom house with smart features",
        ListingType.DESIGN,
        "residential",
        2500.0,
        LicenseType.COMMERCIAL,
        ["modern", "3-bedroom", "smart-home"]
    )
    
    marketplace.create_listing(
        user_ids["bob"],
        "Commercial Office Building",
        "Professional office building design with MEP integration",
        ListingType.DESIGN,
        "commercial",
        5000.0,
        LicenseType.COMMERCIAL,
        ["office", "commercial", "multi-story"]
    )
    
    marketplace.create_listing(
        user_ids["charlie"],
        "Sustainable Tiny House",
        "Eco-friendly tiny house with renewable energy integration",
        ListingType.TEMPLATE,
        "sustainable",
        800.0,
        LicenseType.PERSONAL,
        ["tiny-house", "eco", "sustainable"]
    )
    
    # Create plugins
    print("\n4. CREATE PLUGINS")
    print("-" * 50)
    
    marketplace.create_plugin(
        user_ids["alice"],
        "Smart HVAC Calculator",
        "1.2.0",
        "Advanced HVAC load calculation and optimization",
        150.0,
        "hvac",
        ["2.0", "2.1", "2.2"],
        "https://github.com/alice/hvac-calculator",
        "https://docs.example.com/hvac"
    )
    
    marketplace.create_plugin(
        user_ids["bob"],
        "Energy Optimizer",
        "2.0.1",
        "AI-powered energy consumption optimization",
        200.0,
        "energy",
        ["2.0", "2.1"],
        "https://github.com/bob/energy-optimizer",
        "https://docs.example.com/energy"
    )
    
    # Add reviews
    print("\n5. ADD REVIEWS")
    print("-" * 50)
    
    # Get listing IDs
    all_listings = marketplace.search_listings()
    
    marketplace.add_review(
        all_listings[0].listing_id,
        user_ids["bob"],
        5,
        "Excellent design! Very detailed and easy to work with.",
        verified=True
    )
    
    marketplace.add_review(
        all_listings[0].listing_id,
        user_ids["charlie"],
        4,
        "Great modern design, some minor adjustments needed.",
        verified=True
    )
    
    marketplace.add_review(
        all_listings[1].listing_id,
        user_ids["diana"],
        5,
        "Perfect for our office project. MEP integration was spot on!",
        verified=True
    )
    
    # Search listings
    print("\n6. SEARCH LISTINGS")
    print("-" * 50)
    
    results = marketplace.search_listings(
        query="modern",
        min_price=1000,
        min_rating=4.0
    )
    
    print(f"Found {len(results)} listings:")
    for listing in results:
        print(f"  {listing.title} - ${listing.price:.2f} ({listing.rating:.1f}★)")
    
    # Search plugins
    print("\n7. SEARCH PLUGINS")
    print("-" * 50)
    
    plugins = marketplace.search_plugins(
        category="hvac",
        min_rating=0
    )
    
    print(f"Found {len(plugins)} plugins:")
    for plugin in plugins:
        print(f"  {plugin.name} v{plugin.version} - ${plugin.price:.2f}")
    
    # Purchase
    print("\n8. PURCHASE")
    print("-" * 50)
    
    if all_listings:
        transaction = marketplace.purchase(
            all_listings[0].listing_id,
            user_ids["charlie"]
        )
        
        if transaction:
            # Calculate revenue share
            revenue_share = marketplace.calculate_revenue_share(transaction)
            
            print(f"\nRevenue Distribution:")
            print(f"  Total: ${revenue_share.total_amount:.2f}")
            print(f"  Platform Fee: ${revenue_share.platform_fee:.2f}")
            print(f"  Seller Share: ${revenue_share.seller_share:.2f}")
            
            for dist in revenue_share.distributions:
                if dist['recipient'] != 'platform':
                    print(f"  {dist['recipient']}: ${dist['amount']:.2f} ({dist['percentage']*100:.0f}%)")
    
    # User stats
    print("\n9. USER STATISTICS")
    print("-" * 50)
    
    for username, user_id in user_ids.items():
        stats = marketplace.get_user_stats(user_id)
        if stats:
            print(f"{username}:")
            print(f"  Verified: {stats['verified']}")
            print(f"  Listings: {stats['listings_count']}")
            print(f"  Sales: {stats['total_sales']}")
            print(f"  Revenue: ${stats['total_revenue']:.2f}")
            print(f"  Avg Rating: {stats['average_rating']:.1f}★")
    
    # Marketplace stats
    print("\n10. MARKETPLACE STATISTICS")
    print("-" * 50)
    
    stats = marketplace.get_marketplace_stats()
    print(f"Total Listings: {stats['total_listings']}")
    print(f"Total Plugins: {stats['total_plugins']}")
    print(f"Total Users: {stats['total_users']}")
    print(f"Total Transactions: {stats['total_transactions']}")
    print(f"Total Revenue: ${stats['total_revenue']:.2f}")
    
    print(f"\nTop Listings:")
    for listing in stats['top_listings']:
        print(f"  {listing['title']}: {listing['downloads']} downloads")
    
    print(f"\nTop Sellers:")
    for seller in stats['top_sellers']:
        print(f"  {seller['username']}: {seller['sales']} sales, ${seller['revenue']:.2f}")
    
    print("\n" + "="*80)
    print("MARKETPLACE COMPLETE")
    print("Ready for Phase 3: AI Singularity!")
    print("="*80)


if __name__ == "__main__":
    demonstrate_marketplace()