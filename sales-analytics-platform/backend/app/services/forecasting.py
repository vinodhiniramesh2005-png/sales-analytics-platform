import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.services.column_detect import detect_columns


def build_forecast(df: pd.DataFrame, horizon_days: int, date_column: str | None, value_column: str | None) -> dict:
    cols = detect_columns(df)
    date_col = date_column or cols["date_column"]
    value_col = value_column or cols["revenue_column"]

    if not date_col or not value_col:
        raise ValueError("Could not detect date/value columns for forecasting. Please specify them explicitly.")

    temp = df[[date_col, value_col]].copy()
    temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
    temp = temp.dropna(subset=[date_col])
    daily = temp.groupby(temp[date_col].dt.date)[value_col].sum()
    daily.index = pd.to_datetime(daily.index)
    daily = daily.asfreq("D", fill_value=0)

    if len(daily) < 10:
        # Not enough history for a seasonal model -> use simple linear trend
        x = np.arange(len(daily))
        coeffs = np.polyfit(x, daily.values, 1) if len(daily) > 1 else [0, daily.values.mean() if len(daily) else 0]
        trend = np.poly1d(coeffs)
        future_x = np.arange(len(daily), len(daily) + horizon_days)
        forecast_values = trend(future_x)
        residual_std = float(np.std(daily.values)) if len(daily) > 0 else 0.0
        method = "linear_trend"
    else:
        seasonal_periods = 7 if len(daily) >= 14 else None
        model = ExponentialSmoothing(
            daily,
            trend="add",
            seasonal="add" if seasonal_periods else None,
            seasonal_periods=seasonal_periods,
            initialization_method="estimated",
        )
        fit = model.fit()
        forecast_values = fit.forecast(horizon_days).values
        residuals = fit.fittedvalues - daily
        residual_std = float(np.std(residuals))
        method = "holt_winters"

    last_date = daily.index[-1] if len(daily) > 0 else pd.Timestamp.today()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=horizon_days)

    ci_multiplier = 1.96  # ~95% confidence interval
    forecast_values = np.maximum(forecast_values, 0)

    history = [{"date": str(d.date()), "value": float(v)} for d, v in daily.items()]
    forecast = [
        {
            "date": str(d.date()),
            "value": float(v),
            "lower": float(max(0, v - ci_multiplier * residual_std)),
            "upper": float(v + ci_multiplier * residual_std),
        }
        for d, v in zip(future_dates, forecast_values)
    ]

    return {
        "method": method,
        "date_column": date_col,
        "value_column": value_col,
        "history": history,
        "forecast": forecast,
        "total_forecasted": float(np.sum(forecast_values)),
    }
