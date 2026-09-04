import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  TrendingUp,
  Award,
  FileText,
  Zap,
  Battery,
  Cpu,
  BarChart3,
  Check,
  Target,
  GitBranch,
  Brain,
  Map,
  Layers,
  AlertTriangle,
  Mail,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

/**
 * Research summary for the paper:
 *   "AI-based Reconfigurable Battery System for Smart Electric Vehicles (SEVs)"
 *   Shaheer, Abbas, Adeel, Asghar, Iqbal, Alaulamie.
 *
 * All figures on this page are taken from that manuscript, except the block
 * explicitly labelled "This Web Application", which reports the enumeration
 * produced by server/circuit-solver.ts in this repository.
 */

export const AUTHORS = [
  { name: "Muhammad Shaheer", aff: 1, email: "muhammad.shaheer@hamdard.edu.pk", role: "Contributing author" },
  { name: "Syed Asad Abbas", aff: 1, email: "asadabbassherazi@gmail.com", role: "Contributing author" },
  { name: "Hannan Adeel", aff: 2, email: "hannan@utem.edu.my", role: "Corresponding author" },
  { name: "Muhammad Nabeel Asghar", aff: 3, email: "masghar@kfu.edu.sa", role: "Corresponding author" },
  { name: "Sajid Iqbal", aff: 3, email: "siqbal@kfu.edu.sa", role: "Contributing author" },
  { name: "Abdullah Alaulamie", aff: 3, email: "aalaulamie@kfu.edu.sa", role: "Contributing author" },
];

export const AFFILIATIONS = [
  "Department of Computing, Hamdard University, Islamabad Campus, Islamabad 45550, Pakistan",
  "Fakulti Kecerdasan Buatan dan Keselamatan Siber, Universiti Teknikal Malaysia Melaka, Melaka 71600, Malaysia",
  "Department of Information Systems, College of Computer Sciences and Information Technology, King Faisal University, Al-Ahsa, Saudi Arabia",
];

// Table 1 - Road segment classification data for the seed 36P41U86R9Q45D
export const SEED_TRAINING = "36P41U86R9Q45D";
export const SEED_UNSEEN = "59R12A36U19Q55D10A";

export const TABLE_1 = [
  { seg: "36P", km: 36, type: "In-Cu-Bu L3", cls: "v16" },
  { seg: "41U", km: 41, type: "De-Cu-Bu L2", cls: "v12" },
  { seg: "86R", km: 86, type: "De-Cu L2", cls: "v12" },
  { seg: "9Q", km: 9, type: "De-Cu L1", cls: "v8" },
  { seg: "45D", km: 45, type: "In L3", cls: "v16" },
];

// Table 2 - Neural network layer details
export const TABLE_2 = [
  { layer: "Masking (Masking)", shape: "(None, 4, 1)", params: "0" },
  { layer: "LSTM (LSTM)", shape: "(None, 4, 128)", params: "66,560" },
  { layer: "TimeDistributed (TimeDistributed)", shape: "(None, 4, 4)", params: "516" },
];

// Table 3 - Comparison of model performances
export const TABLE_3 = [
  { model: "ANN", acc: 78.4, precision: 0.75, recall: 0.74, f1: 0.74 },
  { model: "RNN", acc: 82.1, precision: 0.8, recall: 0.77, f1: 0.77 },
  { model: "CNN", acc: 85.1, precision: 0.81, recall: 0.8, f1: 0.8 },
  { model: "LSTM", acc: 92.5, precision: 0.92, recall: 0.91, f1: 0.92 },
];

// Table 4 - Training and evaluation metrics of the models
export const TABLE_4 = [
  { model: "ANN", time: 25, params: "345,000", loss: 0.36 },
  { model: "RNN", time: 32, params: "660,000", loss: 0.29 },
  { model: "CNN", time: 45, params: "885,000", loss: 0.2 },
  { model: "LSTM", time: 48, params: "667,076", loss: 0.14 },
];

// Table 5 - Training and validation metrics for epochs 1 and 10
export const TABLE_5 = [
  { epoch: "1/10", loss: 0.46, acc: 0.7597, vloss: 0.4396, vacc: 0.7621 },
  { epoch: "10/10", loss: 0.1978, acc: 0.8796, vloss: 0.1357, vacc: 0.8173 },
];

// Table 6 - Road profile breakdown with voltage prediction, seed 59R12A36U19Q55D10A
export const TABLE_6 = [
  { seg: "59R", km: 59, type: "Cu-Bu L2", cls: "v12" },
  { seg: "12A", km: 12, type: "Straight L1", cls: "v4" },
  { seg: "36U", km: 36, type: "De-Cu-Bu L2", cls: "v12" },
  { seg: "19Q", km: 19, type: "De-Cu L1", cls: "v8" },
  { seg: "55D", km: 55, type: "In L3", cls: "v16" },
  { seg: "10A", km: 10, type: "Straight L1", cls: "v4" },
];

// Section 4 - class distribution of the valid configuration dataset
export const CLASS_DISTRIBUTION = [
  { voltage: "8 V", pct: 60.7, color: "bg-purple-600" },
  { voltage: "4 V", pct: 24.0, color: "bg-blue-600" },
  { voltage: "12 V", pct: 8.7, color: "bg-amber-600" },
  { voltage: "6 V", pct: 4.0, color: "bg-teal-600" },
  { voltage: "16 V", pct: 2.5, color: "bg-red-600" },
];

// Figure 8 - most frequently occurring resistor per voltage class
export const DOMINANT_RESISTORS = [
  { cls: "4 V", resistor: "RA4", count: 317, topology: "Series only" },
  { cls: "6 V", resistor: "RC2", count: 64, topology: "Combined series-parallel" },
  { cls: "8 V", resistor: "RA2", count: 743, topology: "Parallel" },
  { cls: "12 V", resistor: "RA2", count: 139, topology: "Parallel" },
  { cls: "16 V", resistor: "RA1", count: 37, topology: "Parallel" },
];

// Enumeration produced by this repository's server/circuit-solver.ts over all 2^12 settings.
export const APP_ENUMERATION = [
  { v: "0 V", n: 2523, d: "No complete path or short circuit — excluded from use" },
  { v: "4 V", n: 454, d: "One cell across the terminals" },
  { v: "8 V", n: 470, d: "Two cells in series" },
  { v: "12 V", n: 420, d: "Three cells in series" },
  { v: "16 V", n: 229, d: "Four cells in series" },
];

export const REFERENCES: string[] = [
  "Chan, C.C., Wong, Y.S. (2004). The state of the art of electric vehicle technology. IPEMC 2004, 1, 46–57.",
  "Khalatbariolotani, A., Han, J. (2024). Connected Hybrid Electric Vehicles with Policy-Sharing: A Combination of Deep Reinforcement Learning and Federated Learning. IEEE Trans. Veh. Technol., 73(5), 6789–6801.",
  "Tran, M.K., Panchal, S., Fowler, M. (2024). A Review of Lithium-Ion Battery State-of-Charge Estimation Based on Machine Learning Algorithms. Batteries, 10(3), 89.",
  "Muhammad, S., Rafique, M.U., Li, S., Shao, Z., Wang, Q., Guan, N. (2017). A robust algorithm for state-of-charge estimation with gain optimization. IEEE Trans. Ind. Inform., 13(6), 2983–2994.",
  "Zhang, S., Liu, Y., Wang, X. (2023). Voltage relaxation-based state-of-health estimation of lithium-ion batteries using convolutional neural networks and transfer learning. J. Energy Storage, 68, 107789.",
  "He, L., Gu, L., Kong, L., Gu, Y., Liu, C., He, T. (2013). Exploring adaptive reconfiguration to optimize energy efficiency in large-scale battery systems. IEEE RTSS 2013, 118–127.",
  "Ciocan, A., Fodor, D., Forcos, A., Munteanu, C. (2025). Adaptive Reconfigurable Battery Pack Employing Switching Matrix Circuit to Maximize the Capacity of the Battery Bank. IEEE Trans. Transp. Electrific. (early access).",
  "Yang, F., Wang, D., Zhao, Y. (2025). Digital Twin and AI-Enabled Battery Management System for Electric Vehicles. IEEE Trans. Ind. Inform., 21(2), 1234–1245.",
  "Chen, G., Li, Z., Goetz, S.M. (2023). Reconfigurable Battery Systems: Challenges and Opportunities for Electric Vehicle Applications. IEEE Electrific. Mag., 11(2), 34–45.",
  "Tresca, G., Formentini, A., Riccio, J., Anglani, N., Zanchetta, P. (2023). A reconfigurable cascaded multilevel converter for EV powertrain. IEEE Trans. Ind. Appl.",
  "Wang, Y., Zhang, C., Chen, Z. (2023). A Reconfigurable Battery Pack System with Active Balancing for Electric Vehicles. IEEE Trans. Veh. Technol., 72(4), 4567–4578.",
  "Kim, J.H., Lee, S.H. (2024). Modular Reconfigurable Battery Architecture for Electric Vehicle Applications: A Comprehensive Review. J. Power Sources, 589, 233789.",
  "Muhammad, S., Rafique, M.U., Li, S., Shao, Z., Wang, Q., Liu, X. (2019). Reconfigurable battery systems: a survey on hardware architecture and research challenges. ACM TODAES, 24(2), 1–27.",
  "Kacetl, T., Tashakor, N., Goetz, S.M. (2024). Cloud-enhanced Real-time Control of Modular-Multilevel Reconfigurable Battery Packs for Automotive Applications. IEEE Trans. Ind. Inform., 20(6), 1123–1134.",
  "Haque, T.S., Rahman, M.H., Islam, M.R., Razzak, M.A., Badal, F.R., Ahamed, M.H., Moyeen, S.I., Das, S.K., Ali, M.F., Tasneem, Z., Saha, D.K. (2021). A review on driving control issues for smart electric vehicles. IEEE Access, 9, 135440–135472.",
  "Kacetl, J., Fang, J., Kacetl, T., Tashakor, N., Goetz, S. (2022). Design and analysis of modular multilevel reconfigurable battery converters for variable bus voltage powertrains. IEEE Trans. Power Electron., 38(1), 130–142.",
  "Tashakor, N., Kacetl, T., Goetz, S.M. (2024). Cloud-enhanced Real-time Control of Modular-Multilevel Reconfigurable Battery Packs for Automotive Applications. IEEE Trans. Ind. Inform., 20(6), 1123–1134.",
  "Zeng, C., Li, H., Chen, J. (2025). A novel ensemble learning model for state of health estimation of lithium-ion batteries. J. Power Sources, 512, 230567.",
  "Chandran, R.K., Siddhan, S., Chinnadurai, N. (2025). Hybrid LSTM and deep reinforcement learning for autonomous battery health optimization in electric vehicles. J. Power Sources, 526, 231456.",
  "Arul, R., Relin, J., Raj, F., Darney, P.E., Jansi, D., Krishnan, R.S., Sundaravadivel, P. (2025). A Hybrid Deep Learning Model for Optimizing Electric Vehicle Battery and Navigation Systems. ICMLAS 2025, 308–315.",
  "Muhammad, S., Guan, N., Li, S., Wang, Q., Shao, Z. (2017). Efficient and balanced charging of reconfigurable battery with variable power supply. IEEE RTCSA 2017, 1–6.",
  "Shah, S.K., Singh, M. (2023). The Smart Energy and Power Estimation of Electric Vehicle Battery Using Deep Learning Model. IEEE ICPEDC 2023, 234–239.",
  "Garcia Bustos, J., Baeza Fernandez, C., Brito Schiele, B., Rivera Veloso, V., Masserano, B., Burgos-Mellado, C., Orchard, M., Perez, A. (2025). A novel data-driven framework for driving range prognostics in electric vehicles. Eng. Appl. Artif. Intell., 139, 109567.",
  "Naresh, V.S., Kumar, A., Singh, R. (2025). Optimizing electric vehicle battery health monitoring: a resilient ensemble learning approach for state-of-health prediction. Sustain. Energy Grids Netw., 41, 101456.",
  "Sayed, K., Kassem, A., Saleeb, H., Alghamdi, A.S., Abo-Khalil, A.G. (2020). Energy-saving of battery electric vehicle powertrain and efficiency improvement during different standard driving cycles. Sustainability, 12(24), 10466.",
  "Kacetl, T., Tashakor, N., Goetz, S.M. (2025). Highly Compact Charging With Power-Factor Correction for Electric Vehicles Through Functional Integration Into a Dynamically Reconfigurable Battery. IEEE Trans. Power Electron., 40(8), 10276–10285.",
  "Babu, D., Kumar, A., Roychowdhury, J. (2013). Energy aware battery powered electric vehicles: a predictive model driven approach. CSE 2013, 215–220.",
  "Li, Z., Yang, A., Chen, G., Tashakor, N., Zeng, Z., Peterchev, A.V., Goetz, S.M. (2023). A rapidly reconfigurable DC battery for increasing flexibility and efficiency of electric vehicle drive trains. IEEE Trans. Transp. Electrific.",
  "Park, S., Kim, Y., Lee, J. (2024). Road Profile Classification Using Deep Learning for Adaptive Battery Management in Electric Vehicles. Sensors, 24(5), 1567.",
  "Gonzalez, D., Perez, J., Milanes, V. (2024). Deep Learning-Based Energy Consumption Prediction for Electric Vehicles Considering Road Topography. IEEE Trans. Intell. Transp. Syst., 25(3), 2456–2468.",
  "Wang, L., Zhang, Q., Liu, H. (2023). LSTM-Based Energy-Efficient Route Planning for Electric Vehicles with Terrain Awareness. IEEE Access, 11, 123456–123468.",
  "Liu, K., Li, K., Peng, Q. (2023). Data-Driven Health Estimation and Lifetime Prediction of Lithium-Ion Batteries: A Review. Renew. Sustain. Energy Rev., 182, 113456.",
  "Heimes, H., Kampker, A., Wessel, S. (2025). AI-Driven Structural Battery Development for Electric Vehicles. ATZ Worldwide, 127(3), 56–61.",
  "Ahmad, F., Alam, M.S., Asghar, M.S. (2024). AI-Based Energy Management Systems for Smart Electric Vehicles: A Comprehensive Review. IEEE Access, 12, 45678–45695.",
  "Kubenka, M., Hrubes, P., Kubenkova, M. (2026). A Systematic Review of Computational and Data-Driven Approaches for Energy-Efficient Battery Management in Electrified Vehicles. Appl. Sci., 16(2), 618.",
  "Popa, V., Stoican, F. (2025). The Role of the Industrial IoT in Advancing Electric Vehicle Technology: A Review. Appl. Sci., 15(17), 9290.",
  "Martin-Gomez, A., Garcia-Fernandez, P., Rodriguez-Sanchez, C. (2026). Electric Vehicle Route Optimization: An End-to-End Learning Approach with Multi-Objective Planning. World Electr. Veh. J., 17(1), 41.",
];

const TAB_CLASS =
  "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export default function ResearchSummary() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Hero */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            AI-based Reconfigurable Battery System for Smart Electric Vehicles (SEVs)
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-4 sm:mb-6">
            An LSTM road-profile classifier driving a 4-cell, 12-switch reconfigurable battery pack
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-blue-600 text-white px-4 py-2 text-sm">
              <Brain className="w-4 h-4 mr-2" />
              LSTM · 92.5% accuracy
            </Badge>
            <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
              <Battery className="w-4 h-4 mr-2" />
              4 cells · 12 switches
            </Badge>
            <Badge className="bg-purple-600 text-white px-4 py-2 text-sm">
              <Zap className="w-4 h-4 mr-2" />
              15% lower energy use on inclines
            </Badge>
            <Badge className="bg-amber-600 text-white px-4 py-2 text-sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              ~20% longer battery life
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Keywords: AI · SEVs · LSTM · Reconfigurable Battery Pack
          </p>
        </div>

        {/* Authors */}
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-primary flex items-center gap-2">
              <Award className="w-6 h-6" />
              Authors &amp; Affiliations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AUTHORS.map((a) => (
                <div key={a.email} className="p-4 rounded-lg border border-border bg-card">
                  <p className="font-semibold text-foreground">
                    {a.name}
                    <sup className="text-primary ml-1">{a.aff}</sup>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{a.role}</p>
                  <p className="text-xs font-mono text-primary mt-2 break-all flex items-start gap-1">
                    <Mail className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {a.email}
                  </p>
                </div>
              ))}
            </div>

            <Separator />

            <ol className="space-y-2 text-sm text-muted-foreground">
              {AFFILIATIONS.map((aff, i) => (
                <li key={aff} className="flex gap-2">
                  <sup className="text-primary font-bold">{i + 1}</sup>
                  <span>{aff}</span>
                </li>
              ))}
            </ol>

            <div className="p-4 bg-muted rounded-lg text-sm text-foreground">
              <strong>Funding.</strong> The authors thank the Deanship of Scientific Research, Vice
              Presidency for Graduate Studies and Scientific Research, King Faisal University, Saudi
              Arabia, for supporting this work under Grant No.{" "}
              <span className="font-mono">KFU264837</span>.
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="abstract" className="w-full">
          <TabsList className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-1 sm:gap-2 h-auto p-1 sm:p-2 bg-muted overflow-x-auto">
            <TabsTrigger value="abstract" className={TAB_CLASS}>
              <FileText className="w-4 h-4 mr-2" />
              Abstract
            </TabsTrigger>
            <TabsTrigger value="background" className={TAB_CLASS}>
              <BookOpen className="w-4 h-4 mr-2" />
              Background
            </TabsTrigger>
            <TabsTrigger value="circuit" className={TAB_CLASS}>
              <GitBranch className="w-4 h-4 mr-2" />
              Circuit Model
            </TabsTrigger>
            <TabsTrigger value="methodology" className={TAB_CLASS}>
              <Layers className="w-4 h-4 mr-2" />
              Methodology
            </TabsTrigger>
            <TabsTrigger value="model" className={TAB_CLASS}>
              <Brain className="w-4 h-4 mr-2" />
              LSTM Model
            </TabsTrigger>
            <TabsTrigger value="results" className={TAB_CLASS}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="implementation" className={TAB_CLASS}>
              <Cpu className="w-4 h-4 mr-2" />
              This App
            </TabsTrigger>
            <TabsTrigger value="conclusion" className={TAB_CLASS}>
              <Target className="w-4 h-4 mr-2" />
              Conclusion
            </TabsTrigger>
            <TabsTrigger value="references" className={TAB_CLASS}>
              <BookOpen className="w-4 h-4 mr-2" />
              References
            </TabsTrigger>
          </TabsList>

          {/* ---------------------------------------------------------- Abstract */}
          <TabsContent value="abstract" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <FileText className="w-6 h-6" />
                  Abstract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-foreground leading-relaxed">
                <p className="text-lg">
                  Smart Electric Vehicles (SEVs) operate autonomously or semi-autonomously and draw
                  their energy exclusively from batteries, so battery health determines peak
                  performance, service life and sustainability. This work builds a reconfigurable
                  battery system for SEVs that changes its own cell configuration in response to the
                  road profile ahead, using an AI model that reads elevation, curvature, surface
                  state, inclines, declines, traffic congestion and off-road conditions.
                </p>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-amber-900 mb-3">Problem</h3>
                  <p className="text-amber-800">
                    Conventional SEV battery packs are hard-wired: the connections between cells
                    cannot be changed, so every cell is drawn on at once. A degraded cell then behaves
                    as a resistor, raising the internal resistance of the whole pack, wasting energy
                    and shortening pack life.
                  </p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-blue-900 mb-3">Approach</h3>
                  <p className="text-blue-800">
                    A 4-cell reconfigurable battery pack with three switches per cell (type-a, type-b,
                    type-c) is analysed with Kirchhoff&rsquo;s laws to enumerate the switch settings
                    that yield a valid, short-circuit-free circuit, and each valid configuration is
                    labelled with the voltage it produces. In parallel, a road-profile dataset of
                    segments (straight, inclined, declined, curvy, bumpy, at levels L1&ndash;L3) is
                    labelled with categorical voltage classes v4, v6, v8, v12 and v16. A Long
                    Short-Term Memory (LSTM) network then predicts the voltage class each road patch
                    requires, which in turn selects the battery configuration.
                  </p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-green-900 mb-3">Two stated contributions</h3>
                  <ol className="list-decimal list-inside text-green-800 space-y-2">
                    <li>
                      A dataset of valid battery configurations for a reconfigurable SEV pack, each
                      linked to its corresponding output voltage, derived from an analytical
                      examination of the pack circuit.
                    </li>
                    <li>
                      Application of LSTM to road-profile data to identify road patches and decide the
                      best battery configuration for each &mdash; joining AI-based decision making to
                      reconfigurable battery hardware.
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- Background */}
          <TabsContent value="background" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <BookOpen className="w-6 h-6" />
                  System Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Conventional EV drivetrains use hard-wired batteries forming a fixed high-voltage DC
                  link into a main inverter. Li et al. [28] split that hard-wired battery into smaller
                  sub-units linked by low-voltage Field Effect Transistors; the resulting
                  reconfigurable DC link takes a substantial share of the switching duty off the main
                  inverter and allows the use of modern low-voltage transistors. Muhammad et al. [21]
                  show that dynamically changing the connections between cells turns a battery &mdash;
                  normally a passive two-terminal device &mdash; into a smart battery that
                  reconfigures itself to suit the operating requirement, and Muhammad et al. [27] use
                  reconfigurable packs to close the voltage gap between a variable supply (solar,
                  wind-driven generator) and the pack during charging.
                </p>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    The three switch types per cell
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-700 mb-2">
                        Type-a switch (R<sub>a</sub>)
                      </h4>
                      <p className="text-sm text-red-600">
                        Connects the positive pole of the energy source to the positive pole of the
                        battery cell.
                      </p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-700 mb-2">
                        Type-b switch (R<sub>b</sub>)
                      </h4>
                      <p className="text-sm text-blue-600">
                        Connects to the common bus that ties together the negative poles of all cells.
                      </p>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-700 mb-2">
                        Type-c switch (R<sub>c</sub>)
                      </h4>
                      <p className="text-sm text-green-600">
                        Connects the negative pole of cell <em>n</em> to the positive pole of cell{" "}
                        <em>n</em>+1. The one exception is the last cell, whose type-c switch connects
                        directly to the negative pole of the main energy source.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">Why SEVs need this</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>
                      SEVs are emission-free and low-impact, but effective driving control needs
                      supervisory systems and algorithms that optimise performance, stability and
                      safety while cutting transport cost [25, 26].
                    </li>
                    <li>
                      Shortages of batteries in particular sizes mean packs are assembled from a few to
                      thousands of small cells to meet a given load requirement [6].
                    </li>
                    <li>
                      Fixed packs cannot adapt: a damaged cell raises pack resistance and causes power
                      loss [10, 11, 12].
                    </li>
                    <li>
                      Reconfigurable packs can change voltage, current and power to match a load
                      profile [13&ndash;17], which is the property this work exploits.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----------------------------------------------------- Circuit model */}
          <TabsContent value="circuit" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <GitBranch className="w-6 h-6" />
                  Circuit Model &amp; Mathematical Formulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-blue-900 mb-3">Loop definitions</h3>
                  <p className="text-blue-800">
                    The pack circuit contains two families of loops. The <em>i</em>-th &alpha; loop
                    carries cell <em>i</em> through R<sub>(i+1)a</sub>, R<sub>ic</sub> and R
                    <sub>ia</sub>; in the <em>n</em>-th &alpha; loop, R<sub>(i+1)a</sub> is replaced by
                    the energy source. The <em>i</em>-th &beta; loop contains R<sub>(i+1)b</sub>, R
                    <sub>ic</sub> and R<sub>ib</sub>, and there are only <em>n</em>&minus;1 of them.
                    Currents are written I<sub>i&alpha;</sub> and I<sub>i&beta;</sub>; each cell
                    voltage V<sub>i</sub> is a known constant.
                  </p>
                </div>

                <div className="bg-muted p-6 rounded-lg font-mono text-sm space-y-3 overflow-x-auto">
                  <p className="font-sans font-semibold text-foreground">
                    Kirchhoff&rsquo;s law, <em>i</em>-th &alpha; loop (1 &le; i &le; n&minus;1):
                  </p>
                  <p>V_i = R_ic(I_iα − I_iβ) + R_(i+1)a(I_iα − I_(i+1)α) + R_ia(I_iα − I_(i−1)α)</p>
                  <p className="font-sans font-semibold text-foreground pt-2">
                    <em>i</em>-th &beta; loop (1 &le; i &le; n&minus;1):
                  </p>
                  <p>R_(i+1)b(I_iβ − I_(i+1)β) + V_(i+1) + R_ib·I_iβ + R_ic(I_iβ − I_iα) = 0</p>
                  <p className="font-sans font-semibold text-foreground pt-2">
                    <em>n</em>-th &alpha; loop:
                  </p>
                  <p>V_n = R_nc·I_nα + R_T·I_nα + R_na(I_nα − I_(n−1)α)</p>
                  <p className="font-sans font-semibold text-foreground pt-2">
                    Terminal voltage by Ohm&rsquo;s law:
                  </p>
                  <p>V_T = [ (V_n − R_na·I_(n−1)α) / (R_nc + R_na + R_T) ] · R_T</p>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-green-900 mb-3">
                    Switches as binary resistors
                  </h3>
                  <p className="text-green-800">
                    Each R<sub>i</sub> is modelled as a switch and can therefore take only two values,
                    R &isin; {"{0, ∞}"}. A closed switch is 0 &Omega;; an open switch is infinite. Some
                    switch settings short-circuit the pack; these are excluded automatically, because
                    the corresponding I<sub>i&alpha;</sub> or I<sub>i&beta;</sub> becomes infinite.
                  </p>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-purple-900 mb-3">Optimisation class</h3>
                  <p className="text-purple-800">
                    Because the zero-one variables R<sub>i</sub> appear inside a non-linear,
                    non-convex system, the configuration problem is a Mixed-Integer Non-Linear Program
                    and is solved by Branch and Bound [21, 25].
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Worked 4-cell case (12 switches)
                  </h3>
                  <p className="text-muted-foreground">
                    Expanding the general loops for <em>n</em> = 4 gives eight loop equations plus the
                    terminal relation. For example, loop 1&alpha; is V<sub>1</sub> = R<sub>1a</sub>I
                    <sub>1&alpha;</sub> + R<sub>2a</sub>(I<sub>1&alpha;</sub> &minus; I
                    <sub>2&alpha;</sub>) + R<sub>1c</sub>(I<sub>1&alpha;</sub> &minus; I
                    <sub>1&beta;</sub>), and loop 4&alpha; is V<sub>4</sub> = R<sub>4a</sub>(I
                    <sub>4&alpha;</sub> &minus; I<sub>3&alpha;</sub>) + R<sub>T</sub>I
                    <sub>4&alpha;</sub> + R<sub>4c</sub>I<sub>4&alpha;</sub>. Four cells &times; three
                    switches gives 12 binary variables, that is 2<sup>12</sup> = 4,096 switch settings
                    to screen for validity.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ------------------------------------------------------- Methodology */}
          <TabsContent value="methodology" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <Layers className="w-6 h-6" />
                  Methodology
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">3.1 Data acquisition</h3>
                  <p className="text-muted-foreground">
                    Two datasets are built. The <strong>valid-configuration dataset</strong> comes from
                    the reconfigurable battery pack itself: the admissible switch combinations are
                    identified and each is assigned its output voltage. The{" "}
                    <strong>road-profile dataset</strong> comprises road patches characterised by
                    straightness, incline level and curvature intensity [29, 30], each given a
                    categorical label from v4, v6, v8, v12 and v16.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    3.2 Preprocessing &mdash; the validity heuristic
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Combinations that cause a short circuit are eliminated, and a heuristic identifies
                    which resistor combinations put cells in series, in parallel, or in a combined
                    series-parallel topology. Each surviving configuration is assigned its voltage
                    through an expert system based on the identified circuit class.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-lg border border-blue-200 bg-blue-50">
                      <h4 className="font-semibold text-blue-900 mb-2">Series</h4>
                      <p className="text-sm text-blue-800 font-mono mb-2">
                        R_ai, R_ci, R_c(j−1), R_bj, R_bn, R_cn
                      </p>
                      <p className="text-xs text-blue-700">
                        For consecutive cells. For non-consecutive cells in series the closed set
                        generalises to R_a1, R_b1, R_b(2−1), R_b3, R_b4, R_c4.
                      </p>
                    </div>
                    <div className="p-5 rounded-lg border border-purple-200 bg-purple-50">
                      <h4 className="font-semibold text-purple-900 mb-2">Parallel</h4>
                      <p className="text-sm text-purple-800 font-mono mb-2">
                        R_ai, R_bi, R_aj, R_bj, …, R_ar, R_br, R_bn, R_cn
                      </p>
                      <p className="text-xs text-purple-700">
                        Both the a- and b-switch of every parallel cell close; R_bn and R_cn complete
                        the circuit.
                      </p>
                    </div>
                    <div className="p-5 rounded-lg border border-green-200 bg-green-50">
                      <h4 className="font-semibold text-green-900 mb-2">Combined series-parallel</h4>
                      <p className="text-sm text-green-800 font-mono mb-2">
                        R_ai, R_bi, R_a(j−1), R_b(j−1), R_c(j−1), R_bj, R_bn, R_cn
                      </p>
                      <p className="text-xs text-green-700">
                        If both R_ai and R_bi of a cell close, that cell joins in parallel; if R_c(j−1)
                        closes, cell (j−1) is in series with cell j.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Road-profile seed segmentation
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    A road profile is encoded as a seed string, split into segments made of a numeric
                    distance in kilometres plus a letter carrying the road attributes. For the seed{" "}
                    <span className="font-mono bg-muted px-2 py-1 rounded">{SEED_TRAINING}</span> the
                    breakdown and its voltage classes are given in Table 1. In the road-type column,
                    &lsquo;In&rsquo; is inclined, &lsquo;De&rsquo; declined, &lsquo;Cu&rsquo; curvy and
                    &lsquo;Bu&rsquo; bumpy; L1&ndash;L3 are severity levels of the patch.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <caption className="text-left text-sm font-semibold text-foreground mb-2">
                        Table 1 &mdash; Road segment classification data
                      </caption>
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">S. No</th>
                          <th className="border border-border p-3 text-left">Segment</th>
                          <th className="border border-border p-3 text-right">km</th>
                          <th className="border border-border p-3 text-left">Road type / profile</th>
                          <th className="border border-border p-3 text-left">Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_1.map((r, i) => (
                          <tr key={r.seg} className="hover:bg-muted">
                            <td className="border border-border p-3">{i + 1}</td>
                            <td className="border border-border p-3 font-mono font-semibold">
                              {r.seg}
                            </td>
                            <td className="border border-border p-3 text-right">{r.km}</td>
                            <td className="border border-border p-3">{r.type}</td>
                            <td className="border border-border p-3 font-semibold text-primary">
                              {r.cls}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Processing flow</h3>
                  <ol className="space-y-3 text-foreground">
                    {[
                      "Load and preprocess the dataset so it is consistent and ready for training.",
                      "Split the cleaned dataset into training and testing sets.",
                      "Train the model on the training set, validating after each epoch.",
                      "Evaluate model predictions for different road patches.",
                      "Serve interactive predictions: the user enters a seed string and receives per-patch voltage classes.",
                    ].map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                          {i + 1}
                        </span>
                        <span className="pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- LSTM model */}
          <TabsContent value="model" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <Brain className="w-6 h-6" />
                  Model Development &amp; Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Why LSTM</h3>
                  <p className="text-muted-foreground">
                    ANN, RNN, CNN and LSTM were all evaluated on the road-profile dataset. CNNs excel
                    at spatial data; RNNs model sequences but suffer vanishing gradients and so learn
                    long-term dependencies poorly; ANNs are too generic to pick up the sequential
                    character of road data. LSTM captures the temporal dependencies in a road profile,
                    and a masking layer lets it accept variable-length inputs [31].
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-3">Table 2 &mdash; Network layers</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Layer (type)</th>
                          <th className="border border-border p-3 text-left">Output shape</th>
                          <th className="border border-border p-3 text-right">Params</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_2.map((r) => (
                          <tr key={r.layer} className="hover:bg-muted">
                            <td className="border border-border p-3 font-mono">{r.layer}</td>
                            <td className="border border-border p-3 font-mono">{r.shape}</td>
                            <td className="border border-border p-3 text-right font-semibold">
                              {r.params}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/10 font-bold">
                          <td className="border border-border p-3" colSpan={2}>
                            Trainable parameters
                          </td>
                          <td className="border border-border p-3 text-right text-primary">67,076</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Masking handles missing time steps, the LSTM captures sequential dependencies, and
                    the TimeDistributed dense layer classifies each time step. The model contains no
                    frozen layers and no pre-trained components.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-bold text-foreground mb-3">
                    Table 3 &mdash; Comparison of model performance
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Model</th>
                          <th className="border border-border p-3 text-right">Accuracy (%)</th>
                          <th className="border border-border p-3 text-right">Precision</th>
                          <th className="border border-border p-3 text-right">Recall</th>
                          <th className="border border-border p-3 text-right">F1-score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_3.map((r) => (
                          <tr
                            key={r.model}
                            className={
                              r.model === "LSTM" ? "bg-green-50 font-semibold" : "hover:bg-muted"
                            }
                          >
                            <td className="border border-border p-3">{r.model}</td>
                            <td className="border border-border p-3 text-right">{r.acc.toFixed(1)}</td>
                            <td className="border border-border p-3 text-right">
                              {r.precision.toFixed(2)}
                            </td>
                            <td className="border border-border p-3 text-right">
                              {r.recall.toFixed(2)}
                            </td>
                            <td className="border border-border p-3 text-right">{r.f1.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-3">
                    Table 4 &mdash; Training and evaluation metrics
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Model</th>
                          <th className="border border-border p-3 text-right">Training time (s)</th>
                          <th className="border border-border p-3 text-right">Total parameters</th>
                          <th className="border border-border p-3 text-right">Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_4.map((r) => (
                          <tr
                            key={r.model}
                            className={
                              r.model === "LSTM" ? "bg-green-50 font-semibold" : "hover:bg-muted"
                            }
                          >
                            <td className="border border-border p-3">{r.model}</td>
                            <td className="border border-border p-3 text-right">{r.time}</td>
                            <td className="border border-border p-3 text-right">{r.params}</td>
                            <td className="border border-border p-3 text-right">{r.loss.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    LSTM leads on accuracy and on prediction reliability, and has the lowest loss. Its
                    48 s training time is the longest of the four, which the paper accepts in exchange
                    for the superior classification performance.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-foreground mb-3">
                    Table 5 &mdash; Training and validation metrics, epochs 1 and 10
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Epoch</th>
                          <th className="border border-border p-3 text-right">Training loss</th>
                          <th className="border border-border p-3 text-right">Accuracy</th>
                          <th className="border border-border p-3 text-right">Validation loss</th>
                          <th className="border border-border p-3 text-right">
                            Validation accuracy
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_5.map((r) => (
                          <tr key={r.epoch} className="hover:bg-muted">
                            <td className="border border-border p-3 font-mono">{r.epoch}</td>
                            <td className="border border-border p-3 text-right">{r.loss.toFixed(4)}</td>
                            <td className="border border-border p-3 text-right">{r.acc.toFixed(4)}</td>
                            <td className="border border-border p-3 text-right">
                              {r.vloss.toFixed(4)}
                            </td>
                            <td className="border border-border p-3 text-right">{r.vacc.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Training ran for 10 epochs. Validation loss falls below training loss by the final
                    epoch, which the paper reads as the model generalising well rather than memorising.
                    Optimisation covered hyperparameter tuning, architecture adjustment and data
                    augmentation [2, 33].
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ----------------------------------------------------------- Results */}
          <TabsContent value="results" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <BarChart3 className="w-6 h-6" />
                  Results &amp; Discussion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-5xl font-extrabold text-green-600 mb-2">15%</div>
                      <div className="text-sm text-muted-foreground font-semibold">
                        Lower energy consumption
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        On inclined roads, versus a fixed battery configuration [4]
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-5xl font-extrabold text-blue-600 mb-2">~20%</div>
                      <div className="text-sm text-muted-foreground font-semibold">
                        Longer battery life
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        From reduced cell stress during frequent acceleration and deceleration
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="pt-6 text-center">
                      <div className="text-5xl font-extrabold text-purple-600 mb-2">92.5%</div>
                      <div className="text-sm text-muted-foreground font-semibold">
                        LSTM prediction accuracy
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Forecasting the best battery configuration from the road profile
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Prediction on an unseen road profile
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    The unseen seed{" "}
                    <span className="font-mono bg-muted px-2 py-1 rounded">{SEED_UNSEEN}</span>{" "}
                    was entered into the interactive system. Segment 55D &mdash; 55 km of inclined
                    level-3 road &mdash; draws the highest voltage class, while the straight level-1
                    segments 12A and 10A draw the minimum, 4 V.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <caption className="text-left text-sm font-semibold text-foreground mb-2">
                        Table 6 &mdash; Road profile breakdown with voltage prediction
                      </caption>
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">S. No</th>
                          <th className="border border-border p-3 text-left">Segment</th>
                          <th className="border border-border p-3 text-right">km</th>
                          <th className="border border-border p-3 text-left">Road type</th>
                          <th className="border border-border p-3 text-left">Predicted class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TABLE_6.map((r, i) => (
                          <tr key={r.seg} className="hover:bg-muted">
                            <td className="border border-border p-3">{i + 1}</td>
                            <td className="border border-border p-3 font-mono font-semibold">
                              {r.seg}
                            </td>
                            <td className="border border-border p-3 text-right">{r.km}</td>
                            <td className="border border-border p-3">{r.type}</td>
                            <td className="border border-border p-3 font-semibold text-primary">
                              {r.cls}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Voltage classes in the valid-configuration dataset
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {CLASS_DISTRIBUTION.map(({ voltage, pct, color }) => (
                      <Card key={voltage} className="text-center border-2">
                        <CardContent className="pt-6">
                          <div
                            className={`${color} text-white text-2xl font-bold py-3 rounded-lg mb-3`}
                          >
                            {voltage}
                          </div>
                          <div className="text-2xl font-bold text-primary">{pct}%</div>
                          <div className="text-xs text-muted-foreground">of valid configurations</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    8 V is by far the most frequent class and 16 V the rarest. Across the resistor
                    combinations, series topologies appear most often, followed by parallel and then
                    combined series-parallel.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Which resistors dominate each voltage class
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Voltage class</th>
                          <th className="border border-border p-3 text-left">
                            Most frequent resistor
                          </th>
                          <th className="border border-border p-3 text-right">
                            Valid configurations containing it
                          </th>
                          <th className="border border-border p-3 text-left">Generating topology</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DOMINANT_RESISTORS.map((r) => (
                          <tr key={r.cls} className="hover:bg-muted">
                            <td className="border border-border p-3 font-semibold">{r.cls}</td>
                            <td className="border border-border p-3 font-mono">{r.resistor}</td>
                            <td className="border border-border p-3 text-right">{r.count}</td>
                            <td className="border border-border p-3">{r.topology}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    4 V is always produced by a series combination; 6 V arises only from combined
                    series-and-parallel configurations; 8 V, 12 V and 16 V come from parallel
                    combinations.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Discussion</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>
                      Matching power delivery to road conditions suppresses sudden power surges,
                      cutting the stress placed on individual cells during frequent acceleration and
                      braking [4, 13].
                    </li>
                    <li>
                      State of Charge stays balanced across cells, so energy waste falls and the
                      overall condition of the pack is preserved [4].
                    </li>
                    <li>
                      Real-time adaptability is what makes the driving experience seamless; it is the
                      accuracy of the road-condition forecast that makes reconfiguration useful rather
                      than disruptive [14, 17].
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --------------------------------------------------- Implementation */}
          <TabsContent value="implementation" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <Cpu className="w-6 h-6" />
                  This Web Application
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  This application is the interactive companion to the paper. It implements the same
                  4-cell, 12-switch pack, enumerates every switch setting with a graph-based circuit
                  solver, parses road-profile seed strings into patches, and drives a 3D vehicle
                  simulation across the resulting configurations.
                </p>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    Enumeration produced by this application&rsquo;s solver
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          <th className="border border-border p-3 text-left">Voltage</th>
                          <th className="border border-border p-3 text-right">Configurations</th>
                          <th className="border border-border p-3 text-left">Meaning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {APP_ENUMERATION.map((r) => (
                          <tr key={r.v} className="hover:bg-muted">
                            <td className="border border-border p-3 font-semibold">{r.v}</td>
                            <td className="border border-border p-3 text-right font-bold">
                              {r.n.toLocaleString()}
                            </td>
                            <td className="border border-border p-3 text-muted-foreground">{r.d}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-primary/10 font-bold">
                          <td className="border border-border p-3">Total</td>
                          <td className="border border-border p-3 text-right text-primary">4,096</td>
                          <td className="border border-border p-3">
                            1,573 operational configurations once 0 V states are removed
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
                  <h3 className="font-bold text-xl text-amber-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Two differences from the paper, stated plainly
                  </h3>
                  <ul className="list-disc list-inside text-amber-800 space-y-2">
                    <li>
                      <strong>Class distribution.</strong> The paper reports 8 V at 60.7%, 4 V at 24%,
                      12 V at 8.7%, 6 V at 4.0% and 16 V at 2.5% of the valid-configuration dataset.
                      This application&rsquo;s solver yields 4 V 28.9%, 8 V 29.9%, 12 V 26.7% and 16 V
                      14.6% of its 1,573 operational configurations. The two enumerations apply
                      different validity rules and are not interchangeable.
                    </li>
                    <li>
                      <strong>The 6 V class.</strong> The paper includes a v6 class, produced only by
                      combined series-parallel topologies. The solver in this application returns
                      voltages in multiples of the 4 V cell voltage only, so it never emits 6 V.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Where to see each part</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: Battery,
                        title: "Pack Analysis",
                        body: "Enumerates all 4,096 switch settings and groups them by output voltage.",
                      },
                      {
                        icon: GitBranch,
                        title: "Simulation",
                        body: "Solves an individual switch combination and shows the resulting circuit and voltage.",
                      },
                      {
                        icon: Map,
                        title: "Car Simulation",
                        body: "Drives a road profile patch by patch, reconfiguring the pack at each segment.",
                      },
                      {
                        icon: Brain,
                        title: "AI Monitoring",
                        body: "Tracks per-cell activation counts, State of Charge and State of Health across a run.",
                      },
                    ].map(({ icon: Icon, title, body }) => (
                      <div key={title} className="p-4 rounded-lg border border-border bg-card">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Icon className="w-5 h-5 text-primary" />
                          {title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- Conclusion */}
          <TabsContent value="conclusion" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <Target className="w-6 h-6" />
                  Conclusion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground leading-relaxed text-lg">
                  Designing and running an AI-driven adaptable battery system is a substantial step
                  forward for Smart Electric Vehicles [13, 21]. The work shows that such a system can
                  raise energy efficiency and extend battery life by changing the pack configuration in
                  response to real-time road conditions [16, 28]. Integrating AI gives the quick
                  adaptability needed for continuous optimisation of battery management, and a smoother
                  drive [15, 25].
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "A dataset of valid, short-circuit-free configurations for a 4-cell reconfigurable pack, each labelled with its output voltage.",
                    "An LSTM road-profile classifier reaching 92.5% accuracy, ahead of CNN (85.1%), RNN (82.1%) and ANN (78.4%).",
                    "15% lower energy consumption on inclined roads against a fixed configuration.",
                    "Approximately 20% longer battery life through reduced per-cell stress and balanced State of Charge.",
                  ].map((item) => (
                    <div
                      key={item}
                      className="p-4 rounded-lg border border-green-200 bg-green-50 flex gap-3"
                    >
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-900">{item}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-3">Future directions</h3>
                  <p className="text-muted-foreground">
                    The paper positions this work as groundwork: as the automotive sector advances,
                    intelligent flexible battery systems are expected to be central to efficient,
                    environmentally sound transport [11, 34], with smart electric vehicles becoming not
                    merely more efficient but more responsive to changing demands.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------------------------------------------- References */}
          <TabsContent value="references" className="mt-6 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2 text-2xl">
                  <BookOpen className="w-6 h-6" />
                  References ({REFERENCES.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {REFERENCES.map((ref, i) => (
                    <li key={ref} className="flex gap-3 text-sm">
                      <span className="text-primary font-bold font-mono flex-shrink-0 w-8 text-right">
                        [{i + 1}]
                      </span>
                      <span className="text-muted-foreground">{ref}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
