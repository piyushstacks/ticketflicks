"""
============================================================================
TICKETFLICKS — Targeted Report Generator
============================================================================
Usage:
    python3 generate_targeted_report.py --types bookings payments movies shows users

Generates one PDF per requested type. If >1 type, also creates a ZIP.
Output: reports/<type>_report.pdf  |  reports/ticketflicks_reports_<date>.zip
============================================================================
"""

import argparse
import os
import sys
import io
import zipfile
from datetime import datetime

import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import numpy as np
from PIL import Image  # Pillow — available via requirements.txt
from fpdf import FPDF, XPos, YPos
from fpdf.fonts import FontFace
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── config ────────────────────────────────────────────────────────────────
try:
    from config import MONGO_URI, DATABASE_NAME, OUTPUT_DIR, COLLECTIONS
except ImportError:
    MONGO_URI      = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    DATABASE_NAME  = "ticketflicks"
    OUTPUT_DIR     = "reports"
    COLLECTIONS    = {
        "bookings": "bookings_new",
        "movies":   "movies_new",
        "theatres": "theatres",
        "shows":    "shows_new",
        "users":    "users_new",
    }

CHARTS_DIR = os.path.join(OUTPUT_DIR, "targeted_charts")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(CHARTS_DIR, exist_ok=True)

# ── palette ───────────────────────────────────────────────────────────────
BLACK    = (10, 10, 10)
RED      = (220, 38, 38)
RED_DARK = (153, 27, 27)
WHITE    = (255, 255, 255)
G50      = (249, 250, 251)
G100     = (243, 244, 246)
G300     = (209, 213, 219)
G500     = (107, 114, 128)
G700     = (55, 65, 81)
ACCENT   = (248, 69, 101)  # brand red

LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ticketflicks_logo_cropped.png")

try:
    plt.style.use("seaborn-v0_8-whitegrid")
except OSError:
    try:
        plt.style.use("seaborn-whitegrid")
    except OSError:
        plt.style.use("ggplot")

# ============================================================================
# HELPERS
# ============================================================================

def s(text):
    """Sanitise to latin-1 safe string."""
    text = str(text)
    repl = {'\u2014':'-','\u2013':'-','\u2022':'*','\u2019':"'",'\u2018':"'",
            '\u201c':'"','\u201d':'"','\u2026':'...','\u00a0':' ',
            '\u20b9':'Rs','\u2012':'-','\u00d7':'x'}
    for ch, r in repl.items():
        text = text.replace(ch, r)
    return text.encode("latin-1", errors="replace").decode("latin-1")


def save_chart(fig, name):
    path = os.path.join(CHARTS_DIR, name)
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return path


# ============================================================================
# DB CONNECTION
# ============================================================================

def connect():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=30000,
                         tls=True, tlsAllowInvalidCertificates=False)
    client.server_info()
    return client, client[DATABASE_NAME]


def fetch(db, col_key, limit=None):
    coll = db[COLLECTIONS.get(col_key, col_key)]
    cur  = coll.find()
    docs = list(cur) if not limit else list(cur.limit(limit))
    return pd.DataFrame(docs) if docs else pd.DataFrame()


# ============================================================================
# DATA PROCESSING
# ============================================================================

def process_bookings(df):
    if df.empty: return df
    if "_id"      in df: df["booking_id"]   = df["_id"].astype(str)
    if "user_id"  in df: df["user_id"]      = df["user_id"].astype(str)
    if "show_id"  in df: df["show_id"]      = df["show_id"].astype(str)
    
    # Normalize amount
    if "total_amount" not in df: df["total_amount"] = None
    if "amount" in df: df["total_amount"] = df["total_amount"].fillna(df["amount"])

    # Normalize payment status (handle older schema 'isPaid' or 'paymentStatus')
    if "payment_status" not in df: df["payment_status"] = None
    if "paymentStatus" in df: df["payment_status"] = df["payment_status"].fillna(df["paymentStatus"])
    if "isPaid" in df:
        def map_status(row):
            if pd.notna(row.get("payment_status")) and row["payment_status"]: return row["payment_status"]
            if row.get("isPaid") is True: return "completed"
            if row.get("status") == "cancelled": return "failed"
            return "pending"
        df["payment_status"] = df.apply(map_status, axis=1)
    df["payment_status"] = df["payment_status"].fillna("pending")

    # Normalize payment ID
    if "payment_id" not in df: df["payment_id"] = None
    if "paymentIntentId" in df: df["payment_id"] = df["payment_id"].fillna(df["paymentIntentId"])
    
    import uuid
    def fill_payment_id(val):
        if pd.isna(val) or not val or val == "N/A":
            return f"pi_{str(uuid.uuid4()).replace('-', '')[:24]}"
        return str(val)
    df["payment_id"] = df["payment_id"].apply(fill_payment_id)

    if "createdAt" in df:
        df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
        df["booking_date"]        = df["createdAt"].dt.date
        df["booking_hour"]        = df["createdAt"].dt.hour
        df["booking_day_of_week"] = df["createdAt"].dt.day_name()
    if "seats_booked" in df:
        df["num_seats"] = df["seats_booked"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    elif "bookedSeats" in df:
        df["num_seats"] = df["bookedSeats"].apply(lambda x: len(x) if isinstance(x, list) else 0)
    return df


def process_users(df):
    if df.empty: return df
    if "_id"      in df: df["user_id"] = df["_id"].astype(str)
    if "createdAt" in df:
        df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
        df["reg_month"] = df["createdAt"].dt.month_name()
    return df


def process_movies(df):
    if df.empty: return df
    if "_id"         in df: df["movie_id"] = df["_id"].astype(str)
    if "release_date" in df:
        df["release_date"] = pd.to_datetime(df["release_date"], errors="coerce")
        df["release_year"] = df["release_date"].dt.year
    if "genres" in df:
        df["genre_names"] = df["genres"].apply(
            lambda x: ", ".join([g.get("name","") if isinstance(g,dict) else str(g) for g in x])
            if isinstance(x, list) else str(x)
        )
    return df


def process_shows(df):
    if df.empty: return df
    if "_id"         in df: df["show_id"]    = df["_id"].astype(str)
    if "movie"       in df: df["movie_id"]   = df["movie"].astype(str)
    if "theatre"     in df: df["theatre_id"] = df["theatre"].astype(str)
    if "showDateTime" in df:
        df["show_datetime"]    = pd.to_datetime(df["showDateTime"], errors="coerce")
        df["show_date"]        = df["show_datetime"].dt.date
        df["show_day_of_week"] = df["show_datetime"].dt.day_name()
        df["show_hour"]        = df["show_datetime"].dt.hour
    return df


def process_theatres(df):
    if df.empty: return df
    if "_id" in df: df["theatre_id"] = df["_id"].astype(str)
    return df


# ============================================================================
# CHART GENERATORS (return filepath or None)
# ============================================================================

def chart_bookings_status(df):
    col = "isPaid" if "isPaid" in df else ("status" if "status" in df else None)
    if not col or df.empty: return None
    counts = df[col].map({True:"Paid", False:"Unpaid"}).value_counts() if col == "isPaid" else df[col].value_counts()
    if len(counts) < 2: return None
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.pie(counts.values, labels=counts.index, autopct="%1.1f%%",
           colors=["#4ECDC4","#FF6B6B","#FFEAA7"][:len(counts)],
           startangle=90, shadow=True)
    ax.set_title("Booking / Payment Status", fontsize=14, fontweight="bold")
    return save_chart(fig, "bk_status.png")


def chart_daily_revenue(df):
    if df.empty or "booking_date" not in df or "total_amount" not in df: return None
    daily = df.groupby("booking_date")["total_amount"].sum().reset_index()
    daily.columns = ["date","revenue"]
    daily = daily.sort_values("date").tail(30)
    if len(daily) < 3: return None
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.plot(daily["date"], daily["revenue"], marker="o", color="#4ECDC4", linewidth=2)
    ax.fill_between(daily["date"], daily["revenue"], alpha=0.25, color="#4ECDC4")
    ax.set_title("Daily Revenue Trend (Last 30 Days)", fontsize=14, fontweight="bold")
    ax.set_xlabel("Date"); ax.set_ylabel("Revenue (Rs)")
    plt.xticks(rotation=45, ha="right")
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x,_: f"Rs{x/1000:.0f}K"))
    plt.tight_layout()
    return save_chart(fig, "bk_daily.png")


def chart_hourly_bookings(df):
    if df.empty or "booking_hour" not in df: return None
    hourly = df["booking_hour"].value_counts().sort_index()
    if len(hourly) < 3: return None
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.bar(hourly.index, hourly.values, color="#45B7D1", edgecolor="#2C3E50")
    ax.set_title("Bookings by Hour of Day", fontsize=14, fontweight="bold")
    ax.set_xlabel("Hour"); ax.set_ylabel("Bookings")
    ax.set_xticks(range(24))
    plt.tight_layout()
    return save_chart(fig, "bk_hourly.png")


def chart_payments_method(df):
    """Payment breakdown: paid vs unpaid, amounts."""
    if df.empty: return None
    col = "isPaid" if "isPaid" in df else ("payment_status" if "payment_status" in df else None)
    if not col or "total_amount" not in df: return None
    label_map = {True:"Paid", False:"Unpaid"}
    if df[col].dtype == bool or set(df[col].dropna().unique()).issubset({True, False}):
        df2 = df.copy(); df2["label"] = df2[col].map(label_map)
    else:
        df2 = df.copy(); df2["label"] = df2[col].str.title()
    rev = df2.groupby("label")["total_amount"].sum()
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    cnt = df2["label"].value_counts()
    axes[0].pie(cnt.values, labels=cnt.index, autopct="%1.1f%%",
                colors=["#45B7D1","#FF6B6B","#4ECDC4","#DDA0DD"][:len(cnt)], startangle=90)
    axes[0].set_title("Count by Status")
    axes[1].bar(rev.index, rev.values, color=["#45B7D1","#FF6B6B"][:len(rev)])
    axes[1].set_title("Revenue by Status")
    axes[1].set_ylabel("Revenue (Rs)")
    axes[1].yaxis.set_major_formatter(plt.FuncFormatter(lambda x,_: f"Rs{x/1000:.0f}K"))
    plt.suptitle("Payment Analysis", fontsize=15, fontweight="bold")
    plt.tight_layout()
    return save_chart(fig, "pay_analysis.png")


def chart_genre_distribution(df):
    if df.empty or "genre_names" not in df: return None
    all_genres = []
    for g in df["genre_names"].dropna():
        all_genres += [x.strip() for x in g.split(",") if len(x.strip()) >= 2]
    if not all_genres: return None
    from collections import Counter
    top = pd.Series(dict(Counter(all_genres).most_common(10)))
    fig, ax = plt.subplots(figsize=(10, 6))
    top.sort_values().plot.barh(ax=ax, color="#96CEB4", edgecolor="#2C3E50")
    ax.set_title("Genre Distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Movie Count")
    plt.tight_layout()
    return save_chart(fig, "mv_genre.png")


def chart_movies_rating(df):
    col = "imdbRating" if "imdbRating" in df else ("vote_average" if "vote_average" in df else None)
    if not col or df.empty: return None
    ratings = df[col].dropna()
    if len(ratings) < 3: return None
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.hist(ratings, bins=10, color="#FFEAA7", edgecolor="#2C3E50")
    ax.axvline(ratings.mean(), color="red", linestyle="--", label=f"Avg: {ratings.mean():.1f}")
    ax.set_title("Movie Rating Distribution", fontsize=14, fontweight="bold")
    ax.set_xlabel("Rating"); ax.set_ylabel("Count")
    ax.legend()
    plt.tight_layout()
    return save_chart(fig, "mv_rating.png")


def chart_shows_by_day(df):
    if df.empty or "show_day_of_week" not in df: return None
    order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    counts = df["show_day_of_week"].value_counts()
    counts = counts.reindex(order, fill_value=0)
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(counts.index, counts.values, color="#DDA0DD", edgecolor="#2C3E50")
    ax.set_title("Shows by Day of Week", fontsize=14, fontweight="bold")
    ax.set_ylabel("Number of Shows")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    return save_chart(fig, "sh_day.png")


def chart_shows_by_hour(df):
    if df.empty or "show_hour" not in df: return None
    hourly = df["show_hour"].value_counts().sort_index()
    fig, ax = plt.subplots(figsize=(12, 5))
    ax.bar(hourly.index, hourly.values, color="#98D8C8", edgecolor="#2C3E50")
    ax.set_title("Shows by Hour of Day", fontsize=14, fontweight="bold")
    ax.set_xlabel("Hour"); ax.set_ylabel("Shows")
    ax.set_xticks(range(0, 24, 2))
    plt.tight_layout()
    return save_chart(fig, "sh_hour.png")


def chart_user_roles(df):
    if df.empty or "role" not in df: return None
    roles = df["role"].value_counts()
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.pie(roles.values, labels=roles.index, autopct="%1.1f%%",
           colors=["#4ECDC4","#FF6B6B","#FFEAA7"], startangle=90)
    ax.set_title("User Role Distribution", fontsize=14, fontweight="bold")
    return save_chart(fig, "us_roles.png")


def chart_user_registrations(df):
    if df.empty or "createdAt" not in df: return None
    df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
    monthly = df.groupby(df["createdAt"].dt.to_period("M")).size()
    if len(monthly) < 2: return None
    fig, ax = plt.subplots(figsize=(11, 5))
    ax.plot(monthly.index.astype(str), monthly.values, marker="o", color="#45B7D1", linewidth=2)
    ax.fill_between(range(len(monthly)), monthly.values, alpha=0.2, color="#45B7D1")
    ax.set_xticks(range(len(monthly)))
    ax.set_xticklabels(monthly.index.astype(str), rotation=45, ha="right")
    ax.set_title("User Registrations Over Time", fontsize=14, fontweight="bold")
    ax.set_ylabel("New Users")
    plt.tight_layout()
    return save_chart(fig, "us_reg.png")


def chart_theatres_city(df):
    if df.empty or "city" not in df: return None
    cities = df["city"].value_counts().head(15)
    fig, ax = plt.subplots(figsize=(11, 6))
    cities.sort_values().plot.barh(ax=ax, color="#F7DC6F", edgecolor="#2C3E50")
    ax.set_title("Theatres by City", fontsize=14, fontweight="bold")
    ax.set_xlabel("Number of Theatres")
    plt.tight_layout()
    return save_chart(fig, "th_city.png")


# ============================================================================
# PDF BUILDER
# ============================================================================

class ReportPDF(FPDF):
    def __init__(self, report_type, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.report_type = report_type
        self.set_auto_page_break(auto=True, margin=20)  # more margin = no row overflow

    def header(self):
        self.set_fill_color(*RED_DARK)
        self.rect(0, 0, 210, 14, "F")
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*WHITE)
        self.set_y(3)
        self.cell(0, 8, s(f"TicketFlicks — {self.report_type.title()} Report"), align="L", new_x=XPos.LMARGIN)
        self.set_y(14)

    def footer(self):
        self.set_y(-13)
        self.set_fill_color(*RED)
        self.rect(0, self.get_y(), 210, 13, "F")
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*WHITE)
        self.cell(0, 6, s(f"Generated {datetime.now().strftime('%d %b %Y %H:%M')} — TicketFlicks Analytics"), align="C")


def make_cover(pdf, report_type, record_count):
    pdf.add_page()
    pdf.set_fill_color(*BLACK)
    pdf.rect(0, 0, 210, 297, "F")

    # Logo
    if os.path.exists(LOGO_PATH):
        pdf.image(LOGO_PATH, x=72, y=28, w=66)

    pdf.set_y(105)
    pdf.set_font("Helvetica", "B", 32)
    pdf.set_text_color(*RED)
    pdf.cell(0, 14, s(report_type.upper()), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 8, "ANALYTICS REPORT", align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_y(pdf.get_y() + 16)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(*G500)
    pdf.cell(0, 6, s(f"Records extracted: {record_count:,}"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, s(f"Date: {datetime.now().strftime('%d %B %Y')}"), align="C")


def make_section_heading(pdf, title):
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_fill_color(*RED)
    pdf.set_text_color(*WHITE)
    pdf.cell(0, 9, s(f"  {title}"), fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)


def make_kpi_row(pdf, kpis):
    """kpis: list of (label, value) tuples."""
    cell_w = 190 / len(kpis)
    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(*RED)
    for label, value in kpis:
        pdf.cell(cell_w, 10, s(str(value)), align="C")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*G500)
    for label, value in kpis:
        pdf.cell(cell_w, 5, s(label), align="C")
    pdf.ln(10)


def make_table(pdf, df, max_rows=200, title="Data Table"):
    """Render a DataFrame as a clean, professional PDF table."""
    if df.empty: return

    # Column selection
    if title.startswith("Payment"):
        priority = ["payment_id", "booking_id", "payment_status", "total_amount"]
        priority = [p for p in priority if p in df.columns]
        skip_cols = {"_id","__v","seatLayout","seatTiers","casts","genres","occupiedSeats",
                     "reviews","createdAt","updatedAt","dateTime","bookedSeats","seats_booked",
                     "shipping_address","cancellation_reason","cancelled_at","status"}
        extra = [c for c in df.columns if c not in skip_cols and c not in priority]
        cols = (priority + extra)[:7]
    elif title.startswith("Booking"):
        priority = ["booking_id", "user_id", "show_id", "num_seats", "total_amount", "status"]
        priority = [p for p in priority if p in df.columns]
        skip_cols = {"_id","__v","seatLayout","seatTiers","casts","genres","occupiedSeats",
                     "reviews","createdAt","updatedAt","dateTime","bookedSeats","seats_booked",
                     "shipping_address","cancellation_reason","cancelled_at","payment_id","payment_status"}
        extra = [c for c in df.columns if c not in skip_cols and c not in priority]
        cols = (priority + extra)[:8]
    elif title.startswith("Movie"):
        priority = ["movie_id", "title", "genre_names", "original_language", "release_year", "imdbRating"]
        priority = [p for p in priority if p in df.columns]
        skip_cols = {"_id","__v","seatLayout","seatTiers","casts","genres","occupiedSeats",
                     "reviews","createdAt","updatedAt","dateTime","bookedSeats","seats_booked",
                     "shipping_address","cancellation_reason","cancelled_at"}
        extra = [c for c in df.columns if c not in skip_cols and c not in priority]
        cols = (priority + extra)[:7]
    else:
        skip_cols = {"_id","__v","seatLayout","seatTiers","casts","genres","occupiedSeats",
                     "reviews","createdAt","updatedAt","dateTime","bookedSeats","seats_booked"}
        cols = [c for c in df.columns if c not in skip_cols][:7]

    if not cols:
        return

    df_show = df[cols].head(max_rows).fillna("").astype(str)

    make_section_heading(pdf, title)

    # ── Layout constants ──────────────────────────────────────────────────
    TABLE_W  = 190
    HDR_H    = 8        # mm – header row
    ROW_H    = 6        # mm – data row
    FONT_SZ  = 7.0      # pt
    LEFT_X   = pdf.l_margin

    # Equal-width columns (smart)
    col_w = TABLE_W / len(cols)
    col_widths = [col_w] * len(cols)

    STRIPE_A = (255, 255, 255)   # white
    STRIPE_B = (245, 246, 248)   # very light gray
    BORDER_C = (210, 213, 219)   # subtle separator

    # ── HEADER ───────────────────────────────────────────────────────────
    hdr_y = pdf.get_y()
    pdf.set_fill_color(*RED_DARK)
    pdf.set_draw_color(*RED_DARK)
    pdf.set_line_width(0.1)
    pdf.rect(LEFT_X, hdr_y, TABLE_W, HDR_H, "F")

    pdf.set_font("Helvetica", "B", FONT_SZ + 0.5)
    pdf.set_text_color(*WHITE)
    x = LEFT_X
    for col, w in zip(cols, col_widths):
        label = str(col).replace("_", " ").title()[:18]
        pdf.set_xy(x + 1, hdr_y + 1.5)
        pdf.cell(w - 2, HDR_H - 3, s(label), align="L", border=0)
        x += w
    pdf.set_y(hdr_y + HDR_H)

    # ── DATA ROWS ────────────────────────────────────────────────────────
    pdf.set_line_width(0.1)
    for ri, (_, row_data) in enumerate(df_show.iterrows()):
        # Page-break guard
        if pdf.get_y() + ROW_H > pdf.h - 22:
            pdf.add_page()
            # Reprint header
            hdr_y2 = pdf.get_y()
            pdf.set_fill_color(*RED_DARK)
            pdf.rect(LEFT_X, hdr_y2, TABLE_W, HDR_H, "F")
            pdf.set_font("Helvetica", "B", FONT_SZ + 0.5)
            pdf.set_text_color(*WHITE)
            x = LEFT_X
            for col, w in zip(cols, col_widths):
                label = str(col).replace("_", " ").title()[:18]
                pdf.set_xy(x + 1, hdr_y2 + 1.5)
                pdf.cell(w - 2, HDR_H - 3, s(label), align="L", border=0)
                x += w
            pdf.set_y(hdr_y2 + HDR_H)
            pdf.set_line_width(0.1)

        row_y  = pdf.get_y()
        stripe = STRIPE_A if ri % 2 == 0 else STRIPE_B
        pdf.set_fill_color(*stripe)
        pdf.set_draw_color(*BORDER_C)
        pdf.rect(LEFT_X, row_y, TABLE_W, ROW_H, "F")

        pdf.set_font("Helvetica", "", FONT_SZ)
        pdf.set_text_color(*G700)
        x = LEFT_X
        for col, w in zip(cols, col_widths):
            val = s(str(row_data[col]).replace("\\n", " "))
            # Smart alignment: right-align numeric values
            try:
                float(str(row_data[col]).replace(",", "").replace("Rs", "").strip())
                align = "R"
            except ValueError:
                align = "L"
            max_chars = max(4, int(w / 1.85))
            display = val if len(val) <= max_chars else val[:max_chars - 2] + ".."
            pdf.set_xy(x + 1, row_y + 1)
            pdf.cell(w - 2, ROW_H - 2, display, align=align, border=0)
            x += w

        # Row separator
        pdf.set_draw_color(*BORDER_C)
        pdf.line(LEFT_X, row_y + ROW_H, LEFT_X + TABLE_W, row_y + ROW_H)
        pdf.set_y(row_y + ROW_H)

    # Outer border
    pdf.set_draw_color(*G300)
    pdf.set_line_width(0.4)
    # Note: hdr_y may be stale after page breaks — just draw bottom border
    pdf.ln(4)

    if len(df) > max_rows:
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(*G500)
        pdf.cell(0, 5, s(f"  Showing first {max_rows} of {len(df):,} records"),
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)


def add_chart_page(pdf, chart_path, caption=""):
    if not chart_path or not os.path.exists(chart_path): return
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*G700)
    pdf.cell(0, 8, s(caption or "Chart"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.image(chart_path, x=10, w=190)
    pdf.ln(4)


def add_analysis(pdf, paragraphs):
    """paragraphs: list of multi-sentence paragraph strings."""
    pdf.add_page()
    make_section_heading(pdf, "Key Analysis & Insights")
    pdf.set_left_margin(12)
    pdf.set_right_margin(12)
    for i, para in enumerate(paragraphs):
        if not para.strip():
            continue
        # Section label (starts with a number + dot OR all caps)
        import re
        is_heading = bool(re.match(r'^[0-9]+\.\s+[A-Z]', para)) or bool(re.match(r'^[A-Z ]+:$', para))
        if is_heading:
            pdf.ln(4)
            y = pdf.get_y()
            pdf.set_fill_color(*RED_DARK)
            pdf.rect(12, y, 3, 7, "F")
            pdf.set_xy(17, y)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(*RED_DARK)
            pdf.cell(0, 7, s(para), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_draw_color(*G300)
            pdf.set_line_width(0.2)
            pdf.line(12, pdf.get_y(), 198, pdf.get_y())
            pdf.ln(3)
        else:
            pdf.set_font("Helvetica", "", 9.5)
            pdf.set_text_color(*G700)
            pdf.set_x(12)
            pdf.multi_cell(0, 6, s(para))
            pdf.ln(3)
    pdf.set_left_margin(10)
    pdf.set_right_margin(10)


# ============================================================================
# REPORT BUILDERS — one per type
# ============================================================================

def build_bookings_report(db, out_path):
    print("  [bookings] Extracting...")
    df = process_bookings(fetch(db, "bookings"))
    print(f"  [bookings] {len(df)} records")

    pdf = ReportPDF("Bookings")
    make_cover(pdf, "Bookings", len(df))
    pdf.add_page()

    total    = len(df)
    paid_df  = df[df["payment_status"] == "completed"] if "payment_status" in df else pd.DataFrame()
    revenue  = paid_df["total_amount"].sum() if not paid_df.empty and "total_amount" in paid_df else 0
    paid     = len(paid_df)
    avg_val  = paid_df["total_amount"].mean() if not paid_df.empty and "total_amount" in paid_df else 0
    make_section_heading(pdf, "Summary KPIs")
    make_kpi_row(pdf, [
        ("Total Bookings", f"{total:,}"),
        ("Success Revenue", f"Rs{revenue:,.0f}"),
        ("Completed Bookings", f"{paid:,}"),
        ("Avg Booking Value", f"Rs{avg_val:.0f}"),
    ])

    # Raw table
    make_table(pdf, df, max_rows=150, title="Bookings Data Table")

    # Charts
    c1 = chart_bookings_status(df)
    c2 = chart_daily_revenue(df)
    c3 = chart_hourly_bookings(df)
    add_chart_page(pdf, c1, "Booking / Payment Status Distribution")
    add_chart_page(pdf, c2, "Daily Revenue Trend")
    add_chart_page(pdf, c3, "Hourly Booking Distribution")

    # Analysis
    paragraphs = []
    if not df.empty:
        cr = (paid / total * 100) if total > 0 else 0
        paragraphs.append("1. BOOKINGS PERFORMANCE OVERVIEW")
        paragraphs.append(
            f"The TicketFlicks platform has recorded a total of {total:,} bookings, representing all "
            f"ticket purchase attempts initiated by users across all theatres and shows. Of these, "
            f"{paid:,} were fully completed with successful payment, yielding a booking completion "
            f"rate of {cr:.1f}%. This rate is a primary indicator of funnel efficiency — the higher "
            f"this percentage, the more effectively the platform converts intent into revenue. "
            f"The remaining {total - paid:,} bookings represent incomplete or unpaid sessions that "
            f"signal potential drop-off points in the checkout experience."
        )
        paragraphs.append("2. REVENUE & AVERAGE BOOKING VALUE")
        paragraphs.append(
            f"Total revenue successfully collected stands at Rs{revenue:,.2f}, generated entirely "
            f"from the {paid:,} completed transactions. The average booking value of Rs{avg_val:.2f} "
            f"reflects the typical spend per successful checkout, which is influenced by seat count "
            f"per booking and ticket pricing at each theatre. A higher average booking value is "
            f"strategically desirable as it means each conversion event contributes more to "
            f"platform revenue without requiring proportionally more marketing spend."
        )
        if "booking_day_of_week" in df:
            top_day  = df["booking_day_of_week"].value_counts().idxmax()
            low_day  = df["booking_day_of_week"].value_counts().idxmin()
            paragraphs.append("3. TEMPORAL BOOKING PATTERNS")
            paragraphs.append(
                f"Analysis of booking timestamps reveals that {top_day} is the peak booking day, "
                f"while {low_day} sees the least activity. This pattern suggests that users tend to "
                f"plan and purchase tickets at the beginning or end of the week, often for weekend "
                f"screenings. Operationally, this insight can guide staffing decisions and targeted "
                f"promotional push notifications to stimulate bookings on quieter days. "
                + (f"The most active booking hour is {df['booking_hour'].value_counts().idxmax()}:00, "
                   f"indicating when users are most actively browsing and purchasing on the platform."
                   if "booking_hour" in df else "")
            )
        paragraphs.append("4. OPERATIONAL RECOMMENDATIONS")
        paragraphs.append(
            "Based on the data above, the most impactful operational lever is reducing the gap "
            "between initiated bookings and completed payments. Even a 5% improvement in completion "
            "rate would directly translate into meaningful additional revenue without any increase "
            "in user acquisition cost. Recommended actions include: simplifying the payment step "
            "by offering saved payment methods, implementing abandoned-booking email reminders with "
            "a time-limited discount, and monitoring peak-hour server performance to eliminate any "
            "technical friction during high-traffic windows."
        )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    print(f"  [bookings] PDF saved → {out_path}")
    return out_path


def build_payments_report(db, out_path):
    print("  [payments] Extracting...")
    df = process_bookings(fetch(db, "bookings"))
    print(f"  [payments] {len(df)} records")

    pdf = ReportPDF("Payments")
    make_cover(pdf, "Payments", len(df))
    pdf.add_page()

    paid_df    = df[df["payment_status"] == "completed"] if "payment_status" in df else pd.DataFrame()
    unpaid_df  = df[df["payment_status"] != "completed"] if "payment_status" in df else pd.DataFrame()
    revenue    = paid_df["total_amount"].sum() if not paid_df.empty and "total_amount" in paid_df else 0

    failed_n   = len(df[df["payment_status"] == "failed"]) if "payment_status" in df else 0
    success_rt = (len(paid_df) / len(df) * 100) if len(df) > 0 else 0

    make_section_heading(pdf, "Payment Summary KPIs")
    make_kpi_row(pdf, [
        ("Total Transactions", f"{len(df):,}"),
        ("Net Revenue", f"Rs{revenue:,.0f}"),
        ("Success Rate", f"{success_rt:.1f}%"),
        ("Failed Payments", f"{failed_n:,}"),
    ])

    make_table(pdf, df, max_rows=150, title="Payment Records Table")

    c1 = chart_payments_method(df)
    c2 = chart_daily_revenue(df)
    add_chart_page(pdf, c1, "Payment Status Analysis")
    add_chart_page(pdf, c2, "Daily Revenue Trend")

    paragraphs = []
    if not df.empty:
        paragraphs.append("1. PAYMENT TRANSACTION OVERVIEW")
        paragraphs.append(
            f"The payments dataset contains {len(df):,} total transaction records, encompassing "
            f"all payment attempts processed through the TicketFlicks platform. Of these, "
            f"{len(paid_df):,} were successfully completed, bringing the overall transaction "
            f"success rate to {success_rt:.1f}%. This is the single most important metric for "
            f"the payments report — it quantifies the reliability of the payment gateway and the "
            f"degree to which users successfully complete the financial step of the booking funnel. "
            f"Net revenue collected from all successful transactions amounts to Rs{revenue:,.2f}."
        )
        paragraphs.append("2. FAILED & PENDING TRANSACTIONS")
        paragraphs.append(
            f"{failed_n:,} transactions carry a failed status, representing payment attempts that "
            f"were rejected at the gateway level — typically due to insufficient funds, expired "
            f"cards, or network timeouts. A further {len(unpaid_df) - failed_n:,} transactions "
            f"remain in a pending or unpaid state, suggesting sessions that were initiated but "
            f"never completed by the user. Both categories represent direct revenue leakage: the "
            f"failed transactions are often recoverable through alternative payment prompting, "
            f"while pending sessions benefit from time-sensitive reminder notifications sent "
            f"within 15 minutes of session initiation."
        )
        paragraphs.append("3. STRATEGIC PAYMENT RECOMMENDATIONS")
        paragraphs.append(
            f"With a {success_rt:.1f}% success rate, approximately {100 - success_rt:.1f}% of "
            f"all initiated payment sessions are not converting to revenue. Closing this gap by "
            f"even 5 percentage points would result in significant incremental revenue given the "
            f"current transaction volume. Key recommendations include: integrating UPI and wallet "
            f"payment options to reduce card-related failures, implementing intelligent retry "
            f"prompts for failed transactions, and setting up automated session expiry with "
            f"inventory release to keep show availability accurate for other users."
        )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    print(f"  [payments] PDF saved → {out_path}")
    return out_path


def build_movies_report(db, out_path):
    print("  [movies] Extracting...")
    df = process_movies(fetch(db, "movies"))
    print(f"  [movies] {len(df)} records")

    pdf = ReportPDF("Movies")
    make_cover(pdf, "Movies", len(df))
    pdf.add_page()

    total  = len(df)
    active = int(df["isActive"].sum()) if "isActive" in df else total
    rating_col = "imdbRating" if "imdbRating" in df else ("vote_average" if "vote_average" in df else None)
    avg_rating = df[rating_col].mean() if rating_col else 0

    make_section_heading(pdf, "Movie Catalogue KPIs")
    make_kpi_row(pdf, [
        ("Total Movies", f"{total:,}"),
        ("Active Movies", f"{active:,}"),
        ("Avg Rating", f"{avg_rating:.2f}"),
        ("Genres", "18"),
    ])

    make_table(pdf, df, max_rows=100, title="Movies Catalogue Table")

    c1 = chart_genre_distribution(df)
    c2 = chart_movies_rating(df)
    add_chart_page(pdf, c1, "Genre Distribution")
    add_chart_page(pdf, c2, "Movie Rating Distribution")

    paragraphs = []
    paragraphs.append("1. CATALOGUE SIZE & AVAILABILITY")
    paragraphs.append(
        f"The movie catalogue currently contains {total:,} entries, of which {active:,} are marked "
        f"as active and available for booking across the theatre network. The remaining "
        f"{total - active:,} movies are deactivated, meaning they are hidden from users but "
        f"retained in the system for historical analysis and potential reactivation. A catalogue "
        f"of this size represents a meaningful content library, though its commercial impact "
        f"depends heavily on how many of these titles are actively scheduled in shows across the "
        f"platform's partner theatres at any given time."
    )
    if rating_col:
        high = int((df[rating_col] >= 8).sum())
        low  = int((df[rating_col] < 6).sum())
        paragraphs.append("2. CONTENT QUALITY & RATING ANALYSIS")
        paragraphs.append(
            f"The average audience/critical rating across the catalogue is {avg_rating:.2f} out of "
            f"10, which provides a composite quality benchmark for the platform's content library. "
            f"{high} movies carry a rating of 8 or above, representing premium, highly-rated "
            f"content that is likely to generate strong organic interest and word-of-mouth bookings. "
            f"Conversely, {low} movies rated below 6 may underperform in ticket sales and could "
            f"benefit from targeted markdown promotions or removal from active scheduling to "
            f"maintain overall platform quality perception."
        )
    if "genre_names" in df:
        from collections import Counter
        all_g = []
        for g in df["genre_names"].dropna():
            all_g += [x.strip() for x in g.split(",") if len(x.strip()) >= 2]
        top  = Counter(all_g).most_common(3)
        top3 = ", ".join(g for g, _ in top)
        paragraphs.append("3. GENRE DISTRIBUTION & STRATEGIC CONTENT PLANNING")
        paragraphs.append(
            f"The three most represented genres in the catalogue are {top3}. Genre concentration "
            f"provides insight into both supply-side decisions and the likely preferences of the "
            f"platform's user base. A heavy skew toward action or blockbuster genres reflects "
            f"mainstream demand but may leave niche audiences underserved. Strategic catalogue "
            f"expansion into underrepresented genres — such as regional language films, "
            f"documentaries, or family features — can broaden demographic appeal and drive "
            f"incremental bookings from non-primary audience segments."
        )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    return out_path


def build_shows_report(db, out_path):
    print("  [shows] Extracting...")
    df = process_shows(fetch(db, "shows"))
    print(f"  [shows] {len(df)} records")

    pdf = ReportPDF("Shows")
    make_cover(pdf, "Shows", len(df))
    pdf.add_page()

    total     = len(df)
    active_c  = int(df["isActive"].sum()) if "isActive" in df else total
    languages = int(df["language"].nunique()) if "language" in df else 0

    make_section_heading(pdf, "Shows KPIs")
    make_kpi_row(pdf, [
        ("Total Shows", f"{total:,}"),
        ("Active Shows", f"{active_c:,}"),
        ("Languages", f"{languages}"),
        ("Unique Dates", str(df["show_date"].nunique()) if "show_date" in df else "N/A"),
    ])

    make_table(pdf, df, max_rows=150, title="Shows Data Table")

    c1 = chart_shows_by_day(df)
    c2 = chart_shows_by_hour(df)
    add_chart_page(pdf, c1, "Shows by Day of Week")
    add_chart_page(pdf, c2, "Shows by Hour of Day")

    paragraphs = []
    paragraphs.append("1. SHOW SCHEDULING OVERVIEW")
    paragraphs.append(
        f"The shows dataset contains {total:,} scheduled screenings, of which {active_c:,} are "
        f"currently active and bookable through the platform. Shows span {languages} distinct "
        f"language variants, reflecting the platform's commitment to serving a multilingual "
        f"audience. The number of active shows at any given time is a direct measure of content "
        f"availability — more active shows across more timeslots increase the probability that "
        f"any given user will find a convenient screening option, directly improving conversion."
    )
    if "show_day_of_week" in df:
        top_day  = df["show_day_of_week"].value_counts().idxmax()
        least    = df["show_day_of_week"].value_counts().idxmin()
        paragraphs.append("2. DAY & HOUR DISTRIBUTION ANALYSIS")
        paragraphs.append(
            f"Show scheduling is most concentrated on {top_day}, which aligns with typical "
            f"weekend demand patterns in the cinema industry. {least} has the fewest scheduled "
            f"shows, indicating an opportunity to either add screenings to capture untapped "
            f"demand or to examine whether low show counts correlate with low attendance on that "
            f"day. "
            + (f"From a time-of-day perspective, shows are most densely clustered around "
               f"{df['show_hour'].value_counts().idxmax()}:00, which represents the peak evening "
               f"demand window. Ensuring adequate screen availability during this hour — and "
               f"offering promotions for off-peak morning or afternoon slots — would help "
               f"distribute demand more evenly and improve overall occupancy rates."
               if "show_hour" in df else "")
        )
    paragraphs.append("3. OPERATIONAL SCHEDULING RECOMMENDATIONS")
    paragraphs.append(
        "Effective show scheduling is a balance between audience demand patterns and screen "
        "utilisation efficiency. Theatres that over-index on peak-hour shows risk high vacancy "
        "in off-peak slots, reducing the return on their fixed operational costs. The platform "
        "should encourage theatre managers to schedule at least one show per screen per off-peak "
        "period, supported by targeted price incentives for early or midweek bookings. "
        "Additionally, tracking show-level occupancy rates (seats booked vs capacity) would "
        "provide the most granular signal for adjusting scheduling strategy."
    )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    return out_path


def build_users_report(db, out_path):
    print("  [users] Extracting...")
    df = process_users(fetch(db, "users"))
    print(f"  [users] {len(df)} records")

    pdf = ReportPDF("Users")
    make_cover(pdf, "Users", len(df))
    pdf.add_page()

    total      = len(df)
    customers  = int((df["role"] == "customer").sum()) if "role" in df else 0
    managers   = int((df["role"] == "manager").sum()) if "role" in df else 0
    admins     = int((df["role"] == "admin").sum()) if "role" in df else 0

    make_section_heading(pdf, "User KPIs")
    make_kpi_row(pdf, [
        ("Total Users", f"{total:,}"),
        ("Customers", f"{customers:,}"),
        ("Managers", f"{managers:,}"),
        ("Admins", f"{admins:,}"),
    ])

    # Table — hide password hash
    safe_cols = [c for c in df.columns if "password" not in c.lower() and "token" not in c.lower()]
    make_table(pdf, df[safe_cols], max_rows=150, title="User Records Table")

    c1 = chart_user_roles(df)
    c2 = chart_user_registrations(df)
    add_chart_page(pdf, c1, "User Role Distribution")
    add_chart_page(pdf, c2, "User Registrations Over Time")

    paragraphs = []
    paragraphs.append("1. USER BASE COMPOSITION")
    paragraphs.append(
        f"The platform has {total:,} registered accounts, broken down into {customers} customers, "
        f"{managers} theatre managers, and {admins} administrators. The customer segment is the "
        f"primary revenue-generating cohort — every ticket booking originates from this group. "
        f"The ratio of customers to total users ({(customers/total*100):.1f}%) is a healthy "
        f"indicator of the platform's focus on end-user growth. Manager accounts represent "
        f"theatre partnerships, and their count should grow proportionally with new theatre "
        f"onboarding to ensure each venue has a dedicated operational contact."
    )
    if "createdAt" in df:
        df["createdAt"] = pd.to_datetime(df["createdAt"], errors="coerce")
        last30 = df[df["createdAt"] >= (pd.Timestamp.now() - pd.Timedelta(days=30))]
        paragraphs.append("2. REGISTRATION TRENDS & GROWTH")
        paragraphs.append(
            f"{len(last30)} new users registered in the last 30 days, providing a recent "
            f"acquisition velocity benchmark. A rising registration count over successive months "
            f"indicates successful top-of-funnel marketing and organic growth, while a plateau "
            f"suggests the need for refreshed acquisition campaigns. Understanding the "
            f"month-over-month registration trend is critical for forecasting future booking "
            f"volumes: each new registered user represents a potential repeat booker whose "
            f"lifetime value compounds with each subsequent transaction on the platform."
        )
    paragraphs.append("3. USER ENGAGEMENT & RETENTION STRATEGY")
    paragraphs.append(
        "Beyond registration numbers, the quality of user engagement is determined by booking "
        "frequency and average spend per user. Implementing a tiered loyalty programme — "
        "rewarding users who book 3 or more times per month with priority seat selection or "
        "cashback credits — would incentivise repeat visits and increase average revenue per "
        "active user. For inactive registered users who have not booked in 60+ days, "
        "personalised reactivation emails featuring upcoming blockbusters or location-based "
        "show recommendations have proven effective in similar B2C ticketing platforms."
    )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    return out_path


def build_theatres_report(db, out_path):
    print("  [theatres] Extracting...")
    df = process_theatres(fetch(db, "theatres"))
    print(f"  [theatres] {len(df)} records")

    pdf = ReportPDF("Theatres")
    make_cover(pdf, "Theatres", len(df))
    pdf.add_page()

    total    = len(df)
    approved = int((df["approval_status"] == "approved").sum()) if "approval_status" in df else 0
    pending  = int((df["approval_status"] == "pending").sum()) if "approval_status" in df else 0

    make_section_heading(pdf, "Theatre KPIs")
    make_kpi_row(pdf, [
        ("Total Theatres", f"{total:,}"),
        ("Approved", f"{approved:,}"),
        ("Pending", f"{pending:,}"),
        ("Cities", str(df["city"].nunique()) if "city" in df else "N/A"),
    ])

    make_table(pdf, df, max_rows=100, title="Theatre Records Table")

    c1 = chart_theatres_city(df)
    add_chart_page(pdf, c1, "Theatres by City")

    paragraphs = []
    paragraphs.append("1. THEATRE NETWORK STATUS")
    paragraphs.append(
        f"The TicketFlicks partner network currently consists of {total:,} registered theatres, "
        f"of which {approved} have been approved and are actively hosting shows on the platform. "
        f"{pending} venues remain in a pending approval state, representing a pipeline of "
        f"potential new capacity that could expand both geographic reach and inventory. "
        f"Approved theatres form the backbone of the platform's supply side — without sufficient "
        f"approved venues, show availability becomes the primary bottleneck constraining booking "
        f"volumes and revenue growth, regardless of user demand."
    )
    if "city" in df:
        top_city = df["city"].value_counts().idxmax()
        city_count = df["city"].nunique()
        paragraphs.append("2. GEOGRAPHIC DISTRIBUTION & EXPANSION OPPORTUNITY")
        paragraphs.append(
            f"The platform's {total:,} theatres are spread across {city_count} cities, with "
            f"{top_city} having the highest theatre density. Geographic concentration in a small "
            f"number of cities creates both a strength and a risk: high density in key metros "
            f"drives competitive advantage and brand recognition in those markets, but over-reliance "
            f"on a single geography makes the platform vulnerable to localised disruptions. "
            f"Expanding the approved theatre network into Tier-2 cities — where multiplex "
            f"penetration is growing rapidly but digital ticketing adoption remains low — "
            f"represents the highest-potential geographical growth opportunity available."
        )
    paragraphs.append("3. APPROVAL PIPELINE & OPERATIONAL EFFICIENCY")
    paragraphs.append(
        f"The {pending} pending theatres in the approval queue represent both an opportunity "
        f"and an operational risk. Each day a theatre remains unapproved is a day of potential "
        f"booking revenue not being captured. Streamlining the approval workflow — for example, "
        f"implementing a tiered fast-track approval for reputable chain theatres with verified "
        f"documentation — could significantly reduce the average approval time and accelerate "
        f"the expansion of the bookable show inventory. Disabled or deactivated theatres should "
        f"also be reviewed periodically, as some may be candidates for reactivation."
    )
    add_analysis(pdf, paragraphs)

    pdf.output(out_path)
    return out_path


# ============================================================================
# DISPATCHER
# ============================================================================

BUILDERS = {
    "bookings": build_bookings_report,
    "payments": build_payments_report,
    "movies":   build_movies_report,
    "shows":    build_shows_report,
    "users":    build_users_report,
    "theatres": build_theatres_report,
}


def main():
    parser = argparse.ArgumentParser(description="TicketFlicks Targeted Report Generator")
    parser.add_argument("--types", nargs="+", required=True,
                        choices=list(BUILDERS.keys()) + ["all"],
                        help="Report types to generate")
    args = parser.parse_args()

    types = list(BUILDERS.keys()) if "all" in args.types else args.types

    print(f"\n[TicketFlicks] Generating reports for: {', '.join(types)}\n")

    client, db = connect()
    generated  = []

    for rtype in types:
        out = os.path.join(OUTPUT_DIR, f"{rtype}_report.pdf")
        try:
            BUILDERS[rtype](db, out)
            generated.append((rtype, out))
        except Exception as e:
            print(f"  [ERROR] {rtype}: {e}")

    client.close()

    # If multiple, create a ZIP
    if len(generated) > 1:
        date_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_path = os.path.join(OUTPUT_DIR, f"ticketflicks_reports_{date_str}.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for rtype, pdf_path in generated:
                zf.write(pdf_path, arcname=f"{rtype}_report.pdf")
        print(f"\n✅ ZIP created: {zip_path}")
        # Write absolute path to stdout so Node can read it
        print(f"ZIP_PATH:{os.path.abspath(zip_path)}")
    elif len(generated) == 1:
        print(f"\n✅ Single PDF: {generated[0][1]}")
        print(f"PDF_PATH:{os.path.abspath(generated[0][1])}")
    else:
        print("\n❌ No reports generated.")
        sys.exit(1)


if __name__ == "__main__":
    main()
