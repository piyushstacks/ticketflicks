"""
Configuration file for TicketFlicks Analytics Pipeline
Edit the settings below to match your environment
"""

# ============================================================================
# MONGODB CONFIGURATION
# ============================================================================

# MongoDB Connection URI
# Local MongoDB
MONGO_URI = "mongodb+srv://piyushbhagchandani64:08P5NdHDb5F2CHc4@cluster99.57yjjst.mongodb.net"

# MongoDB Atlas (cloud) - uncomment and edit if using cloud
# MONGO_URI = "mongodb+srv://<username>:<password>@cluster.mongodb.net/"

# Database name - CHANGE THIS to your actual database name
DATABASE_NAME = "ticketflicks"

# ============================================================================
# OUTPUT CONFIGURATION
# ============================================================================

# Output directory for reports and charts
OUTPUT_DIR = "reports"

# Excel report filename
EXCEL_FILENAME = "ticketflicks_analytics_report.xlsx"

# ============================================================================
# DATE FILTERING (Optional)
# ============================================================================

# Set to None to include all data
# Or specify date range for filtered analysis
START_DATE = None  # e.g., "2024-01-01"
END_DATE = None    # e.g., "2024-12-31"

# ============================================================================
# CHART CONFIGURATION
# ============================================================================

# Chart DPI (resolution)
CHART_DPI = 150

# Chart style (matplotlib style name)
CHART_STYLE = "seaborn-v0_8-whitegrid"

# Custom color palette for charts
CHART_COLORS = [
    '#FF6B6B',  # Red
    '#4ECDC4',  # Teal
    '#45B7D1',  # Blue
    '#96CEB4',  # Green
    '#FFEAA7',  # Yellow
    '#DDA0DD',  # Plum
    '#98D8C8',  # Mint
    '#F7DC6F',  # Gold
]

# ============================================================================
# COLLECTION NAMES
# ============================================================================

# MongoDB collection names (as used in your models)
COLLECTIONS = {
    'bookings': 'bookings_new',
    'movies': 'movies_new',
    'theatres': 'theatres',
    'shows': 'shows_new',
    'users': 'users_new',
    'screens': 'screens_new',
    'genres': 'genres',
    'languages': 'languages',
    'casts': 'casts',
}
