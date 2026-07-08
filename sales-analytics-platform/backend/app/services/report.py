import os
import uuid

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    PageBreak,
)

from app.core.config import settings
from app.services.column_detect import detect_columns
from app.services.forecasting import build_forecast


def build_report_data(df: pd.DataFrame) -> dict:
    cols = detect_columns(df)
    rev, profit, product, region, date_col = (
        cols["revenue_column"], cols["profit_column"], cols["product_column"],
        cols["region_column"], cols["date_column"],
    )

    total_sales = float(df[rev].sum()) if rev else 0.0
    total_profit = float(df[profit].sum()) if profit else None
    total_orders = len(df)
    avg_order_value = float(df[rev].mean()) if rev else 0.0

    top_products, weak_products = [], []
    if product and rev:
        grouped = df.groupby(product)[rev].sum().sort_values(ascending=False)
        top_products = [{"name": str(k), "value": float(v)} for k, v in grouped.head(5).items()]
        weak_products = [{"name": str(k), "value": float(v)} for k, v in grouped.tail(5).items()]

    regional = []
    if region and rev:
        grouped = df.groupby(region)[rev].sum().sort_values(ascending=False)
        regional = [{"name": str(k), "value": float(v)} for k, v in grouped.items()]

    monthly_trend = []
    if date_col and rev:
        temp = df.copy()
        temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
        temp = temp.dropna(subset=[date_col])
        monthly = temp.groupby(temp[date_col].dt.to_period("M"))[rev].sum().sort_index()
        monthly_trend = [{"name": str(k), "value": float(v)} for k, v in monthly.items()]

    forecast_summary = None
    try:
        forecast = build_forecast(df, 30, None, None)
        forecast_summary = {
            "method": forecast["method"],
            "total_forecasted_next_30_days": forecast["total_forecasted"],
        }
    except Exception:
        forecast_summary = None

    recommendations = _generate_recommendations(top_products, weak_products, regional, forecast_summary)
    insights = _generate_insights(total_sales, total_profit, monthly_trend, regional)

    return {
        "executive_summary": {
            "total_sales": total_sales,
            "total_profit": total_profit,
            "total_orders": total_orders,
            "avg_order_value": avg_order_value,
        },
        "top_products": top_products,
        "weak_products": weak_products,
        "regional_analysis": regional,
        "monthly_trend": monthly_trend,
        "forecast_summary": forecast_summary,
        "recommendations": recommendations,
        "ai_insights": insights,
    }


def _generate_recommendations(top_products, weak_products, regional, forecast_summary) -> list[str]:
    recs = []
    if top_products:
        recs.append(f"Double down on '{top_products[0]['name']}' — your strongest revenue driver.")
    if weak_products:
        recs.append(f"Review pricing or positioning for '{weak_products[0]['name']}', which is underperforming.")
    if regional:
        worst_region = min(regional, key=lambda r: r["value"])
        recs.append(f"Investigate the '{worst_region['name']}' region — it has the lowest sales contribution.")
    if forecast_summary:
        recs.append(
            f"Based on the {forecast_summary['method']} model, plan inventory for approximately "
            f"${forecast_summary['total_forecasted_next_30_days']:,.0f} in sales over the next 30 days."
        )
    if not recs:
        recs.append("Upload a dataset with product, region, and date columns for tailored recommendations.")
    return recs


def _generate_insights(total_sales, total_profit, monthly_trend, regional) -> list[str]:
    insights = []
    if len(monthly_trend) >= 2:
        first, last = monthly_trend[0]["value"], monthly_trend[-1]["value"]
        if first > 0:
            change = (last - first) / first * 100
            direction = "grown" if change >= 0 else "declined"
            insights.append(f"Sales have {direction} by {abs(change):.1f}% from the first to the most recent month.")
    if total_profit is not None and total_sales:
        margin = (total_profit / total_sales) * 100
        insights.append(f"Overall profit margin is approximately {margin:.1f}%.")
    if regional:
        insights.append(f"'{regional[0]['name']}' is the top-performing region by revenue.")
    if not insights:
        insights.append("Additional columns (date, profit, region) would enable deeper AI insights.")
    return insights


def _save_bar_chart(data: list[dict], title: str, ylabel: str, path: str):
    if not data:
        return None
    names = [d["name"] for d in data]
    values = [d["value"] for d in data]
    plt.figure(figsize=(6, 3.5))
    plt.bar(names, values, color="#6366f1")
    plt.title(title)
    plt.ylabel(ylabel)
    plt.xticks(rotation=30, ha="right", fontsize=8)
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()
    return path


def _save_line_chart(data: list[dict], title: str, ylabel: str, path: str):
    if not data:
        return None
    names = [d["name"] for d in data]
    values = [d["value"] for d in data]
    plt.figure(figsize=(6, 3.5))
    plt.plot(names, values, marker="o", color="#22c55e")
    plt.title(title)
    plt.ylabel(ylabel)
    plt.xticks(rotation=30, ha="right", fontsize=8)
    plt.tight_layout()
    plt.savefig(path, dpi=140)
    plt.close()
    return path


def generate_pdf_report(df: pd.DataFrame, company_name: str = "AI Sales Analytics Platform") -> str:
    report_data = build_report_data(df)
    report_id = uuid.uuid4().hex
    pdf_path = os.path.join(settings.REPORTS_DIR, f"report_{report_id}.pdf")

    chart_dir = settings.CHARTS_DIR
    top_products_chart = _save_bar_chart(
        report_data["top_products"], "Top Products by Revenue", "Revenue",
        os.path.join(chart_dir, f"top_{report_id}.png"),
    )
    regional_chart = _save_bar_chart(
        report_data["regional_analysis"], "Regional Analysis", "Revenue",
        os.path.join(chart_dir, f"region_{report_id}.png"),
    )
    trend_chart = _save_line_chart(
        report_data["monthly_trend"], "Monthly Sales Trend", "Revenue",
        os.path.join(chart_dir, f"trend_{report_id}.png"),
    )

    doc = SimpleDocTemplate(pdf_path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#4f46e5"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#312e81"))
    body_style = styles["BodyText"]

    story = []
    story.append(Paragraph(company_name, title_style))
    story.append(Paragraph("AI-Generated Sales Analytics Report", styles["Heading3"]))
    story.append(Spacer(1, 0.5 * cm))

    # Executive Summary
    story.append(Paragraph("Executive Summary", heading_style))
    summary = report_data["executive_summary"]
    summary_table_data = [
        ["Total Sales", f"${summary['total_sales']:,.2f}"],
        ["Total Orders", f"{summary['total_orders']:,}"],
        ["Average Order Value", f"${summary['avg_order_value']:,.2f}"],
    ]
    if summary["total_profit"] is not None:
        summary_table_data.append(["Total Profit", f"${summary['total_profit']:,.2f}"])
    t = Table(summary_table_data, colWidths=[7 * cm, 7 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef2ff")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5 * cm))

    # Sales Trends
    if trend_chart:
        story.append(Paragraph("Sales Trends", heading_style))
        story.append(RLImage(trend_chart, width=16 * cm, height=9 * cm))
        story.append(Spacer(1, 0.5 * cm))

    # Top Products
    if top_products_chart:
        story.append(Paragraph("Top Products", heading_style))
        story.append(RLImage(top_products_chart, width=16 * cm, height=9 * cm))
        story.append(Spacer(1, 0.5 * cm))

    # Weak Products
    if report_data["weak_products"]:
        story.append(Paragraph("Weak Products", heading_style))
        weak_table = [["Product", "Revenue"]] + [
            [p["name"], f"${p['value']:,.2f}"] for p in report_data["weak_products"]
        ]
        t2 = Table(weak_table, colWidths=[10 * cm, 6 * cm])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.append(t2)
        story.append(Spacer(1, 0.5 * cm))

    # Regional Analysis
    if regional_chart:
        story.append(PageBreak())
        story.append(Paragraph("Regional Analysis", heading_style))
        story.append(RLImage(regional_chart, width=16 * cm, height=9 * cm))
        story.append(Spacer(1, 0.5 * cm))

    # Forecast Summary
    if report_data["forecast_summary"]:
        story.append(Paragraph("Forecast Summary", heading_style))
        fs = report_data["forecast_summary"]
        story.append(Paragraph(
            f"Using a {fs['method'].replace('_', ' ')} model, projected sales for the next 30 days "
            f"total approximately ${fs['total_forecasted_next_30_days']:,.2f}.", body_style
        ))
        story.append(Spacer(1, 0.5 * cm))

    # AI Insights
    story.append(Paragraph("AI Insights", heading_style))
    for insight in report_data["ai_insights"]:
        story.append(Paragraph(f"• {insight}", body_style))
    story.append(Spacer(1, 0.3 * cm))

    # Recommendations
    story.append(Paragraph("Recommendations", heading_style))
    for rec in report_data["recommendations"]:
        story.append(Paragraph(f"• {rec}", body_style))

    doc.build(story)
    return pdf_path
