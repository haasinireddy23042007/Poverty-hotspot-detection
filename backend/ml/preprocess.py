"""
Preprocess NFHS-5 Telangana data (long → wide) and build the 8-indicator
poverty feature matrix for the ML pipeline.

DIRECTLY AVAILABLE in NFHS-5:
  1. literacy_rate           – Indicator 14 (Women literacy %)
  2. sanitation_access       – Indicator 9  (improved sanitation %)
  3. drinking_water_access   – Indicator 8  (improved water source %)
  4. underweight_children    – Indicator 76 (children underweight %)
  5. stunted_children        – Indicator 73 (children stunted %)
  6. anemia_women            – Indicator 82 (non-pregnant women anaemic %)
  7. child_marriage_rate     – Indicator 16 (women married before 18 %)
  8. anemic_children         – Indicator 81 (children 6-59m anaemic %)

SYNTHETICALLY DERIVED (seeded from the real indicators so district rankings hold):
  9. unemployment_rate       – proxy: inverse of literacy + child_marriage (normalised)
 10. per_capita_income       – proxy: composite of sanitation + water + literacy
 11. asset_ownership         – proxy: composite of water + sanitation + inverse-stunting
 12. infant_mortality_rate   – proxy: stunted + underweight + anaemia in children
 13. mpi_score               – weighted composite of all real indicators

All derived values are scaled to realistic ranges documented below.
"""
import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')

# ── Indicator prefix → column name mapping ─────────────────────────────────
NFHS_INDICATORS = {
    '14. Women who are literate':                                                    'literacy_rate',
    '9. Population living in households that use an improved sanitation facility':   'sanitation_access',
    '8. Population living in households with an improved drinking-water source':     'drinking_water_access',
    '76. Children under 5 years who are underweight (weight-for-age)':              'underweight_children',
    '73. Children under 5 years who are stunted (height-for-age)':                  'stunted_children',
    '82. Non-pregnant women age 15-49 years who are anaemic':                       'anemia_women',
    '16. Women age 20-24 years married before age 18 years':                        'child_marriage_rate',
    '81. Children age 6-59 months who are anaemic':                                 'anemic_children',
}

# All 8 model features (real + derived)
FEATURE_COLS = [
    'literacy_rate',       'unemployment_rate',   'per_capita_income',
    'sanitation_access',   'drinking_water_access','infant_mortality_rate',
    'asset_ownership',     'mpi_score',
]

# MPI weights for composite score
# Negative weight  → higher value means LESS poverty (good indicator)
# Positive weight  → higher value means MORE poverty  (bad indicator)
MPI_WEIGHTS = {
    'literacy_rate':         -0.20,
    'sanitation_access':     -0.12,
    'drinking_water_access': -0.08,
    'underweight_children':   0.18,
    'stunted_children':       0.15,
    'anemia_women':           0.10,
    'child_marriage_rate':    0.10,
    'anemic_children':        0.07,
}


def load_nfhs5():
    """Load NFHS-5 CSV and extract 8 real indicators per district."""
    csv_path = os.path.join(DATA_DIR, 'NFHS-5-TG-Telangana.csv')
    df = pd.read_csv(csv_path)
    df = df[df['State'] == 'Telangana'].copy()
    df['NFHS-5'] = pd.to_numeric(df['NFHS-5'], errors='coerce')

    wide = None
    for prefix, col_name in NFHS_INDICATORS.items():
        sub = df[df['Indicator'].str.startswith(prefix.split('(')[0].strip())][['District','NFHS-5']].copy()
        sub = sub.rename(columns={'NFHS-5': col_name})
        wide = sub if wide is None else wide.merge(sub, on='District', how='outer')

    return wide


def _derive_synthetic(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """
    Derive 5 synthetic features from the real NFHS-5 indicators.
    District rankings derived from real data; absolute values scaled to realistic ranges.
    """
    df = df.copy()
    n = len(df)

    # ── Unemployment rate  (8–28 %)  ──────────────────────────────────────────
    # Proxy: low literacy + high child-marriage → higher unemployment
    unemp_proxy = (100 - df['literacy_rate']) * 0.5 + df['child_marriage_rate'] * 0.5
    unemp_mn  = MinMaxScaler(feature_range=(8, 28))
    df['unemployment_rate'] = unemp_mn.fit_transform(unemp_proxy.values.reshape(-1,1)).flatten()
    df['unemployment_rate'] += rng.normal(0, 0.8, n)          # add slight noise
    df['unemployment_rate'] = df['unemployment_rate'].clip(5, 32)

    # ── Per-capita income  (₹50k – ₹160k /year) ───────────────────────────────
    # Proxy: literacy + sanitation + water access (better access → more income)
    income_proxy = (df['literacy_rate'] + df['sanitation_access'] + df['drinking_water_access']) / 3
    inc_mn = MinMaxScaler(feature_range=(50000, 160000))
    df['per_capita_income'] = inc_mn.fit_transform(income_proxy.values.reshape(-1,1)).flatten()
    df['per_capita_income'] += rng.normal(0, 3000, n)
    df['per_capita_income'] = df['per_capita_income'].clip(40000, 175000).round(-3)

    # ── Asset ownership  (20–75 %) ─────────────────────────────────────────────
    # Proxy: sanitation + water + inverse stunting → more assets
    asset_proxy = (df['sanitation_access'] + df['drinking_water_access'] + (100 - df['stunted_children'])) / 3
    ast_mn = MinMaxScaler(feature_range=(20, 75))
    df['asset_ownership'] = ast_mn.fit_transform(asset_proxy.values.reshape(-1,1)).flatten()
    df['asset_ownership'] += rng.normal(0, 1.5, n)
    df['asset_ownership'] = df['asset_ownership'].clip(15, 80).round(1)

    # ── Infant mortality rate  (20–65 per 1000) ────────────────────────────────
    # Proxy: stunted + underweight + anemic children → higher IMR
    imr_proxy = (df['stunted_children'] + df['underweight_children'] + df['anemic_children']) / 3
    imr_mn = MinMaxScaler(feature_range=(20, 65))
    df['infant_mortality_rate'] = imr_mn.fit_transform(imr_proxy.values.reshape(-1,1)).flatten()
    df['infant_mortality_rate'] += rng.normal(0, 1.0, n)
    df['infant_mortality_rate'] = df['infant_mortality_rate'].clip(15, 75).round(1)

    return df


def _compute_mpi(df: pd.DataFrame) -> pd.Series:
    """Compute composite MPI score (0–100) from the real NFHS indicators."""
    scaler = MinMaxScaler()
    raw_cols = list(MPI_WEIGHTS.keys())
    norm = scaler.fit_transform(df[raw_cols])
    norm_df = pd.DataFrame(norm, columns=raw_cols, index=df.index)

    mpi = np.zeros(len(norm_df))
    for col, w in MPI_WEIGHTS.items():
        mpi += w * norm_df[col].values

    mpi_min, mpi_max = mpi.min(), mpi.max()
    if mpi_max > mpi_min:
        return pd.Series((mpi - mpi_min) / (mpi_max - mpi_min) * 100, index=df.index)
    return pd.Series(np.full(len(df), 50.0), index=df.index)


def preprocess():
    """
    Returns:
        district_df  (DataFrame) – one row per district, 12 features + MPI score
        feature_cols (list)      – the 8 model-input feature names
        scaler       (fitted MinMaxScaler on FEATURE_COLS)
    """
    rng = np.random.default_rng(seed=42)

    df = load_nfhs5()

    # Median imputation for any missing real indicators
    real_cols = list(NFHS_INDICATORS.values())
    for col in real_cols:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())
        else:
            df[col] = 50.0

    # Derive synthetic features
    df = _derive_synthetic(df, rng)

    # Compute MPI from real indicators
    df['mpi_score'] = _compute_mpi(df)

    # Final scaler on the 8 model features
    scaler = MinMaxScaler()
    scaler.fit(df[FEATURE_COLS])

    df = df.rename(columns={'District': 'district'})
    return df, FEATURE_COLS, scaler


if __name__ == '__main__':
    result_df, cols, _ = preprocess()
    display_cols = ['district','mpi_score','literacy_rate','unemployment_rate',
                    'per_capita_income','sanitation_access','drinking_water_access',
                    'infant_mortality_rate','asset_ownership']
    print(result_df[display_cols].sort_values('mpi_score', ascending=False).to_string(index=False))
