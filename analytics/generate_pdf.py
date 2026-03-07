"""
TicketFlicks - Comprehensive PDF Report Generator
Theme: Red / Black / White  |  Cinema-Premium Design
Layout: Cover -> Summary -> [Section Page: Table + Charts] -> AI Analysis
"""

import os
from datetime import datetime
from fpdf import FPDF, XPos, YPos
from fpdf.fonts import FontFace
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
    def draw_table(self, headers, rows, col_widths, max_rows=None):
        """
        Clean professional table with:
        - Dark red header bar (white bold text)
        - Alternating white / light-gray data rows
        - Word-wrap inside cells via multi_cell trick
        - Subtle border lines only
        """
        if not rows:
            self.set_font('Helvetica', 'I', 9)
            set_text(self, GRAY_500)
            self.cell(0, 8, 'No data available for this section.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(3)
            return

        data_rows  = rows[:max_rows] if max_rows else rows
        total_w    = sum(col_widths)
        row_h      = 6          # mm per data row
        hdr_h      = 8          # mm header height
        font_size  = 7.5        # data font size
        left_x     = self.l_margin

        # ── HEADER ──────────────────────────────────────────────────────────
        set_fill(self, RED_DARK)
        set_draw(self, RED_DARK)
        self.set_line_width(0.1)
        self.rect(left_x, self.get_y(), total_w, hdr_h, 'F')

        self.set_font('Helvetica', 'B', 8)
        set_text(self, WHITE)
        x = left_x
        hdr_y = self.get_y()
        for i, (h, w) in enumerate(zip(headers, col_widths)):
            self.set_xy(x + 1, hdr_y + 1.5)
            self.cell(w - 2, hdr_h - 3, s(h).upper(), align='L', border=0)
            x += w
        self.set_y(hdr_y + hdr_h)

        # ── DATA ROWS ───────────────────────────────────────────────────────
        STRIPE_A = (255, 255, 255)   # white
        STRIPE_B = (245, 246, 248)   # very light gray
        BORDER_C = (220, 220, 220)   # subtle grid line

        set_draw(self, BORDER_C)
        self.set_line_width(0.1)

        for ri, row in enumerate(data_rows):
            # Page break guard
            if self.get_y() + row_h > self.h - 22:
                self.add_page()
                # Reprint header on new page
                set_fill(self, RED_DARK)
                self.rect(left_x, self.get_y(), total_w, hdr_h, 'F')
                self.set_font('Helvetica', 'B', 8)
                set_text(self, WHITE)
                x = left_x
                hdr_y2 = self.get_y()
                for h, w in zip(headers, col_widths):
                    self.set_xy(x + 1, hdr_y2 + 1.5)
                    self.cell(w - 2, hdr_h - 3, s(h).upper(), align='L', border=0)
                    x += w
                self.set_y(hdr_y2 + hdr_h)
                set_draw(self, BORDER_C)
                self.set_line_width(0.1)

            row_y     = self.get_y()
            stripe    = STRIPE_A if ri % 2 == 0 else STRIPE_B
            set_fill(self, stripe)
            self.rect(left_x, row_y, total_w, row_h, 'F')

            self.set_font('Helvetica', '', font_size)
            set_text(self, GRAY_700)
            x = left_x
            for ci, (cell_val, w) in enumerate(zip(row, col_widths)):
                cell_text = s(str(cell_val))
                # Right-align numeric-looking cells (simple heuristic)
                try:
                    float(str(cell_val).replace(',', '').replace('Rs', '').strip())
                    align = 'R'
                    self.set_xy(x + 1, row_y + 1)
                    self.cell(w - 2, row_h - 2, cell_text, align=align, border=0)
                except ValueError:
                    align = 'L'
                    self.set_xy(x + 1, row_y + 1)
                    # Truncate to fit cell width (avoid overflow)
                    max_chars = max(4, int(w / 1.9))
                    display = cell_text if len(cell_text) <= max_chars else cell_text[:max_chars - 2] + '..'
                    self.cell(w - 2, row_h - 2, display, align=align, border=0)
                x += w

            # Bottom border line for each row
            set_draw(self, BORDER_C)
            self.line(left_x, row_y + row_h, left_x + total_w, row_y + row_h)
            self.set_y(row_y + row_h)

        # Outer border
        set_draw(self, GRAY_300)
        self.set_line_width(0.3)
        self.rect(left_x, hdr_y, total_w, hdr_h + len(data_rows) * row_h, border=0)
        self.ln(6)

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
You are a Senior Data Scientist & Strategy Lead at TicketFlicks. 
Provide a COPIOUS and HIGHLY DETAILED analytical report strictly based on the provided platform data.

PLATFORM METRICS:
- Total Revenue: INR {stats.get('total_revenue', 0):,.2f}
- Revenue per User: INR {stats.get('revenue_per_user', 0):,.2f}
- Revenue per Theatre: INR {stats.get('revenue_per_theatre', 0):,.2f}
- Booking Conversion Rate: {stats.get('conversion_rate', 0):.2f}%
- Average Seats per Booking: {stats.get('seats_per_booking', 0):.2f}
- Active Movies: {stats.get('active_movies', 0)}
- Registered Users: {stats.get('total_users', 0)}

Write 4 long, information-dense analytical sections. Each section MUST be at least 2 long paragraphs.
Expand significantly on the data to explain 'why' these metrics matter and how they impact scalability.

Format each section as:
[NUMBER. SECTION HEADING]
[Paragraph 1...]
[Paragraph 2...]

Sections required:
1. EXECUTIVE PERFORMANCE OVERVIEW: Deep dive into the current financial health and revenue scalability...
2. REVENUE & CONVERSION ANALYSIS: Detailed breakdown of the sales funnel and conversion efficiency...
3. USER BEHAVIOUR & ENGAGEMENT: Granular look at user registration growth and seat occupancy patterns...
4. OPERATIONAL EFFICIENCY: Assessment of movie inventory performance and theatre-level throughput...

Rules:
- Length: Be verbose. Provide deep context.
- NO bullets, NO asterisks, NO markdown. Use only plain text sentences.
- Each section heading must be on its own line in UPPERCASE.
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
            f"TicketFlicks has generated a total platform revenue of INR {rev:,.0f}, reflecting the cumulative value"
            f" captured from all successful ticket transactions processed through the system. This top-line figure"
            f" positions the platform at a critical early growth stage, where the foundational transaction"
            f" infrastructure has proven operational but scale remains the central challenge. With {usr} registered"
            f" users on the platform and a revenue-per-user ratio of INR {stats.get('revenue_per_user',0):,.0f},"
            f" there is clear evidence that individual monetisation is moderate and consistent, which is a healthy"
            f" sign for a B2C ticketing marketplace. The average booking value of INR {avg:,.0f} indicates that"
            f" customers are making deliberate, considered purchasing decisions rather than impulsive micro-purchases,"
            f" suggesting the platform attracts intent-driven users primed for conversion.\n"
            f"The fact that {stats.get('active_movies',0)} active movies are available simultaneously speaks to"
            f" catalogue depth, yet it is the conversion of that catalogue breadth into actual booked seats that"
            f" defines commercial success. As the platform matures, the key strategic imperative is not merely"
            f" user acquisition but activation -- ensuring that each registered account transitions into a"
            f" repeat, high-value customer. Deepening content diversity and expanding theatre partnerships"
            f" across Tier-1 and Tier-2 cities remains the most reliable lever for sustained revenue scaling.\n\n"

            "2. REVENUE & CONVERSION ANALYSIS\n"
            f"The booking conversion rate stands at {stats.get('conversion_rate',0):.1f}%, a metric that encapsulates"
            f" the efficiency of the entire sales funnel from initial user interest through to a completed,"
            f" paid transaction. In the context of digital ticketing marketplaces, industry benchmarks typically"
            f" range between 2.5% and 8%, meaning TicketFlicks' current rate provides a clear baseline"
            f" against which future optimisation efforts should be measured. The revenue distribution across"
            f" active theatre partners averages INR {stats.get('revenue_per_theatre',0):,.0f} per venue, highlighting"
            f" both the per-venue productivity and the degree to which revenue is concentrated or distributed"
            f" across the network. A high per-theatre average is indicative of strong demand concentration,"
            f" while a lower figure suggests broader geographic spread but thinner per-location revenue.\n"
            f"Improving conversion requires simultaneous attention to UX friction points, payment reliability,"
            f" and show discovery algorithms. Any reduction in drop-off between the seat-selection stage and"
            f" final payment confirmation has an outsized impact on overall revenue since it directly increases"
            f" the numerator of the conversion rate without requiring additional marketing spend. Implementing"
            f" dynamic pricing models, promotional bundles, and personalised show recommendations based on user"
            f" history represents the highest-ROI conversion optimisation available to the platform at this stage.\n\n"

            "3. USER BEHAVIOUR & ENGAGEMENT\n"
            f"Transaction data reveals an average of {stats.get('seats_per_booking',0):.1f} seats per booking,"
            f" a figure that carries significant implications for both venue capacity planning and marketing"
            f" strategy. A mean above 1.5 strongly indicates that users are booking as part of social groups --"
            f" couples, families, or friends -- rather than as solo attendees. This group booking behaviour is"
            f" inherently positive for the platform because it means each conversion event generates"
            f" proportionally higher revenue than a single-seat transaction, amplifying the effective revenue"
            f" per conversion. It also implies that word-of-mouth dynamics are likely active -- users who enjoy"
            f" the booking experience will naturally introduce the platform to their social circles.\n"
            f"From an engagement standpoint, the concentration of bookings across {usr} registered users creates"
            f" both a risk and an opportunity. If a small cohort of highly active users accounts for a"
            f" disproportionate share of total revenue, the platform is exposed to churn risk within that"
            f" segment. Implementing a tiered loyalty framework -- offering priority seat selection, exclusive"
            f" pre-sale windows, or bundled F&B credits to frequent bookers -- would serve both to retain"
            f" high-value users and to create aspirational incentives that encourage infrequent users to"
            f" increase their booking frequency toward the premium tier.\n\n"

            "4. OPERATIONAL EFFICIENCY\n"
            f"Operational efficiency for a cinema ticketing platform is best measured through the ratio of"
            f" successfully closed transactions relative to total initiated sessions, the throughput of each"
            f" theatre partner, and the reliability of the payment gateway integration. Currently, the"
            f" conversion rate of {stats.get('conversion_rate',0):.1f}% implies that for every 100 users who"
            f" begin the booking process, approximately {stats.get('conversion_rate',0):.0f} complete a"
            f" successful payment. Closing this gap -- even by 2-3 percentage points -- mathematically"
            f" translates to a significant revenue uplift per marketing rupee spent, making it the highest"
            f" priority operational improvement available without capital expenditure.\n"
            f"Theatre partner efficiency, measured by revenue per active venue at INR {stats.get('revenue_per_theatre',0):,.0f},"
            f" should be benchmarked against individual theatre show schedules to identify underperforming"
            f" screens and peak-demand times. Venues with low per-show occupancy rates would benefit from"
            f" targeted promotional pushes -- flash discounts, last-minute deal notifications, or"
            f" complementary bundling with nearby dining options -- to drive fill rates upward. The"
            f" operational goal is to ensure that the fixed cost of maintaining each theatre partnership"
            f" is consistently offset by the variable revenue it generates, establishing a self-sustaining"
            f" and scalable theatre network that grows in profitability as the user base expands."
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
    # SECTION: BOOKINGS
    # =========================================================
    bookings = analytics_data.get('raw_bookings', [])
    b_rows = [
        [
            s(r.get('booking_id', ''))[-12:],           # last 12 chars of ID (unique suffix)
            s(r.get('user_id',    ''))[-12:],
            s(r.get('show_id',    ''))[-12:],
            f"Rs {r.get('total_amount', 0):,.0f}",
            s(r.get('status',         'N/A')).capitalize(),
            s(r.get('payment_status', 'N/A')).capitalize(),
            str(r.get('num_seats', 0))
        ]
        for r in bookings
    ]
    build_section(
        pdf, charts_dir,
        title='Bookings Table & Charts',
        subtitle='Booking records with status, amount and seat details',
        table_headers=['Booking ID', 'User ID', 'Show ID', 'Amount', 'Status', 'Payment', 'Seats'],
        table_rows=b_rows,
        col_widths=[28, 28, 28, 22, 22, 22, 14],
        chart_files=[
            ('booking_status_pie.png',          'Booking Status Distribution'),
            ('payment_status_pie.png',           'Payment Status Distribution'),
            ('hourly_booking_distribution.png',  'Bookings by Hour of Day'),
            ('day_of_week_distribution.png',     'Bookings by Day of Week'),
            ('booking_heatmap.png',              'Booking Activity Heatmap'),
            ('daily_revenue_trend.png',          'Daily Revenue Trend'),
        ]
    )

    # =========================================================
    # SECTION: MOVIES
    # =========================================================
    movies = analytics_data.get('raw_movies', [])
    m_rows = [
        [
            s(r.get('movie_id', ''))[-12:],
            s(r.get('title', 'N/A'))[:28],
            s(r.get('genre_names', 'N/A'))[:20],
            str(r.get('imdbRating', 'N/A')),
            str(r.get('duration_min', 'N/A')),
            'Yes' if r.get('isActive') else 'No'
        ]
        for r in movies
    ]
    build_section(
        pdf, charts_dir,
        title='Movies Table & Charts',
        subtitle='Active movie catalogue with genres, ratings and runtime',
        table_headers=['Movie ID', 'Title', 'Genre', 'Rating', 'Mins', 'Active'],
        table_rows=m_rows,
        col_widths=[26, 52, 42, 16, 16, 16],
        chart_files=[
            ('revenue_by_movie_bar.png',        'Revenue by Movie'),
            ('rating_distribution_bar.png',     'Rating Distribution'),
            ('genre_distribution_pie.png',      'Genre Distribution'),
            ('revenue_by_genre_bar.png',        'Revenue by Genre'),
            ('revenue_vs_bookings_scatter.png', 'Revenue vs Bookings')
        ]
    )

    # =========================================================
    # SECTION: THEATRES
    # =========================================================
    theatres = analytics_data.get('raw_theatres', [])
    t_rows = [
        [
            s(r.get('theatre_id', ''))[-12:],
            s(r.get('name', 'N/A'))[:28],
            s(r.get('city', 'N/A'))[:18],
            s(r.get('approval_status', 'N/A')).capitalize(),
            'Yes' if r.get('disabled') else 'No'
        ]
        for r in theatres
    ]
    build_section(
        pdf, charts_dir,
        title='Theatres Table & Charts',
        subtitle='Partner venue directory with status and city distribution',
        table_headers=['Theatre ID', 'Name', 'City', 'Status', 'Disabled'],
        table_rows=t_rows,
        col_widths=[26, 58, 38, 28, 20],
        chart_files=[
            ('revenue_by_theatre_bar.png', 'Revenue by Theatre'),
            ('theatre_city_bar.png',       'Theatres by City')
        ]
    )

    # =========================================================
    # SECTION: SHOWS
    # =========================================================
    shows = analytics_data.get('raw_shows', [])
    sh_rows = [
        [
            s(r.get('show_id',    ''))[-12:],
            s(r.get('movie_id',   ''))[-12:],
            s(r.get('theatre_id', ''))[-12:],
            s(str(r.get('show_datetime', 'N/A')))[:16],
            f"Rs {r.get('basePrice', 0):,.0f}" if r.get('basePrice') else 'N/A',
            s(r.get('status', 'N/A')).capitalize()
        ]
        for r in shows
    ]
    build_section(
        pdf, charts_dir,
        title='Shows Table & Charts',
        subtitle='Scheduled show records with timing and pricing details',
        table_headers=['Show ID', 'Movie ID', 'Theatre ID', 'Date & Time', 'Price', 'Status'],
        table_rows=sh_rows,
        col_widths=[26, 26, 26, 38, 22, 32],
        chart_files=[]
    )

    # =========================================================
    # SECTION: USERS
    # =========================================================
    users = analytics_data.get('raw_users', [])
    u_rows = [
        [
            s(r.get('user_id', ''))[-12:],
            s(r.get('name',  'N/A'))[:24],
            s(r.get('email', 'N/A'))[:28],
            s(r.get('role',  'N/A')).capitalize(),
            s(str(r.get('createdAt', 'N/A')))[:10]
        ]
        for r in users
    ]
    build_section(
        pdf, charts_dir,
        title='Users Table & Charts',
        subtitle='Registered user accounts with roles and join dates',
        table_headers=['User ID', 'Name', 'Email', 'Role', 'Joined'],
        table_rows=u_rows,
        col_widths=[26, 40, 56, 24, 24],
        chart_files=[
            ('user_role_pie.png', 'User Role Distribution')
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
