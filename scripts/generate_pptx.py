#!/usr/bin/env python3
"""
Generator for CBM KPI Methodology Presentation (.pptx)
Generates a 16:9 widescreen presentation in Corporate Clean / Light Theme,
embedding user reference images, custom styled risk matrices, cards, and formulas.
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6] # completely blank layout

    # Corporate Clean / Light Palette
    BG_LIGHT = RGBColor(248, 250, 252)      # Slate 50
    CARD_BG = RGBColor(255, 255, 255)       # White
    CARD_BORDER = RGBColor(226, 232, 240)   # Slate 200
    TEXT_NAVY = RGBColor(15, 23, 42)        # Slate 900
    TEXT_MUTED = RGBColor(100, 116, 139)    # Slate 500
    ACCENT_BLUE = RGBColor(37, 99, 235)     # Blue 600
    HEADER_BLUE = RGBColor(30, 58, 138)     # Blue 900
    ACCENT_TEAL = RGBColor(13, 148, 136)    # Teal 600

    # Risk Palette
    RISK_GREEN = RGBColor(34, 197, 94)      # #22c55e
    RISK_YELLOW = RGBColor(234, 179, 8)     # #eab308
    RISK_ORANGE = RGBColor(249, 115, 22)    # #f97316
    RISK_RED = RGBColor(239, 68, 68)        # #ef4444

    IMAGE_REF_1 = "/home/marcosgnr/.gemini/antigravity-ide/brain/3fe5a2ad-3236-4d5f-acee-43807d1c03e7/.user_uploaded/media_1790138394669.png"
    IMAGE_REF_2 = "/home/marcosgnr/.gemini/antigravity-ide/brain/3fe5a2ad-3236-4d5f-acee-43807d1c03e7/.user_uploaded/media_1790138658712.png"

    def add_background_and_header(slide, title_text, category_text="CONDITION BASED MAINTENANCE (CBM)"):
        # Background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_LIGHT
        bg.line.fill.background()

        # Top Accent Line
        top_line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.08))
        top_line.fill.solid()
        top_line.fill.fore_color.rgb = ACCENT_BLUE
        top_line.line.fill.background()

        # Header Box
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.9))
        tf = header_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

        p0 = tf.paragraphs[0]
        p0.text = category_text.upper()
        p0.font.size = Pt(10)
        p0.font.bold = True
        p0.font.color.rgb = ACCENT_BLUE
        p0.font.name = "Segoe UI"

        p1 = tf.add_paragraph()
        p1.text = title_text
        p1.font.size = Pt(22)
        p1.font.bold = True
        p1.font.color.rgb = HEADER_BLUE
        p1.font.name = "Segoe UI"
        p1.space_before = Pt(3)

        # Bottom Footer
        footer_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        ftf = footer_box.text_frame
        ftf.word_wrap = True
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        fp = ftf.paragraphs[0]
        fp.text = "CBMnet Reference Alignment & Fleet Health Scoring | Technical Governance Deck"
        fp.font.size = Pt(9)
        fp.font.color.rgb = TEXT_MUTED
        fp.font.name = "Segoe UI"

    # ==============================================================
    # SLIDE 1: TITLE SLIDE
    # ==============================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = RGBColor(15, 23, 42) # Slate 900 Deep Corporate Navy
    bg1.line.fill.background()

    # Decorative blue accent bar
    dec_bar = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(0.18), Inches(3.2))
    dec_bar.fill.solid()
    dec_bar.fill.fore_color.rgb = RGBColor(59, 130, 246)
    dec_bar.line.fill.background()

    t_box1 = slide1.shapes.add_textbox(Inches(1.2), Inches(1.7), Inches(11.0), Inches(3.5))
    tf1 = t_box1.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "CONDITION BASED MAINTENANCE (CBM)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(96, 165, 250)
    p.font.name = "Segoe UI"

    p = tf1.add_paragraph()
    p.text = "Fleet Health & Risk Scoring Methodology"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = RGBColor(255, 255, 255)
    p.font.name = "Segoe UI"
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Mathematical Formulation, CBMnet Standards Alignment & Unified Fleet Deduction Logic"
    p.font.size = Pt(16)
    p.font.color.rgb = RGBColor(203, 213, 225)
    p.font.name = "Segoe UI"
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Author: Reliability & Condition Monitoring Engineering Team  |  Target: Engineering & Operations Alignment"
    p.font.size = Pt(11)
    p.font.color.rgb = RGBColor(148, 163, 184)
    p.font.name = "Segoe UI"
    p.space_before = Pt(30)

    # ==============================================================
    # SLIDE 2: EXECUTIVE SUMMARY & OBJECTIVES
    # ==============================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide2, "Executive Summary & Methodology Objectives")

    cards_data = [
        ("1. Standardized Risk Metric", 
         "Replace subjective and ambiguous rankings with mathematically rigorous, auditable scores that reflect true asset criticality and condition.", 
         ACCENT_BLUE),
        ("2. Real-World Integration", 
         "Bridge international standards (CBMnet §1.6 & FAR Overdue) with our industrial operating assets (IFS EAM RAM criticality & ISO vibration tiers).", 
         ACCENT_TEAL),
        ("3. 100% Unified Deductions", 
         "Unify the 3 fleet KPIs (Fault Risk, Compliance Risk, Total Risk) under an intuitive 100% health potential where defects and overdue PMs deduct bounded points.", 
         HEADER_BLUE),
        ("4. Offshore Usability", 
         "Equip offshore and onshore teams with clear, harmonized score badges (X/12, Y/15, Z/15) in equipment details for rapid triage and maintenance planning.", 
         RGBColor(79, 70, 229))
    ]

    for i, (ctitle, cdesc, ccolor) in enumerate(cards_data):
        left = Inches(0.8 + i * 2.95)
        top = Inches(1.6)
        width = Inches(2.8)
        height = Inches(4.9)

        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = CARD_BG
        card.line.color.rgb = CARD_BORDER
        card.line.width = Pt(1)

        # Header bar on card
        c_bar = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.2), top + Inches(0.3), Inches(0.08), Inches(0.45))
        c_bar.fill.solid()
        c_bar.fill.fore_color.rgb = ccolor
        c_bar.line.fill.background()

        ctb = slide2.shapes.add_textbox(left + Inches(0.35), top + Inches(0.3), width - Inches(0.55), Inches(4.3))
        ctf = ctb.text_frame
        ctf.word_wrap = True

        cp1 = ctf.paragraphs[0]
        cp1.text = ctitle
        cp1.font.size = Pt(13)
        cp1.font.bold = True
        cp1.font.color.rgb = TEXT_NAVY
        cp1.font.name = "Segoe UI"

        cp2 = ctf.add_paragraph()
        cp2.text = cdesc
        cp2.font.size = Pt(11)
        cp2.font.color.rgb = TEXT_MUTED
        cp2.font.name = "Segoe UI"
        cp2.space_before = Pt(16)

    # ==============================================================
    # SLIDE 3: REFERENCE BASELINE 1 — CBMNET RISK LEVELS (§1.6)
    # ==============================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide3, "Reference Baseline: CBMnet Standard Risk Levels (§1.6)")

    # Left: Explanation Card
    left_card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.1))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = CARD_BG
    left_card.line.color.rgb = CARD_BORDER

    ltb = slide3.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(6.2), Inches(4.6))
    ltf = ltb.text_frame
    ltf.word_wrap = True

    p = ltf.paragraphs[0]
    p.text = "CBMnet Theoretical Standard Specifications"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    items = [
        ("Fault Risk (Max 25)", "Highest Likelihood of all Faults (Max 5) × Consequence of Failure of Machine (Max 5). Results in a 5×5 matrix."),
        ("Compliance Risk (Max 25)", "Compliance Level (Max 5) × Consequence of Failure of Machine (Max 5). Scales overdue inspection exposure."),
        ("CBMnet Total Risk (Max 30)", "Fault Risk + (20% × Compliance Risk). Preserves physical condition as the dominant risk factor (up to 25), with maintenance compliance as a 20% modifier (up to 5 pts)."),
        ("Key Architectural Principle", "Condition severity is prioritized as primary; operational survey adherence is secondary. This 20% Pareto modifier ensures machines with active mechanical anomalies are always prioritized.")
    ]

    for title, desc in items:
        p1 = ltf.add_paragraph()
        p1.text = "• " + title + ":"
        p1.font.size = Pt(11.5)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_NAVY
        p1.space_before = Pt(10)

        p2 = ltf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED

    # Right: Embedded Original Image
    if os.path.exists(IMAGE_REF_1):
        slide3.shapes.add_picture(IMAGE_REF_1, Inches(8.0), Inches(1.5), width=Inches(4.5))

    # ==============================================================
    # SLIDE 4: REFERENCE BASELINE 2 — PM OVERDUE FORMULA & CRITERIA
    # ==============================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide4, "Reference Baseline: PM Overdue (%) Mathematical Formula")

    # Left: Explanation & Formulas
    left_card4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.1))
    left_card4.fill.solid()
    left_card4.fill.fore_color.rgb = CARD_BG
    left_card4.line.color.rgb = CARD_BORDER

    ltb4 = slide4.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(6.2), Inches(4.5))
    ltf4 = ltb4.text_frame
    ltf4.word_wrap = True

    p = ltf4.paragraphs[0]
    p.text = "FAR PM Overdue Mathematical Formulation"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = ltf4.add_paragraph()
    p.text = "Calendar-based PM Overdue Formulation:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEXT_NAVY
    p.space_before = Pt(10)

    p = ltf4.add_paragraph()
    p.text = "PM Overdue (%) = [(Today - Due Date) / PM Interval] × 100%"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = ltf4.add_paragraph()
    p.text = "Run-Hour Based PM Overdue Formulation:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEXT_NAVY
    p.space_before = Pt(12)

    p = ltf4.add_paragraph()
    p.text = "PM Overdue (%) = [Current Run Hours since Last PM / PM Interval Run Hours] × 100%"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = ltf4.add_paragraph()
    p.text = "Standard Criteria Range (FAR Overdue Buckets):"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEXT_NAVY
    p.space_before = Pt(14)

    p = ltf4.add_paragraph()
    p.text = "• Not Overdue: ≤ 0% (Inspection completed on or before scheduled date)\n• 0 - 50%: Early grace window slippage\n• 50 - 100%: Missed by up to 1 full collection cycle\n• 100 - 150%: Double interval missed\n• 150 - 200%: Prolonged surveillance lapse\n• > 200%: Critical unmonitored blind spot"
    p.font.size = Pt(10)
    p.font.color.rgb = TEXT_MUTED

    # Right: Embedded Original Image
    if os.path.exists(IMAGE_REF_2):
        slide4.shapes.add_picture(IMAGE_REF_2, Inches(8.0), Inches(2.2), width=Inches(4.6))

    # ==============================================================
    # SLIDE 5: ARCHITECTURAL ADAPTATION TO INDUSTRIAL IFS & CBM
    # ==============================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide5, "Architectural Adaptation: Real-World Data Integration")

    # Comparison Table
    table_shape = slide5.shapes.add_table(5, 4, Inches(0.8), Inches(1.6), Inches(11.733), Inches(4.9))
    table = table_shape.table
    table.columns[0].width = Inches(2.6)
    table.columns[1].width = Inches(2.4)
    table.columns[2].width = Inches(2.9)
    table.columns[3].width = Inches(3.833)

    headers = ["Dimension", "CBMnet Theoretical", "CBM Application Implementation", "Technical Justification & Operational Value"]
    for c, h in enumerate(headers):
        cell = table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = HEADER_BLUE
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(11)
        cp.font.bold = True
        cp.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Consequence / Criticality", "5 qualitative levels", "3 IFS RAM Classes\n(Low = 1, Medium = 2, High/SECE = 3)", "Predetermined during project Reliability & Maintainability (RAM) study and mastered in IFS EAM. Prevents subjective analyst tampering."),
        ("Condition / Likelihood", "5 arbitrary levels", "4 Standard CBM Tiers\n(T4 Good=1, T3 Good=2, T2 Degraded=3, T1 Critical=4)", "Strictly derived from certified vibration & lube oil surveillance (ISO 10816 / ISO 17359). Represents worst-case technique status."),
        ("Compliance Overdue Scale", "5 qualitative steps", "6 FAR PM Overdue Indices\n(Index 0 to Index 5 based on actual days)", "Calculated objectively using (Today - Due Date) / PM Interval. Mathematical ratio eliminates manual estimation."),
        ("Risk Output Scales", "Fault: 25 | Comp: 25 | Total: 30", "Fault: 12 | Comp: 15 | Total: 15.0\n(with 20% compliance weight)", "Maintains exact CBMnet balance (20% weight on compliance). Compact scales are clearer for offshore operations.")
    ]

    for r, row in enumerate(rows_data):
        for c, val in enumerate(row):
            cell = table.cell(r + 1, c)
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if r % 2 == 0 else RGBColor(241, 245, 249)
            cp = cell.text_frame.paragraphs[0]
            cp.text = val
            cp.font.size = Pt(10)
            cp.font.color.rgb = TEXT_NAVY if c < 3 else TEXT_MUTED
            if c == 2:
                cp.font.bold = True
                cp.font.color.rgb = ACCENT_BLUE

    # ==============================================================
    # SLIDE 6: KPI 1 — FAULT RISK FORMULATION
    # ==============================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide6, "KPI 1: Fault Risk Formulation (Scale 1 to 12)")

    # Top Formula Banner
    f_banner = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.3))
    f_banner.fill.solid()
    f_banner.fill.fore_color.rgb = CARD_BG
    f_banner.line.color.rgb = ACCENT_BLUE
    f_banner.line.width = Pt(1.5)

    f_tf = f_banner.text_frame
    f_tf.word_wrap = True
    fp0 = f_tf.paragraphs[0]
    fp0.text = "CORE FAULT RISK FORMULA (PER ASSET):"
    fp0.font.size = Pt(10)
    fp0.font.bold = True
    fp0.font.color.rgb = ACCENT_BLUE

    fp1 = f_tf.add_paragraph()
    fp1.text = "Fault Risk = Worst Condition Tier (1 to 4)  ×  IFS Criticality (1 to 3)"
    fp1.font.size = Pt(18)
    fp1.font.bold = True
    fp1.font.color.rgb = HEADER_BLUE
    fp1.space_before = Pt(4)

    fp2 = f_tf.add_paragraph()
    fp2.text = "Resulting Score Range: 1 to 12 pts  |  Categorization: Low (1-3), Medium (4-7), High (8-11), Critical (≥12)"
    fp2.font.size = Pt(10.5)
    fp2.font.color.rgb = TEXT_MUTED

    # Bottom Two Columns
    c_left = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.0), Inches(5.7), Inches(3.7))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = CARD_BG
    c_left.line.color.rgb = CARD_BORDER

    cl_tf = c_left.text_frame
    cl_tf.word_wrap = True
    p = cl_tf.paragraphs[0]
    p.text = "Variable 1: Worst Condition Tier (ISO Tiers)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = cl_tf.add_paragraph()
    p.text = "• Consolidated Multi-Technique Rule:\n   Condition = max(Tier(Vibration), Tier(Lube Oil))\n\n• Tier 1 (Critical) = 4 points\n   Severe machinery fault detected; failure imminent.\n\n• Tier 2 (Degraded) = 3 points\n   Detectable mechanical anomaly requiring maintenance.\n\n• Tier 3 (Good / Baseline Watch) = 2 points\n   Operational, minor trend elevation.\n\n• Tier 4 (Good / Normal) = 1 point\n   Optimal baseline operation, no anomaly."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(8)

    c_right = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(3.0), Inches(5.7), Inches(3.7))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = CARD_BG
    c_right.line.color.rgb = CARD_BORDER

    cr_tf = c_right.text_frame
    cr_tf.word_wrap = True
    p = cr_tf.paragraphs[0]
    p.text = "Variable 2: IFS RAM Criticality"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = cr_tf.add_paragraph()
    p.text = "• Sourced directly from IFS Enterprise Asset Management:\n\n• High / Critical / SECE = 3 points\n   Safety & Environmental Critical Element (SECE) or single-point production shutdown consequence.\n\n• Medium Criticality = 2 points\n   Significant production impact with partial redundancy.\n\n• Low Criticality = 1 point\n   Full standby redundancy, non-critical balance of plant."
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(8)

    # ==============================================================
    # SLIDE 7: KPI 1 — FAULT RISK MATRIX & 100% DEDUCTION
    # ==============================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide7, "KPI 1: Fault Risk Matrix & Fleet Overall Health %")

    # Left: Native Vector Matrix Table
    m_table_shape = slide7.shapes.add_table(4, 5, Inches(0.8), Inches(1.5), Inches(6.2), Inches(3.2))
    m_table = m_table_shape.table
    m_table.columns[0].width = Inches(2.2)
    m_table.columns[1].width = Inches(1.0)
    m_table.columns[2].width = Inches(1.0)
    m_table.columns[3].width = Inches(1.0)
    m_table.columns[4].width = Inches(1.0)

    m_headers = ["IFS Criticality", "Tier 4\n(Good)", "Tier 3\n(Good)", "Tier 2\n(Degr.)", "Tier 1\n(Crit.)"]
    for c, h in enumerate(m_headers):
        cell = m_table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = HEADER_BLUE
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(9.5)
        cp.font.bold = True
        cp.alignment = PP_ALIGN.CENTER
        cp.font.color.rgb = RGBColor(255, 255, 255)

    matrix_rows = [
        ("High / SECE (3)", [("3", RISK_GREEN), ("6", RISK_YELLOW), ("9", RISK_ORANGE), ("12", RISK_RED)]),
        ("Medium (2)",     [("2", RISK_GREEN), ("4", RISK_YELLOW), ("6", RISK_YELLOW), ("8", RISK_ORANGE)]),
        ("Low (1)",        [("1", RISK_GREEN), ("2", RISK_GREEN),  ("3", RISK_GREEN),  ("4", RISK_YELLOW)]),
    ]

    for r, (row_label, cells) in enumerate(matrix_rows):
        lbl_cell = m_table.cell(r + 1, 0)
        lbl_cell.fill.solid()
        lbl_cell.fill.fore_color.rgb = RGBColor(241, 245, 249)
        p = lbl_cell.text_frame.paragraphs[0]
        p.text = row_label
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_NAVY

        for c, (val, color) in enumerate(cells):
            v_cell = m_table.cell(r + 1, c + 1)
            v_cell.fill.solid()
            v_cell.fill.fore_color.rgb = color
            p = v_cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(12)
            p.font.bold = True
            p.alignment = PP_ALIGN.CENTER
            p.font.color.rgb = RGBColor(255, 255, 255) if color in [RISK_RED, RISK_ORANGE] else TEXT_NAVY

    # Matrix Legend Below
    leg_box = slide7.shapes.add_textbox(Inches(0.8), Inches(4.8), Inches(6.2), Inches(1.8))
    leg_tf = leg_box.text_frame
    p = leg_tf.paragraphs[0]
    p.text = "Matrix Risk Categories: Green = Low (1-3) | Yellow = Medium (4-7) | Orange = High (8-11) | Red = Critical (12)"
    p.font.size = Pt(9.5)
    p.font.color.rgb = TEXT_MUTED

    # Right: Fleet Overall Health % Deduction Card
    r_card = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.3), Inches(1.5), Inches(5.2), Inches(5.1))
    r_card.fill.solid()
    r_card.fill.fore_color.rgb = CARD_BG
    r_card.line.color.rgb = CARD_BORDER

    rc_tf = r_card.text_frame
    rc_tf.word_wrap = True
    p = rc_tf.paragraphs[0]
    p.text = "Fleet Overall Health % (100% Deduction Logic)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = rc_tf.add_paragraph()
    p.text = "• Maximum Fleet Health Points:\n   Max Points = N machines × 12 points\n\n• Targeted Penalty Deductions:\n   Deductions occur ONLY for active anomalies:\n   - Tier 1 (Critical) Machine: Deducts its Fault Risk score\n   - Tier 2 (Degraded) Machine: Deducts its Fault Risk score\n   - Tier 3 / Tier 4 (Good) Machines: Deduct 0 points\n\n• Fleet Health % Formula:"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(8)

    p = rc_tf.add_paragraph()
    p.text = "Overall Health % = [(Max Points - Deductions) / Max Points] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    p.space_before = Pt(6)

    # ==============================================================
    # SLIDE 8: KPI 2 — PM OVERDUE & 6-STAGE DELAY INDEXING
    # ==============================================================
    slide8 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide8, "KPI 2: PM Overdue (%) & 6-Stage Delay Indexing")

    # Formula Banner
    f_banner2 = slide8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.3))
    f_banner2.fill.solid()
    f_banner2.fill.fore_color.rgb = CARD_BG
    f_banner2.line.color.rgb = ACCENT_TEAL
    f_banner2.line.width = Pt(1.5)

    f_tf2 = f_banner2.text_frame
    f_tf2.word_wrap = True
    fp0 = f_tf2.paragraphs[0]
    fp0.text = "PM OVERDUE MATHEMATICAL FORMULA & CONSOLIDATION:"
    fp0.font.size = Pt(10)
    fp0.font.bold = True
    fp0.font.color.rgb = ACCENT_TEAL

    fp1 = f_tf2.add_paragraph()
    fp1.text = "PM Overdue (%) = [(Today - Planned Date) / PM Interval (days)] × 100%"
    fp1.font.size = Pt(17)
    fp1.font.bold = True
    fp1.font.color.rgb = HEADER_BLUE
    fp1.space_before = Pt(4)

    fp2 = f_tf2.add_paragraph()
    fp2.text = "Independent Surveys: Vibration (e.g. 24 days) and Lube Oil (e.g. 84 days) are evaluated separately. Highest delay index is adopted."
    fp2.font.size = Pt(10.5)
    fp2.font.color.rgb = TEXT_MUTED

    # Table of 6 Indices
    idx_table_shape = slide8.shapes.add_table(7, 3, Inches(0.8), Inches(3.0), Inches(11.733), Inches(3.7))
    idx_table = idx_table_shape.table
    idx_table.columns[0].width = Inches(2.2)
    idx_table.columns[1].width = Inches(1.8)
    idx_table.columns[2].width = Inches(7.733)

    idx_headers = ["Overdue Range (%)", "Overdue Index", "Operational Severity & Technical Impact"]
    for c, h in enumerate(idx_headers):
        cell = idx_table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = HEADER_BLUE
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(10.5)
        cp.font.bold = True
        cp.font.color.rgb = RGBColor(255, 255, 255)

    indices_data = [
        ("≤ 0%", "Index 0", "On Schedule — Machine survey is fully up-to-date. Zero compliance penalty."),
        ("0% - 50%", "Index 1", "Early Delay — Minor route slippage within allowable grace rescheduling window."),
        ("50% - 100%", "Index 2", "Moderate Delay — Overdue by up to one full inspection interval. Maintenance rescheduled."),
        ("100% - 150%", "Index 3", "Significant Delay — Machine missed two successive monitoring windows. Elevated operational risk."),
        ("150% - 200%", "Index 4", "Severe Delay — Extended unmonitored period. Priority offshore route required."),
        ("> 200%", "Index 5", "Critical Delay — Extreme blind spot (> 2x nominal cycle). Severe data integrity breach.")
    ]

    for r, (rng, idx, desc) in enumerate(indices_data):
        cell0 = idx_table.cell(r + 1, 0)
        cell1 = idx_table.cell(r + 1, 1)
        cell2 = idx_table.cell(r + 1, 2)

        for cell in [cell0, cell1, cell2]:
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if r % 2 == 0 else RGBColor(241, 245, 249)

        p = cell0.text_frame.paragraphs[0]
        p.text = rng
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_NAVY

        p = cell1.text_frame.paragraphs[0]
        p.text = idx
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE

        p = cell2.text_frame.paragraphs[0]
        p.text = desc
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_MUTED

    # ==============================================================
    # SLIDE 9: KPI 2 — COMPLIANCE RISK MATRIX & FLEET COMPLIANCE %
    # ==============================================================
    slide9 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide9, "KPI 2: Compliance Risk Matrix & Fleet Compliance %")

    # Left: 3x6 Vector Matrix Table
    c_table_shape = slide9.shapes.add_table(4, 7, Inches(0.8), Inches(1.5), Inches(6.8), Inches(3.2))
    c_table = c_table_shape.table
    c_table.columns[0].width = Inches(2.0)
    for i in range(1, 7):
        c_table.columns[i].width = Inches(0.8)

    c_headers = ["IFS Criticality", "Idx 0\n(0%)", "Idx 1\n(50%)", "Idx 2\n(100%)", "Idx 3\n(150%)", "Idx 4\n(200%)", "Idx 5\n(>200%)"]
    for c, h in enumerate(c_headers):
        cell = c_table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = HEADER_BLUE
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(8.5)
        cp.font.bold = True
        cp.alignment = PP_ALIGN.CENTER
        cp.font.color.rgb = RGBColor(255, 255, 255)

    comp_rows = [
        ("High / SECE (3)", [("0", RISK_GREEN), ("3", RISK_GREEN), ("6", RISK_YELLOW), ("9", RISK_ORANGE), ("12", RISK_RED), ("15", RISK_RED)]),
        ("Medium (2)",     [("0", RISK_GREEN), ("2", RISK_GREEN), ("4", RISK_YELLOW), ("6", RISK_YELLOW), ("8", RISK_ORANGE), ("10", RISK_ORANGE)]),
        ("Low (1)",        [("0", RISK_GREEN), ("1", RISK_GREEN), ("2", RISK_GREEN),  ("3", RISK_GREEN),  ("4", RISK_YELLOW), ("5", RISK_YELLOW)]),
    ]

    for r, (row_label, cells) in enumerate(comp_rows):
        lbl_cell = c_table.cell(r + 1, 0)
        lbl_cell.fill.solid()
        lbl_cell.fill.fore_color.rgb = RGBColor(241, 245, 249)
        p = lbl_cell.text_frame.paragraphs[0]
        p.text = row_label
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = TEXT_NAVY

        for c, (val, color) in enumerate(cells):
            v_cell = c_table.cell(r + 1, c + 1)
            v_cell.fill.solid()
            v_cell.fill.fore_color.rgb = color
            p = v_cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11)
            p.font.bold = True
            p.alignment = PP_ALIGN.CENTER
            p.font.color.rgb = RGBColor(255, 255, 255) if color in [RISK_RED, RISK_ORANGE] else TEXT_NAVY

    # Right: Fleet Compliance % Deduction Card
    r_card2 = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.9), Inches(1.5), Inches(4.6), Inches(5.1))
    r_card2.fill.solid()
    r_card2.fill.fore_color.rgb = CARD_BG
    r_card2.line.color.rgb = CARD_BORDER

    rc2_tf = r_card2.text_frame
    rc2_tf.word_wrap = True
    p = rc2_tf.paragraphs[0]
    p.text = "Fleet Compliance % (100% Deduction Logic)"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = rc2_tf.add_paragraph()
    p.text = "• Maximum Fleet Compliance Potential:\n   Max Points = N machines × 15 points\n\n• Overdue Penalty Deductions:\n   Every machine overdue beyond 0% deducts its Compliance Risk score (Crit × Index).\n   - Machines on schedule (Index 0) deduct 0 pts.\n   - Highly critical overdue machines deduct up to 15 pts.\n\n• Fleet Compliance % Formula:"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(8)

    p = rc2_tf.add_paragraph()
    p.text = "Compliance % = [(Max Points - Deductions) / Max Points] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_TEAL
    p.space_before = Pt(6)

    # ==============================================================
    # SLIDE 10: KPI 3 — CBM TOTAL RISK SYNTHESIS
    # ==============================================================
    slide10 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide10, "KPI 3: CBM Total Risk Synthesis (Scale 1.0 to 15.0)")

    # Formula Banner
    f_banner3 = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.4))
    f_banner3.fill.solid()
    f_banner3.fill.fore_color.rgb = CARD_BG
    f_banner3.line.color.rgb = RGBColor(79, 70, 229)
    f_banner3.line.width = Pt(1.5)

    f_tf3 = f_banner3.text_frame
    f_tf3.word_wrap = True
    fp0 = f_tf3.paragraphs[0]
    fp0.text = "COMPOSITE TOTAL RISK FORMULA (CBMnet §1.6 ALIGNED):"
    fp0.font.size = Pt(10)
    fp0.font.bold = True
    fp0.font.color.rgb = RGBColor(79, 70, 229)

    fp1 = f_tf3.add_paragraph()
    fp1.text = "CBM Total Risk = Fault Risk  +  (20%  ×  Compliance Risk)"
    fp1.font.size = Pt(18)
    fp1.font.bold = True
    fp1.font.color.rgb = HEADER_BLUE
    fp1.space_before = Pt(4)

    fp2 = f_tf3.add_paragraph()
    fp2.text = "Scale Range: 1.0 to 15.0 pts (Minimum: 1 + 0 = 1.0 | Maximum: 12 + 0.2×15 = 15.0)"
    fp2.font.size = Pt(10.5)
    fp2.font.color.rgb = TEXT_MUTED

    # Bottom 4 Category Cards
    thresholds = [
        ("Low Risk", "< 4.0", RISK_GREEN, "Asset operating normally within baseline thresholds and inspection schedule. Routine surveillance."),
        ("Medium Risk", "4.0 - 7.9", RISK_YELLOW, "Early stage degradation or moderate inspection delay. Engineering review recommended."),
        ("High Risk", "8.0 - 11.9", RISK_ORANGE, "Substantial degradation (Tier 2 on critical machine) or severe inspection blind spot. Priority triage."),
        ("Critical Risk", "≥ 12.0", RISK_RED, "Imminent failure potential (Tier 1 on high criticality machine). Immediate offshore intervention.")
    ]

    for i, (t_name, t_range, t_color, t_desc) in enumerate(thresholds):
        left = Inches(0.8 + i * 2.95)
        top = Inches(3.1)
        width = Inches(2.8)
        height = Inches(3.6)

        c = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        # Color top indicator
        ind = slide10.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.12))
        ind.fill.solid()
        ind.fill.fore_color.rgb = t_color
        ind.line.fill.background()

        ctf = c.text_frame
        ctf.word_wrap = True

        p = ctf.paragraphs[0]
        p.text = t_name
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = TEXT_NAVY

        p = ctf.add_paragraph()
        p.text = "Score Range: " + t_range
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = t_color
        p.space_before = Pt(4)

        p = ctf.add_paragraph()
        p.text = t_desc
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(12)

    # ==============================================================
    # SLIDE 11: KPI 3 — FLEET TOTAL HEALTH % DEDUCTION LOGIC
    # ==============================================================
    slide11 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide11, "KPI 3: Fleet Total Health % Formulation")

    # Left: Explanation Card
    l_card11 = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.8), Inches(5.1))
    l_card11.fill.solid()
    l_card11.fill.fore_color.rgb = CARD_BG
    l_card11.line.color.rgb = CARD_BORDER

    ltf11 = l_card11.text_frame
    ltf11.word_wrap = True
    p = ltf11.paragraphs[0]
    p.text = "Consolidated Fleet Deduction Mechanism"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = ltf11.add_paragraph()
    p.text = "The 3rd KPI card captures the total integrity of the entire fleet, combining both active mechanical defects and overdue monitoring penalties into a single management score."
    p.font.size = Pt(11)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(8)

    p = ltf11.add_paragraph()
    p.text = "1. Maximum Total Potential: N machines × 15.0 points"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = TEXT_NAVY
    p.space_before = Pt(12)

    p = ltf11.add_paragraph()
    p.text = "2. Machine Penalty Deduction Formula:\n   Deduction_i = Fault Deduction_i + (0.20 × Compliance Risk_i)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE
    p.space_before = Pt(8)

    p = ltf11.add_paragraph()
    p.text = "3. Fleet Total Health % Result:\n   Total Health % = [(Max Points - Total Deductions) / Max Points] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE
    p.space_before = Pt(8)

    # Right: Property of Coherence Card
    r_card11 = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.9), Inches(1.5), Inches(4.6), Inches(5.1))
    r_card11.fill.solid()
    r_card11.fill.fore_color.rgb = CARD_BG
    r_card11.line.color.rgb = CARD_BORDER

    rtf11 = r_card11.text_frame
    rtf11.word_wrap = True
    p = rtf11.paragraphs[0]
    p.text = "Mathematical Properties of Coherence"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    points = [
        ("Zero Baseline Drift", "If all machines are healthy (Tier 3/4) and all collections are on schedule, Fleet Total Health = 100.0%."),
        ("Strict Monotonicity", "Every new defect detected or collection delay incurred strictly subtracts bounded points, decreasing the health percentage."),
        ("Balanced Weighting", "A severely degraded pump (Tier 1 on High Crit) deducts 12 pts, whereas severe overdue inspection on that same pump deducts 3.0 pts (20% weight), preventing administrative delays from masking physical breakdowns.")
    ]

    for p_title, p_desc in points:
        p1 = rtf11.add_paragraph()
        p1.text = "• " + p_title + ":"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_NAVY
        p1.space_before = Pt(12)

        p2 = rtf11.add_paragraph()
        p2.text = p_desc
        p2.font.size = Pt(10)
        p2.font.color.rgb = TEXT_MUTED

    # ==============================================================
    # SLIDE 12: EQUIPMENT DETAILS MODAL HARMONIZATION
    # ==============================================================
    slide12 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide12, "Equipment Details Modal: Score Harmonization")

    # Header Card
    top_c12 = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(1.5))
    top_c12.fill.solid()
    top_c12.fill.fore_color.rgb = CARD_BG
    top_c12.line.color.rgb = CARD_BORDER

    t12_tf = top_c12.text_frame
    t12_tf.word_wrap = True
    p = t12_tf.paragraphs[0]
    p.text = "UNIFIED RATIO PRESENTATION IN ASSET HEADER:"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    p = t12_tf.add_paragraph()
    p.text = "[ Fault: 8/12 ]       [ Compliance: 6/15 ]       [ Total Risk: 9.2/15 ]"
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE
    p.space_before = Pt(6)

    # 3 Badges Explanation
    badges_data = [
        ("Fault Risk Badge (X / 12)", "Displays mechanical defect severity weighted by RAM criticality. Immediately informs the reliability engineer if the machine is operating with active defects.", RISK_ORANGE),
        ("Compliance Badge (Y / 15)", "Displays surveillance collection overdue status weighted by criticality. Confirms if vibration or oil sampling has been neglected.", ACCENT_TEAL),
        ("Total Risk Badge (Z / 15)", "The unified CBM score (Fault + 0.20 × Compliance). Formatted as a ratio over 15.0 with color matching the risk classification tier.", RGBColor(79, 70, 229))
    ]

    for i, (btitle, bdesc, bcolor) in enumerate(badges_data):
        left = Inches(0.8 + i * 3.95)
        top = Inches(3.2)
        width = Inches(3.8)
        height = Inches(3.4)

        bcard = slide12.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        bcard.fill.solid()
        bcard.fill.fore_color.rgb = CARD_BG
        bcard.line.color.rgb = CARD_BORDER

        btf = bcard.text_frame
        btf.word_wrap = True

        p = btf.paragraphs[0]
        p.text = btitle
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = bcolor

        p = btf.add_paragraph()
        p.text = bdesc
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(10)

    # ==============================================================
    # SLIDE 13: DIRECT ARCHITECTURE COMPARISON
    # ==============================================================
    slide13 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide13, "Architecture Alignment: CBMnet Standard vs. CBM App")

    # Table
    t_shape13 = slide13.shapes.add_table(7, 3, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.1))
    table13 = t_shape13.table
    table13.columns[0].width = Inches(3.2)
    table13.columns[1].width = Inches(3.5)
    table13.columns[2].width = Inches(5.033)

    t13_headers = ["Parameter / Metric", "CBMnet Theoretical Standard (§1.6)", "CBM Application Implementation"]
    for c, h in enumerate(t13_headers):
        cell = table13.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = HEADER_BLUE
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(11)
        cp.font.bold = True
        cp.font.color.rgb = RGBColor(255, 255, 255)

    comp_rows13 = [
        ("Criticality (Consequence)", "5 qualitative scale points", "3 IFS RAM Classes (Low=1, Medium=2, High/SECE=3)"),
        ("Condition (Likelihood)", "5 arbitrary Likelihood levels", "4 Certified CBM Surveillance Tiers (ISO 10816 / 17359)"),
        ("Compliance Overdue Input", "5 qualitative adherence steps", "6 FAR PM Overdue Indices based on (Today - Due) / Interval"),
        ("Maximum Fault Risk", "25 points (5 × 5 matrix)", "12 points (4 Tiers × 3 Criticalities)"),
        ("Maximum Compliance Risk", "25 points (5 × 5 matrix)", "15 points (3 Criticalities × 5 Overdue Indices)"),
        ("Maximum Total Risk", "30 points (25 + 0.2 × 25)", "15.0 points (12 + 0.2 × 15.0) — Exact 20% weight preserved")
    ]

    for r, (param, theo, impl) in enumerate(comp_rows13):
        cell0 = table13.cell(r + 1, 0)
        cell1 = table13.cell(r + 1, 1)
        cell2 = table13.cell(r + 1, 2)

        for cell in [cell0, cell1, cell2]:
            cell.fill.solid()
            cell.fill.fore_color.rgb = CARD_BG if r % 2 == 0 else RGBColor(241, 245, 249)

        p = cell0.text_frame.paragraphs[0]
        p.text = param
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_NAVY

        p = cell1.text_frame.paragraphs[0]
        p.text = theo
        p.font.size = Pt(10)
        p.font.color.rgb = TEXT_MUTED

        p = cell2.text_frame.paragraphs[0]
        p.text = impl
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE

    # ==============================================================
    # SLIDE 14: PRACTICAL OFFSHORE SCENARIO WALKTHROUGH
    # ==============================================================
    slide14 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide14, "Practical Example: Offshore Asset Scoring Walkthrough")

    # Left: Case Context
    l_case = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.1))
    l_case.fill.solid()
    l_case.fill.fore_color.rgb = CARD_BG
    l_case.line.color.rgb = CARD_BORDER

    ltf_c = l_case.text_frame
    ltf_c.word_wrap = True
    p = ltf_c.paragraphs[0]
    p.text = "Target Asset: Crude Oil Export Pump (P-01A)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    p = ltf_c.add_paragraph()
    p.text = "• IFS EAM RAM Criticality: High (Score = 3)\n\n• Condition Assessment Findings:\n  - Vibration Survey: Tier 2 (Degraded, bearing inner race defect = 3)\n  - Lube Oil Survey: Tier 4 (Good = 1)\n  - Consolidated Condition: Tier 2 (Degraded = 3 pts)\n\n• Routine Surveillance Adherence:\n  - Vibration PM Frequency: 24 days\n  - Last Survey Completed: 42 days ago\n  - Overdue Days: 42 - 24 = 18 days\n  - Overdue %: (18 / 24) × 100% = 75.0%\n  - Delay Index: 75% falls in (50%-100%] -> Index 2"
    p.font.size = Pt(10.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_before = Pt(10)

    # Right: Calculated Results
    r_case = slide14.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.1))
    r_case.fill.solid()
    r_case.fill.fore_color.rgb = CARD_BG
    r_case.line.color.rgb = CARD_BORDER

    rtf_c = r_case.text_frame
    rtf_c.word_wrap = True
    p = rtf_c.paragraphs[0]
    p.text = "Calculated Risk Scores & Fleet Impact"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    steps = [
        ("1. Fault Risk Score", "3 (Crit) × 3 (Tier 2) = 9 / 12  (High Risk)", RISK_ORANGE),
        ("2. Compliance Risk Score", "3 (Crit) × 2 (Index) = 6 / 15  (Moderate Delay)", ACCENT_TEAL),
        ("3. CBM Total Risk Score", "9 + (0.20 × 6) = 10.2 / 15.0  (High Risk)", RGBColor(79, 70, 229)),
        ("4. Fleet Deduction Impact", "Deducts 9 pts from Fleet Fault Health, 6 pts from Fleet Compliance, and 10.2 pts from Total Health.", HEADER_BLUE)
    ]

    for s_title, s_val, s_col in steps:
        p1 = rtf_c.add_paragraph()
        p1.text = s_title
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_NAVY
        p1.space_before = Pt(8)

        p2 = rtf_c.add_paragraph()
        p2.text = s_val
        p2.font.size = Pt(12)
        p2.font.bold = True
        p2.font.color.rgb = s_col

    # ==============================================================
    # SLIDE 15: MANAGEMENT DASHBOARD OVERVIEW (THE 3 CARDS)
    # ==============================================================
    slide15 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide15, "Management Dashboard: Visual KPI Cards")

    cards_ui = [
        ("FAULT RISK & HEALTH", "98.3%", "HEALTH", "Avg Fault Risk: 2.1 / 12\nEvaluated: 104 machines\nAt Risk: 3 machines (1 Crit, 2 Deg)\nDeduction: -21 pts", RISK_GREEN),
        ("COMPLIANCE RISK", "95.8%", "COMPLIANCE", "Avg Compliance: 0.8 / 15\nOn Schedule: 92 machines\nOverdue PM: 12 machines\nDeduction: -65 pts", ACCENT_TEAL),
        ("CBM TOTAL RISK", "97.2%", "TOTAL HEALTH", "Avg Total Risk: 2.3 / 15\nCritical / High: 2 machines\nMedium / Low: 102 machines\nDeduction: -34.0 pts", HEADER_BLUE)
    ]

    for i, (title, pct, sub, details, color) in enumerate(cards_ui):
        left = Inches(0.8 + i * 3.95)
        top = Inches(1.5)
        width = Inches(3.8)
        height = Inches(5.1)

        c = slide15.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True

        p = ctf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = HEADER_BLUE

        # Center circular badge imitation
        p = ctf.add_paragraph()
        p.text = pct
        p.font.size = Pt(36)
        p.font.bold = True
        p.font.color.rgb = color
        p.alignment = PP_ALIGN.CENTER
        p.space_before = Pt(24)

        p = ctf.add_paragraph()
        p.text = sub
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = TEXT_MUTED
        p.alignment = PP_ALIGN.CENTER

        p = ctf.add_paragraph()
        p.text = details
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_NAVY
        p.space_before = Pt(28)

    # ==============================================================
    # SLIDE 16: GOVERNANCE, AUDITING & REVIEW CHECKLIST
    # ==============================================================
    slide16 = prs.slides.add_slide(blank_layout)
    add_background_and_header(slide16, "Technical Governance, Auditing & Team Review")

    g_card = slide16.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(11.733), Inches(5.1))
    g_card.fill.solid()
    g_card.fill.fore_color.rgb = CARD_BG
    g_card.line.color.rgb = CARD_BORDER

    gtf = g_card.text_frame
    gtf.word_wrap = True

    p = gtf.paragraphs[0]
    p.text = "Engineering Validation Checklist"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = HEADER_BLUE

    checks = [
        ("In-App Interactivity", "Every KPI card features an (i) Info icon opening an interactive mathematical formula popover directly in the live application."),
        ("Automated Data Pipeline", "Scores recalculate reactively whenever new vibration or oil analysis reports are registered or collection dates advance."),
        ("Strict Traceability", "Every deduction point subtracted from the 100% fleet health is traceable to a specific machinery defect report or overdue route."),
        ("Standard Compliance", "Maintains full alignment with ISO 10816/17359, IFS RAM methodology, and CBMnet §1.6 risk architecture.")
    ]

    for ctitle, cdesc in checks:
        p1 = gtf.add_paragraph()
        p1.text = "✓ " + ctitle + ":"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_BLUE
        p1.space_before = Pt(12)

        p2 = gtf.add_paragraph()
        p2.text = cdesc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_MUTED

    # Output path
    output_path = "/home/marcosgnr/CBM/docs/CBM_KPI_Methodology_Presentation.pptx"
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_presentation()
