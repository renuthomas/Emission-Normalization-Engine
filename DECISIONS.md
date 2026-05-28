
# `DECISIONS.md`

When engineering an automated data processing engine, ambiguities in raw data are inevitable. Here are some of the ambiquity and solutions therefore -:
### 1. SAP Material Group Shorthands & German System Column Mappings

* **Ambiguity:** SAP systems often use short German codes like `MATNR` (Material Number) and `MENGE` (Quantity) instead of clear English names.
* **Resolution:** Built an explicit translation engine directly into `NormalizationPipeline.process_sap_csv`. Unmapped rows are automatically bypassed instead of crashing the batch upload, allowing the pipeline to process valid entries seamlessly.
* **PM Query Requirement:** *"Should we establish a fallback table that maps unclassified SAP material numbers directly to standard emissions categories, or should unmapped rows block the entire ingestion batch?"*

### 2. Overlapping and Irregular Utility Billing Schedules

* **Ambiguity:** Utility bills rarely align perfectly with standard calendar months (e.g., February 15 to April 5).
* **Resolution:** Implemented a temporal validation rule that flags any billing cycle outside a typical 25-35 day window as `SUSPICIOUS`. This alerts analysts to irregular intervals that could skew quarterly reporting.
* **PM Query Requirement:** *"Should we introduce a linear daily interpolation engine to automatically split cross-month utility data into exact calendar months, or leave the raw billing periods as the data logs?"*

### 3. Missing Corporate Travel Dimensions

* **Ambiguity:** Travel booking payloads frequently omit the exact carbon footprint or list empty distance markers (`"distance_km": "0"`).
* **Resolution:** Programmed the ingestion pipeline to parse the trip category flag (`FLIGHT`, `HOTEL`, `GROUND`). If a flight contains a zero-distance marker, it is immediately marked as `SUSPICIOUS`, prompting an analyst override. For valid records, it applies a standardized factor weight based on the mode of transport.
* **PM Query Requirement:** *"If an API payload is missing exact distance values, should we integrate a spatial mapping tool to calculate distance using airport codes, or rely on manual analyst entries?"*
