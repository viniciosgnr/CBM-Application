#!/usr/bin/env python3
"""
Generator for SBM Offshore Standard CBM KPI Methodology Presentation (.pptx)
Generates a concise 7-slide widescreen presentation strictly aligned with
SBM Offshore's corporate visual identity (Orange pill, SBM logo, navy underlined
headers, orange bullets, and pastel matrix tables).
"""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_sbm_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # SBM Offshore Official Palette
    SBM_ORANGE = RGBColor(241, 90, 36)      # #F15A24 SBM Primary Orange
    SBM_NAVY = RGBColor(0, 46, 93)          # #002E5D SBM Deep Corporate Navy
    SBM_DARK = RGBColor(15, 23, 42)         # #0F172A Body Text
    SBM_MUTED = RGBColor(100, 116, 139)     # #64748B Secondary Text
    SBM_LIGHT_BG = RGBColor(255, 255, 255)  # Pure White
    SBM_CARD_BG = RGBColor(248, 250, 252)   # Slate 50
    SBM_BORDER = RGBColor(226, 232, 240)    # Slate 200

    # SBM Risk Matrix Pastel Palette (from SBM FAR 3.0 / LOD2-PM)
    SBM_GREEN = RGBColor(226, 239, 218)     # #E2EFDA Soft Pastel Green
    SBM_YELLOW = RGBColor(255, 242, 204)    # #FFF2CC Soft Pastel Yellow
    SBM_ORANGE_PASTEL = RGBColor(252, 228, 214) # #FCE4D6 Soft Pastel Orange
    SBM_RED = RGBColor(248, 206, 204)       # #F8CECC Soft Pastel Red / Pink
    SBM_TABLE_HEADER = RGBColor(217, 225, 242) # #D9E1F2 Soft Slate Blue

    LOGO_PATH = "/home/marcosgnr/CBM/docs/sbm_logo.png"

    def add_sbm_header_and_footer(slide, title_text, slide_num):
        # White background
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = SBM_LIGHT_BG
        bg.line.fill.background()

        # Top-Left Orange Pill Accent
        pill = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.42), Inches(0.35), Inches(0.65))
        pill.fill.solid()
        pill.fill.fore_color.rgb = SBM_ORANGE
        pill.line.fill.background()

        # Slide Title
        t_box = slide.shapes.add_textbox(Inches(1.3), Inches(0.4), Inches(9.5), Inches(0.75))
        tf = t_box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(22)
        p.font.bold = True
        p.font.color.rgb = SBM_NAVY
        p.font.name = "Segoe UI"

        # Top-Right SBM Offshore Logo
        if os.path.exists(LOGO_PATH):
            slide.shapes.add_picture(LOGO_PATH, Inches(11.3), Inches(0.35), width=Inches(1.3))

        # Bottom Footer
        f_box = slide.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(10.5), Inches(0.3))
        ftf = f_box.text_frame
        ftf.word_wrap = True
        ftf.margin_left = ftf.margin_top = ftf.margin_right = ftf.margin_bottom = 0
        p = ftf.paragraphs[0]
        p.text = "© SBM Offshore. All rights reserved. www.sbmoffshore.com"
        p.font.size = Pt(8.5)
        p.font.color.rgb = SBM_MUTED
        p.font.name = "Segoe UI"

        # Bottom-Right Circular Slide Number Pill
        num_circle = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(12.35), Inches(7.0), Inches(0.35), Inches(0.35))
        num_circle.fill.solid()
        num_circle.fill.fore_color.rgb = SBM_NAVY
        num_circle.line.fill.background()
        ntf = num_circle.text_frame
        ntf.margin_left = ntf.margin_top = ntf.margin_right = ntf.margin_bottom = 0
        np = ntf.paragraphs[0]
        np.text = str(slide_num)
        np.font.size = Pt(9.5)
        np.font.bold = True
        np.alignment = PP_ALIGN.CENTER
        np.font.color.rgb = RGBColor(255, 255, 255)

    def add_section_header(slide, left, top, text):
        box = slide.shapes.add_textbox(left, top, Inches(5.0), Inches(0.4))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.underline = True
        p.font.color.rgb = SBM_NAVY
        p.font.name = "Segoe UI"

    # ==============================================================
    # SLIDE 1: COVER SLIDE (SBM Corporate Standard)
    # ==============================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = SBM_LIGHT_BG
    bg1.line.fill.background()

    # Left bold vertical bar (Orange & Navy)
    bar_orange = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(0.2), Inches(3.6))
    bar_orange.fill.solid()
    bar_orange.fill.fore_color.rgb = SBM_ORANGE
    bar_orange.line.fill.background()

    # SBM Logo Top Right
    if os.path.exists(LOGO_PATH):
        slide1.shapes.add_picture(LOGO_PATH, Inches(10.8), Inches(0.7), width=Inches(1.8))

    t_box1 = slide1.shapes.add_textbox(Inches(1.3), Inches(1.8), Inches(10.5), Inches(3.6))
    tf1 = t_box1.text_frame
    tf1.word_wrap = True
    p = tf1.paragraphs[0]
    p.text = "CONDITION BASED MAINTENANCE (CBM)"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE
    p.font.name = "Segoe UI"

    p = tf1.add_paragraph()
    p.text = "Fleet Health & Risk Scoring Methodology"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY
    p.font.name = "Segoe UI"
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Alignment with SBM LOD2-PM, IFS RAM Severity & CBMnet Standards"
    p.font.size = Pt(17)
    p.font.color.rgb = SBM_MUTED
    p.font.name = "Segoe UI"
    p.space_before = Pt(8)

    p = tf1.add_paragraph()
    p.text = "Reliability & Condition Monitoring Engineering Team  |  Technical Validation Deck"
    p.font.size = Pt(11)
    p.font.color.rgb = SBM_NAVY
    p.font.name = "Segoe UI"
    p.space_before = Pt(28)

    # Footer
    f1 = slide1.shapes.add_textbox(Inches(0.8), Inches(7.1), Inches(11.0), Inches(0.3))
    p = f1.text_frame.paragraphs[0]
    p.text = "© SBM Offshore. All rights reserved. www.sbmoffshore.com"
    p.font.size = Pt(8.5)
    p.font.color.rgb = SBM_MUTED

    # ==============================================================
    # SLIDE 2: BASELINE CONTEXT — SBM LOD2-PM & CBMNET STANDARDS
    # ==============================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide2, "Baseline Context: SBM LOD2-PM & CBMnet Standards", 2)

    # Left Column: SBM LOD2-PM Architecture
    add_section_header(slide2, Inches(0.8), Inches(1.4), "SBM LOD2 - PM Standard")
    l_box2 = slide2.shapes.add_textbox(Inches(0.8), Inches(1.85), Inches(5.6), Inches(4.9))
    ltf2 = l_box2.text_frame
    ltf2.word_wrap = True

    p = ltf2.paragraphs[0]
    p.text = "• Activation Logic: Activated when PM is overdue; deactivated upon 'Work Done'."
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK

    p = ltf2.add_paragraph()
    p.text = "• FAR Score Determination: Likelihood × RAM-based Severity."
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK
    p.space_before = Pt(8)

    p = ltf2.add_paragraph()
    p.text = "• PM Overdue Mathematical Formula (FAR Standard):\n   PM Overdue (%) = [(Today - Due Date) / PM Interval] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE
    p.space_before = Pt(8)

    p = ltf2.add_paragraph()
    p.text = "• Operational Alignment:\n   SBM's LOD2-PM governs collection adherence. We map this directly into our 6 overdue indices (Not Overdue to >200%)."
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED
    p.space_before = Pt(8)

    # Right Column: CBMnet Standard Risk Levels (§1.6)
    add_section_header(slide2, Inches(6.9), Inches(1.4), "CBMnet Theoretical Standard (§1.6)")
    r_box2 = slide2.shapes.add_textbox(Inches(6.9), Inches(1.85), Inches(5.6), Inches(4.9))
    rtf2 = r_box2.text_frame
    rtf2.word_wrap = True

    p = rtf2.paragraphs[0]
    p.text = "• Fault Risk (Max 25):\n   Highest Likelihood of all Faults (Max 5) × Consequence of Failure (Max 5)."
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK

    p = rtf2.add_paragraph()
    p.text = "• Compliance Risk (Max 25):\n   Compliance Level (Max 5) × Consequence of Failure (Max 5)."
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK
    p.space_before = Pt(8)

    p = rtf2.add_paragraph()
    p.text = "• CBMnet Total Risk (Max 30):\n   Fault Risk + (20% × Compliance Risk)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE
    p.space_before = Pt(8)

    p = rtf2.add_paragraph()
    p.text = "• Core Pareto Weighting Principle:\n   Physical condition is the primary driver of risk. Overdue PM acts as a 20% modifier, preventing admin delays from masking mechanical failures."
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED
    p.space_before = Pt(8)

    # ==============================================================
    # SLIDE 3: KPI 1 — FAULT RISK FORMULATION & MATRIX
    # ==============================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide3, "KPI 1: Fault Risk Formulation & Matrix (1 to 12)", 3)

    # Top Formula Callout Box
    f_box3 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(1.1))
    f_box3.fill.solid()
    f_box3.fill.fore_color.rgb = SBM_CARD_BG
    f_box3.line.color.rgb = SBM_ORANGE
    f_box3.line.width = Pt(1.5)

    ftf3 = f_box3.text_frame
    ftf3.word_wrap = True
    p = ftf3.paragraphs[0]
    p.text = "FAULT RISK FORMULA = Worst Condition Tier (1 to 4)  ×  IFS RAM Criticality (1 to 3)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY

    p = ftf3.add_paragraph()
    p.text = "Scale: 1 to 12 pts | Multi-Technique Rule: Condition = max(Vibration Tier, Lube Oil Tier)"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED

    # Left: SBM Pastel Vector Matrix Table
    add_section_header(slide3, Inches(0.8), Inches(2.65), "Fault Risk Matrix (4×3)")
    t_shape3 = slide3.shapes.add_table(4, 5, Inches(0.8), Inches(3.1), Inches(6.2), Inches(3.4))
    table3 = t_shape3.table
    table3.columns[0].width = Inches(2.2)
    table3.columns[1].width = Inches(1.0)
    table3.columns[2].width = Inches(1.0)
    table3.columns[3].width = Inches(1.0)
    table3.columns[4].width = Inches(1.0)

    m3_headers = ["IFS Criticality", "Tier 4\n(Good)", "Tier 3\n(Good)", "Tier 2\n(Degr.)", "Tier 1\n(Crit.)"]
    for c, h in enumerate(m3_headers):
        cell = table3.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = SBM_NAVY
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(9.5)
        cp.font.bold = True
        cp.alignment = PP_ALIGN.CENTER
        cp.font.color.rgb = RGBColor(255, 255, 255)

    matrix3_data = [
        ("High / SECE (3)", [("3", SBM_GREEN), ("6", SBM_YELLOW), ("9", SBM_ORANGE_PASTEL), ("12", SBM_RED)]),
        ("Medium (2)",     [("2", SBM_GREEN), ("4", SBM_YELLOW), ("6", SBM_YELLOW),        ("8", SBM_ORANGE_PASTEL)]),
        ("Low (1)",        [("1", SBM_GREEN), ("2", SBM_GREEN),  ("3", SBM_GREEN),         ("4", SBM_YELLOW)]),
    ]

    for r, (row_label, cells) in enumerate(matrix3_data):
        cell_lbl = table3.cell(r + 1, 0)
        cell_lbl.fill.solid()
        cell_lbl.fill.fore_color.rgb = SBM_TABLE_HEADER
        p = cell_lbl.text_frame.paragraphs[0]
        p.text = row_label
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = SBM_NAVY

        for c, (val, color) in enumerate(cells):
            v_cell = table3.cell(r + 1, c + 1)
            v_cell.fill.solid()
            v_cell.fill.fore_color.rgb = color
            p = v_cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(12)
            p.font.bold = True
            p.alignment = PP_ALIGN.CENTER
            p.font.color.rgb = SBM_NAVY

    # Right: Fleet Health Deduction Explanation
    add_section_header(slide3, Inches(7.4), Inches(2.65), "Fleet Overall Health % Deduction")
    r_box3 = slide3.shapes.add_textbox(Inches(7.4), Inches(3.1), Inches(5.1), Inches(3.4))
    rtf3 = r_box3.text_frame
    rtf3.word_wrap = True

    p = rtf3.paragraphs[0]
    p.text = "• Maximum Fleet Potential: N machines × 12 points"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK

    p = rtf3.add_paragraph()
    p.text = "• Active Defect Penalties Only:\n   - Tier 1 (Critical) Machine: Deducts its Fault Risk score\n   - Tier 2 (Degraded) Machine: Deducts its Fault Risk score\n   - Tier 3 / Tier 4 (Good) Machines: Deduct 0 points"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED
    p.space_before = Pt(8)

    p = rtf3.add_paragraph()
    p.text = "• Fleet Health % Formula:\n   Health % = [(Max Points - Deductions) / Max Points] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE
    p.space_before = Pt(10)

    # ==============================================================
    # SLIDE 4: KPI 2 — COMPLIANCE RISK & PM OVERDUE
    # ==============================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide4, "KPI 2: Compliance Risk & PM Overdue (0 to 15)", 4)

    # Top Formula Callout Box
    f_box4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(1.1))
    f_box4.fill.solid()
    f_box4.fill.fore_color.rgb = SBM_CARD_BG
    f_box4.line.color.rgb = SBM_ORANGE
    f_box4.line.width = Pt(1.5)

    ftf4 = f_box4.text_frame
    ftf4.word_wrap = True
    p = ftf4.paragraphs[0]
    p.text = "COMPLIANCE RISK = IFS RAM Criticality (1 to 3)  ×  PM Overdue Index (0 to 5)"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY

    p = ftf4.add_paragraph()
    p.text = "Scale: 0 to 15 pts | PM Overdue (%) = [(Today - Planned Date) / PM Interval] × 100%"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED

    # Left: 3x6 Compliance Matrix Table
    add_section_header(slide4, Inches(0.8), Inches(2.65), "Compliance Risk Matrix (3×6)")
    t_shape4 = slide4.shapes.add_table(4, 7, Inches(0.8), Inches(3.1), Inches(6.8), Inches(3.4))
    table4 = t_shape4.table
    table4.columns[0].width = Inches(2.0)
    for i in range(1, 7):
        table4.columns[i].width = Inches(0.8)

    m4_headers = ["IFS Criticality", "Idx 0\n(0%)", "Idx 1\n(50%)", "Idx 2\n(100%)", "Idx 3\n(150%)", "Idx 4\n(200%)", "Idx 5\n(>200%)"]
    for c, h in enumerate(m4_headers):
        cell = table4.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = SBM_NAVY
        cp = cell.text_frame.paragraphs[0]
        cp.text = h
        cp.font.size = Pt(8.5)
        cp.font.bold = True
        cp.alignment = PP_ALIGN.CENTER
        cp.font.color.rgb = RGBColor(255, 255, 255)

    matrix4_data = [
        ("High / SECE (3)", [("0", SBM_GREEN), ("3", SBM_GREEN), ("6", SBM_YELLOW), ("9", SBM_ORANGE_PASTEL), ("12", SBM_RED), ("15", SBM_RED)]),
        ("Medium (2)",     [("0", SBM_GREEN), ("2", SBM_GREEN), ("4", SBM_YELLOW), ("6", SBM_YELLOW),        ("8", SBM_ORANGE_PASTEL), ("10", SBM_ORANGE_PASTEL)]),
        ("Low (1)",        [("0", SBM_GREEN), ("1", SBM_GREEN), ("2", SBM_GREEN),  ("3", SBM_GREEN),         ("4", SBM_YELLOW), ("5", SBM_YELLOW)]),
    ]

    for r, (row_label, cells) in enumerate(matrix4_data):
        cell_lbl = table4.cell(r + 1, 0)
        cell_lbl.fill.solid()
        cell_lbl.fill.fore_color.rgb = SBM_TABLE_HEADER
        p = cell_lbl.text_frame.paragraphs[0]
        p.text = row_label
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = SBM_NAVY

        for c, (val, color) in enumerate(cells):
            v_cell = table4.cell(r + 1, c + 1)
            v_cell.fill.solid()
            v_cell.fill.fore_color.rgb = color
            p = v_cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11)
            p.font.bold = True
            p.alignment = PP_ALIGN.CENTER
            p.font.color.rgb = SBM_NAVY

    # Right: Fleet Compliance Deduction
    add_section_header(slide4, Inches(7.9), Inches(2.65), "Fleet Compliance % Deduction")
    r_box4 = slide4.shapes.add_textbox(Inches(7.9), Inches(3.1), Inches(4.6), Inches(3.4))
    rtf4 = r_box4.text_frame
    rtf4.word_wrap = True

    p = rtf4.paragraphs[0]
    p.text = "• Maximum Fleet Potential: N machines × 15 points"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_DARK

    p = rtf4.add_paragraph()
    p.text = "• Worst-Case Dual Technique Rule:\n   Compliance Risk = max(Crit × Index(Vib), Crit × Index(Oil))\n\n• Overdue Penalty Deductions:\n   Every machine with overdue > 0% subtracts its Compliance Risk score (up to 15 pts)."
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED
    p.space_before = Pt(8)

    p = rtf4.add_paragraph()
    p.text = "• Fleet Compliance % Formula:\n   Compliance % = [(Max Points - Deductions) / Max Points] × 100%"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE
    p.space_before = Pt(10)

    # ==============================================================
    # SLIDE 5: KPI 3 — CBM TOTAL RISK SYNTHESIS
    # ==============================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide5, "KPI 3: CBM Total Risk Synthesis (1.0 to 15.0)", 5)

    # Formula Callout Banner
    f_box5 = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), Inches(11.733), Inches(1.1))
    f_box5.fill.solid()
    f_box5.fill.fore_color.rgb = SBM_CARD_BG
    f_box5.line.color.rgb = SBM_ORANGE
    f_box5.line.width = Pt(1.5)

    ftf5 = f_box5.text_frame
    ftf5.word_wrap = True
    p = ftf5.paragraphs[0]
    p.text = "CBM TOTAL RISK = Fault Risk (1 to 12)  +  (20%  ×  Compliance Risk (0 to 15))"
    p.font.size = Pt(15)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY

    p = ftf5.add_paragraph()
    p.text = "Scale: 1.0 to 15.0 pts (Minimum: 1.0 | Maximum: 12 + 0.2×15 = 15.0 pts)"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_MUTED

    # 4 Category Cards in SBM Style
    add_section_header(slide5, Inches(0.8), Inches(2.65), "Risk Severity Classification Tiers")

    categories = [
        ("Low Risk", "< 4.0", SBM_GREEN, "Asset operating normally within baseline vibration & oil thresholds. Routine surveillance cycle."),
        ("Medium Risk", "4.0 - 7.9", SBM_YELLOW, "Early-stage mechanical degradation or moderate overdue PM. Engineering monitoring review."),
        ("High Risk", "8.0 - 11.9", SBM_ORANGE_PASTEL, "Substantial degradation (Tier 2 on critical machine) or severe inspection blind spot. Priority triage."),
        ("Critical Risk", "≥ 12.0", SBM_RED, "Imminent failure potential (Tier 1 on high criticality machine). Immediate offshore intervention required.")
    ]

    for i, (c_name, c_range, c_color, c_desc) in enumerate(categories):
        left = Inches(0.8 + i * 2.95)
        top = Inches(3.1)
        width = Inches(2.8)
        height = Inches(3.6)

        card = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = SBM_CARD_BG
        card.line.color.rgb = SBM_BORDER

        # Top Pastel Banner on Card
        top_bar = slide5.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.4))
        top_bar.fill.solid()
        top_bar.fill.fore_color.rgb = c_color
        top_bar.line.fill.background()

        tp = top_bar.text_frame.paragraphs[0]
        tp.text = c_name.upper()
        tp.font.size = Pt(10.5)
        tp.font.bold = True
        tp.alignment = PP_ALIGN.CENTER
        tp.font.color.rgb = SBM_NAVY

        ctf = card.text_frame
        ctf.word_wrap = True

        p = ctf.paragraphs[0]
        p.text = "Range: " + c_range
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = SBM_NAVY
        p.space_before = Pt(36)

        p = ctf.add_paragraph()
        p.text = c_desc
        p.font.size = Pt(10)
        p.font.color.rgb = SBM_MUTED
        p.space_before = Pt(12)

    # ==============================================================
    # SLIDE 6: SCORE HARMONIZATION & FLEET DASHBOARD
    # ==============================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide6, "Score Harmonization & Fleet Dashboard", 6)

    # Top: Equipment Modal Badges Representation
    add_section_header(slide6, Inches(0.8), Inches(1.35), "Equipment Details Modal: Score Format")

    badge_banner = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.8), Inches(11.733), Inches(1.1))
    badge_banner.fill.solid()
    badge_banner.fill.fore_color.rgb = SBM_CARD_BG
    badge_banner.line.color.rgb = SBM_BORDER

    bbtf = badge_banner.text_frame
    bbtf.word_wrap = True
    p = bbtf.paragraphs[0]
    p.text = "UNIFIED RATIO FORMAT IN ASSET HEADER:"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = SBM_ORANGE

    p = bbtf.add_paragraph()
    p.text = "[ Fault: 8/12 ]             [ Compliance: 6/15 ]             [ Total Risk: 9.2/15 ]"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY
    p.space_before = Pt(4)

    # Bottom: 3 KPI Cards Recreation
    add_section_header(slide6, Inches(0.8), Inches(3.1), "Fleet KPI Dashboard Cards (100% Potential)")

    kpi_cards = [
        ("FAULT RISK & HEALTH", "98.3%", "HEALTH", "Avg Fault Risk: 2.1 / 12\nEvaluated: 104 machines\nAt Risk: 3 machines (1 Crit, 2 Deg)\nDeduction: -21 pts", SBM_GREEN),
        ("COMPLIANCE RISK", "95.8%", "COMPLIANCE", "Avg Compliance: 0.8 / 15\nOn Schedule: 92 machines\nOverdue PM: 12 machines\nDeduction: -65 pts", SBM_YELLOW),
        ("CBM TOTAL RISK", "97.2%", "TOTAL HEALTH", "Avg Total Risk: 2.3 / 15\nCritical / High: 2 machines\nMedium / Low: 102 machines\nDeduction: -34.0 pts", SBM_ORANGE_PASTEL)
    ]

    for i, (title, pct, sub, details, color) in enumerate(kpi_cards):
        left = Inches(0.8 + i * 3.95)
        top = Inches(3.55)
        width = Inches(3.8)
        height = Inches(3.3)

        c = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        c.fill.solid()
        c.fill.fore_color.rgb = SBM_CARD_BG
        c.line.color.rgb = SBM_BORDER

        ctf = c.text_frame
        ctf.word_wrap = True

        p = ctf.paragraphs[0]
        p.text = title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = SBM_NAVY

        p = ctf.add_paragraph()
        p.text = pct
        p.font.size = Pt(30)
        p.font.bold = True
        p.font.color.rgb = SBM_ORANGE
        p.alignment = PP_ALIGN.CENTER
        p.space_before = Pt(10)

        p = ctf.add_paragraph()
        p.text = sub
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = SBM_MUTED
        p.alignment = PP_ALIGN.CENTER

        p = ctf.add_paragraph()
        p.text = details
        p.font.size = Pt(9.5)
        p.font.color.rgb = SBM_DARK
        p.space_before = Pt(12)

    # ==============================================================
    # SLIDE 7: PRACTICAL OFFSHORE CASE STUDY & VALIDATION
    # ==============================================================
    slide7 = prs.slides.add_slide(blank_layout)
    add_sbm_header_and_footer(slide7, "Practical Case Study: Crude Export Pump (P-01A)", 7)

    # Left: Asset Condition & Surveillance Data
    add_section_header(slide7, Inches(0.8), Inches(1.4), "Asset Condition & Surveillance Inputs")
    l_box7 = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.85), Inches(5.6), Inches(4.9))
    l_box7.fill.solid()
    l_box7.fill.fore_color.rgb = SBM_CARD_BG
    l_box7.line.color.rgb = SBM_BORDER

    ltf7 = l_box7.text_frame
    ltf7.word_wrap = True

    p = ltf7.paragraphs[0]
    p.text = "• Asset Tag: P-01A (Crude Oil Export Pump)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = SBM_NAVY

    p = ltf7.add_paragraph()
    p.text = "• IFS EAM RAM Criticality: High (Score = 3)\n   Single-point production export consequence."
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_DARK
    p.space_before = Pt(8)

    p = ltf7.add_paragraph()
    p.text = "• Surveillance Condition:\n   - Vibration Survey: Tier 2 (Degraded, inner race bearing defect = 3)\n   - Lube Oil Survey: Tier 4 (Good = 1)\n   - Resolved Worst Condition = Tier 2 (Degraded = 3 pts)"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_DARK
    p.space_before = Pt(8)

    p = ltf7.add_paragraph()
    p.text = "• Overdue PM Calculation:\n   - Vibration PM Frequency: 24 days\n   - Last Survey Completed: 42 days ago\n   - Overdue Days: 42 - 24 = 18 days\n   - Overdue %: (18 / 24) × 100% = 75.0%\n   - 75% in (50%-100%] -> Overdue Index = 2"
    p.font.size = Pt(10.5)
    p.font.color.rgb = SBM_DARK
    p.space_before = Pt(8)

    # Right: Step-by-Step Scoring Results
    add_section_header(slide7, Inches(6.9), Inches(1.4), "Calculated Risk Scores & Fleet Impact")
    r_box7 = slide7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.85), Inches(5.6), Inches(4.9))
    r_box7.fill.solid()
    r_box7.fill.fore_color.rgb = SBM_CARD_BG
    r_box7.line.color.rgb = SBM_BORDER

    rtf7 = r_box7.text_frame
    rtf7.word_wrap = True

    results = [
        ("1. Fault Risk Score", "3 (Crit) × 3 (Tier 2) = 9 / 12 pts", "High Risk (橙) — Deducts 9 pts from fleet fault health"),
        ("2. Compliance Risk Score", "3 (Crit) × 2 (Index) = 6 / 15 pts", "Moderate Delay (黄) — Deducts 6 pts from fleet compliance"),
        ("3. CBM Total Risk Score", "9 + (0.20 × 6) = 10.2 / 15.0 pts", "High Risk (橙) — Deducts 10.2 pts from fleet total health"),
        ("4. Fleet Governance Value", "Zero Ambiguity & Full Traceability", "Every deduction point is directly auditable to the bearing defect report and 18-day collection delay.")
    ]

    for i, (rtitle, rval, rdesc) in enumerate(results):
        p1 = rtf7.paragraphs[0] if i == 0 else rtf7.add_paragraph()
        p1.text = rtitle + ":"
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = SBM_NAVY
        if i > 0: p1.space_before = Pt(10)

        p2 = rtf7.add_paragraph()
        p2.text = rval
        p2.font.size = Pt(12)
        p2.font.bold = True
        p2.font.color.rgb = SBM_ORANGE

        p3 = rtf7.add_paragraph()
        p3.text = rdesc
        p3.font.size = Pt(9.5)
        p3.font.color.rgb = SBM_MUTED

    # Save presentation
    output_path = "/home/marcosgnr/CBM/docs/CBM_KPI_Methodology_Presentation.pptx"
    prs.save(output_path)
    print(f"SBM Standard Presentation successfully generated: {output_path}")

if __name__ == "__main__":
    create_sbm_presentation()
