#  Relational Data Model

### The Core Challenge

An enterprise greenhouse gas (GHG) accounting system must translate disparate, noisy physical observations (liters of fuel burned, kilowatt-hours metered, passenger-kilometers flown) into an immutable ledger of carbon dioxide equivalents ($CO_2e$).

### The Root Cause of Failures in Naive Designs

Most carbon platforms fail because they treat carbon accounting like standard corporate CRUD applications. If you modify a row directly, you lose the historical context required by financial auditors. If your multi-tenant isolation relies solely on simple SQL `WHERE` clauses at the controller level, a single missing query condition will leak raw data across corporate boundaries.

### So, how do we solve this problem?

To solve this problem, we used  **Direct Acyclic Graph (DAG)** lineage strategy. We isolate the raw data entirely from the  ledger, ensure schema normalization and update every single database state change with an automatic, system-enforced ledger audit trail.

```
[Raw Ingestion Batch] ──> [Raw Data Row] (Immutable Blob)
                                 │
                                 ▼ (Normalization Pipeline Engine)
[Organization Tenant] ──> [Normalized Activity Data] <── [Data Source Type]
                                 │
                                 ▼ (Analyst Manual Overrides)
                          [Audit Trail Log] (Historical State Blocks)

```

---

### Database Architecture Blueprint

#### 1. `Organization`

Multi-tenancy must be anchored at the root level of the database. We separate entities completely using a dedicated Organization model.

```python
class Organization(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

```

* **Why:** Every operational model downstream must maintain an index foreign-key directly pointing to an `Organization`.

#### 2. `DataSource` 

```python
class DataSource(models.Model):
    SOURCE_TYPES = (
        ('SAP', 'SAP ERP Procurement/Fuel'),
        ('UTILITY', 'Utility Portal CSV'),
        ('TRAVEL', 'Corporate Travel Platform JSON'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='data_sources')
    name = models.CharField(max_length=100)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES)
    is_active = models.BooleanField(default=True)

```

* **Why:** This identifies the structural origin of data streams. It allows our ingestion logic to instantly know which extraction method to apply to an row.

#### 3. `RawIngestionBatch` & `RawDataRow` 

To ensure compliance with strict security standards, we must never modify raw data. We preserve the original source documents exactly as it was uploaded.

```python
class RawIngestionBatch(models.Model):
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    filename = models.CharField(max_length=255)
    ingested_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

class RawDataRow(models.Model):
    batch = models.ForeignKey(RawIngestionBatch, on_delete=models.CASCADE, related_name='rows')
    row_index = models.IntegerField()
    raw_payload = models.JSONField()  # Unmodified JSON blob representation of row
    processed = models.BooleanField(default=False)

```

* **Why:** If an environmental calculation factor updates or an auditor questions a value three years from now, we can trace the record back to the exact block that entered our ecosystem.

#### 4. `NormalizedActivityData`

This is the engine's core table. It translates highly fragmented source rows into a uniform, mathematically comparable format.

```python
class NormalizedActivityData(models.Model):
    SCOPE_CHOICES = (
        ('SCOPE_1', 'Scope 1: Direct Emissions'),
        ('SCOPE_2', 'Scope 2: Indirect Market Electricity'),
        ('SCOPE_3', 'Scope 3: Upstream/Downstream Value Chain'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending Human Attestation'),
        ('SUSPICIOUS', 'Flagged Anomaly Alert'),
        ('APPROVED', 'Verified & Cleared'),
        ('LOCKED', 'Immutable Audit Lock'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    raw_row = models.OneToOneField(RawDataRow, on_delete=models.CASCADE, related_name='normalized')
    
    scope_category = models.CharField(max_length=10, choices=SCOPE_CHOICES)
    activity_type = models.CharField(max_length=255) # e.g., "Stationary Combustion - Diesel"
    
    start_date = models.DateField()
    end_date = models.DateField()
    
    raw_quantity = models.DecimalField(max_digits=15, decimal_places=4)
    raw_unit = models.CharField(max_length=50)
    
    # Unified Normalized Values
    normalized_quantity = models.DecimalField(max_digits=15, decimal_places=4)
    normalized_unit = models.CharField(max_length=50) # Liters, kWh, Passenger-KM
    
    # Carbon Metrics
    co2e_metric_tons = models.DecimalField(max_digits=12, decimal_places=6)
    emission_factor_used = models.CharField(max_length=255)
    
    # State Machine Controls
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    flags = models.JSONField(default=list, blank=True)
    last_modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)

```

* **Why:** It decouples input variations from calculation results. Whether tracking gallons of fuel from SAP or kWh from utilities, everything maps to clean, normalized quantities and $CO_2e$ metric tons.

#### 5. `AuditTrail`

```python
class AuditTrail(models.Model):
    activity_record = models.ForeignKey(NormalizedActivityData, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100) # e.g., "MANUAL_ANALYST_OVERRIDE"
    previous_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField()

```

* **Why:** This ensures full accountability for manual updates. Every change creates a permanent, immutable record of previous values, new values, and the human analyst's justification narrative.

---
