import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";
import "./Other.css";

const Other = () => {
  const [goldPrices, setGoldPrices] = useState(null);
  // Stocks removed per request
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchExchangeRate = async () => {
    try {
      // Fetch USD to INR exchange rate
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      if (response.ok) {
        const data = await response.json();
        return data.rates.INR || 83.0; // fallback to 83 if API fails
      }
    } catch (err) {
      console.error("Error fetching exchange rate:", err);
    }
    return 83.0; // fallback rate
  };

  const fetchGoldPrices = async () => {
    try {
      const gold_key = process.env.REACT_APP_GOLD_API_KEY;
      if (!gold_key) throw new Error("Missing REACT_APP_GOLD_API_KEY in .env");

      // Request INR first (preferred). If API returns USD, we'll convert.
      const response = await fetch("https://www.goldapi.io/api/XAU/INR", {
        headers: {
          "x-access-token": gold_key,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Gold API error", response.status, data);
        throw new Error(data.message || `Gold API returned ${response.status}`);
      }

      // Determine price-per-ounce in INR
      let goldPriceInrPerOunce;
      if (data.currency && data.currency.toUpperCase() === "INR") {
        // API already returned INR
        goldPriceInrPerOunce = data.price;
      } else {
        // API returned USD (or unspecified) — convert using exchange rate
        const usdToInr = await fetchExchangeRate();
        goldPriceInrPerOunce = data.price * usdToInr;
      }

      // Convert ounce -> grams -> 8 grams
      const gramsPerOunce = 31.1035;
      const goldPriceInrPerGram = goldPriceInrPerOunce / gramsPerOunce;
      const goldPriceInrPer8Grams = goldPriceInrPerGram * 8;

      setGoldPrices({
        price: goldPriceInrPer8Grams,
        change: data.change ?? 0,
        changePercent: data.changePercent ?? 0,
        currency: "INR",
        unit: "per 8 grams",
        timestamp: data.timestamp ?? Date.now(),
        usdPrice:
          data.currency && data.currency.toUpperCase() === "USD"
            ? data.price
            : null,
        exchangeRate:
          data.currency && data.currency.toUpperCase() === "INR"
            ? null
            : await fetchExchangeRate(),
        pricePerGram: goldPriceInrPerGram,
        pricePerOunce: goldPriceInrPerOunce,
      });
    } catch (err) {
      console.error("Error fetching gold prices:", err);
      setGoldPrices({
        price: 47500,
        change: 0,
        changePercent: 0,
        currency: "INR",
        unit: "per 8 grams",
        note: "Sample data - API unavailable",
      });
    }
  };

  // Stock fetching removed

  const getStockName = (symbol) => {
    const names = {
      "RELIANCE.BSE": "Reliance Industries",
      "TCS.BSE": "Tata Consultancy Services",
      "HDFCBANK.BSE": "HDFC Bank",
      "INFY.BSE": "Infosys",
    };
    return names[symbol] || symbol;
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchGoldPrices()]);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch market data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const formatCurrency = (amount, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Removed unused number formatter for stocks

  const getChangeColor = (change) => {
    return change >= 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  if (loading) {
    return (
      <div className="other-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="other-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Error Loading Market Data</h3>
          <p>{error}</p>
          <button onClick={fetchAllData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="other-container">
      <div className="other-header">
        <h1>Market Data</h1>
        <div className="header-actions">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchAllData} className="refresh-button">
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Gold Prices Section */}
      <div className="market-section">
        <h2>Gold Price</h2>
        {goldPrices && (
          <div className="gold-card">
            <div className="gold-header">
              <div className="gold-icon">🥇</div>
              <div className="gold-info">
                <h3>Gold Spot Price</h3>
                <p className="gold-unit">{goldPrices.unit}</p>
              </div>
            </div>
            <div className="gold-price">
              <span className="price-value">
                {formatCurrency(goldPrices.price, goldPrices.currency)}
              </span>
              <div className="price-breakdown">
                {goldPrices.pricePerGram && (
                  <div className="breakdown-item">
                    Per gram:{" "}
                    {formatCurrency(
                      goldPrices.pricePerGram,
                      goldPrices.currency
                    )}
                  </div>
                )}
              </div>
              {goldPrices.exchangeRate && (
                <div className="exchange-rate">
                  Exchange Rate: 1 USD = ₹{goldPrices.exchangeRate.toFixed(2)}
                </div>
              )}
            </div>
            {goldPrices.note && (
              <div className="data-note">
                <Info size={14} />
                <span>{goldPrices.note}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stocks section removed per request */}

      <div className="market-footer">
        <div className="disclaimer">
          <Info size={16} />
          <span>
            Market data is for informational purposes only. Prices may be
            delayed and should not be used for trading decisions. Always verify
            with official sources.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Other;
