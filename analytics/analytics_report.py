"""
============================================================================
TICKETFLICKS - MongoDB Analytics & Reporting Pipeline
============================================================================
Professional Data Analytics Script for Movie Ticket Booking System

This script extracts data from MongoDB, generates Excel reports, and creates
visual analytics charts for business intelligence.

Author: Analytics Team
Version: 1.0.0
============================================================================
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for server environments
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import numpy as np
from collections import Counter

# Add current directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import configuration
try:
    from config import MONGO_URI, DATABASE_NAME, OUTPUT_DIR, CHART_COLORS, COLLECTIONS
    print("✓ Loaded configuration from config.py")
except ImportError as e:
    print(f"⚠ Config import failed: {e}, using defaults")
    # Fallback if config.py not found
    MONGO_URI = "mongodb://localhost:27017/"
    DATABASE_NAME = "ticketflicks"
    OUTPUT_DIR = "reports"
    CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
    COLLECTIONS = {
        'bookings': 'bookings_new',
        'movies': 'movies_new',
        'theatres': 'theatres',
        'shows': 'shows_new',
        'users': 'users_new',
    }

# ============================================================================
# CONFIGURATION
# ============================================================================

# Output Directory
CHARTS_DIR = os.path.join(OUTPUT_DIR, "charts")
EXCEL_FILE = os.path.join(OUTPUT_DIR, "ticketflicks_analytics_report.xlsx")

# Chart styling - use a safe style
try:
    plt.style.use('seaborn-v0_8-whitegrid')
except OSError:
    try:
        plt.style.use('seaborn-whitegrid')
    except OSError:
        plt.style.use('ggplot')
sns.set_palette("husl")

# ============================================================================
# MONGODB CONNECTION & DATA EXTRACTION
# ============================================================================

def connect_to_mongodb():
    """Establish connection to MongoDB database."""
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()  # Test connection
        print(f"✓ Connected to MongoDB: {MONGO_URI}")
        return client, client[DATABASE_NAME]
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        raise


def extract_bookings_data(db):
    """Extract and process bookings collection data."""
    print("  → Extracting bookings data...")
    
    bookings = list(db[COLLECTIONS.get('bookings', 'bookings_new')].find())
    if not bookings:
        return pd.DataFrame()
    
    df = pd.DataFrame(bookings)
    
    # Flatten nested fields
    if 'seats_booked' in df.columns:
        df['num_seats'] = df['seats_booked'].apply(lambda x: len(x) if isinstance(x, list) else 0)
    
    # Convert ObjectId to string
    if '_id' in df.columns:
        df['booking_id'] = df['_id'].astype(str)
    if 'user_id' in df.columns:
        df['user_id'] = df['user_id'].astype(str)
    if 'show_id' in df.columns:
        df['show_id'] = df['show_id'].astype(str)
    
    # Convert timestamps
    for col in ['createdAt', 'updatedAt', 'cancelled_at', 'refunded_at']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Extract date components
    if 'createdAt' in df.columns:
        df['booking_date'] = df['createdAt'].dt.date
        df['booking_hour'] = df['createdAt'].dt.hour
        df['booking_day_of_week'] = df['createdAt'].dt.day_name()
        df['booking_month'] = df['createdAt'].dt.month_name()
    
    print(f"    ✓ Extracted {len(df)} booking records")
    return df


def extract_movies_data(db):
    """Extract and process movies collection data."""
    print("  → Extracting movies data...")
    
    movies = list(db[COLLECTIONS.get('movies', 'movies_new')].find())
    if not movies:
        return pd.DataFrame()
    
    df = pd.DataFrame(movies)
    
    # Convert ObjectId to string
    if '_id' in df.columns:
        df['movie_id'] = df['_id'].astype(str)
    
    # Convert timestamps
    if 'release_date' in df.columns:
        df['release_date'] = pd.to_datetime(df['release_date'], errors='coerce')
        df['release_year'] = df['release_date'].dt.year
        df['release_month'] = df['release_date'].dt.month_name()
    
    # Extract genre names
    if 'genres' in df.columns:
        df['genre_names'] = df['genres'].apply(
            lambda x: ', '.join([g.get('name', str(g)) if isinstance(g, dict) else str(g) for g in x]) 
            if isinstance(x, list) else str(x)
        )
    
    print(f"    ✓ Extracted {len(df)} movie records")
    return df


def extract_theatres_data(db):
    """Extract and process theatres collection data."""
    print("  → Extracting theatres data...")
    
    theatres = list(db[COLLECTIONS.get('theatres', 'theatres')].find())
    if not theatres:
        return pd.DataFrame()
    
    df = pd.DataFrame(theatres)
    
    # Convert ObjectId to string
    if '_id' in df.columns:
        df['theatre_id'] = df['_id'].astype(str)
    if 'manager_id' in df.columns:
        df['manager_id'] = df['manager_id'].astype(str)
    
    # Convert timestamps
    for col in ['createdAt', 'updatedAt', 'approval_date', 'disabled_date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    print(f"    ✓ Extracted {len(df)} theatre records")
    return df


def extract_shows_data(db):
    """Extract and process shows collection data."""
    print("  → Extracting shows data...")
    
    shows = list(db[COLLECTIONS.get('shows', 'shows_new')].find())
    if not shows:
        return pd.DataFrame()
    
    df = pd.DataFrame(shows)
    
    # Convert ObjectId to string
    if '_id' in df.columns:
        df['show_id'] = df['_id'].astype(str)
    if 'movie' in df.columns:
        df['movie_id'] = df['movie'].astype(str)
    if 'theatre' in df.columns:
        df['theatre_id'] = df['theatre'].astype(str)
    if 'screen' in df.columns:
        df['screen_id'] = df['screen'].astype(str)
    
    # Convert timestamps
    if 'showDateTime' in df.columns:
        df['show_datetime'] = pd.to_datetime(df['showDateTime'], errors='coerce')
        df['show_date'] = df['show_datetime'].dt.date
        df['show_hour'] = df['show_datetime'].dt.hour
        df['show_day_of_week'] = df['show_datetime'].dt.day_name()
    
    # Calculate seat occupancy
    if 'seatTiers' in df.columns:
        df['total_occupied_seats'] = df['seatTiers'].apply(
            lambda tiers: sum(len(t.get('occupiedSeats', {})) for t in (tiers if isinstance(tiers, list) else []))
        )
    
    print(f"    ✓ Extracted {len(df)} show records")
    return df


def extract_users_data(db):
    """Extract and process users collection data."""
    print("  → Extracting users data...")
    
    users = list(db[COLLECTIONS.get('users', 'users_new')].find())
    if not users:
        return pd.DataFrame()
    
    df = pd.DataFrame(users)
    
    # Convert ObjectId to string
    if '_id' in df.columns:
        df['user_id'] = df['_id'].astype(str)
    
    # Convert timestamps
    for col in ['createdAt', 'updatedAt', 'last_login']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Extract date components
    if 'createdAt' in df.columns:
        df['registration_date'] = df['createdAt'].dt.date
        df['registration_month'] = df['createdAt'].dt.month_name()
    
    print(f"    ✓ Extracted {len(df)} user records")
    return df


# ============================================================================
# DATA AGGREGATION & ANALYSIS
# ============================================================================

def create_enriched_bookings_data(bookings_df, shows_df, movies_df, theatres_df, users_df):
    """Create enriched bookings data with movie, theatre, and user details."""
    print("  → Enriching bookings data with related entities...")
    
    if bookings_df.empty:
        return pd.DataFrame()
    
    enriched = bookings_df.copy()
    
    # Merge with shows
    if not shows_df.empty and 'show_id' in enriched.columns and 'show_id' in shows_df.columns:
        show_cols = ['show_id', 'movie_id', 'theatre_id', 'show_datetime', 'show_date', 
                     'show_hour', 'basePrice', 'language', 'status']
        available_show_cols = [c for c in show_cols if c in shows_df.columns]
        enriched = enriched.merge(
            shows_df[available_show_cols].rename(columns={'status': 'show_status'}),
            on='show_id',
            how='left'
        )
    
    # Merge with movies
    if not movies_df.empty and 'movie_id' in enriched.columns and 'movie_id' in movies_df.columns:
        movie_cols = ['movie_id', 'title', 'genre_names', 'imdbRating', 'duration_min', 'release_date']
        available_movie_cols = [c for c in movie_cols if c in movies_df.columns]
        enriched = enriched.merge(
            movies_df[available_movie_cols],
            on='movie_id',
            how='left'
        )
    
    # Merge with theatres
    if not theatres_df.empty and 'theatre_id' in enriched.columns and 'theatre_id' in theatres_df.columns:
        theatre_cols = ['theatre_id', 'name', 'city', 'location', 'state']
        available_theatre_cols = [c for c in theatre_cols if c in theatres_df.columns]
        enriched = enriched.merge(
            theatres_df[available_theatre_cols].rename(columns={'name': 'theatre_name'}),
            on='theatre_id',
            how='left'
        )
    
    # Merge with users
    if not users_df.empty and 'user_id' in enriched.columns and 'user_id' in users_df.columns:
        user_cols = ['user_id', 'name', 'email', 'role']
        available_user_cols = [c for c in user_cols if c in users_df.columns]
        enriched = enriched.merge(
            users_df[available_user_cols].rename(columns={'name': 'customer_name'}),
            on='user_id',
            how='left'
        )
    
    print(f"    ✓ Created enriched dataset with {len(enriched)} records")
    return enriched


def generate_booking_analytics(bookings_df):
    """Generate booking analytics summary."""
    if bookings_df.empty:
        return {}
    
    analytics = {
        'total_bookings': len(bookings_df),
        'total_revenue': bookings_df['total_amount'].sum() if 'total_amount' in bookings_df else 0,
        'average_booking_value': bookings_df['total_amount'].mean() if 'total_amount' in bookings_df else 0,
        'total_seats_booked': bookings_df['num_seats'].sum() if 'num_seats' in bookings_df else 0,
        'average_seats_per_booking': bookings_df['num_seats'].mean() if 'num_seats' in bookings_df else 0,
    }
    
    # Status breakdown
    if 'status' in bookings_df:
        analytics['bookings_by_status'] = bookings_df['status'].value_counts().to_dict()
    
    # Payment status breakdown
    if 'payment_status' in bookings_df:
        analytics['bookings_by_payment_status'] = bookings_df['payment_status'].value_counts().to_dict()
    
    # Revenue by status
    if 'status' in bookings_df and 'total_amount' in bookings_df:
        analytics['revenue_by_status'] = bookings_df.groupby('status')['total_amount'].sum().to_dict()
    
    # Daily booking trends
    if 'booking_date' in bookings_df:
        daily = bookings_df.groupby('booking_date').agg({
            'booking_id': 'count',
            'total_amount': 'sum'
        }).reset_index()
        daily.columns = ['date', 'bookings', 'revenue']
        analytics['daily_trends'] = daily
    
    # Hourly distribution
    if 'booking_hour' in bookings_df:
        analytics['hourly_distribution'] = bookings_df['booking_hour'].value_counts().sort_index().to_dict()
    
    # Day of week distribution
    if 'booking_day_of_week' in bookings_df:
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        dow = bookings_df['booking_day_of_week'].value_counts()
        analytics['day_of_week_distribution'] = {day: dow.get(day, 0) for day in day_order}
    
    return analytics


def generate_movie_analytics(movies_df, enriched_bookings_df):
    """Generate movie analytics summary."""
    if movies_df.empty:
        return {}
    
    analytics = {
        'total_movies': len(movies_df),
        'active_movies': len(movies_df[movies_df.get('isActive', True) == True]),
    }
    
    # Genre distribution
    if 'genre_names' in movies_df:
        all_genres = []
        for genres in movies_df['genre_names'].dropna():
            all_genres.extend([g.strip() for g in genres.split(',')])
        analytics['genre_distribution'] = dict(Counter(all_genres).most_common(10))
    
    # Rating distribution
    if 'imdbRating' in movies_df:
        ratings = movies_df['imdbRating'].dropna()
        analytics['average_rating'] = ratings.mean()
        analytics['rating_distribution'] = {
            '9-10': len(ratings[(ratings >= 9)]),
            '8-9': len(ratings[(ratings >= 8) & (ratings < 9)]),
            '7-8': len(ratings[(ratings >= 7) & (ratings < 8)]),
            '6-7': len(ratings[(ratings >= 6) & (ratings < 7)]),
            'Below 6': len(ratings[(ratings < 6)])
        }
    
    # Movie performance from bookings
    if not enriched_bookings_df.empty and 'title' in enriched_bookings_df:
        movie_perf = enriched_bookings_df.groupby('title').agg({
            'booking_id': 'count',
            'total_amount': 'sum',
            'num_seats': 'sum'
        }).reset_index()
        movie_perf.columns = ['movie', 'bookings', 'revenue', 'seats_sold']
        movie_perf = movie_perf.sort_values('revenue', ascending=False)
        analytics['top_movies_by_revenue'] = movie_perf.head(10).to_dict('records')
        analytics['top_movies_by_bookings'] = movie_perf.nlargest(10, 'bookings').to_dict('records')
    
    return analytics


def generate_theatre_analytics(theatres_df, enriched_bookings_df):
    """Generate theatre analytics summary."""
    if theatres_df.empty:
        return {}
    
    analytics = {
        'total_theatres': len(theatres_df),
        'approved_theatres': len(theatres_df[theatres_df.get('approval_status', '') == 'approved']),
        'pending_theatres': len(theatres_df[theatres_df.get('approval_status', '') == 'pending']),
    }
    
    # City distribution
    if 'city' in theatres_df:
        analytics['theatres_by_city'] = theatres_df['city'].value_counts().to_dict()
    
    # Approval status distribution
    if 'approval_status' in theatres_df:
        analytics['approval_status_distribution'] = theatres_df['approval_status'].value_counts().to_dict()
    
    # Theatre performance from bookings
    if not enriched_bookings_df.empty and 'theatre_name' in enriched_bookings_df:
        theatre_perf = enriched_bookings_df.groupby('theatre_name').agg({
            'booking_id': 'count',
            'total_amount': 'sum',
            'num_seats': 'sum'
        }).reset_index()
        theatre_perf.columns = ['theatre', 'bookings', 'revenue', 'seats_sold']
        theatre_perf = theatre_perf.sort_values('revenue', ascending=False)
        analytics['top_theatres_by_revenue'] = theatre_perf.head(10).to_dict('records')
    
    return analytics


def generate_user_analytics(users_df, bookings_df):
    """Generate user analytics summary."""
    if users_df.empty:
        return {}
    
    analytics = {
        'total_users': len(users_df),
    }
    
    # Role distribution
    if 'role' in users_df:
        analytics['users_by_role'] = users_df['role'].value_counts().to_dict()
    
    # Registration trends
    if 'registration_month' in users_df:
        analytics['registration_by_month'] = users_df['registration_month'].value_counts().to_dict()
    
    # User booking activity
    if not bookings_df.empty and 'user_id' in bookings_df:
        user_activity = bookings_df.groupby('user_id').agg({
            'booking_id': 'count',
            'total_amount': 'sum'
        }).reset_index()
        user_activity.columns = ['user_id', 'total_bookings', 'total_spent']
        
        analytics['users_with_bookings'] = len(user_activity)
        analytics['average_bookings_per_user'] = user_activity['total_bookings'].mean()
        analytics['average_spend_per_user'] = user_activity['total_spent'].mean()
        analytics['top_customers'] = user_activity.nlargest(10, 'total_spent').to_dict('records')
    
    return analytics


# ============================================================================
# CHART GENERATION
# ============================================================================

def save_chart(fig, filename):
    """Save chart to file."""
    filepath = os.path.join(CHARTS_DIR, filename)
    fig.savefig(filepath, dpi=150, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close(fig)
    print(f"    ✓ Saved: {filename}")
    return filepath


def create_booking_status_pie(bookings_df):
    """Create booking status distribution pie chart."""
    if bookings_df.empty or 'status' not in bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(10, 8))
    status_counts = bookings_df['status'].value_counts()
    
    colors = ['#4ECDC4', '#FF6B6B', '#FFEAA7'][:len(status_counts)]
    explode = [0.05] * len(status_counts)
    
    wedges, texts, autotexts = ax.pie(
        status_counts.values,
        labels=status_counts.index.str.title(),
        autopct='%1.1f%%',
        colors=colors,
        explode=explode,
        shadow=True,
        startangle=90
    )
    
    ax.set_title('Booking Status Distribution', fontsize=16, fontweight='bold', pad=20)
    
    # Add legend
    ax.legend(wedges, [f"{label}: {count:,}" for label, count in zip(status_counts.index.str.title(), status_counts.values)],
              title="Status", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    return save_chart(fig, 'booking_status_pie.png')


def create_payment_status_pie(bookings_df):
    """Create payment status distribution pie chart."""
    if bookings_df.empty or 'payment_status' not in bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(10, 8))
    payment_counts = bookings_df['payment_status'].value_counts()
    
    colors = ['#45B7D1', '#96CEB4', '#FF6B6B', '#DDA0DD'][:len(payment_counts)]
    explode = [0.05] * len(payment_counts)
    
    wedges, texts, autotexts = ax.pie(
        payment_counts.values,
        labels=payment_counts.index.str.title(),
        autopct='%1.1f%%',
        colors=colors,
        explode=explode,
        shadow=True,
        startangle=90
    )
    
    ax.set_title('Payment Status Distribution', fontsize=16, fontweight='bold', pad=20)
    
    ax.legend(wedges, [f"{label}: {count:,}" for label, count in zip(payment_counts.index.str.title(), payment_counts.values)],
              title="Payment Status", loc="center left", bbox_to_anchor=(1, 0, 0.5, 1))
    
    return save_chart(fig, 'payment_status_pie.png')


def create_revenue_by_movie_bar(enriched_bookings_df):
    """Create revenue by movie bar chart."""
    if enriched_bookings_df.empty or 'title' not in enriched_bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(14, 8))
    
    revenue_by_movie = enriched_bookings_df.groupby('title')['total_amount'].sum().sort_values(ascending=True).tail(15)
    
    bars = ax.barh(revenue_by_movie.index, revenue_by_movie.values, color='#4ECDC4', edgecolor='#2C3E50', linewidth=0.5)
    
    ax.set_xlabel('Revenue (₹)', fontsize=12)
    ax.set_ylabel('Movie', fontsize=12)
    ax.set_title('Top 15 Movies by Revenue', fontsize=16, fontweight='bold', pad=20)
    
    # Add value labels
    for bar, value in zip(bars, revenue_by_movie.values):
        ax.text(value + (revenue_by_movie.max() * 0.01), bar.get_y() + bar.get_height()/2,
                f'₹{value:,.0f}', va='center', fontsize=9)
    
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'₹{x/1000:.0f}K'))
    
    plt.tight_layout()
    return save_chart(fig, 'revenue_by_movie_bar.png')


def create_revenue_by_theatre_bar(enriched_bookings_df):
    """Create revenue by theatre bar chart."""
    if enriched_bookings_df.empty or 'theatre_name' not in enriched_bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(14, 8))
    
    revenue_by_theatre = enriched_bookings_df.groupby('theatre_name')['total_amount'].sum().sort_values(ascending=True).tail(15)
    
    bars = ax.barh(revenue_by_theatre.index, revenue_by_theatre.values, color='#45B7D1', edgecolor='#2C3E50', linewidth=0.5)
    
    ax.set_xlabel('Revenue (₹)', fontsize=12)
    ax.set_ylabel('Theatre', fontsize=12)
    ax.set_title('Top 15 Theatres by Revenue', fontsize=16, fontweight='bold', pad=20)
    
    for bar, value in zip(bars, revenue_by_theatre.values):
        ax.text(value + (revenue_by_theatre.max() * 0.01), bar.get_y() + bar.get_height()/2,
                f'₹{value:,.0f}', va='center', fontsize=9)
    
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'₹{x/1000:.0f}K'))
    
    plt.tight_layout()
    return save_chart(fig, 'revenue_by_theatre_bar.png')


def create_daily_revenue_trend(bookings_df):
    """Create daily revenue trend line chart."""
    if bookings_df.empty or 'booking_date' not in bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(14, 6))
    
    daily_revenue = bookings_df.groupby('booking_date').agg({
        'total_amount': 'sum',
        'booking_id': 'count'
    }).reset_index()
    daily_revenue.columns = ['date', 'revenue', 'bookings']
    daily_revenue = daily_revenue.sort_values('date')
    
    # Filter last 30 days if too much data
    if len(daily_revenue) > 30:
        daily_revenue = daily_revenue.tail(30)
    
    ax.plot(daily_revenue['date'], daily_revenue['revenue'], marker='o', linewidth=2, 
            markersize=6, color='#4ECDC4', markerfacecolor='#FF6B6B', markeredgecolor='white')
    
    ax.fill_between(daily_revenue['date'], daily_revenue['revenue'], alpha=0.3, color='#4ECDC4')
    
    ax.set_xlabel('Date', fontsize=12)
    ax.set_ylabel('Revenue (₹)', fontsize=12)
    ax.set_title('Daily Revenue Trend', fontsize=16, fontweight='bold', pad=20)
    
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%d %b'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=3))
    plt.xticks(rotation=45, ha='right')
    
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'₹{x/1000:.0f}K'))
    
    plt.tight_layout()
    return save_chart(fig, 'daily_revenue_trend.png')


def create_hourly_booking_distribution(bookings_df):
    """Create hourly booking distribution bar chart."""
    if bookings_df.empty or 'booking_hour' not in bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(14, 6))
    
    hourly = bookings_df['booking_hour'].value_counts().sort_index()
    
    bars = ax.bar(hourly.index, hourly.values, color='#45B7D1', edgecolor='#2C3E50', linewidth=0.5)
    
    ax.set_xlabel('Hour of Day', fontsize=12)
    ax.set_ylabel('Number of Bookings', fontsize=12)
    ax.set_title('Booking Distribution by Hour of Day', fontsize=16, fontweight='bold', pad=20)
    
    ax.set_xticks(range(24))
    ax.set_xticklabels([f'{h:02d}:00' for h in range(24)], rotation=45, ha='right')
    
    # Highlight peak hour - find position in bars container
    if len(hourly) > 0:
        peak_hour = hourly.idxmax()
        peak_position = list(hourly.index).index(peak_hour)
        bars[peak_position].set_color('#FF6B6B')
    
    plt.tight_layout()
    return save_chart(fig, 'hourly_booking_distribution.png')


def create_day_of_week_distribution(bookings_df):
    """Create day of week booking distribution bar chart."""
    if bookings_df.empty or 'booking_day_of_week' not in bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(10, 6))
    
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    dow_counts = bookings_df['booking_day_of_week'].value_counts().reindex(day_order)
    
    colors = ['#96CEB4' if day not in ['Saturday', 'Sunday'] else '#FF6B6B' for day in day_order]
    bars = ax.bar(day_order, dow_counts.values, color=colors, edgecolor='#2C3E50', linewidth=0.5)
    
    ax.set_xlabel('Day of Week', fontsize=12)
    ax.set_ylabel('Number of Bookings', fontsize=12)
    ax.set_title('Booking Distribution by Day of Week', fontsize=16, fontweight='bold', pad=20)
    
    # Add value labels
    for bar, value in zip(bars, dow_counts.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + (dow_counts.max() * 0.01),
                f'{value:,}', ha='center', va='bottom', fontsize=10)
    
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    return save_chart(fig, 'day_of_week_distribution.png')


def create_genre_distribution_pie(movies_df):
    """Create genre distribution pie chart."""
    if movies_df.empty or 'genre_names' not in movies_df:
        return None
    
    all_genres = []
    for genres in movies_df['genre_names'].dropna():
        all_genres.extend([g.strip() for g in genres.split(',')])
    
    if not all_genres:
        return None
    
    genre_counts = Counter(all_genres).most_common(10)
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    labels = [g[0] for g in genre_counts]
    values = [g[1] for g in genre_counts]
    
    colors = CHART_COLORS[:len(labels)]
    
    wedges, texts, autotexts = ax.pie(
        values, labels=labels, autopct='%1.1f%%',
        colors=colors, startangle=90, pctdistance=0.85
    )
    
    # Draw center circle for donut chart
    centre_circle = plt.Circle((0, 0), 0.70, fc='white')
    ax.add_patch(centre_circle)
    
    ax.set_title('Movie Genre Distribution', fontsize=16, fontweight='bold', pad=20)
    
    plt.tight_layout()
    return save_chart(fig, 'genre_distribution_pie.png')


def create_user_role_pie(users_df):
    """Create user role distribution pie chart."""
    if users_df.empty or 'role' not in users_df:
        return None
    
    fig, ax = plt.subplots(figsize=(10, 8))
    
    role_counts = users_df['role'].value_counts()
    colors = ['#4ECDC4', '#45B7D1', '#FF6B6B'][:len(role_counts)]
    
    wedges, texts, autotexts = ax.pie(
        role_counts.values,
        labels=role_counts.index.str.title(),
        autopct='%1.1f%%',
        colors=colors,
        explode=[0.05] * len(role_counts),
        shadow=True,
        startangle=90
    )
    
    ax.set_title('User Distribution by Role', fontsize=16, fontweight='bold', pad=20)
    
    return save_chart(fig, 'user_role_pie.png')


def create_theatre_city_bar(theatres_df):
    """Create theatre count by city bar chart."""
    if theatres_df.empty or 'city' not in theatres_df:
        return None
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    city_counts = theatres_df['city'].value_counts().head(15)
    
    bars = ax.bar(city_counts.index, city_counts.values, color='#96CEB4', edgecolor='#2C3E50', linewidth=0.5)
    
    ax.set_xlabel('City', fontsize=12)
    ax.set_ylabel('Number of Theatres', fontsize=12)
    ax.set_title('Theatre Distribution by City', fontsize=16, fontweight='bold', pad=20)
    
    plt.xticks(rotation=45, ha='right')
    
    for bar, value in zip(bars, city_counts.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                str(value), ha='center', va='bottom', fontsize=10)
    
    plt.tight_layout()
    return save_chart(fig, 'theatre_city_bar.png')


def create_rating_distribution_bar(movies_df):
    """Create movie rating distribution bar chart."""
    if movies_df.empty or 'imdbRating' not in movies_df:
        return None
    
    ratings = movies_df['imdbRating'].dropna()
    if ratings.empty:
        return None
    
    fig, ax = plt.subplots(figsize=(12, 6))
    
    # Create rating bins
    bins = [0, 2, 4, 6, 7, 8, 9, 10]
    labels = ['0-2', '2-4', '4-6', '6-7', '7-8', '8-9', '9-10']
    rating_dist = pd.cut(ratings, bins=bins, labels=labels, include_lowest=True).value_counts().sort_index()
    
    colors = ['#FF6B6B', '#FF6B6B', '#FFEAA7', '#FFEAA7', '#96CEB4', '#4ECDC4', '#4ECDC4']
    bars = ax.bar(rating_dist.index, rating_dist.values, color=colors[:len(rating_dist)], edgecolor='#2C3E50')
    
    ax.set_xlabel('IMDb Rating Range', fontsize=12)
    ax.set_ylabel('Number of Movies', fontsize=12)
    ax.set_title('Movie Rating Distribution', fontsize=16, fontweight='bold', pad=20)
    
    for bar, value in zip(bars, rating_dist.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                str(value), ha='center', va='bottom', fontsize=10)
    
    plt.tight_layout()
    return save_chart(fig, 'rating_distribution_bar.png')


def create_revenue_vs_bookings_scatter(enriched_bookings_df):
    """Create revenue vs bookings scatter plot by movie."""
    if enriched_bookings_df.empty or 'title' not in enriched_bookings_df:
        return None
    
    fig, ax = plt.subplots(figsize=(12, 8))
    
    movie_perf = enriched_bookings_df.groupby('title').agg({
        'booking_id': 'count',
        'total_amount': 'sum'
    }).reset_index()
    movie_perf.columns = ['movie', 'bookings', 'revenue']
    
    scatter = ax.scatter(movie_perf['bookings'], movie_perf['revenue'], 
                        c=movie_perf['revenue'], cmap='viridis', 
                        s=100, alpha=0.6, edgecolors='white', linewidth=0.5)
    
    ax.set_xlabel('Number of Bookings', fontsize=12)
    ax.set_ylabel('Revenue (₹)', fontsize=12)
    ax.set_title('Revenue vs Bookings by Movie', fontsize=16, fontweight='bold', pad=20)
    
    # Add colorbar
    cbar = plt.colorbar(scatter)
    cbar.set_label('Revenue (₹)', fontsize=10)
    
    # Annotate top performers
    top_movies = movie_perf.nlargest(5, 'revenue')
    for _, row in top_movies.iterrows():
        ax.annotate(row['movie'][:15] + '...' if len(row['movie']) > 15 else row['movie'],
                   (row['bookings'], row['revenue']),
                   xytext=(5, 5), textcoords='offset points', fontsize=8)
    
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'₹{x/1000:.0f}K'))
    
    plt.tight_layout()
    return save_chart(fig, 'revenue_vs_bookings_scatter.png')


# ============================================================================
# EXCEL REPORT GENERATION
# ============================================================================

def create_summary_sheet(writer, booking_analytics, movie_analytics, theatre_analytics, user_analytics):
    """Create executive summary sheet."""
    print("  → Creating summary sheet...")
    
    summary_data = []
    
    # Booking Summary
    summary_data.append(['BOOKING ANALYTICS', ''])
    summary_data.append(['Total Bookings', booking_analytics.get('total_bookings', 0)])
    summary_data.append(['Total Revenue', f"₹{booking_analytics.get('total_revenue', 0):,.2f}"])
    summary_data.append(['Average Booking Value', f"₹{booking_analytics.get('average_booking_value', 0):,.2f}"])
    summary_data.append(['Total Seats Booked', booking_analytics.get('total_seats_booked', 0)])
    summary_data.append(['Average Seats per Booking', f"{booking_analytics.get('average_seats_per_booking', 0):.1f}"])
    summary_data.append(['', ''])
    
    # Movie Summary
    summary_data.append(['MOVIE ANALYTICS', ''])
    summary_data.append(['Total Movies', movie_analytics.get('total_movies', 0)])
    summary_data.append(['Active Movies', movie_analytics.get('active_movies', 0)])
    summary_data.append(['Average IMDb Rating', f"{movie_analytics.get('average_rating', 0):.1f}"])
    summary_data.append(['', ''])
    
    # Theatre Summary
    summary_data.append(['THEATRE ANALYTICS', ''])
    summary_data.append(['Total Theatres', theatre_analytics.get('total_theatres', 0)])
    summary_data.append(['Approved Theatres', theatre_analytics.get('approved_theatres', 0)])
    summary_data.append(['Pending Approvals', theatre_analytics.get('pending_theatres', 0)])
    summary_data.append(['', ''])
    
    # User Summary
    summary_data.append(['USER ANALYTICS', ''])
    summary_data.append(['Total Users', user_analytics.get('total_users', 0)])
    summary_data.append(['Users with Bookings', user_analytics.get('users_with_bookings', 0)])
    summary_data.append(['Avg Bookings per User', f"{user_analytics.get('average_bookings_per_user', 0):.1f}"])
    summary_data.append(['Avg Spend per User', f"₹{user_analytics.get('average_spend_per_user', 0):,.2f}"])
    summary_data.append(['', ''])
    
    # Report metadata
    summary_data.append(['REPORT INFO', ''])
    summary_data.append(['Generated At', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
    summary_data.append(['Database', DATABASE_NAME])
    
    df = pd.DataFrame(summary_data, columns=['Metric', 'Value'])
    df.to_excel(writer, sheet_name='Summary', index=False)
    print("    ✓ Created summary sheet")


def export_to_excel(bookings_df, movies_df, theatres_df, shows_df, users_df, 
                    enriched_bookings_df, booking_analytics, movie_analytics, 
                    theatre_analytics, user_analytics):
    """Export all data to Excel file with multiple sheets."""
    print("\n📊 Generating Excel Report...")
    
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
        # Summary sheet
        create_summary_sheet(writer, booking_analytics, movie_analytics, theatre_analytics, user_analytics)
        
        # Raw data sheets
        if not bookings_df.empty:
            print("  → Exporting bookings data...")
            export_cols = ['booking_id', 'user_id', 'show_id', 'total_amount', 'status', 
                          'payment_status', 'num_seats', 'payment_method', 'createdAt']
            available_cols = [c for c in export_cols if c in bookings_df.columns]
            bookings_df[available_cols].to_excel(writer, sheet_name='Bookings', index=False)
        
        if not movies_df.empty:
            print("  → Exporting movies data...")
            export_cols = ['movie_id', 'title', 'genre_names', 'imdbRating', 'duration_min', 
                          'release_date', 'isActive']
            available_cols = [c for c in export_cols if c in movies_df.columns]
            movies_df[available_cols].to_excel(writer, sheet_name='Movies', index=False)
        
        if not theatres_df.empty:
            print("  → Exporting theatres data...")
            export_cols = ['theatre_id', 'name', 'city', 'location', 'state', 'approval_status', 'disabled']
            available_cols = [c for c in export_cols if c in theatres_df.columns]
            theatres_df[available_cols].to_excel(writer, sheet_name='Theatres', index=False)
        
        if not shows_df.empty:
            print("  → Exporting shows data...")
            export_cols = ['show_id', 'movie_id', 'theatre_id', 'show_datetime', 'language', 
                          'basePrice', 'status', 'totalCapacity']
            available_cols = [c for c in export_cols if c in shows_df.columns]
            shows_df[available_cols].to_excel(writer, sheet_name='Shows', index=False)
        
        if not users_df.empty:
            print("  → Exporting users data...")
            export_cols = ['user_id', 'name', 'email', 'phone', 'role', 'createdAt']
            available_cols = [c for c in export_cols if c in users_df.columns]
            users_df[available_cols].to_excel(writer, sheet_name='Users', index=False)
        
        # Enriched bookings data
        if not enriched_bookings_df.empty:
            print("  → Exporting enriched bookings data...")
            export_cols = ['booking_id', 'customer_name', 'email', 'title', 'theatre_name', 
                          'city', 'show_datetime', 'total_amount', 'status', 'payment_status', 
                          'num_seats', 'booking_date']
            available_cols = [c for c in export_cols if c in enriched_bookings_df.columns]
            enriched_bookings_df[available_cols].to_excel(writer, sheet_name='Enriched_Bookings', index=False)
        
        # Analytics sheets
        if 'top_movies_by_revenue' in movie_analytics:
            print("  → Exporting movie performance...")
            pd.DataFrame(movie_analytics['top_movies_by_revenue']).to_excel(
                writer, sheet_name='Movie_Performance', index=False)
        
        if 'top_theatres_by_revenue' in theatre_analytics:
            print("  → Exporting theatre performance...")
            pd.DataFrame(theatre_analytics['top_theatres_by_revenue']).to_excel(
                writer, sheet_name='Theatre_Performance', index=False)
        
        if 'top_customers' in user_analytics:
            print("  → Exporting customer analytics...")
            pd.DataFrame(user_analytics['top_customers']).to_excel(
                writer, sheet_name='Top_Customers', index=False)
        
        # Daily trends
        if 'daily_trends' in booking_analytics:
            print("  → Exporting daily trends...")
            booking_analytics['daily_trends'].to_excel(
                writer, sheet_name='Daily_Trends', index=False)
    
    print(f"\n✓ Excel report saved: {EXCEL_FILE}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function."""
    print("\n" + "="*70)
    print("TICKETFLICKS - MongoDB Analytics & Reporting Pipeline")
    print("="*70 + "\n")
    
    # Create output directories
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(CHARTS_DIR, exist_ok=True)
    
    # Connect to MongoDB
    client, db = connect_to_mongodb()
    
    # Extract data
    print("\n📥 Extracting Data from MongoDB...")
    bookings_df = extract_bookings_data(db)
    movies_df = extract_movies_data(db)
    theatres_df = extract_theatres_data(db)
    shows_df = extract_shows_data(db)
    users_df = extract_users_data(db)
    
    # Create enriched data
    print("\n🔗 Enriching Data...")
    enriched_bookings_df = create_enriched_bookings_data(
        bookings_df, shows_df, movies_df, theatres_df, users_df
    )
    
    # Generate analytics
    print("\n📈 Generating Analytics...")
    booking_analytics = generate_booking_analytics(bookings_df)
    movie_analytics = generate_movie_analytics(movies_df, enriched_bookings_df)
    theatre_analytics = generate_theatre_analytics(theatres_df, enriched_bookings_df)
    user_analytics = generate_user_analytics(users_df, bookings_df)
    
    # Export to Excel
    export_to_excel(
        bookings_df, movies_df, theatres_df, shows_df, users_df,
        enriched_bookings_df, booking_analytics, movie_analytics,
        theatre_analytics, user_analytics
    )
    
    # Generate charts
    print("\n📊 Generating Visualizations...")
    charts = []
    
    charts.append(('Booking Status', create_booking_status_pie(bookings_df)))
    charts.append(('Payment Status', create_payment_status_pie(bookings_df)))
    charts.append(('Revenue by Movie', create_revenue_by_movie_bar(enriched_bookings_df)))
    charts.append(('Revenue by Theatre', create_revenue_by_theatre_bar(enriched_bookings_df)))
    charts.append(('Daily Revenue Trend', create_daily_revenue_trend(bookings_df)))
    charts.append(('Hourly Bookings', create_hourly_booking_distribution(bookings_df)))
    charts.append(('Day of Week', create_day_of_week_distribution(bookings_df)))
    charts.append(('Genre Distribution', create_genre_distribution_pie(movies_df)))
    charts.append(('User Roles', create_user_role_pie(users_df)))
    charts.append(('Theatres by City', create_theatre_city_bar(theatres_df)))
    charts.append(('Rating Distribution', create_rating_distribution_bar(movies_df)))
    charts.append(('Revenue vs Bookings', create_revenue_vs_bookings_scatter(enriched_bookings_df)))
    
    # Close MongoDB connection
    client.close()
    print("\n✓ MongoDB connection closed")
    
    # Print summary
    print("\n" + "="*70)
    print("ANALYTICS REPORT SUMMARY")
    print("="*70)
    
    print(f"\n📊 KEY METRICS:")
    print(f"   • Total Bookings: {booking_analytics.get('total_bookings', 0):,}")
    print(f"   • Total Revenue: ₹{booking_analytics.get('total_revenue', 0):,.2f}")
    print(f"   • Total Movies: {movie_analytics.get('total_movies', 0):,}")
    print(f"   • Total Theatres: {theatre_analytics.get('total_theatres', 0):,}")
    print(f"   • Total Users: {user_analytics.get('total_users', 0):,}")
    
    print(f"\n📁 OUTPUT FILES:")
    print(f"   • Excel Report: {EXCEL_FILE}")
    print(f"   • Charts Directory: {CHARTS_DIR}/")
    
    print(f"\n📈 GENERATED CHARTS:")
    for name, path in charts:
        if path:
            print(f"   ✓ {name}")
    
    print("\n" + "="*70)
    print("✅ Analytics Pipeline Complete!")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
