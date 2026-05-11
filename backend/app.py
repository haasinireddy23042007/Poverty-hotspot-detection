"""
Flask REST API for Poverty Hotspot Identification System — Telangana
"""
import os
import sys
import numpy as np
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import resend
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Ensure backend package is importable
sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__)
CORS(app)

# ── Lazy-load model bundle ────────────────────────────────────────────────────
_bundle = None

def get_bundle():
    global _bundle
    if _bundle is None:
        from ml.model import load_bundle
        _bundle = load_bundle()
    return _bundle


def district_to_dict(row, feature_cols, feature_importances=None):
    """Convert a DataFrame row to a JSON-serialisable dict."""
    top_drivers = _compute_top_drivers(row, feature_cols)
    # Feature 7 & 4: Derived proxies
    night_light = round(float((row.get('literacy_rate', 0) + row.get('per_capita_income', 50000)/1000) / 2), 1)
    # 1=Improving, -1=Worsening, 0=Stable
    trend_val = 1 if row.get('literacy_rate', 0) > 60 else (-1 if row.get('underweight_children', 0) > 40 else 0)
    trend_text = "Improving" if trend_val > 0 else ("Worsening" if trend_val < 0 else "Stable")

    return {
        'district':      row.get('district', ''),
        'mpi_score':     round(float(row.get('mpi_score', 0)), 2),
        'cluster_label': row.get('cluster_label', ''),
        'is_hotspot':    int(row.get('is_hotspot', 0)),
        'hotspot_probability': float(row.get('hotspot_probability', 0.0)),
        'top_drivers':   top_drivers,
        'recommendations': _get_recommendations(top_drivers),
        'schemes':       _get_schemes(top_drivers),
        'night_light_index': min(100, night_light),
        'poverty_trend': trend_text,
        'poverty_trend_val': trend_val,
        'feature_importances': feature_importances,
        'indicators': {
            'literacy_rate':         round(float(row.get('literacy_rate', 0)), 1),
            'sanitation_access':     round(float(row.get('sanitation_access', 0)), 1),
            'drinking_water_access': round(float(row.get('drinking_water_access', 0)), 1),
            'underweight_children':  round(float(row.get('underweight_children', 0)), 1),
            'stunted_children':      round(float(row.get('stunted_children', 0)), 1),
            'anemia_women':          round(float(row.get('anemia_women', 0)), 1),
            'child_marriage_rate':   round(float(row.get('child_marriage_rate', 0)), 1),
            'anemic_children':       round(float(row.get('anemic_children', 0)), 1),
        }
    }


def _compute_top_drivers(row, feature_cols):
    """Return top 3 indicators most contributing to poverty."""
    POVERTY_INDICATORS = {
        'underweight_children':  ('Underweight Children',  True),
        'stunted_children':      ('Stunted Children',      True),
        'anemia_women':          ('Anaemia in Women',      True),
        'child_marriage_rate':   ('Child Marriage Rate',   True),
        'anemic_children':       ('Anaemia in Children',   True),
        'literacy_rate':         ('Low Literacy',          False),
        'sanitation_access':     ('Poor Sanitation',       False),
        'drinking_water_access': ('Poor Water Access',     False),
    }
    scores = []
    for col, (label, higher_is_worse) in POVERTY_INDICATORS.items():
        val = float(row.get(col, 50.0))
        score = val if higher_is_worse else (100 - val)
        scores.append((score, label, round(val, 1), col))
    scores.sort(reverse=True)
    return [{'indicator': s[1], 'value': s[2], 'id': s[3]} for s in scores[:3]]


def _get_recommendations(top_drivers):
    """Generate rule-based recommendations based on top poverty drivers."""
    REC_MAP = {
        'underweight_children':  'Nutritional supplement programs and Anganwadi outreach',
        'stunted_children':      'Early childhood nutrition and maternal care workshops',
        'anemia_women':          'Iron & Folic Acid distribution and regular health camps',
        'child_marriage_rate':   'Community education and stricter law enforcement',
        'anemic_children':       'Pediatric health checkups and fortified food distribution',
        'literacy_rate':         'Adult literacy camps and mobile library initiatives',
        'sanitation_access':     'SBM-G infrastructure development and awareness',
        'drinking_water_access': 'Jal Jeevan Mission pipeline expansion',
    }
    return [REC_MAP.get(d['id'], 'General development aid') for d in top_drivers]


def _get_schemes(top_drivers):
    """Map relevant government schemes to top poverty drivers."""
    SCHEME_MAP = {
        'underweight_children':  'POSHAN Abhiyaan',
        'stunted_children':      'Integrated Child Development Services (ICDS)',
        'anemia_women':          'Anemia Mukt Bharat',
        'child_marriage_rate':   'Kalyana Lakshmi / Shaadi Mubarak',
        'anemic_children':       'Weekly Iron and Folic Acid Supplementation (WIFS)',
        'literacy_rate':         'Samagra Shiksha',
        'sanitation_access':     'Swachh Bharat Mission (Grameen)',
        'drinking_water_access': 'Mission Bhagiratha (Telangana)',
    }
    return list(set([SCHEME_MAP.get(d['id'], 'MGNREGA') for d in top_drivers]))


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.route('/api/districts', methods=['GET'])
def get_districts():
    """Return all Telangana districts with poverty data."""
    bundle = get_bundle()
    df     = bundle['districts_df']
    cols   = bundle['feature_cols']
    imps   = bundle.get('feature_importances', {})
    result = [district_to_dict(row, cols, imps) for _, row in df.iterrows()]
    return jsonify({'districts': result, 'total': len(result)})


@app.route('/api/hotspots', methods=['GET'])
def get_hotspots():
    """Return only High Poverty districts."""
    bundle = get_bundle()
    df     = bundle['districts_df']
    cols   = bundle['feature_cols']
    imps   = bundle.get('feature_importances', {})
    hot_df = df[df['cluster_label'] == 'High Poverty']
    result = [district_to_dict(row, cols, imps) for _, row in hot_df.iterrows()]
    return jsonify({'hotspots': result, 'total': len(result)})


@app.route('/api/district/<name>', methods=['GET'])
def get_district(name):
    """Return data for a single district by name."""
    bundle = get_bundle()
    df     = bundle['districts_df']
    cols   = bundle['feature_cols']
    imps   = bundle.get('feature_importances', {})
    match  = df[df['district'].str.lower() == name.lower()]
    if match.empty:
        abort(404, description=f"District '{name}' not found")
    row = match.iloc[0]
    return jsonify(district_to_dict(row, cols, imps))


@app.route('/api/predict', methods=['POST'])
def predict():
    """Accept district feature JSON, return hotspot prediction."""
    data = request.get_json(force=True)
    if not data:
        abort(400, description='Request body must be JSON')

    from ml.model import predict as ml_predict
    result = ml_predict(data)
    return jsonify(result)


@app.route('/api/retrain', methods=['POST'])
def retrain():
    """Re-run preprocessing + training, refresh model bundle."""
    global _bundle
    try:
        from ml.preprocess import preprocess
        from ml.model import train_and_save
        df, feature_cols, _ = preprocess()
        _, bundle = train_and_save(df, feature_cols)
        _bundle = bundle
        return jsonify({'status': 'success', 'message': 'Model retrained successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Overview stats for the dashboard home page."""
    bundle  = get_bundle()
    df      = bundle['districts_df']
    hotspot_count = int((df['cluster_label'] == 'High Poverty').sum())
    moderate_count = int((df['cluster_label'] == 'Moderate Poverty').sum())
    low_count = int((df['cluster_label'] == 'Low Poverty').sum())
    return jsonify({
        'total_districts':    len(df),
        'hotspot_districts':  hotspot_count,
        'moderate_districts': moderate_count,
        'low_poverty_districts': low_count,
        'avg_mpi_score':      round(float(df['mpi_score'].mean()), 2),
        'highest_mpi_district': df.loc[df['mpi_score'].idxmax(), 'district'],
        'lowest_mpi_district':  df.loc[df['mpi_score'].idxmin(), 'district'],
    })


@app.route('/api/alert', methods=['POST'])
def send_alert():
    """Send a notification via Resend (Login or Poverty Alert)."""
    data = request.get_json(force=True)
    email = data.get('email')
    subject = data.get('subject', 'System Notification')
    html_content = data.get('html')
    
    if not email or not html_content:
        return jsonify({'error': 'Email and content are required'}), 400
    
    try:
        resend.api_key = os.environ.get("RESEND_API_KEY", "your_resend_api_key_here")
        params = {
            "from": "PovertyHotspot <onboarding@resend.dev>",
            "to": [email],
            "subject": subject,
            "html": html_content,
        }
        resend.Emails.send(params)
        return jsonify({'status': 'success'})
    except Exception as e:
        print(f"Resend Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


# ── Error handlers ────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': str(e)}), 404

@app.errorhandler(400)
def bad_request(e):
    return jsonify({'error': str(e)}), 400

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Pre-load / train model at startup
    get_bundle()
    app.run(host='0.0.0.0', debug=True, port=3001)
