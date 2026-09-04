# Battery pack configuration dataset

Generated data for the 4-cell reconfigurable battery pack. Regenerate with:

```
npm run dataset:generate     # writes both CSV files
npm run dataset:all          # every verification suite (see below)
```

## Files

| File | Rows | Contents |
| --- | --- | --- |
| `battery-configurations-all.csv` | 4096 | Every switch configuration, including short-circuit and zero-output cases |
| `battery-configurations-valid.csv` | 565 | Voltage-producing configurations only |

## Columns

| Column | Meaning |
| --- | --- |
| `ConfigID` | `#0000`–`#4095`, the switch vector read as a 12-bit integer (bit 0 = R1A) |
| `R1A`…`R4C` | Switch state: `1` = closed (0 Ω), `0` = open (∞ Ω) |
| `SwitchStates` | The same 12 bits grouped per cell, e.g. `101 001 001 001` |
| `Status` | `valid`, `short-circuit` (excluded by the specification), or `invalid` |
| `Voltage_V` | Terminal voltage across the load, in volts |
| `VoltageGroup` | Label for the voltage class |
| `ConnectionClass` | `series`, `parallel`, `both` (series-parallel), or `none` |
| `CellsInSeries` | Cells in series per conducting branch (`Voltage_V` ÷ 4 V) |
| `ActiveCells` | Cell numbers carrying load current |

## Circuit model

Topology is the 3-switch reconfigurable battery pack proposed in Muhammad Shaheer's paper,
*AI-based Reconfigurable Battery System for Smart Electric Vehicles (SEVs)* (Shaheer, Abbas,
Adeel, Asghar, Iqbal, Alaulamie), Section 2 and Fig. 1, with the Kirchhoff loop equations of
its Eqs. 1-12:

- **Type a** (`RiA`) connects the energy-source positive terminal to cell *i*'s positive pole.
- **Type b** (`RiB`) connects cell *i*'s negative pole to the common b-bus.
- **Type c** (`RiC`) connects cell *i*'s negative pole to cell *i+1*'s positive pole; for the
  last cell, `R4C` connects instead to the energy-source negative terminal.
- The load sits between the two energy-source terminals; `Voltage_V` is measured across it.

Cells are ideal 4 V sources and switches are ideal (0 Ω / ∞ Ω), exactly as the supplied
equations assume — no internal-resistance term appears in them. Configurations where the
node potentials are contradictory (a shorted cell, or two parallel branches of unequal EMF)
have infinite loop current and are marked `short-circuit`.

## Result summary

Of 4096 configurations: **2380 short-circuit**, **1150 zero output**, **1 invalid**,
**565 voltage-producing**.

The single additional invalid case is `R1B, R1C, R2C, R3A, R4B, R4C` (`#3174`): the common bus
routes ES− to cell 2's positive pole while `R3A` reaches its negative pole, so current flows the
wrong way through the load. It is excluded from the valid set.

| Voltage | series | parallel | both | total |
| --- | --- | --- | --- | --- |
| 4 V | 346 | 91 | – | 437 |
| 8 V | 89 | – | 12 | 101 |
| 12 V | 21 | – | 1 | 22 |
| 16 V | 5 | – | – | 5 |
| **Total** | **461** | **91** | **13** | **565** |

## Verification

Three independent methods agree on the voltage, short-circuit status and active-cell set of all
4096 configurations:

| Suite | Method |
| --- | --- |
| `npm run dataset:verify` | Hand-worked circuit cases plus structural invariants |
| `npm run dataset:crosscheck` | Numeric Modified Nodal Analysis over a real resistive network with a Gaussian-elimination matrix solve — a completely different algorithm from the topological solver |
| `npm run dataset:handcheck` | Closed-form hand derivation reproducing every count |
| `npm run dataset:papercheck` | Confirms the model implements the pack architecture proposed in the paper |
| `npm run dataset:appcheck` | Confirms the running application serves exactly this dataset |

### The hand derivation

Take ES− as the 0 V reference and write x_i for the potential of cell *i*'s negative pole. Each
closed switch is one linear equation: `a_i → x_i = φ(ES+) − 4`, `b_i → x_i = φ(bus)`,
`c_i → x_i = x_(i+1) + 4`, and `c_4 → x_4 = 0`. A configuration short circuits exactly when this
system is inconsistent.

Because `c_4` pins x_4 = 0, the "tail run" of cells m..4 joined by closed type-c switches has every
potential pinned absolutely at x_i = 4(4 − i). This yields:

- `R4C` must be closed for any current at all (ES− is reachable no other way).
- At most one type-a switch, and at most one type-b switch, may be closed on a tail-run cell.
- **Family I** (466 rows): ES+ lands on tail cell *s*, and the output is exactly **4(5 − s) volts**.
  The number of ways to complete the remaining switches, f(m), depends only on m — never on s:
  f(1)=5, f(2)=14, f(3)=63, f(4)=278. So Family I = 5·4 + 14·3 + 63·2 + 278·1 = **466**.
- **Family II** (99 rows): ES+ reaches only non-tail cells, and the b-bus completes the circuit.
- Total: 466 + 99 = **565**.

Worked by hand, f(1) = 5 because the tail run is all four cells, leaving only the bus free: "no
type-b closed" or "exactly one of b1..b4" = 1 + 4. And f(2) = 16 − 2 = 14, because the free
switches are {a1, b1, b2, b3, b4}, giving 4 × 4 = 16 combinations, of which the 2 that close a1
and b1 together against a tail b at t ≠ s pin x_1 inconsistently and short.

## Alignment with the proposed pack

`npm run dataset:papercheck` asserts the model against the paper's own architecture and worked
switch lists. It matches on every point of the architecture — four cells, three switches per
cell, type-a to the energy-source positive pole, type-b to the common negative bus, type-c to
the next cell's positive pole with the last cell wired to the energy-source negative pole, the
load across the terminals, and R ∈ {0, ∞} — and it reproduces the paper's worked series
(Eq. 13, 17), parallel (Eq. 18, 19, 21) and full-series results.

It also implements the paper's own exclusion rule verbatim: *"short circuit may occur for some
configurations. The optimization target will automatically exclude short circuit configurations
from our solution because some of Iia or Iib will become infinite."* An inconsistent set of node
potentials is precisely the ideal-source signature of that infinite loop current.

Two of the paper's Section 3.2 switch lists do not follow from the architecture it proposes:

- **The v6 class.** 6 V is not a valid configuration of this pack. Under the paper's own
  R ∈ {0, ∞}, the terminal voltage is always a whole number of 4 V cells in series. The switch
  lists the paper labels v6 (e.g. Eq. 22) put an 8 V string in parallel with a 4 V branch, which
  drives an unbounded loop current — excluded by the paper's own rule rather than averaging to
  6 V. Averaging would require modelling cell internal resistance, which Eqs. 1-12 do not
  include. The usable voltage classes are therefore **4, 8, 12 and 16 V**.
- **Non-consecutive series (Eqs. 14-16).** No switch in the architecture joins one cell's
  negative pole to a non-adjacent cell's positive pole — type-c reaches only cell *n+1* — so
  those switch lists place all cell negatives on the common bus, which is a parallel connection.

## Relationship to earlier artefacts

- `attached_assets/FormulaValidConfig (2)_1759486139357.xlsx` is the paper's own
  valid-configuration dataset — its 1605 rows reproduce the paper's published percentages
  exactly (975/1605 = 60.7 % at 8 V, 386 = 24.0 %, 140 = 8.7 %, 64 = 4.0 %, 40 = 2.5 %). It is
  **not** read by any code in this repository. Its encoding is `0` = closed (R = 0 Ω), matching
  the paper's R ∈ {0, ∞}. Its `COMB` column is a pure function of `VOLTS` (every 4 V row is
  `parallel`, every 6 V row is `both`, all others `series`), so that column carries no
  structural information beyond the voltage. Its 64 6 V rows are the excluded class described
  above.
- The application previously contained **five** separate circuit implementations, which disagreed
  with each other and with the specification. All of them have been replaced by
  `shared/battery-model.ts`, which is now the single source of truth. The superseded solver
  reported 1573 "non-zero" configurations because it derived voltage as
  `activeCells × 4` regardless of wiring — counting cells that carry no load current, and treating
  short circuits as working configurations.
