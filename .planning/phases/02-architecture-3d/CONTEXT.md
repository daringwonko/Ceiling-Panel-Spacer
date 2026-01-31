# Scout Report: Database Setup and Model Structures

**Scouted:** 2026-01-31  
**Target Phase:** Phase 2: Architecture 3D (Database Integration)  
**Scout ID:** backup-scout-2-database  

## What We Found (Tier 1 - Stable)

### Codebase Location
- **Configuration:** core/config.py (lines 26-27) - Database URL setting
- **Database Files:** 
  - security.db (SQLite database)
  - sensor_network.db (SQLite database) 
- **Model Structures:** Extensive use of dataclasses throughout codebase (80+ @dataclass instances)
- **IoT Components:** iot/sensor_network.py, iot/security.py (database usage)

### Existing Patterns

**Configuration Pattern:**
```python
# core/config.py:26-27
database_url: str = "sqlite:///./buildscale.db"
```

**Dataclass Model Pattern:**
```python
# core/ceiling_panel_calc.py:20-30
@dataclass
class Dimensions:
    width_mm: float
    length_mm: float
```

**Database Usage Pattern:**
```python
# No active SQLAlchemy/SQL model found yet
# Database files exist but no ORM integration detected
```

### Dependencies

**Current Imports:**
- `pydantic` (BaseSettings for config)
- `pydantic_settings` (environment loading)
- No SQLAlchemy or alembic imports found

**Database Files Present:**
- security.db (exists in root)
- sensor_network.db (exists in root)

**Framework Dependencies:**
- Using Pydantic for data validation/modeling
- SQLite format (simple, embeddable)
- No migration framework detected

## What We Need (Tier 2 - Decision-Dependent)

### Unknowns Awaiting Phase N Decisions
- SQLAlchemy integration plan (when to migrate from dataclass-only)
- Migration pattern for existing SQLite data
- Whether to keep SQLite or move to PostgreSQL as roadmap indicates

### Questions for Planner
- Should Phase 2 migrate to full ORM/SQLAlchemy or keep dataclasses + basic persistence?
- How to handle data migration from existing SQLite files?
- What database operations need to be supported for 3D architecture (model storage, user sessions, sharing)?

## Recommendations

### Implementation Approach

**Option A: Immediate SQLAlchemy Integration (Full ORM)**
- Pros: Scales to Phase 2/3 requirements, proper relationships, migrations
- Cons: Overkill for current simple data needs, adds complexity
- Scout preference: If 3D models require user data/sharing

**Option B: Hybrid Approach (Dataclasses + Simple Persistence)**  
- Pros: Faster implementation, maintains current patterns, sufficient for initial 3D features
- Cons: Won't scale for collaborative/postgreSQL roadmap
- Scout preference: If just storing calculated 3D models/temporary data

### Risk Assessment
- **Risk:** Premature ORM adoption (Phase 2 needs simple persistence, roadmap says PostgreSQL in Phase 2)
- **Mitigation:** Start with lightweight persistence, plan ORM migration for Phase 2 mid/late
- **Risk:** Existing SQLite data loss during migration
- **Mitigation:** Export/import scripts, backup requirements

---

*Scout Report Complete*</content>
<parameter name="filePath">.planning/phases/02-architecture-3d/02-DATABASE-SCOUT-RESEARCH.md