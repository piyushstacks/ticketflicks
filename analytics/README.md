# TicketFlicks Analytics Pipeline

Professional MongoDB analytics and reporting tool for movie ticket booking systems.

## Features

- **Data Extraction**: Pulls data from MongoDB collections (bookings, movies, theatres, shows, users)
- **Excel Reports**: Generates multi-sheet Excel files with raw data and analytics
- **Visual Analytics**: Creates professional charts and graphs for business intelligence
- **Enriched Data**: Joins related collections for comprehensive analysis

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Database

Edit `config.py` and update:
- `MONGO_URI` - Your MongoDB connection string
- `DATABASE_NAME` - Your database name

### 3. Run Analytics

```bash
python analytics_report.py
```

## Output

### Excel Report (`reports/ticketflicks_analytics_report.xlsx`)

| Sheet | Description |
|-------|-------------|
| Summary | Executive summary with key metrics |
| Bookings | Raw booking data |
| Movies | Movie catalog data |
| Theatres | Theatre information |
| Shows | Show schedules |
| Users | User data |
| Enriched_Bookings | Bookings with movie/theatre/user details |
| Movie_Performance | Top movies by revenue |
| Theatre_Performance | Top theatres by revenue |
| Top_Customers | Highest spending customers |
| Daily_Trends | Daily booking and revenue trends |

### Charts (`reports/charts/`)

| Chart | Description |
|-------|-------------|
| `booking_status_pie.png` | Booking status distribution (confirmed/pending/cancelled) |
| `payment_status_pie.png` | Payment status distribution |
| `revenue_by_movie_bar.png` | Top 15 movies by revenue |
| `revenue_by_theatre_bar.png` | Top 15 theatres by revenue |
| `daily_revenue_trend.png` | Daily revenue trend line chart |
| `hourly_booking_distribution.png` | Booking patterns by hour |
| `day_of_week_distribution.png` | Booking patterns by weekday |
| `genre_distribution_pie.png` | Movie genre distribution |
| `user_role_pie.png` | User role distribution |
| `theatre_city_bar.png` | Theatre distribution by city |
| `rating_distribution_bar.png` | Movie rating distribution |
| `revenue_vs_bookings_scatter.png` | Revenue vs bookings correlation |

## Key Analytics Metrics

### Booking Analytics
- Total bookings count
- Total revenue (₹)
- Average booking value
- Total seats booked
- Status breakdown (confirmed/pending/cancelled)

### Movie Analytics
- Total movies count
- Genre distribution
- IMDb rating distribution
- Top performing movies by revenue

### Theatre Analytics
- Total theatres count
- Approval status breakdown
- Theatre distribution by city
- Top performing theatres

### User Analytics
- Total users count
- User role distribution
- Average bookings per user
- Average spend per user
- Top customers

## Project Structure

```
analytics/
├── analytics_report.py   # Main analytics script
├── config.py             # Configuration settings
├── requirements.txt      # Python dependencies
├── README.md            # This file
└── reports/             # Generated reports (auto-created)
    ├── ticketflicks_analytics_report.xlsx
    └── charts/
        └── *.png
```

## Customization

### Filter by Date Range

Edit `config.py`:
```python
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"
```

### Add Custom Charts

Modify the chart generation functions in `analytics_report.py` to create additional visualizations.

## Requirements

- Python 3.8+
- MongoDB 4.4+
- Required packages (see requirements.txt)

## Troubleshooting

### Connection Error
- Verify MongoDB is running: `mongod --version`
- Check connection string in `config.py`

### Empty Results
- Verify collection names match your database
- Check `COLLECTIONS` dictionary in `config.py`

### Chart Display Issues
- Ensure matplotlib backend is properly configured
- On macOS, you may need: `import matplotlib; matplotlib.use('TkAgg')`
