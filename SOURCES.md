# Real-World Data Formats

### 1. SAP Material Logistics Log Exports

* **Real-World Context:** SAP material movement reports (such as Transaction `MB51`) extract raw operational data into flat, comma-separated sheets.
* **Production Code Sample Structure:**
```csv
MATNR,MENGE,MEINS,BUDAT,WERKS,TXTMD
441009,12000,L,20260401,1001,Diesel Fuel - Generator
```


* **Real-World Edge Failures:**
1. **Locales & Decimals:** European SAP instances export numbers using commas for decimals (e.g., `12000,50` instead of `12000.50`), which can break standard float parsers.
2. **Unit Disconnects:** Quantities can arrive under unmapped unit codes like `ST` (pieces) or `DR` (drums), which cannot be directly converted to liquid metrics without manual volume mapping.



### 2. Utility Grid Provider Statement Invoices

* **Real-World Context:** Utility companies provide multi-meter billing data via flat-file dashboards or automated data transfers.
* **Production Code Sample Structure:**
```csv
Meter ID,Billing Start Date,Billing End Date,Total kWh Usage,Facility
MTR-8819,2026-03-01,2026-03-31,14500.50,HQ Building
```


* **Real-World Edge Failures:**
1. **Estimated Readings:** Utilities often substitute estimated consumption values during billing cycles, later issuing retroactive corrections that can lead to duplicate data entries.
2. **Varying Timezones:** Automated smart meters may record timestamp logs across different local timezones, leading to minor overlap discrepancies when consolidating global emissions.



### 3. Corporate Travel Service Providers (Navan / Concur API)

* **Real-World Context:** Modern travel systems transmit data via structured REST API JSON streams.
* **Production Code Sample Structure:**
```json
[
  {
    "category": "FLIGHT",
    "distance_km": "1120.40",
    "booking_start": "2026-05-10",
    "booking_end": "2026-05-10",
    "raw_unit": "KM"
  }
]

```


* **Real-World Edge Failures:**
1. **Multi-Segment Flights:** A single booking id can contain multiple flight legs (e.g., JFK to LHR, then LHR to DXB), requiring a robust parsing loop to split and calculate each leg individually.
2. **Cancellations and Refunds:** Flight adjustments or last-minute cancellations trigger negative transaction lines, which require a matching reconciliation loop to prevent over-reporting carbon emissions.