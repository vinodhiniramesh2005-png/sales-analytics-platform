"""
Generates a realistic sample sales dataset with 10,000+ rows for demoing the platform.
Run: python scripts/generate_sample_data.py
"""
import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

N_ROWS = 12000

PRODUCTS = [
    ("Laptop Pro 15", "Electronics", 1200), ("Wireless Mouse", "Electronics", 25),
    ("Mechanical Keyboard", "Electronics", 85), ("4K Monitor", "Electronics", 400),
    ("Office Chair", "Furniture", 220), ("Standing Desk", "Furniture", 350),
    ("Desk Lamp", "Furniture", 45), ("Bookshelf", "Furniture", 150),
    ("Notebook Set", "Stationery", 12), ("Fountain Pen", "Stationery", 30),
    ("Sticky Notes Pack", "Stationery", 8), ("Whiteboard", "Stationery", 60),
    ("Running Shoes", "Sportswear", 95), ("Yoga Mat", "Sportswear", 35),
    ("Water Bottle", "Sportswear", 18), ("Gym Bag", "Sportswear", 55),
    ("Coffee Maker", "Home Appliances", 130), ("Blender", "Home Appliances", 75),
    ("Air Purifier", "Home Appliances", 210), ("Vacuum Cleaner", "Home Appliances", 260),
]

REGIONS = [
    ("California", "USA"), ("Texas", "USA"), ("New York", "USA"), ("Florida", "USA"),
    ("Illinois", "USA"), ("Ontario", "Canada"), ("Quebec", "Canada"),
    ("Maharashtra", "India"), ("Karnataka", "India"), ("Delhi", "India"),
    ("Bavaria", "Germany"), ("England", "UK"),
]

SALES_REPS = [
    "Alice Johnson", "Brian Lee", "Carla Gomez", "David Kim", "Emma Wilson",
    "Frank Chen", "Grace Patel", "Henry Adams", "Isla Murphy", "Jack Thompson",
]

FIRST_NAMES = ["James", "Mary", "John", "Priya", "Wei", "Fatima", "Carlos", "Sofia", "Noah", "Ava",
               "Liam", "Olivia", "Ethan", "Isabella", "Mason", "Mia", "Lucas", "Amelia", "Ravi", "Nina"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
              "Rodriguez", "Martinez", "Sharma", "Patel", "Wilson", "Anderson", "Taylor"]

start_date = datetime(2023, 1, 1)
end_date = datetime(2025, 12, 31)
date_range_days = (end_date - start_date).days

rows = []
for i in range(N_ROWS):
    product_name, category, base_price = random.choice(PRODUCTS)
    region, country = random.choice(REGIONS)
    rep = random.choice(SALES_REPS)
    customer = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

    order_offset = random.randint(0, date_range_days)
    order_date = start_date + timedelta(days=order_offset)
    ship_date = order_date + timedelta(days=random.randint(1, 7))

    quantity = random.randint(1, 12)
    # Seasonal boost in Nov/Dec, slight yearly growth trend
    seasonal_multiplier = 1.4 if order_date.month in (11, 12) else 1.0
    yearly_growth = 1 + (order_date.year - 2023) * 0.08
    price_variation = base_price * random.uniform(0.9, 1.15)
    unit_price = round(price_variation * yearly_growth, 2)

    discount_pct = random.choice([0, 0, 0, 5, 10, 15, 20])
    revenue = round(unit_price * quantity * seasonal_multiplier * (1 - discount_pct / 100), 2)
    cost = round(unit_price * quantity * random.uniform(0.55, 0.75), 2)
    profit = round(revenue - cost, 2)

    rows.append({
        "Order Date": order_date.strftime("%Y-%m-%d"),
        "Shipping Date": ship_date.strftime("%Y-%m-%d"),
        "Customer": customer,
        "Product": product_name,
        "Category": category,
        "Region": region,
        "Country": country,
        "State": region,
        "Sales Representative": rep,
        "Quantity": quantity,
        "Unit Price": unit_price,
        "Discount": discount_pct,
        "Revenue": revenue,
        "Profit": profit,
    })

df = pd.DataFrame(rows)

# Introduce some realistic messiness for the cleaning pipeline to fix
messy_idx = df.sample(frac=0.03, random_state=1).index
df.loc[messy_idx, "Customer"] = df.loc[messy_idx, "Customer"].apply(lambda x: f"  {x}  ")
dup_rows = df.sample(frac=0.01, random_state=2)
df = pd.concat([df, dup_rows], ignore_index=True)
missing_idx = df.sample(frac=0.02, random_state=3).index
df.loc[missing_idx, "Discount"] = np.nan

output_dir = os.path.join(os.path.dirname(__file__), "..", "sample_data")
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "sample_sales_data.csv")
df.to_csv(output_path, index=False)
print(f"Generated {len(df)} rows -> {output_path}")
