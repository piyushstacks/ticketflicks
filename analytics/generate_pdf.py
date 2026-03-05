"""
TicketFlicks - Comprehensive PDF Report Generator
Theme: Red / Black / White  |  Cinema-Premium Design
Layout: Cover -> Summary -> [Section Page: Table + Charts] -> AI Analysis
"""

import os
from datetime import datetime
from fpdf import FPDF, XPos, YPos
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# COLOUR PALETTE: Red / Black / White
# ---------------------------------------------------------------------------
BLACK      = (10,  10,  10)    # near-black
RED        = (220, 38,  38)    # red-600
RED_DARK   = (153, 27,  27)    # red-800  (header gradient)
WHITE      = (255, 255, 255)
GRAY_50    = (249, 250, 251)   # off-white page bg
GRAY_100   = (243, 244, 246)   # alternating row
GRAY_300   = (209, 213, 219)   # border
GRAY_500   = (107, 114, 128)   # sub-text
GRAY_700   = ( 55,  65,  81)   # body text
RED_LIGHT  = (254, 226, 226)   # light red row tint

LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ticketflicks_logo_cropped.png")


# ---------------------------------------------------------------------------
# UTILITIES
# ---------------------------------------------------------------------------

def s(text):
    """Sanitise to latin-1 safe string."""
    text = str(text)
    for ch, rep in {
        '\u2014': '-', '\u2013': '-', '\u2022': '*', '\u2019': "'",
        '\u2018': "'", '\u201c': '"', '\u201d': '"', '\u2026': '...',
        '\u00a0': ' ', '\u20b9': 'Rs', '\u2012': '-', '\u00d7': 'x',
    }.items():
        text = text.replace(ch, rep)
    return text.encode('latin-1', errors='replace').decode('latin-1')


def set_text(pdf, color):
    pdf.set_text_color(*color)

def set_fill(pdf, color):
    pdf.set_fill_color(*color)

def set_draw(pdf, color):
    pdf.set_draw_color(*color)


# ---------------------------------------------------------------------------
# PDF CLASS
# ---------------------------------------------------------------------------

class TFReport(FPDF):
    def __init__(self):
        super().__init__()
        self.doc_id   = f"TF-{datetime.now().strftime('%Y%m%d-%H%M')}"
        self.gen_date = datetime.now().strftime('%d %b %Y  %I:%M %p')
        self._in_cover = False   # suppress header/footer on cover

    # ── HEADER ──────────────────────────────────────────────────────────────
    def header(self):
        if self._in_cover:
            return

        # Black bar
        set_fill(self, BLACK)
        self.rect(0, 0, 210, 18, 'F')
        # Red accent line
        set_fill(self, RED)
        self.rect(0, 18, 210, 1.5, 'F')

        # Logo: use fixed height. Cropped logo is wide (744x148), so h=13 keeps it proportional
        if os.path.exists(LOGO_PATH):
            self.image(LOGO_PATH, x=8, y=3, h=12)
        else:
            self.set_xy(8, 4)
            self.set_font('Helvetica', 'B', 13)
            set_text(self, RED)
            self.cell(0, 8, 'TicketFlicks', border=0)

        # Center title
        self.set_xy(70, 5)
        self.set_font('Helvetica', 'B', 10)
        set_text(self, WHITE)
        self.cell(70, 7, 'Analytics Report', border=0, align='C')

        # Right doc id
        self.set_xy(145, 3)
        self.set_font('Helvetica', '', 6.5)
        set_text(self, GRAY_300)
        self.cell(55, 5, self.doc_id, border=0, align='R')
        self.set_xy(145, 8)
        self.cell(55, 5, self.gen_date, border=0, align='R')

        self.set_y(24)

    # ── FOOTER ──────────────────────────────────────────────────────────────
    def footer(self):
        if self._in_cover:
            return
        self.set_y(-13)
        set_draw(self, RED)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 200, self.get_y())
        self.set_y(-11)
        self.set_font('Helvetica', 'I', 7)
        set_text(self, GRAY_500)
        self.cell(140, 5, 'Confidential - TicketFlicks Internal Analytics Document', border=0)
        self.cell(49, 5, f'Page {self.page_no()}', border=0, align='R')

    # ── SECTION BANNER ──────────────────────────────────────────────────────
    def section_banner(self, title, subtitle=''):
        """Full-width black banner with red left accent and white title."""
        y = self.get_y()
        # Black fill
        set_fill(self, BLACK)
        self.rect(10, y, 190, 12, 'F')
        # Red left stripe
        set_fill(self, RED)
        self.rect(10, y, 4, 12, 'F')

        self.set_xy(17, y + 2)
        self.set_font('Helvetica', 'B', 11)
        set_text(self, WHITE)
        self.cell(140, 8, s(title.upper()), border=0)

        if subtitle:
            self.set_xy(17, y + 7)
            self.set_font('Helvetica', '', 7)
            set_text(self, GRAY_300)
            self.cell(140, 4, s(subtitle), border=0)

        self.ln(16)

    # ── TABLE ───────────────────────────────────────────────────────────────
    def draw_table(self, headers, rows, col_widths, max_rows=25):
        """
        Render aligned table. Header = red bg / white text.
        Rows alternate white / light-red.
        """
        if not rows:
            self.set_font('Helvetica', 'I', 9)
            set_text(self, GRAY_500)
            self.cell(0, 8, 'No data available.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(3)
            return

        total_w = sum(col_widths)
        x_start = (210 - total_w) / 2   # centre the table

        # Header
        set_fill(self, RED)
        set_draw(self, RED_DARK)
        self.set_line_width(0.2)
        self.set_xy(x_start, self.get_y())
        for h, w in zip(headers, col_widths):
            self.set_font('Helvetica', 'B', 8)
            set_text(self, WHITE)
            self.cell(w, 9, s(h), border=1, align='C', fill=True)
        self.ln()

        # Data rows
        set_draw(self, GRAY_300)
        for ri, row in enumerate(rows[:max_rows]):
            if self.get_y() > self.h - 28:
                self.add_page()
                # Repeat header on next page
                self.set_xy(x_start, self.get_y())
                set_fill(self, RED)
                for h, w in zip(headers, col_widths):
                    self.set_font('Helvetica', 'B', 8)
                    set_text(self, WHITE)
                    self.cell(w, 9, s(h), border=1, align='C', fill=True)
                self.ln()

            fill = ri % 2 == 0
            set_fill(self, GRAY_100 if fill else WHITE)
            self.set_xy(x_start, self.get_y())

            for ci, (cell_val, w) in enumerate(zip(row, col_widths)):
                self.set_font('Helvetica', '', 7.5)
                set_text(self, GRAY_700)
                align = 'R' if ci > 0 else 'L'
                self.cell(w, 7.5, s(str(cell_val)), border=1, align=align, fill=fill)
            self.ln()

        self.ln(5)

    # ── KPI CARD ────────────────────────────────────────────────────────────
    def kpi_card(self, label, value, x, y, w=44, h=20):
        set_fill(self, BLACK)
        set_draw(self, RED)
        self.set_line_width(0.5)
        self.rect(x, y, w, h, 'DF')
        # Top red bar
        set_fill(self, RED)
        self.rect(x, y, w, 2.5, 'F')

        self.set_xy(x + 1, y + 4)
        self.set_font('Helvetica', 'B', 7.5)
        set_text(self, GRAY_300)
        self.cell(w - 2, 5, s(label).upper(), align='C')

        self.set_xy(x + 1, y + 10)
        self.set_font('Helvetica', 'B', 12)
        set_text(self, WHITE)
        self.cell(w - 2, 10, s(str(value)), align='C')


# ---------------------------------------------------------------------------
# AI ANALYSIS
# ---------------------------------------------------------------------------

def generate_ai_analysis(stats):
    api_key = os.environ.get("GEMINI_API_KEY") or "dummy"

    prompt = f"""
You are a Senior Data Scientist at TicketFlicks. Write a concise, high-impact analytical report strictly based on the provided data.
DO NOT invent, assume, or hallucinate trends. If data is limited, state exactly what the data shows without unsupported extrapolations.

PLATFORM METRICS:
- Total Revenue: INR {stats.get('total_revenue', 0):,.0f}
- Revenue per User: INR {stats.get('revenue_per_user', 0):,.0f}
- Revenue per Theatre: INR {stats.get('revenue_per_theatre', 0):,.0f}
- Booking Conversion Rate: {stats.get('conversion_rate', 0):.1f}%
- Average Seats per Booking: {stats.get('seats_per_booking', 0):.1f}
- Active Movies: {stats.get('active_movies', 0)}
- Registered Users: {stats.get('total_users', 0)}

Write exactly 4 numbered sections. Format each section as:
[NUMBER. SECTION HEADING]
[1 blank line then the paragraph body]

Sections required:
1. EXECUTIVE PERFORMANCE OVERVIEW
2. REVENUE & CONVERSION ANALYSIS
3. USER BEHAVIOUR & ENGAGEMENT
4. OPERATIONAL EFFICIENCY

Rules:
- NO bullets, NO asterisks, NO markdown, NO em-dashes (use plain hyphens only).
- Each section heading must appear alone on its own line in UPPERCASE.
- Paragraphs must be highly analytical, data-dense, 3-4 sentences total.
- Total length: 250-320 words.
"""

    try:
        if api_key in ("dummy", "", None):
            raise ValueError("dummy key")
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-pro')
        raw = model.generate_content(prompt).text
        return s(raw)
    except Exception as e:
        print(f"  Gemini fallback: {e}")
        rev = stats.get('total_revenue', 0)
        bk  = stats.get('total_bookings', 0)
        usr = stats.get('total_users', 0)
        avg = stats.get('average_booking_value', 0)
        thtr = stats.get('top_theatre', 'N/A')

        return s(
            "1. EXECUTIVE PERFORMANCE OVERVIEW\n"
            f"TicketFlicks generated INR {rev:,.0f} in platform revenue. With an average revenue per user of INR {stats.get('revenue_per_user',0):,.0f}"
            f" across {usr} registered users, the platform demonstrates a solid foundation. Key operational metrics indicate"
            f" consistent user engagement, though overall volume remains constrained by current catalogue depth of {stats.get('active_movies',0)} active movies.\n\n"

            "2. REVENUE & CONVERSION ANALYSIS\n"
            f"The platform achieved a booking conversion rate of {stats.get('conversion_rate',0):.1f}%. This indicates the proportion"
            f" of initiated transactions resulting in successful payments. Examining revenue distribution across venues,"
            f" the platform averages INR {stats.get('revenue_per_theatre',0):,.0f} per active theatre, highlighting"
            f" the baseline geographical monetisation performance.\n\n"

            "3. USER BEHAVIOUR & ENGAGEMENT\n"
            f"Transaction data reveals an average of {stats.get('seats_per_booking',0):.1f} seats booked per order. This group-booking"
            f" tendency suggests that users primarily utilise the platform for shared social experiences. Customer lifetime"
            f" value indicators reflect moderate retention, forming a baseline for future targeted re-engagement campaigns.\n\n"

            "4. OPERATIONAL EFFICIENCY\n"
            f"Current platform operations show varying degrees of efficiency across physical and digital touchpoints."
            f" By focusing purely on existing data traces, it is evident that increasing the conversion rate from"
            f" {stats.get('conversion_rate',0):.1f}% represents the most immediate lever for revenue expansion without"
            f" requiring proportional increases in user acquisition spending."
        )


# ---------------------------------------------------------------------------
# CHART EMBEDDER  (always on new line, never overlapping)
# ---------------------------------------------------------------------------

def embed_chart(pdf, charts_dir, filename, caption, force_new_page=True):
    """Embed chart image with caption. Always on its own page for clean layout."""
    fpath = os.path.join(charts_dir, filename)
    if not os.path.exists(fpath):
        return

# ---------------------------------------------------------------------------
# SMART CHART EMBEDDER
# ---------------------------------------------------------------------------

# Approximate chart height in mm for a given width
# matplotlib default figsize 14x8 (bar) = ratio 0.57 ; 10x8 (pie) = ratio 0.80
CHART_APPROX_H = 0.60   # conservative estimate for page-fit check


def embed_chart(pdf, charts_dir, filename, caption, img_w=188):
    """Embed chart. Adds a new page only if there isn't enough vertical room."""
    fpath = os.path.join(charts_dir, filename)
    if not os.path.exists(fpath):
        return

    needed = img_w * CHART_APPROX_H + 18   # image height + caption + padding
    if pdf.get_y() + needed > pdf.h - 22:   # not enough room on current page
        pdf.add_page()

    pdf.ln(3)
    pdf.set_x(10)
    pdf.set_font('Helvetica', 'B', 9)
    set_text(pdf, RED)
    pdf.cell(0, 6, s(caption), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    cur_y = pdf.get_y()
    set_draw(pdf, RED)
    pdf.set_line_width(0.25)
    pdf.line(10, cur_y, 200, cur_y)
    pdf.set_y(cur_y + 2)

    x = (210 - img_w) / 2
    pdf.image(fpath, x=x, y=pdf.get_y(), w=img_w)
    pdf.set_y(pdf.get_y() + img_w * CHART_APPROX_H)
    pdf.ln(6)


# ---------------------------------------------------------------------------
# SECTION BUILDER  — smart page sharing
# ---------------------------------------------------------------------------

TABLE_ROW_H = 7.5    # mm per data row
TABLE_HDR_H = 9      # mm for header row


def table_height(n_rows):
    return TABLE_HDR_H + n_rows * TABLE_ROW_H + 8   # +8 for ln(5) + rounding


def build_section(pdf, charts_dir, title, subtitle, table_headers, table_rows, col_widths, chart_files):
    """
    Render one complete section.
    If table is small AND at least one chart fits after it, keep them on same page.
    Otherwise start each on its own page.
    """
    # Estimate table height
    n = len(table_rows) if table_rows else 0
    tbl_h = table_height(min(n, 25))   # max 25 rows per page

    # Estimate first-chart height
    first_chart_h = 0
    if chart_files:
        first_chart_h = 188 * CHART_APPROX_H + 18

    # Decide layout: can table + first chart both fit on one page?
    banner_h = 18
    available = pdf.h - 24 - 24   # page height minus header (24) and footer (22)
    same_page = (banner_h + tbl_h + first_chart_h) <= available

    # Always start section on a fresh page
    pdf.add_page()
    pdf.section_banner(title, subtitle)

    # ---- TABLE ----
    if table_rows:
        pdf.draw_table(table_headers, table_rows, col_widths)
    else:
        pdf.set_font('Helvetica', 'I', 9)
        set_text(pdf, GRAY_500)
        pdf.cell(0, 8, 'No data available for this section.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # ---- CHARTS ----
    for i, (fname, caption) in enumerate(chart_files):
        # First chart: only add new page if table+first chart don't fit together
        if i == 0 and same_page:
            embed_chart(pdf, charts_dir, fname, caption)
        else:
            # Subsequent charts or oversized: check if there's room, else new page
            fpath = os.path.join(charts_dir, fname)
            if not os.path.exists(fpath):
                continue
            needed = 188 * CHART_APPROX_H + 18
            if pdf.get_y() + needed > pdf.h - 22:
                pdf.add_page()
                # Reprint section banner on continuation page (lighter)
                y = pdf.get_y()
                set_fill(pdf, (40, 40, 40))
                pdf.rect(10, y, 190, 10, 'F')
                set_fill(pdf, RED)
                pdf.rect(10, y, 3, 10, 'F')
                pdf.set_xy(16, y + 1.5)
                pdf.set_font('Helvetica', 'B', 8)
                set_text(pdf, WHITE)
                pdf.cell(0, 7, s(title.upper() + ' (continued)'), border=0)
                pdf.ln(13)
            embed_chart(pdf, charts_dir, fname, caption)


# ---------------------------------------------------------------------------
# MAIN PDF CREATOR
# ---------------------------------------------------------------------------

def create_pdf(analytics_data, charts_dir, output_path):
    pdf = TFReport()
    pdf.set_auto_page_break(auto=True, margin=20)

    # =========================================================
    # PAGE 1 - COVER
    # =========================================================
    pdf._in_cover = True
    pdf.add_page()

    # Full black background
    set_fill(pdf, BLACK)
    pdf.rect(0, 0, 210, 297, 'F')

    # Logo centred on cover - cropped logo is 744x148 (wide, 5:1 ratio)
    # At h=20mm, width = 20 * (744/148) = ~100mm, perfectly proportioned
    LOGO_H = 22
    LOGO_W = int(LOGO_H * (744 / 148))  # ~110mm
    logo_top = 32
    logo_bottom = logo_top + LOGO_H
    if os.path.exists(LOGO_PATH):
        pdf.image(LOGO_PATH, x=(210 - LOGO_W) / 2, y=logo_top, h=LOGO_H)
    else:
        pdf.set_xy(0, logo_top)
        pdf.set_font('Helvetica', 'B', 32)
        set_text(pdf, RED)
        pdf.cell(210, LOGO_H, 'TicketFlicks', align='C')

    # Red divider under logo
    divider_y = logo_bottom + 4
    set_fill(pdf, RED)
    pdf.rect(50, divider_y, 110, 1.5, 'F')

    # Title block — starts well below logo
    title_y = divider_y + 7
    pdf.set_xy(0, title_y)
    pdf.set_font('Helvetica', '', 9)
    set_text(pdf, GRAY_300)
    pdf.cell(210, 7, 'OFFICIAL BUSINESS ANALYTICS DOCUMENT', align='C')

    pdf.set_xy(0, title_y + 9)
    pdf.set_font('Helvetica', 'B', 26)
    set_text(pdf, WHITE)
    pdf.cell(210, 14, 'ANALYTICS REPORT', align='C')

    pdf.set_xy(0, title_y + 25)
    pdf.set_font('Helvetica', '', 9)
    set_text(pdf, GRAY_300)
    pdf.cell(210, 7, 'Comprehensive Platform Intelligence', align='C')

    # Red divider 2
    divider2_y = title_y + 34
    set_fill(pdf, RED)
    pdf.rect(50, divider2_y, 110, 1.5, 'F')

    # Meta grid (white card on black)
    meta_y = divider2_y + 10
    set_fill(pdf, (30, 30, 30))
    set_draw(pdf, RED)
    pdf.set_line_width(0.5)
    pdf.rect(20, meta_y, 170, 75, 'DF')
    # Red top strip
    set_fill(pdf, RED)
    pdf.rect(20, meta_y, 170, 3, 'F')

    meta_items = [
        ("REPORT ID",         f"TF-{datetime.now().strftime('%Y%m%d')}"),
        ("GENERATED ON",      datetime.now().strftime('%d %b %Y  %I:%M %p')),
        ("REPORTING SCOPE",   "All-Time Platform Data"),
        ("PREPARED BY",       "Analytics Engine (Auto)"),
        ("PLATFORM",          "TicketFlicks B2C"),
        ("CLASSIFICATION",    "Internal / Confidential"),
    ]
    for i, (k, v) in enumerate(meta_items):
        col = i % 2
        row = i // 2
        mx = 25 + col * 85
        my = meta_y + 7 + row * 22

        pdf.set_xy(mx, my)
        pdf.set_font('Helvetica', 'B', 7)
        set_text(pdf, GRAY_300)
        pdf.cell(70, 5, k)

        pdf.set_xy(mx, my + 6)
        pdf.set_font('Helvetica', '', 9)
        set_text(pdf, WHITE)
        pdf.cell(70, 6, s(v))

    pdf.set_y(meta_y + 76)
    pdf.set_x(0)
    pdf.set_font('Helvetica', 'I', 7.5)
    set_text(pdf, GRAY_500)
    pdf.cell(210, 6, 'This document is electronically generated and does not require a physical signature.', align='C')

    pdf._in_cover = False

    # =========================================================
    # PAGE 2 - EXECUTIVE KPI SUMMARY
    # =========================================================
    pdf.add_page()
    pdf.section_banner('Executive Summary', 'Platform-wide key performance indicators')

    kpis = [
        ("Total Revenue",    f"Rs {analytics_data.get('total_revenue', 0):,.0f}"),
        ("Total Bookings",   str(analytics_data.get('total_bookings', 0))),
        ("Conversion Rate",  f"{analytics_data.get('conversion_rate', 0):.1f}%"),
        ("Rev / User",       f"Rs {analytics_data.get('revenue_per_user', 0):,.0f}"),
    ]
    kpis2 = [
        ("Seats / Booking",  f"{analytics_data.get('seats_per_booking', 0):.1f}"),
        ("Rev / Theatre",    f"Rs {analytics_data.get('revenue_per_theatre', 0):,.0f}"),
        ("Active Movies",    str(analytics_data.get('active_movies', 0))),
        ("Registered Users", str(analytics_data.get('total_users', 0))),
    ]

    # Larger KPI cards: 2 rows of 4, each 47mm wide
    card_w, card_h = 47, 26
    gap = 3
    start_x = (210 - (4 * card_w + 3 * gap)) / 2
    row1_y = pdf.get_y()
    for i, (lbl, val) in enumerate(kpis[:4]):
        pdf.kpi_card(lbl, val, x=start_x + i * (card_w + gap), y=row1_y, w=card_w, h=card_h)
    pdf.set_y(row1_y + card_h + gap)
    row2_y = pdf.get_y()
    for i, (lbl, val) in enumerate(kpis2):
        pdf.kpi_card(lbl, val, x=start_x + i * (card_w + gap), y=row2_y, w=card_w, h=card_h)
    pdf.set_y(row2_y + card_h + 10)

    # =========================================================
    # SECTION: BOOKINGS
    # =========================================================
    bk_status = analytics_data.get('bookings_by_status', {})
    build_section(
        pdf, charts_dir,
        title    = 'Bookings - Status Overview',
        subtitle = 'Distribution of bookings by status and payment',
        table_headers = ['Status', 'Count'],
        table_rows    = [[k.title(), str(v)] for k, v in bk_status.items()] if bk_status else [],
        col_widths    = [95, 95],
        chart_files   = [
            ('booking_status_pie.png',   'Figure 1: Booking Status Distribution'),
            ('payment_status_pie.png',   'Figure 2: Payment Status Distribution'),
        ]
    )

    # =========================================================
    # SECTION: DAILY REVENUE TRENDS
    # =========================================================
    daily = analytics_data.get('daily_trends', [])
    daily_rows = []
    if daily:
        for r in daily:
            if r.get('bookings', 0) > 0:
                daily_rows.append([
                    r.get('date', ''),
                    str(r.get('bookings', 0)),
                    f"Rs {r.get('revenue', 0):,.0f}"
                ])

    build_section(
        pdf, charts_dir,
        title    = 'Revenue - Daily Trends',
        subtitle = 'Bookings and revenue over the past 30 days',
        table_headers = ['Date', 'Bookings', 'Revenue (Rs)'],
        table_rows    = daily_rows,
        col_widths    = [70, 60, 60],
        chart_files   = [
            ('daily_revenue_trend.png', 'Figure 3: Daily Revenue Trend'),
        ]
    )

    # =========================================================
    # SECTION: MOVIES
    # =========================================================
    top_movies = analytics_data.get('top_movies', [])
    movie_rows = [
        [s(r.get('movie', ''))[:35], str(r.get('bookings', 0)),
         f"Rs {r.get('revenue', 0):,.0f}", str(r.get('seats_sold', 0))]
        for r in top_movies
    ]
    build_section(
        pdf, charts_dir,
        title    = 'Movies - Performance Breakdown',
        subtitle = 'All movies ranked by revenue',
        table_headers = ['Movie Title', 'Bookings', 'Revenue (Rs)', 'Seats Sold'],
        table_rows    = movie_rows,
        col_widths    = [80, 36, 46, 28],
        chart_files   = [
            ('revenue_by_movie_bar.png',       'Figure 4: Revenue by Movie'),
            ('revenue_vs_bookings_scatter.png','Figure 5: Revenue vs Bookings Scatter'),
        ]
    )

    # =========================================================
    # SECTION: THEATRES
    # =========================================================
    top_theatres = analytics_data.get('top_theatres', [])
    theatre_rows = [
        [s(r.get('theatre', ''))[:26], s(r.get('city', 'N/A'))[:14],
         str(r.get('bookings', 0)), f"Rs {r.get('revenue', 0):,.0f}", str(r.get('seats_sold', 0))]
        for r in top_theatres
    ]
    build_section(
        pdf, charts_dir,
        title    = 'Theatres - Performance Breakdown',
        subtitle = 'Revenue, bookings and capacity per theatre',
        table_headers = ['Theatre Name', 'City', 'Bookings', 'Revenue (Rs)', 'Seats Sold'],
        table_rows    = theatre_rows,
        col_widths    = [58, 34, 28, 44, 26],
        chart_files   = [
            ('revenue_by_theatre_bar.png', 'Figure 6: Revenue by Theatre'),
            ('theatre_city_bar.png',       'Figure 7: Theatres per City'),
        ]
    )

    # =========================================================
    # SECTION: GENRES
    # =========================================================
    genre_dist = analytics_data.get('genre_distribution', {})
    genre_rows = [[s(g), str(c)] for g, c in genre_dist.items()]
    build_section(
        pdf, charts_dir,
        title    = 'Genre - Distribution & Revenue',
        subtitle = 'Genre breakdown across active movies',
        table_headers = ['Genre', 'Movie Count'],
        table_rows    = genre_rows,
        col_widths    = [100, 90],
        chart_files   = [
            ('genre_distribution_pie.png', 'Figure 8: Genre Distribution'),
            ('revenue_by_genre_bar.png',   'Figure 9: Revenue by Genre'),
        ]
    )

    # =========================================================
    # SECTION: USERS & TOP CUSTOMERS
    # =========================================================
    user_roles     = analytics_data.get('users_by_role', {})
    top_customers  = analytics_data.get('top_customers', [])

    role_rows = [[k.title(), str(v)] for k, v in user_roles.items()]

    pdf.add_page()
    pdf.section_banner('Users - Role Distribution & Top Customers', 'Platform user roles and top spenders')

    if role_rows:
        pdf.set_font('Helvetica', 'B', 8)
        set_text(pdf, GRAY_700)
        pdf.cell(0, 5, 'User Role Breakdown', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.draw_table(['Role', 'Count'], role_rows, [100, 90])

    if top_customers:
        pdf.set_font('Helvetica', 'B', 8)
        set_text(pdf, GRAY_700)
        pdf.cell(0, 5, 'Top Customers by Value', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        cust_rows = []
        for r in top_customers[:10]:
            user_id = str(r.get('user_id', 'Unknown'))
            display_id = f"ID: {user_id[:8]}...{user_id[-4:]}" if len(user_id) >= 12 else user_id
            cust_rows.append([
                s(display_id),
                str(r.get('total_bookings', r.get('bookings', 0))),
                f"Rs {r.get('total_spent', r.get('total', 0)):,.0f}"
            ])
        pdf.draw_table(['Customer ID', 'Bookings', 'Total Spent (Rs)'], cust_rows, [95, 40, 55])

    # Smart embedding will safely skip None
    embed_chart(pdf, charts_dir, 'user_role_pie.png', 'Figure 10: User Role Distribution')

    # =========================================================
    # SECTION: BOOKING TIME PATTERNS
    # =========================================================
    pdf.add_page()
    pdf.section_banner('Booking Patterns - Time Analysis', 'When users book — by hour, day and heatmap')

    embed_chart(pdf, charts_dir, 'booking_heatmap.png',              'Figure 11: Booking Heatmap (Day x Hour)')
    embed_chart(pdf, charts_dir, 'hourly_booking_distribution.png',  'Figure 12: Bookings by Hour of Day')
    embed_chart(pdf, charts_dir, 'day_of_week_distribution.png',     'Figure 13: Bookings by Day of Week')

    # =========================================================
    # SECTION: MOVIE RATINGS
    # =========================================================
    rating_dist = analytics_data.get('rating_distribution', {})
    if rating_dist:
        rating_rows = [[k, str(v)] for k, v in rating_dist.items() if v > 0]
        build_section(
            pdf, charts_dir,
            title    = 'Movies - IMDb Rating Distribution',
            subtitle = 'How movies on the platform score on IMDb',
            table_headers = ['Rating Band', 'Movie Count'],
            table_rows    = rating_rows,
            col_widths    = [95, 95],
            chart_files   = [
                ('rating_distribution_bar.png', 'Figure 14: IMDb Rating Distribution'),
            ]
        )

    # =========================================================
    # FINAL PAGE - STRATEGIC ANALYSIS
    # =========================================================
    pdf.add_page()
    pdf.section_banner('Strategic Insights & Analysis', 'Data-driven performance observations')

    raw_analysis = generate_ai_analysis(analytics_data)

    # Render each section: detect numbered headings ("1. HEADING") and bold them
    pdf.set_left_margin(13)
    pdf.set_right_margin(13)

    for para in raw_analysis.split('\n'):
        para = para.strip()
        if not para:
            pdf.ln(4)
            continue

        # Detect heading lines like "1. EXECUTIVE PERFORMANCE OVERVIEW"
        import re
        is_heading = bool(re.match(r'^[1-9]\. [A-Z &]+$', para))

        if is_heading:
            if pdf.get_y() > pdf.h - 60:   # avoid lone heading at bottom
                pdf.add_page()
            pdf.ln(3)
            pdf.set_font('Helvetica', 'B', 12)
            set_text(pdf, BLACK)
            # Red left marker
            y = pdf.get_y()
            set_fill(pdf, RED)
            pdf.rect(13, y, 2, 8, 'F')
            pdf.set_x(17)
            pdf.cell(0, 8, s(para), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            # Underline
            ul_y = pdf.get_y()
            set_draw(pdf, GRAY_300)
            pdf.set_line_width(0.2)
            pdf.line(13, ul_y, 197, ul_y)
            pdf.ln(3)
        else:
            pdf.set_x(13)
            pdf.set_font('Helvetica', '', 10)
            set_text(pdf, GRAY_700)
            pdf.multi_cell(0, 6, s(para))
            pdf.ln(1)

    pdf.set_left_margin(10)
    pdf.set_right_margin(10)
    pdf.ln(4)

    # =========================================================
    # SAVE
    # =========================================================
    pdf.output(output_path)
    size_kb = os.path.getsize(output_path) // 1024
    print(f"  PDF saved: {output_path}  ({size_kb} KB)")


# ---------------------------------------------------------------------------
# STANDALONE TEST
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    dummy = {
        'total_bookings': 150, 'total_revenue': 45000,
        'average_booking_value': 300, 'total_users': 50,
        'active_movies': 8,
        'top_genres': 'Action, Drama, Thriller',
        'top_theatre': 'PVR Phoenix Mumbai',
        'bookings_by_status': {'confirmed': 80, 'pending': 40, 'cancelled': 30},
        'users_by_role': {'customer': 45, 'manager': 4, 'admin': 1},
        'rating_distribution': {'9-10': 2, '8-9': 3, '7-8': 2, '6-7': 1, 'Below 6': 0},
        'genre_distribution': {'Action': 3, 'Drama': 4, 'Thriller': 2, 'Comedy': 1},
        'top_movies': [
            {'movie': 'Inception', 'bookings': 50, 'revenue': 15000, 'seats_sold': 90},
            {'movie': 'Interstellar', 'bookings': 45, 'revenue': 13500, 'seats_sold': 81},
        ],
        'top_theatres': [
            {'theatre': 'PVR Phoenix Mumbai', 'city': 'Mumbai', 'bookings': 40, 'revenue': 12000, 'seats_sold': 80},
        ],
        'top_customers': [
            {'name': 'Rahul Sharma', 'total_bookings': 12, 'total_spent': 3600},
            {'name': 'Priya Patel',  'total_bookings': 9,  'total_spent': 2700},
        ],
        'daily_trends': [
            {'date': '2026-03-01', 'bookings': 5, 'revenue': 1500},
            {'date': '2026-03-02', 'bookings': 8, 'revenue': 2400},
        ],
    }
    os.makedirs("reports/charts", exist_ok=True)
    create_pdf(dummy, "reports/charts", "reports/comprehensive_report.pdf")
