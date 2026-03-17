import type { TenderDetailData } from "../types/types";

export const tenderDetailDataById: Record<string, TenderDetailData> = {
  "2026-001778419": {
    id: "2026-001778419",
    aiSummary:
      "AI assessment suggests a strong strategic fit, but the opportunity carries high execution complexity and significant competitive pressure. The deciding factors are scale, technical capability and price discipline.",
    objectText:
      "Execution of the closure of the quay at Puerto de Granadilla, including 543.31 metres of quay, eleven caissons founded at level -18.00, two submerged concrete closures and pavement enabling works.",
    lastUpdated: "13 Mar 2026",
    publicationStatus: "Published",
    procedureType: "Open procedure",
    contractType: "Works",
    fitScore: 92,
    fitLabel: "Strong fit",
    sourceUrl:
      "https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=XsSr%2BSUWdZczjChw4z%2FXvw%3D%3D",
    headerBadges: [
      { label: "Published", tone: "teal" },
      { label: "Procedure: Open", tone: "neutral" },
      { label: "Contract: Works", tone: "neutral" },
      { label: "AI Insights", tone: "purple" },
    ],
    overviewCards: [
      {
        title: "Contracting authority",
        lines: [
          {
            label: "Entity",
            value: "Port Authority of Santa Cruz de Tenerife",
            tone: "teal",
          },
          { label: "Location", value: "Puerto de Granadilla, Tenerife" },
          { label: "CPV", value: "45244000 · Maritime works" },
        ],
      },
      {
        title: "Commercial snapshot",
        lines: [
          { label: "Estimated value", value: "€39.71M", tone: "strong" },
          { label: "Budget excl. VAT", value: "€36.74M" },
          { label: "Duration", value: "20 months" },
          { label: "Guarantee", value: "3% provisional · 5% definitive guarantee" },
        ],
      },
      {
        title: "Timeline",
        topMeta: "Last updated · 13 Mar 2026",
        lines: [
          { label: "Publication", value: "13 Mar 2026" },
          { label: "Submission deadline", value: "17 Apr 2026", tone: "teal" },
          { label: "Administrative opening", value: "22 Apr 2026" },
          { label: "Technical opening", value: "29 Apr 2026" },
        ],
      },
    ],
    timeline: [
      { label: "Published", value: "13 Mar 2026" },
      { label: "Document availability", value: "Until 17 Apr 2026" },
      {
        label: "Deadline to submit offers",
        value: "17 Apr 2026",
        tone: "highlight",
      },
      { label: "Administrative opening", value: "22 Apr 2026" },
      { label: "Technical opening", value: "29 Apr 2026" },
      { label: "Economic opening", value: "20 May 2026" },
    ],
    signals: [
      { label: "Competitive pressure", value: "High" },
      { label: "Bid effort", value: "High" },
      { label: "Compliance risk", value: "Medium" },
      { label: "Pricing pressure", value: "High" },
    ],
    alerts: [
      {
        id: "granadilla-classification",
        title: "Required contractor classification F1-2 / F2-5 / F4-6",
        status: "notDetected",
        hint: "Heavy maritime works classification is explicitly required.",
        sourceLabel: "Admission criteria",
      },
      {
        id: "granadilla-deuc",
        title: "DEUC completion required",
        status: "missing",
        hint: "Administrative documentation requires the DEUC.",
        sourceLabel: "Required documents",
      },
      {
        id: "granadilla-technical",
        title: "Technical proposal documentation required",
        status: "missing",
        hint: "Technical envelope must include qualitative documentation.",
        sourceLabel: "Tender documents",
      },
    ],
    pricingMetrics: [
      {
        title: "Award model",
        value: "51 / 49",
        subtitle: "Formula criteria vs judgement criteria",
      },
      { title: "Payment model", value: "Monthly certification" },
      {
        title: "Price revision",
        value: "Enabled",
        subtitle: "Formula detailed in the PCAP",
      },
    ],
    buyerMetrics: [
      { title: "Buyer type", value: "State authority" },
      { title: "Sector", value: "Port infrastructure" },
      { title: "Funding", value: "85% FEDER eligible" },
    ],
    guaranteeMetrics: [
      {
        title: "Provisional guarantee",
        value: "3%",
        subtitle: "Required to participate in the tender",
      },
      {
        title: "Definitive guarantee",
        value: "5%",
        subtitle: "Required financial guarantee upon award",
      },
      { title: "Variants", value: "Allowed" },
      { title: "Subcontracting", value: "Allowed" },
    ],
    participants: [
      {
        id: "p1",
        name: "Acciona Construcción S.A.",
        fiscalId: "A81638108",
        participations: 7,
        awards: 3,
        successRate: "42.9%",
        avgDiscount: "8.6%",
        contractsWithBuyer: 2,
      },
      {
        id: "p2",
        name: "Dragados S.A.",
        fiscalId: "A15139314",
        participations: 9,
        awards: 4,
        successRate: "44.4%",
        avgDiscount: "10.2%",
        contractsWithBuyer: 3,
      },
      {
        id: "p3",
        name: "Sacyr Construcción S.A.",
        fiscalId: "A28013811",
        participations: 5,
        awards: 1,
        successRate: "20.0%",
        avgDiscount: "7.9%",
        contractsWithBuyer: 1,
      },
    ],
    requiredDocuments: [
      { id: "rd1", title: "DEUC / self-declaration form" },
      {
        id: "rd2",
        title: "Technical proposal documentation",
        description: "Documentation listed in Annex 2 of the PCAP",
      },
      {
        id: "rd3",
        title: "Economic proposal",
        description: "Proposal drafted according to Annex 3 of the PCAP",
      },
      {
        id: "rd4",
        title: "Formula-based criteria documentation",
        description: "Documentation listed in Annex 4 of the PCAP",
      },
    ],
    admissionCriteria: [
      { id: "ac1", title: "Contractor classification F1-2, F2-5 and F4-6" },
      { id: "ac2", title: "Commitment to assign sufficient technical means" },
      { id: "ac3", title: "Capacity to contract and absence of exclusions" },
      { id: "ac4", title: "Tax and social security compliance" },
    ],
    awardCriteria: [
      {
        id: "aw1",
        title: "Formula-based criteria",
        description: "Criteria evaluated automatically according to the economic formula defined in the PCAP.",
        weight: 51,
        subcriteria: [
          {
            id: "aw1-1",
            title: "Economic offer",
            weight: 45,
          },
          {
            id: "aw1-2",
            title: "Reduction of execution lead time",
            weight: 4,
          },
          {
            id: "aw1-3",
            title: "Extension of guarantee period",
            weight: 2,
          },
        ],
      },
      {
        id: "aw2",
        title: "Judgement-based technical criteria",
        description: "Technical proposal assessed by the evaluation committee based on qualitative subcriteria.",
        weight: 49,
        subcriteria: [
          {
            id: "aw2-1",
            title: "Construction methodology and phasing",
            weight: 20,
          },
          {
            id: "aw2-2",
            title: "Technical team and relevant experience",
            weight: 15,
          },
          {
            id: "aw2-3",
            title: "Environmental and risk management approach",
            weight: 8,
          },
          {
            id: "aw2-4",
            title: "Innovation and value-added improvements",
            weight: 6,
          },
        ],
      },
    ],
    tenderDocuments: [
      { id: "td1", title: "PCAP" },
      { id: "td2", title: "PPTP" },
      { id: "td3", title: "DEUC template" },
      { id: "td4", title: "Annexes 2, 3 and 4" },
    ],
  },

  "2025-001484637": {
    id: "2025-001484637",
    aiSummary:
      "This opportunity looks attractive because the award model is fully price-driven and the lot structure opens selective entry strategies. The main risk is administrative completeness across lots and margin erosion.",
    objectText:
      "Mixed contract for demolitions, earth movement and supply materials required for the execution of PFEA 2025 works, split into eleven lots and open to presentation for one or several lots.",
    lastUpdated: "28 Dec 2025",
    publicationStatus: "Published",
    procedureType: "Open procedure",
    contractType: "Mixed supplies / works support",
    fitScore: 88,
    fitLabel: "Good fit",
    sourceUrl:
      "https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=3MZ%2B0PLYipqExvMJXBMHHQ%3D%3D",
    headerBadges: [
      { label: "Published", tone: "teal" },
      { label: "11 lots", tone: "amber" },
      { label: "Price-only award", tone: "neutral" },
      { label: "AI Insights", tone: "purple" },
    ],
    overviewCards: [
      {
        title: "Contracting authority",
        lines: [
          {
            label: "Entity",
            value: "Montilla City Council",
            tone: "teal",
          },
          { label: "Location", value: "Montilla, Córdoba, Spain" },
          { label: "Primary CPV", value: "44000000 · Construction materials" },
        ],
      },
      {
        title: "Commercial snapshot",
        lines: [
          { label: "Estimated value", value: "€308.5K", tone: "strong" },
          { label: "Total value", value: "€373.3K" },
          { label: "Duration", value: "Until 31 Dec 2026" },
          { label: "Lots", value: "11" },
        ],
      },
      {
        title: "Timeline",
        topMeta: "Last updated · 28 Dec 2025",
        lines: [
          { label: "Publication", value: "28 Dec 2025" },
          { label: "Submission deadline", value: "26 Jan 2026", tone: "teal" },
          { label: "Economic opening", value: "27 Jan 2026" },
          { label: "Delivery model", value: "24h from each order" },
        ],
      },
    ],
    timeline: [
      { label: "Published", value: "28 Dec 2025" },
      {
        label: "Deadline to submit offers",
        value: "26 Jan 2026",
        tone: "highlight",
      },
      { label: "Economic opening", value: "27 Jan 2026" },
    ],
    signals: [
      { label: "Competitive pressure", value: "Medium" },
      { label: "Bid effort", value: "Medium" },
      { label: "Compliance risk", value: "Medium" },
      { label: "Pricing pressure", value: "High" },
    ],
    alerts: [
      {
        id: "montilla-foreign",
        title: "Foreign company declaration",
        status: "missing",
        hint: "Optional unless the bidder is foreign.",
        sourceLabel: "Required documents",
      },
      {
        id: "montilla-solvency",
        title: "External solvency declaration",
        status: "notDetected",
        hint: "Needed only if solvency is integrated with third parties.",
        sourceLabel: "Required documents",
      },
      {
        id: "montilla-turnover",
        title: "Annual turnover requirement",
        status: "notMet",
        hint: "At least 1.5x the annual average value of each lot.",
        sourceLabel: "Admission criteria",
      },
    ],
    pricingMetrics: [
      {
        title: "Award model",
        value: "100% price",
        subtitle: "Single criterion based on best price",
      },
      { title: "Lot strategy", value: "Up to 11 lots" },
      {
        title: "Delivery timing",
        value: "24h max",
        subtitle: "From each order",
      },
    ],
    buyerMetrics: [
      { title: "Buyer type", value: "Local authority" },
      { title: "Programme", value: "PFEA 2025" },
      { title: "Presentation", value: "Electronic only" },
    ],
    guaranteeMetrics: [
      { title: "Definitive guarantee", value: "Not highlighted" },
      { title: "Price revision", value: "Not allowed" },
      { title: "Tender validity", value: "1 year" },
    ],
    participants: [
      {
        id: "m1",
        name: "Materiales Córdoba S.L.",
        fiscalId: "B14567231",
        participations: 4,
        awards: 2,
        successRate: "50.0%",
        avgDiscount: "12.4%",
        contractsWithBuyer: 3,
      },
      {
        id: "m2",
        name: "Suministros del Sur S.A.",
        fiscalId: "A28900451",
        participations: 5,
        awards: 1,
        successRate: "20.0%",
        avgDiscount: "9.1%",
        contractsWithBuyer: 1,
      },
      {
        id: "m3",
        name: "Áridos y Hormigones Sierra Norte",
        fiscalId: "B93004451",
        participations: 3,
        awards: 1,
        successRate: "33.3%",
        avgDiscount: "11.8%",
        contractsWithBuyer: 2,
      },
    ],
    lots: [
      {
        id: "1",
        title: "Lot 1 · Demolitions and earth movement",
        description: "Demolitions and earth movement.",
        value: "€54.2K",
        cpv: "45520000",
      },
      {
        id: "4",
        title: "Lot 4 · Steel",
        description: "Steel for works execution.",
        value: "€10.3K",
        cpv: "44000000",
      },
      {
        id: "10",
        title: "Lot 10 · Plumbing material",
        description: "Plumbing material required for PFEA 2025 works.",
        value: "€148.58",
        cpv: "44115210",
      },
      {
        id: "11",
        title: "Lot 11 · Asphalt mix",
        description: "Asphalt mix for PFEA 2025 works.",
        value: "€4.07K",
        cpv: "44000000",
      },
    ],
    requiredDocuments: [
      {
        id: "rd1",
        title: "Administrative self-declaration",
        description: "Envelope 1",
      },
      {
        id: "rd2",
        title: "Economic offer PDF",
        description: "Annex depends on the lot",
      },
      { id: "rd3", title: "Editable annex template" },
      {
        id: "rd4",
        title: "Foreign company declaration",
        optional: true,
      },
      {
        id: "rd5",
        title: "External solvency declaration",
        optional: true,
      },
    ],
    admissionCriteria: [
      {
        id: "ac1",
        title: "Annual turnover",
        description: "At least 1.5x the annual average value of the lot",
      },
      {
        id: "ac2",
        title: "Similar supplies / works references",
        description: "Annual accumulated amount >= 70% of the lot value",
      },
      { id: "ac3", title: "Capacity to contract" },
      { id: "ac4", title: "No exclusions / no incompatibilities" },
      { id: "ac5", title: "Tax and social security compliance" },
    ],
    awardCriteria: [
      {
        id: "aw1",
        title: "Best economic offer",
        description: "100 points",
      },
    ],
    tenderDocuments: [
      { id: "td1", title: "PCAP" },
      { id: "td2", title: "PPTP" },
      { id: "td3", title: "Lot annex templates" },
    ],
  },

  "2022-808905": {
    id: "2022-808905",
    aiSummary:
      "Compact opportunity with medium complexity. Attractive if your catalogue covers kiosk hardware and the technical demo can be prepared quickly.",
    objectText:
      "Supply contract for three citizen self-service kiosks under a rental model with purchase option, including technical memory, demo validation and mixed award criteria.",
    lastUpdated: "31 May 2022",
    publicationStatus: "Published",
    procedureType: "Open procedure",
    contractType: "Supply / rental with purchase option",
    fitScore: 84,
    fitLabel: "Good fit",
    sourceUrl:
      "https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=knhbGX%2FF%2F63nSoTX3z%2F7wA%3D%3D",
    headerBadges: [
      { label: "Published", tone: "teal" },
      { label: "4-year duration", tone: "neutral" },
      { label: "AI Insights", tone: "purple" },
    ],
    overviewCards: [
      {
        title: "Contracting authority",
        lines: [
          { label: "Entity", value: "Algemesí City Council", tone: "teal" },
          { label: "Location", value: "Algemesí, Valencia, Spain" },
          { label: "Primary CPV", value: "48810000 · Information systems" },
        ],
      },
      {
        title: "Commercial snapshot",
        lines: [
          { label: "Estimated value", value: "€60K", tone: "strong" },
          { label: "Total value", value: "€72.6K" },
          { label: "Duration", value: "4 years" },
          { label: "Model", value: "Rental with purchase option" },
        ],
      },
      {
        title: "Timeline",
        topMeta: "Last updated · 31 May 2022",
        lines: [
          { label: "Publication", value: "31 May 2022" },
          { label: "Submission deadline", value: "15 Jun 2022", tone: "teal" },
          { label: "Technical opening", value: "16 Jun 2022" },
          { label: "Economic opening", value: "27 Jun 2022" },
        ],
      },
    ],
    timeline: [
      { label: "Published", value: "31 May 2022" },
      {
        label: "Deadline to submit offers",
        value: "15 Jun 2022",
        tone: "highlight",
      },
      { label: "Technical opening", value: "16 Jun 2022" },
      { label: "Economic opening", value: "27 Jun 2022" },
    ],
    signals: [
      { label: "Competitive pressure", value: "Medium" },
      { label: "Bid effort", value: "Low" },
      { label: "Compliance risk", value: "Low" },
      { label: "Pricing pressure", value: "Medium" },
    ],
    alerts: [
      {
        id: "algemesi-memory",
        title: "Technical memory required",
        status: "missing",
        hint: "The technical memory must demonstrate compliance and support the demo.",
        sourceLabel: "Required documents",
      },
      {
        id: "algemesi-rolece",
        title: "ROLECE preregistration declaration",
        status: "notDetected",
        hint: "The file mentions preregistration and no changes in registered data.",
        sourceLabel: "Admission criteria",
      },
    ],
    pricingMetrics: [
      { title: "Award split", value: "50 / 25 / 25" },
      { title: "Contract model", value: "Rental + purchase option" },
      { title: "Duration", value: "4 years" },
    ],
    buyerMetrics: [
      { title: "Buyer type", value: "Local authority" },
      { title: "Use case", value: "Citizen self-service kiosks" },
      { title: "Region", value: "Valencia" },
    ],
    guaranteeMetrics: [
      { title: "Definitive guarantee", value: "5%" },
      { title: "Technical demo", value: "Required" },
      { title: "Submission", value: "Electronic only" },
    ],
    participants: [
      {
        id: "a1",
        name: "Smart Kiosk Iberia S.L.",
        fiscalId: "B78451239",
        participations: 3,
        awards: 1,
        successRate: "33.3%",
        avgDiscount: "6.5%",
        contractsWithBuyer: 0,
      },
      {
        id: "a2",
        name: "Citizen Automation Systems S.A.",
        fiscalId: "A43098761",
        participations: 4,
        awards: 2,
        successRate: "50.0%",
        avgDiscount: "8.1%",
        contractsWithBuyer: 1,
      },
    ],
    requiredDocuments: [
      { id: "rd1", title: "DEUC" },
      { id: "rd2", title: "Technical memory" },
      { id: "rd3", title: "Economic proposal" },
    ],
    admissionCriteria: [
      { id: "ac1", title: "Capacity to contract" },
      { id: "ac2", title: "Tax and social security compliance" },
      { id: "ac3", title: "ROLECE preregistration declaration" },
    ],
    awardCriteria: [
      { id: "aw1", title: "Economic offer", description: "50 points" },
      { id: "aw2", title: "Purchase option", description: "25 points" },
      { id: "aw3", title: "Judgement criteria", description: "25 points" },
    ],
    tenderDocuments: [
      { id: "td1", title: "PCAP" },
      { id: "td2", title: "Technical specifications" },
      { id: "td3", title: "Economic model template" },
    ],
  },

  "2026-001786387": {
    id: "2026-001786387",
    aiSummary:
      "Fast, document-heavy minor contract. The main decision hinges on whether you hold the required RITE installer qualification and can package the PRTR documentation quickly.",
    objectText:
      "Minor contract for the supply and installation of climate control for the immersive space in the Yacimiento de La Clínica building, under the Calahorra Enogastronómica tourism sustainability programme financed through PRTR / NextGenerationEU.",
    lastUpdated: "13 Mar 2026",
    publicationStatus: "Published",
    procedureType: "Minor contract",
    contractType: "Supply and installation",
    fitScore: 79,
    fitLabel: "Selective fit",
    sourceUrl:
      "https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=9ogJtZfRfbn10HRJw8TEnQ%3D%3D",
    headerBadges: [
      { label: "Published", tone: "teal" },
      { label: "Minor contract", tone: "amber" },
      { label: "PRTR / NextGenerationEU", tone: "purple" },
    ],
    overviewCards: [
      {
        title: "Contracting authority",
        lines: [
          { label: "Entity", value: "Calahorra City Council", tone: "teal" },
          { label: "Location", value: "Calahorra, La Rioja, Spain" },
          { label: "Primary CPV", value: "42512300 · Air-conditioning units" },
        ],
      },
      {
        title: "Commercial snapshot",
        lines: [
          { label: "Estimated value", value: "€4.818", tone: "strong" },
          { label: "Total value", value: "€5.829,78" },
          { label: "Duration", value: "1 month" },
          { label: "Funding", value: "PRTR / NextGenerationEU" },
        ],
      },
      {
        title: "Timeline",
        topMeta: "Last updated · 13 Mar 2026",
        lines: [
          { label: "Publication", value: "13 Mar 2026" },
          { label: "Submission deadline", value: "20 Mar 2026", tone: "teal" },
          { label: "Opening", value: "23 Mar 2026" },
          { label: "Execution site", value: "Yacimiento de La Clínica" },
        ],
      },
    ],
    timeline: [
      { label: "Published", value: "13 Mar 2026" },
      {
        label: "Deadline to submit offers",
        value: "20 Mar 2026",
        tone: "highlight",
      },
      { label: "Opening", value: "23 Mar 2026" },
    ],
    signals: [
      { label: "Competitive pressure", value: "Medium" },
      { label: "Bid effort", value: "Medium" },
      { label: "Compliance risk", value: "Medium" },
      { label: "Pricing pressure", value: "High" },
    ],
    alerts: [
      {
        id: "calahorra-rite",
        title: "RITE installer qualification required",
        status: "notDetected",
        hint: "The file requires proof that the company is an authorised thermal installer.",
        sourceLabel: "Required documents",
      },
      {
        id: "calahorra-daci",
        title: "DACI PRTR annex required",
        status: "missing",
        hint: "PRTR-specific annex is mandatory.",
        sourceLabel: "Required documents",
      },
      {
        id: "calahorra-tax",
        title: "Tax and social security certificates required",
        status: "missing",
        hint: "Both certificates appear as mandatory documentation.",
        sourceLabel: "Required documents",
      },
    ],
    pricingMetrics: [
      {
        title: "Award model",
        value: "100% price",
        subtitle: "Single automatic criterion",
      },
      { title: "Estimated value", value: "€4.818" },
      { title: "Total value", value: "€5.829,78" },
    ],
    buyerMetrics: [
      { title: "Buyer type", value: "Local authority" },
      { title: "Programme", value: "Calahorra Enogastronómica" },
      { title: "Funding", value: "PRTR / NextGenerationEU" },
    ],
    guaranteeMetrics: [
      { title: "Execution period", value: "1 month" },
      { title: "Submission", value: "Electronic only" },
      { title: "Location", value: "Yacimiento de La Clínica" },
    ],
    participants: [
      {
        id: "c1",
        name: "Rioja Climatización S.L.",
        fiscalId: "B26400111",
        participations: 6,
        awards: 2,
        successRate: "33.3%",
        avgDiscount: "9.4%",
        contractsWithBuyer: 1,
      },
      {
        id: "c2",
        name: "Instalaciones Térmicas del Ebro S.A.",
        fiscalId: "A26077451",
        participations: 5,
        awards: 2,
        successRate: "40.0%",
        avgDiscount: "7.8%",
        contractsWithBuyer: 0,
      },
    ],
    requiredDocuments: [
      { id: "rd1", title: "PRTR annexes" },
      { id: "rd2", title: "Social security certificate" },
      { id: "rd3", title: "Tax agency certificate" },
      { id: "rd4", title: "Economic offer" },
      { id: "rd5", title: "RITE installer qualification" },
      { id: "rd6", title: "DACI PRTR" },
    ],
    admissionCriteria: [
      { id: "ac1", title: "Capacity to contract" },
      { id: "ac2", title: "Tax compliance" },
      { id: "ac3", title: "Social security compliance" },
      { id: "ac4", title: "Authorised thermal installer qualification" },
    ],
    awardCriteria: [
      { id: "aw1", title: "Price", description: "100 points" },
    ],
    tenderDocuments: [
      { id: "td1", title: "PPT / technical specifications" },
      { id: "td2", title: "Economic offer template" },
      { id: "td3", title: "PRTR annex template" },
      { id: "td4", title: "DACI PRTR template" },
    ],
  },

  "2026-LOWFIT-001": {
    id: "2026-LOWFIT-001",
    aiSummary:
      "AI assessment indicates a weak strategic fit. The contract size is very small versus the typical portfolio and the category has limited overlap with the core activity profile. It may still be relevant for local presence or tactical pipeline coverage, but it is not a priority pursuit.",
    objectText:
      "Framework supply contract for basic office stationery, including paper, folders, envelopes and consumables, for municipal departments with price as the only award criterion.",
    lastUpdated: "16 Mar 2026",
    publicationStatus: "Published",
    procedureType: "Open procedure",
    contractType: "Supplies",
    fitScore: 34,
    fitLabel: "Low fit",
    sourceUrl: "",
    headerBadges: [
      { label: "Published", tone: "teal" },
      { label: "Price-only award", tone: "neutral" },
      { label: "Low fit", tone: "amber" },
      { label: "AI Insights", tone: "purple" },
    ],
    overviewCards: [
      {
        title: "Contracting authority",
        lines: [
          {
            label: "Entity",
            value: "Small Municipality of Villacampo",
            tone: "teal",
          },
          { label: "Location", value: "Zamora, Spain" },
          { label: "Primary CPV", value: "30192000 · Office supplies" },
        ],
      },
      {
        title: "Commercial snapshot",
        lines: [
          { label: "Estimated value", value: "€22K", tone: "strong" },
          { label: "Total value", value: "€26.6K" },
          { label: "Duration", value: "12 months" },
          { label: "Award model", value: "Price only" },
        ],
      },
      {
        title: "Timeline",
        topMeta: "Last updated · 16 Mar 2026",
        lines: [
          { label: "Publication", value: "16 Mar 2026" },
          { label: "Submission deadline", value: "03 May 2026", tone: "teal" },
          { label: "Status", value: "Open" },
        ],
      },
    ],
    timeline: [
      { label: "Published", value: "16 Mar 2026" },
      {
        label: "Deadline to submit offers",
        value: "03 May 2026",
        tone: "highlight",
      },
      { label: "Expected award", value: "May 2026" },
      { label: "Execution period", value: "12 months" },
    ],
    signals: [
      { label: "Competitive pressure", value: "Medium" },
      { label: "Bid effort", value: "Low" },
      { label: "Compliance risk", value: "Low" },
      { label: "Pricing pressure", value: "High" },
    ],
    alerts: [
      {
        id: "villacampo-admin",
        title: "Administrative declaration required",
        status: "missing",
        hint: "A signed administrative declaration is required in the offer.",
        sourceLabel: "Required documents",
      },
      {
        id: "villacampo-economic",
        title: "Economic offer template required",
        status: "missing",
        hint: "The contracting authority requires the official economic offer template.",
        sourceLabel: "Required documents",
      },
      {
        id: "villacampo-price",
        title: "Price-only award increases discount pressure",
        status: "notDetected",
        hint: "Pure price competition may reduce margins and strategic attractiveness.",
        sourceLabel: "Award criteria",
      },
    ],
    pricingMetrics: [
      {
        title: "Base price",
        value: "0 €",
      },
      {
        title: "Ideal discount",
        value: "11,5%",
      },
      {
        title: "Offer price",
        value: "0 €",
      },
    ],
    buyerMetrics: [
      { title: "Buyer type", value: "Local authority" },
      { title: "Contract value", value: "Low value" },
      { title: "Award model", value: "Price only" },
    ],
    guaranteeMetrics: [
      { title: "Execution period", value: "12 months" },
      { title: "Submission", value: "Electronic only" },
      { title: "Location", value: "Villacampo, Zamora" },
    ],
    participants: [
      {
        id: "c1",
        name: "Papelería Sayago S.L.",
        fiscalId: "B49200111",
        participations: 9,
        awards: 4,
        successRate: "44.4%",
        avgDiscount: "11.2%",
        contractsWithBuyer: 3,
      },
      {
        id: "c2",
        name: "Suministros Duero Office S.A.",
        fiscalId: "A49077451",
        participations: 6,
        awards: 2,
        successRate: "33.3%",
        avgDiscount: "9.1%",
        contractsWithBuyer: 1,
      },
    ],
    requiredDocuments: [
      { id: "rd1", title: "Administrative declaration" },
      { id: "rd2", title: "Economic offer template" },
      { id: "rd3", title: "Tax compliance certificate" },
      { id: "rd4", title: "Social security certificate" },
    ],
    admissionCriteria: [
      { id: "ac1", title: "Capacity to contract" },
      { id: "ac2", title: "Tax compliance" },
      { id: "ac3", title: "Social security compliance" },
    ],
    awardCriteria: [
      { id: "aw1", title: "Price", description: "100 points" },
    ],
    tenderDocuments: [
      { id: "td1", title: "PCAP / administrative specifications" },
      { id: "td2", title: "PPT / technical specifications" },
      { id: "td3", title: "Economic offer template" },
    ],
  },

};

export function getTenderDetailData(id: string): TenderDetailData | null {
  return tenderDetailDataById[id] ?? null;
}
