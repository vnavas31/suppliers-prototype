import importlib.util
import pathlib
import sys
import tempfile
import unittest


PIPELINE_PATH = pathlib.Path(__file__).resolve().parents[1] / "placsp_pipeline.py"
SPEC = importlib.util.spec_from_file_location("placsp_pipeline", PIPELINE_PATH)
pipeline = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
sys.modules[SPEC.name] = pipeline
SPEC.loader.exec_module(pipeline)


class SemanticRegressionTests(unittest.TestCase):
    def test_sample_rows_are_not_created_when_source_says_no(self):
        self.assertEqual(pipeline.sample_requirement_status("21. PRESENTACIÓN DE OFERTAS: Entrega de muestras: NO"), "not_required")
        self.assertEqual(pipeline.sample_requirement_status("9.1. MUESTRAS X No se exigen"), "not_required")

    def test_sample_rows_require_explicit_positive_source(self):
        self.assertEqual(pipeline.sample_requirement_status("Entrega de muestras: SÍ. Lugar de presentación: registro municipal."), "required")
        self.assertEqual(pipeline.sample_requirement_status("Se exigen muestras en las condiciones indicadas en el PPT."), "required")

    def test_deuc_appendix_instructions_are_not_treated_as_bid_checklist(self):
        text = (
            "ANEXO I INSTRUCCIONES PARA LA CUMPLIMENTACIÓN DEL DOCUMENTO EUROPEO ÚNICO DE "
            "CONTRATACIÓN (DEUC). Parte I: Información sobre el procedimiento. "
            "Cuando varios empresarios concurran en UTE, deberá presentarse un DEUC independiente."
        )
        self.assertTrue(pipeline.is_deuc_instruction_only(text))

    def test_operational_deuc_submission_page_is_not_filtered(self):
        text = (
            "Sobre electrónico A: Documentación General. Deberá acompañarse una declaración responsable "
            "ajustada al formulario de documento europeo único de contratación (DEUC)."
        )
        self.assertFalse(pipeline.is_deuc_instruction_only(text))

    def test_prohibition_evidence_terms_prefer_operational_terms_over_declaration(self):
        terms = pipeline.evidence_terms_for_reason("Absence of prohibition to contract declaration.")
        self.assertIn("prohibición", terms)
        self.assertNotIn("declaración responsable", terms)

    def test_price_weight_uses_price_subtype_not_previous_zero_ponderation(self):
        text = (
            "Mejora recogida de vertederos incontrolados : Otros Subtipo Criterio : 15 "
            "Ponderación : 0 Cantidad Mínima : 15 Cantidad Máxima "
            "Oferta económica : Precio Subtipo Criterio : 85 Ponderación : Euros "
            "Expresión de evaluación : 0 Cantidad Mínima : 85 Cantidad Máxima"
        )
        self.assertEqual(pipeline.extract_price_weight(text), "85")

    def test_price_weight_ignores_total_quality_price_and_uses_specific_price_points(self):
        text = (
            "La adjudicación se realizará mediante mejor relación calidad-precio. "
            "La puntuación máxima total será de 100 puntos. "
            "1. Oferta económica: hasta 85 puntos. "
            "2. Mejora: recogida de vertederos incontrolados: hasta 15 puntos."
        )
        self.assertEqual(pipeline.extract_price_weight(text), "85")

    def test_price_weight_never_returns_zero_as_score(self):
        self.assertIsNone(pipeline.extract_price_weight("Precio : Precio Subtipo Criterio : 0 Ponderación : 0"))

    def test_award_rows_preserve_price_and_improvement_split(self):
        doc = pipeline.DownloadedDoc(
            role="pcap",
            title="PCAP",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "pcap.pdf",
            sha1="pcap-award-split",
            page_count=32,
        )
        rows = []
        pipeline.append_award_rows_from_text(
            rows,
            doc,
            13,
            (
                "Puntuación total. Oferta económica: 85 puntos. "
                "Mejora: recogida de vertederos incontrolados: hasta 15 puntos. TOTAL: 100 puntos."
            ),
        )
        self.assertEqual([(row["item"], row["weight"]) for row in rows], [
            ("Economic offer / price criterion.", "85"),
            ("Improvement: annual collection of uncontrolled dumping-site waste.", "15"),
        ])

    def test_summary_compaction_does_not_cut_mid_word(self):
        text = (
            "Contratación del servicio de gestión del ecoparque municipal y la recogida y transporte de "
            "residuos voluminosos en el término municipal de Moratalla, comprendiendo la gestión integral."
        )
        summary = pipeline.compact_summary_text(text, max_chars=120)
        self.assertLessEqual(len(summary), 121)
        self.assertTrue(summary.endswith("."))
        self.assertNotRegex(summary, r"\b[a-zA-ZÀ-ÿ]{1}$")

    def test_award_criteria_score_rejects_special_execution_boilerplate(self):
        text = (
            "PROTOCOL per a la incorporació i verificació del compliment de la CONDICIÓ ESPECIAL "
            "D’EXECUCIÓ igualtat d’oportunitats i no-discriminació LGTBI en els contractes públics."
        )
        self.assertLess(pipeline.award_criteria_score(text), 4)

    def test_award_criteria_score_accepts_price_scoring_block(self):
        text = "Criterios de adjudicación. Oferta económica: Precio Subtipo Criterio: 85 Ponderación: Euros."
        self.assertGreaterEqual(pipeline.award_criteria_score(text), 4)

    def test_scope_snippet_trims_table_of_contents_leader(self):
        text = (
            "Clàusula 28. Recursos ....................................... 34 "
            "Clàusula 1. Objecte i règim jurídic del contracte L’objecte del contracte són les obres de restauració."
        )
        snippet = pipeline.snippet_for_terms(text, ["objecte del contracte"], radius=80)
        self.assertNotIn("................................", snippet)

    def test_structured_lots_can_anchor_to_first_available_pdf(self):
        doc_without_pages = pipeline.DownloadedDoc(
            role="ppt",
            title="Empty PPT",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "empty.pdf",
            sha1="empty",
        )
        doc_with_pages = pipeline.DownloadedDoc(
            role="pdf",
            title="Recovered notice",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "notice.pdf",
            sha1="notice",
        )
        selected = pipeline.first_doc_with_pages(
            [doc_without_pages, doc_with_pages],
            {"notice": [{"page": 1, "text": "Objeto del contrato"}]},
            ["ppt", "contract_notice"],
        )
        self.assertIs(selected, doc_with_pages)

    def test_missing_page_does_not_emit_fake_evidence_chip(self):
        doc = pipeline.DownloadedDoc(
            role="pcap",
            title="PCAP",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "pcap.pdf",
            sha1="pcap",
        )
        self.assertEqual(pipeline.verified_evidence(doc, None, "Provisional guarantee"), [])

    def test_first_substantive_page_skips_numeric_ocr_noise(self):
        doc = pipeline.DownloadedDoc(
            role="ppt",
            title="PPT",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "ppt.pdf",
            sha1="ppt",
        )
        selected_doc, selected_page, text = pipeline.first_substantive_page(
            [doc],
            {
                "ppt": [
                    {"page": 1, "text": "1"},
                    {"page": 2, "text": "PPT P10035777 Definición y ejecución de pruebas dinámicas de las unidades ferroviarias"},
                ]
            },
            ["ppt"],
        )
        self.assertIs(selected_doc, doc)
        self.assertEqual(selected_page, 2)
        self.assertIn("pruebas dinámicas", text)

    def test_detailed_scope_prefers_technical_ppt_and_strips_csv_boilerplate(self):
        pcap = pipeline.DownloadedDoc(
            role="pcap",
            title="PCAP",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "pcap.pdf",
            sha1="pcap-scope-boilerplate",
            page_count=32,
        )
        ppt = pipeline.DownloadedDoc(
            role="ppt",
            title="PPT",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "ppt.pdf",
            sha1="ppt-scope-operational",
            page_count=12,
        )
        scope = pipeline.extract_lots(
            {
                "contract_type": "Servicios",
                "description": "Gestión del ecoparque y recogida y transporte de residuos voluminosos.",
                "cpvs": ["90500000"],
            },
            [pcap, ppt],
            {
                "pcap-scope-boilerplate": [{"page": 5, "text": "Objeto del contrato. Texto administrativo general."}],
                "ppt-scope-operational": [{
                    "page": 2,
                    "text": (
                        "El código de verificación (CSV) permite la verficación de la integridad de una copia. "
                        "1.- OBJETO El presente Pliego de Prescripciones Técnicas tiene por objeto establecer "
                        "el régimen de condiciones técnicas que han de regir la prestación del servicio de "
                        "explotación integral del ecoparque municipal. Dicha gestión comprende la recepción, "
                        "clasificación y almacenamiento temporal de residuos urbanos, así como su posterior "
                        "transporte y entrega en centros autorizados. Asimismo, la prestación incluye el servicio "
                        "de recogida y gestión de residuos voluminosos y enseres."
                    ),
                }],
            },
        )
        self.assertEqual(scope["evidence"][0]["doc_role"], "ppt")
        rendered_items = " ".join(item["item"] for item in scope["items"])
        self.assertIn("Operate the municipal ecoparque", rendered_items)
        self.assertNotIn("código de verificación", rendered_items.lower())

    def test_detailed_scope_prefers_object_heading_over_later_operational_page(self):
        ppt = pipeline.DownloadedDoc(
            role="ppt",
            title="PPT",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "ppt.pdf",
            sha1="ppt-gym-scope",
            page_count=7,
        )
        scope = pipeline.extract_lots(
            {
                "contract_type": "Suministros",
                "description": "Suministro e instalación del equipamiento del gimnasio municipal.",
                "cpvs": ["37440000"],
            },
            [ppt],
            {
                "ppt-gym-scope": [
                    {
                        "page": 2,
                        "text": (
                            "1.- OBJETO El objeto del presente Pliego es el suministro, instalación, puesta en marcha "
                            "y mantenimiento del equipamiento necesario para el gimnasio municipal. El suministro "
                            "incluirá máquinas de musculación y cardiovasculares, material de peso libre y asistencia técnica."
                        ),
                    },
                    {
                        "page": 3,
                        "text": (
                            "Ayuntamiento de Arcos de Jalón caso, se exigirá al adjudicatario del equipamiento la limpieza "
                            "del local. Se aportará manual de operación y mantenimiento. Efectuado todo lo anterior se "
                            "realizará la recepción de la totalidad del objeto del contrato."
                        ),
                    },
                ],
            },
        )
        self.assertEqual(scope["evidence"][0]["page"], 2)
        rendered_items = " ".join(item["item"] for item in scope["items"])
        self.assertIn("Supply, transport, install and commission", rendered_items)
        self.assertNotIn("Ayuntamiento de Arcos", rendered_items)

    def test_detailed_scope_skips_table_of_contents_scope_page(self):
        ppt = pipeline.DownloadedDoc(
            role="ppt",
            title="PPT",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "ppt.pdf",
            sha1="ppt-works-index",
            page_count=20,
        )
        scope = pipeline.extract_lots(
            {
                "contract_type": "Obras",
                "description": "Obras de demolición, reforma, conservación y rehabilitación de inmuebles.",
                "cpvs": ["45200000"],
            },
            [ppt],
            {
                "ppt-works-index": [
                    {
                        "page": 2,
                        "text": "Artículo 1. OBJETO. ..................................... 6 Artículo 2. ÁMBITO DE ACTUACIÓN ........ 6 Artículo 3. ALCANCE DE LAS OBRAS ........ 13",
                    },
                    {
                        "page": 6,
                        "text": (
                            "Artículo 1. OBJETO. El presente Pliego de Prescripciones Técnicas tiene por objeto fijar "
                            "las condiciones para obras de reparación, rehabilitación, conservación y mantenimiento "
                            "de inmuebles y viviendas, incluyendo reposiciones, mejoras y sustituciones necesarias."
                        ),
                    },
                    {
                        "page": 23,
                        "text": (
                            "Cualquier desperfecto causado por el contratista en la estructura, terminaciones o "
                            "instalaciones de los edificios objeto del contrato durante la prestación del servicio "
                            "deberá ser subsanado, con mantenimiento, conservación, limpieza y transporte de materiales."
                        ),
                    },
                ],
            },
        )
        self.assertEqual(scope["evidence"][0]["page"], 6)
        rendered_items = " ".join(item["item"] for item in scope["items"])
        self.assertIn("demolition, repair, reform", rendered_items)
        self.assertNotIn("................................", rendered_items)

    def test_placeholder_lot_zero_does_not_create_fake_scope_lot(self):
        mj = pipeline.DownloadedDoc(
            role="justification",
            title="MJ",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "mj.pdf",
            sha1="mj-insurance",
            page_count=3,
        )
        scope = pipeline.extract_lots(
            {
                "contract_type": "Servicios",
                "description": "Contractació de les pòlisses obligatòries d’accidents en activitats fisicoesportives en medi natural.",
                "cpvs": ["66510000"],
                "lots": [{"id": "0", "title": "Lot 0", "description": "", "cpvs": []}],
            },
            [mj],
            {
                "mj-insurance": [{
                    "page": 1,
                    "text": "Contractació de les pòlisses obligatòries d’accidents en activitats fisicoesportives en medi natural per cobrir les conseqüències d’accidents de clients.",
                }],
            },
        )
        self.assertEqual(scope["lots"], [])
        rendered_items = " ".join(item["item"] for item in scope["items"])
        self.assertIn("accident insurance policies", rendered_items)
        self.assertNotIn("Lot 0", rendered_items)

    def test_insurance_lots_do_not_use_hardcoded_btk_scope(self):
        mj = pipeline.DownloadedDoc(
            role="justification",
            title="MJ",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "mj.pdf",
            sha1="mj-insurance-lots",
            page_count=8,
        )
        scope = pipeline.extract_lots(
            {
                "contract_type": "Servicios",
                "description": "Contractació de les pòlisses obligatòries d’accidents en activitats fisicoesportives en medi natural.",
                "cpvs": ["66510000"],
                "lots": [{"id": "0", "title": "Lot 0", "description": "", "cpvs": []}],
            },
            [mj],
            {
                "mj-insurance-lots": [{
                    "page": 8,
                    "text": (
                        "8.- Divisió en lots Aquesta licitació es composa dels següents lots: "
                        "Lot 1: Pòlissa d’Assegurança d’Accidents en activitats fisicoesportives en el medi natural "
                        "de les activitats de bicicleta de muntanya. "
                        "Lot 2: Pòlissa d’Assegurança d’Accidents en activitats fisicoesportives en el medi natural "
                        "de la resta d’activitats."
                    ),
                }],
            },
        )
        self.assertEqual(scope["count"], 2)
        rendered = " ".join([lot["title"] + " " + lot["description"] for lot in scope["lots"]])
        self.assertIn("Accident insurance", rendered)
        self.assertNotIn("Btk", rendered)
        self.assertNotIn("phytosanitary", rendered)

    def test_scope_evidence_prefers_pcap_ppt_mj_over_contract_notice(self):
        notice = pipeline.DownloadedDoc(
            role="contract_notice",
            title="Contract Notice",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "notice.pdf",
            sha1="notice-scope",
            page_count=4,
        )
        pcap = pipeline.DownloadedDoc(
            role="pcap",
            title="PCAP",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "pcap.pdf",
            sha1="pcap-scope",
            page_count=20,
        )
        selected_doc, selected_page, _text = pipeline.first_doc_page_containing(
            [notice, pcap],
            {
                "notice-scope": [{"page": 1, "text": "Objeto del contrato con resumen estructurado."}],
                "pcap-scope": [{"page": 7, "text": "Objeto del contrato definido en el Pliego de Cláusulas Administrativas Particulares."}],
            },
            ["objeto del contrato"],
            preferred_roles=pipeline.SCOPE_EVIDENCE_PREFERRED_ROLES,
        )
        self.assertIs(selected_doc, pcap)
        self.assertEqual(selected_page, 7)

    def test_required_documents_do_not_fall_back_to_notice_when_pcap_has_evidence(self):
        notice = pipeline.DownloadedDoc(
            role="contract_notice",
            title="Contract Notice",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "notice.pdf",
            sha1="notice-req",
            page_count=4,
        )
        pcap = pipeline.DownloadedDoc(
            role="pcap",
            title="PCAP",
            url="",
            path=pathlib.Path(tempfile.gettempdir()) / "pcap.pdf",
            sha1="pcap-req",
            page_count=30,
        )
        requirements = pipeline.extract_generic_requirements_and_criteria(
            [notice, pcap],
            {
                "notice-req": [{"page": 3, "text": "Condiciones de admisión: capacidad de obrar y solvencia."}],
                "pcap-req": [{
                    "page": 12,
                    "text": (
                        "Sobre A documentación administrativa. Se incluirá el DEUC. "
                        "Criterios de adjudicación. Oferta económica precio ponderación 100 puntos."
                    ),
                }],
            },
        )
        collected = []

        def collect(value):
            if isinstance(value, list):
                for item in value:
                    collect(item)
            elif isinstance(value, dict):
                if value.get("doc_role") or value.get("doc_title") or value.get("page"):
                    collected.append(value)
                for item in value.values():
                    collect(item)

        collect(requirements)
        evidence_roles = [evidence.get("doc_role") for evidence in collected if evidence.get("doc_role")]
        self.assertTrue(evidence_roles)
        self.assertNotIn("contract_notice", evidence_roles)
        self.assertTrue(all(role == "pcap" for role in evidence_roles))

    def test_catalan_administrative_clauses_are_classified_as_pcap(self):
        role = pipeline.classify_role("Plec de clàusules administratives particulars", "application/pdf", b"%PDF-1.4")
        self.assertEqual(role, "pcap")

    def test_administrative_clause_variants_are_classified_as_pcap(self):
        examples = [
            "PLECS DE CLAUSULES ECONOMIQUES ADMINISTRATIVES I JURIDIQUES",
            "ARANTZAZUKOdministratiboak2026",
            "PCP 2026-ING-00013 DEF",
            "Contracte_5_4305420002_2026_0000867",
        ]
        for title in examples:
            with self.subTest(title=title):
                self.assertEqual(pipeline.classify_role(title, "application/pdf", b"%PDF-1.4"), "pcap")


if __name__ == "__main__":
    unittest.main()
