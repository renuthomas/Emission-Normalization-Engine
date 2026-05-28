# System Tradeoffs

To deliver a reliable core engine, we had to make certain decisions to exclude complex, non-essential systems from the initial build.

### 1. Automatic Spatial Great-Circle Distance Calculation

* **Why Postponed:** Implementing an automated coordinate calculation engine (using airport codes like JFK and LHR to find spatial flight distance) introduces massive external API overhead.
* **Trade-off:** We assume the upstream travel data source provides numerical distance variables. Any row missing this data is flagged as an anomaly for manual review, keeping the core parser lean and efficient.

### 2. Multi-Currency Financial Conversion Engine

* **Why Postponed:** Corporate travel data from platforms like Navan or Concur can arrive in multiple currencies (USD, EUR, GBP). Building a reliable currency conversion engine requires live integrations with financial exchange APIs to manage fluctuating rates over time.
* **Trade-off:** We skipped spend-based carbon mapping entirely, relying strictly on direct physical metrics like distance traveled and nights stayed. This ensures highly accurate, physical data logging without the complexity of exchange rate tracking.

### 3. Granular Carbon Factor Horizon Scheduling

* **Why Postponed:** Real-world emission factors change dynamically based on grid composition changes year-over-year.
* **Trade-off:** The platform uses a fixed, static factor index model (e.g., standard DEFRA/eGRID benchmarks for 2026). This provides an immutable baseline for verification before rolling out dynamic, time-varying factor updates across different reporting years.

---
