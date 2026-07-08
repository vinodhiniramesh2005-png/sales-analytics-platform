import pandas as pd

from app.services.column_detect import detect_columns


def answer_question(df: pd.DataFrame, question: str) -> dict:
    q = question.lower().strip()
    cols = detect_columns(df)
    rev = cols["revenue_column"]
    profit = cols["profit_column"]
    product = cols["product_column"]
    customer = cols["customer_column"]
    region = cols["region_column"]
    date_col = cols["date_column"]

    def money(x):
        return f"${x:,.2f}"

    # Total sales / revenue
    if any(k in q for k in ["total sales", "total revenue", "overall sales", "sum of sales"]):
        if rev:
            total = df[rev].sum()
            return {"answer": f"Total sales is {money(total)} across {len(df)} orders.",
                    "data": {"total": float(total)}, "chart_suggestion": "kpi"}

    # Average revenue
    if "average revenue" in q or "average sales" in q or "avg revenue" in q:
        if rev:
            avg = df[rev].mean()
            return {"answer": f"Average revenue per order is {money(avg)}.",
                    "data": {"average": float(avg)}, "chart_suggestion": "kpi"}

    # Best selling / top product
    if any(k in q for k in ["best selling", "best product", "top product"]):
        if product and rev:
            grouped = df.groupby(product)[rev].sum().sort_values(ascending=False)
            top = grouped.index[0]
            return {
                "answer": f"The best-selling product is '{top}' with {money(grouped.iloc[0])} in total sales.",
                "data": grouped.head(10).to_dict(),
                "chart_suggestion": "bar",
            }

    # Worst / weak products
    if any(k in q for k in ["worst product", "weak product", "lowest selling"]):
        if product and rev:
            grouped = df.groupby(product)[rev].sum().sort_values(ascending=True)
            worst = grouped.index[0]
            return {
                "answer": f"The weakest-performing product is '{worst}' with only {money(grouped.iloc[0])} in sales.",
                "data": grouped.head(10).to_dict(),
                "chart_suggestion": "bar",
            }

    # Monthly sales / trend
    if "monthly" in q and ("sales" in q or "revenue" in q):
        if date_col and rev:
            temp = df.copy()
            temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
            temp = temp.dropna(subset=[date_col])
            monthly = temp.groupby(temp[date_col].dt.to_period("M"))[rev].sum()
            monthly.index = monthly.index.astype(str)
            return {
                "answer": f"Monthly sales trend computed across {len(monthly)} months.",
                "data": monthly.to_dict(),
                "chart_suggestion": "line",
            }

    # Highest profit
    if "highest profit" in q or "most profitable" in q:
        if profit and product:
            grouped = df.groupby(product)[profit].sum().sort_values(ascending=False)
            top = grouped.index[0]
            return {
                "answer": f"'{top}' generates the highest profit at {money(grouped.iloc[0])}.",
                "data": grouped.head(10).to_dict(),
                "chart_suggestion": "bar",
            }
        elif rev:
            return {"answer": "No profit column detected; showing revenue leader instead.",
                    "data": {}, "chart_suggestion": None}

    # Worst performing state/region
    if any(k in q for k in ["worst performing state", "worst region", "weakest region", "worst state"]):
        if region and rev:
            grouped = df.groupby(region)[rev].sum().sort_values(ascending=True)
            worst = grouped.index[0]
            return {
                "answer": f"'{worst}' is the weakest-performing region with {money(grouped.iloc[0])} in sales.",
                "data": grouped.head(10).to_dict(),
                "chart_suggestion": "bar",
            }

    # Top customers
    if "top customer" in q or "best customer" in q:
        if customer and rev:
            grouped = df.groupby(customer)[rev].sum().sort_values(ascending=False)
            return {
                "answer": f"The top customer is '{grouped.index[0]}' with {money(grouped.iloc[0])} in total purchases.",
                "data": grouped.head(10).to_dict(),
                "chart_suggestion": "bar",
            }

    # Compare last year
    if "compare" in q and "year" in q:
        if date_col and rev:
            temp = df.copy()
            temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
            temp = temp.dropna(subset=[date_col])
            yearly = temp.groupby(temp[date_col].dt.year)[rev].sum()
            return {
                "answer": f"Yearly sales comparison computed across {len(yearly)} year(s).",
                "data": {str(k): float(v) for k, v in yearly.to_dict().items()},
                "chart_suggestion": "bar",
            }

    # Row / record count
    if "how many" in q and ("row" in q or "record" in q or "order" in q):
        return {"answer": f"The dataset contains {len(df)} records.", "data": {"count": len(df)},
                "chart_suggestion": None}

    # Fallback: generic column summary
    return {
        "answer": (
            "I couldn't map that question to a specific metric automatically. "
            "Try asking about total sales, best/worst product, monthly sales, top customers, "
            "highest profit, or regional performance."
        ),
        "data": None,
        "chart_suggestion": None,
    }
