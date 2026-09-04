# Battery pack configuration dataset

Generated data for the 4-cell reconfigurable battery pack. Regenerate with:

```
npm run dataset:generate     # writes both CSV files
npm run dataset:verify       # end-to-end checks (22 assertions)
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
| `Status` | `valid`, or `short-circuit` for configurations the specification requires be excluded |
| `Voltage_V` | Terminal voltage across the load, in volts |
| `VoltageGroup` | Label for the voltage class |
| `ConnectionClass` | `series`, `parallel`, `both` (series-parallel), or `none` |
| `CellsInSeries` | Cells in series per conducting branch (`Voltage_V` ÷ 4 V) |
| `ActiveCells` | Cell numbers carrying load current |

## Circuit model

Topology is taken from the Kirchhoff loop equations supplied with the project
(`attached_assets/Pasted-Type-a-switch-connects-...txt`):

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

Of 4096 configurations: **2380 short-circuit**, **1151 zero output**, **565 voltage-producing**.

| Voltage | series | parallel | both | total |
| --- | --- | --- | --- | --- |
| 4 V | 346 | 91 | – | 437 |
| 8 V | 89 | – | 12 | 101 |
| 12 V | 21 | – | 1 | 22 |
| 16 V | 5 | – | – | 5 |
| **Total** | **461** | **91** | **13** | **565** |

## Relationship to earlier artefacts

- `attached_assets/FormulaValidConfig (2)_1759486139357.xlsx` is **not** read by any code in
  this repository. It lists 1605 rows with voltages 4/6/8/12/16 V, and its `COMB` column is a
  pure function of `VOLTS` (every 4 V row is `parallel`, every 6 V row is `both`, all others
  are `series`), so that column carries no structural information. Its 6 V rows are not
  reproducible with ideal 4 V cells and ideal switches; they require a resistive cell model.
- `server/circuit-solver.ts` (used by the running app) is a separate implementation that
  yields 1573 non-zero configurations with a different distribution. It has not been
  reconciled with this dataset — see `CHANGELOG.log`.
