from flask import Flask, g, jsonify, request
from flask_sock import Sock
import psycopg2
from flask_cors import CORS
import psycopg2.extras
import os
import json
import math
import uuid
from dotenv import load_dotenv
from livekit import api
from validation import (
    validate,
    current_user_id,
    ReviewCreate,
    ReviewUpdate,
    FavoriteCreate,
    AuthSyncUser,
    BusinessQuery,
)

# Load environment variables
load_dotenv()



app = Flask(__name__)
CORS(app)

sock = Sock(app)


@app.errorhandler(404)
def handle_404(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(Exception)
def handle_uncaught(error):
    """Last-resort net so unhandled errors return clean JSON, not an HTML 500."""
    from werkzeug.exceptions import HTTPException
    if isinstance(error, HTTPException):
        return jsonify({'error': error.description}), error.code
    print(f"Unhandled error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

# Store connected WebSocket clients
connected_clients = set()

@sock.route('/ws')
def websocket(ws):
    """WebSocket endpoint for agent-to-frontend communication"""
    connected_clients.add(ws)
    print("✅ Frontend connected to WebSocket")
    try:
        while True:
            # Keep connection alive, receive any messages from frontend
            data = ws.receive()
            if data:
                print(f"Received from frontend: {data}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.remove(ws)
        print("❌ Frontend disconnected")

def send_to_frontend(message):
    """Send navigation commands to all connected frontends"""
    for client in list(connected_clients):
        try:
            client.send(json.dumps(message))
            print(f"📤 Sent to frontend: {message}")
        except Exception as e:
            print(f"Failed to send to client: {e}")
            connected_clients.discard(client)

@app.route('/agent/navigate', methods=['POST'])
def agent_navigate():
    """Receive navigation commands from agent and relay to frontend"""
    data = request.json
    print(f"Agent wants to navigate: {data}")

    # Send to all connected frontends via WebSocket
    send_to_frontend(data)

    return {"status": "sent"}, 200

@app.route('/livekit/token')
def get_livekit_token():
    """Generate a fresh LiveKit access token for the frontend"""
    # Generate unique room name for each session to ensure new agent dispatch
    room_name = f"room-{uuid.uuid4().hex[:8]}"

    token = api.AccessToken(
        os.getenv('LIVEKIT_API_KEY'),
        os.getenv('LIVEKIT_API_SECRET')
    ).with_identity("web-user") \
     .with_name("Web User") \
     .with_grants(api.VideoGrants(
        room_join=True,
        room=room_name,
        room_create=True,  # Allow creating new rooms
    ))
    return token.to_jwt()

CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'business_directory'),
    'user': os.getenv('DB_USER', 'akurukunda01'),
    'secret_key': 'king',
    'port': int(os.getenv('DB_PORT', '5432'))
}

def get_db():
    if 'db' not in g:
        g.db = psycopg2.connect(
            dbname=CONFIG['database'],
            user=CONFIG['user'],
            host=CONFIG['host'],
            port=CONFIG['port']
        )
        g.cursor = g.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return g.db, g.cursor

def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

@app.teardown_appcontext
def close_db_connection(error):
    close_db(error)



@app.route('/auth/sync-user', methods=['POST'])
def sync_auth0_user():
    """Sync Auth0 user with local database"""
    try:
        data, errors = validate(AuthSyncUser, request.json)
        if errors:
            return jsonify({'errors': errors}), 400

        auth0_id = data.sub
        # email is NOT NULL in the DB; derive a stable placeholder when Auth0
        # doesn't provide one.
        email = data.email or f"{auth0_id.replace('|', '_')}@noemail.local"
        first_name = data.given_name or ''
        last_name = data.family_name or ''
        # avatar_url column is limited; truncate to stay within VARCHAR(255).
        avatar_url = (data.picture or '')[:255]

        conn, cursor = get_db()

        cursor.execute('SELECT * FROM users WHERE auth0_id = %s', (auth0_id,))
        user = cursor.fetchone()

        if user:
            # Don't touch user_name on update -- it's the UNIQUE handle and is
            # generated once at creation below.
            cursor.execute('''
                UPDATE users
                SET email = %s, first_name = %s, last_name = %s,
                    avatar_url = %s, updated_at = CURRENT_TIMESTAMP
                WHERE auth0_id = %s
                RETURNING id, user_name, email, first_name, last_name, avatar_url, auth0_id
            ''', (email, first_name, last_name, avatar_url, auth0_id))

            updated_user = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'User updated', 'user': updated_user}), 200
        else:
            # user_name is UNIQUE and VARCHAR(50). Append a sub fragment so two
            # users with the same display name can't collide.
            base = data.nickname or data.name or email.split('@')[0]
            user_name = (base[:40] + '-' + auth0_id.split('|')[-1][:8])[:50]
            cursor.execute('''
                INSERT INTO users (user_name, email, auth0_id, first_name, last_name, avatar_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, user_name, email, first_name, last_name, avatar_url, auth0_id
            ''', (user_name, email, auth0_id, first_name, last_name, avatar_url))
            
            new_user = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({'message': 'User created', 'user': new_user}), 201
    
    except Exception as e:
        print("Error syncing user:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/auth/current-user', methods=['GET'])
def get_current_user():
    """Get current user by auth0_id"""
    auth0_id = request.args.get('auth0_id')
    
    if not auth0_id:
        return jsonify({'error': 'auth0_id required'}), 400
    
    try:
        conn, cursor = get_db()
        cursor.execute('SELECT id, user_name, email, first_name, last_name, avatar_url, auth0_id FROM users WHERE auth0_id = %s', (auth0_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify(user), 200
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_local', methods=['GET'])
def get_businesses():
    args = _clean_query_args(request.args)
    params_obj, errors = validate(BusinessQuery, args)
    if errors:
        return jsonify({'errors': errors}), 400

    category = params_obj.category
    min_rating = params_obj.min_rating
    max_distance = params_obj.max_distance
    user_lat = params_obj.lat
    user_lng = params_obj.lng

    conn, cursor = get_db()
    
    sql = "SELECT * FROM businesses WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
    params = []
    
    if category and category != 'all':
        sql += " AND category = %s"
        params.append(category)
    
    if min_rating and min_rating > 0:
        sql += " AND rating >= %s"
        params.append(min_rating)
    
    cursor.execute(sql, params)
    businesses = cursor.fetchall()
    
    # Calculate distance for each business if user location provided
    if user_lat and user_lng:
        for business in businesses:
            if business['latitude'] and business['longitude']:
                distance = calculate_distance(
                    user_lat, user_lng,
                    float(business['latitude']), float(business['longitude'])
                )
                business['distance'] = f"{distance} mi"
                business['distance_value'] = distance
            else:
                business['distance_value'] = 999  # Put businesses without coords at end
        
        # Filter by max distance if provided
        if max_distance is not None:
            businesses = [b for b in businesses if b.get('distance_value', 999) <= max_distance]

        # Sort by distance
        businesses = sorted(businesses, key=lambda x: x.get('distance_value', 999))
    else:
        # No user location, sort by rating
        businesses = sorted(businesses, key=lambda x: x.get('rating', 0), reverse=True)

    cursor.close()
    conn.close()

    return jsonify(businesses), 200


def _clean_query_args(args):
    """Drop 'all'/'' sentinels for numeric query params so the optional
    BusinessQuery fields stay None instead of failing float parsing."""
    cleaned = args.to_dict()
    for key in ('min_rating', 'max_distance', 'lat', 'lng'):
        if cleaned.get(key) in ('', 'all'):
            cleaned.pop(key, None)
    return cleaned


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in miles using Haversine formula"""
    R = 3959  # Earth's radius in miles
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return round(R * c, 1)

@app.route('/search_local', methods=['GET'])
def search_businesses():
    args = _clean_query_args(request.args)
    params_obj, errors = validate(BusinessQuery, args)
    if errors:
        return jsonify({'errors': errors}), 400

    query = params_obj.q or ''
    category = params_obj.category
    min_rating = params_obj.min_rating
    max_distance = params_obj.max_distance
    user_lat = params_obj.lat
    user_lng = params_obj.lng

    conn, cursor = get_db()
    
    sql = "SELECT * FROM businesses WHERE name ILIKE %s AND latitude IS NOT NULL AND longitude IS NOT NULL"
    params = [f'%{query}%']
    
    if category and category != 'all':
        sql += " AND category = %s"
        params.append(category)
    
    if min_rating is not None and min_rating > 0:
        sql += " AND rating >= %s"
        params.append(min_rating)
    
    cursor.execute(sql, params)
    businesses = cursor.fetchall()
    
    # Calculate distance for each business if user location provided
    if user_lat and user_lng:
        for business in businesses:
            if business['latitude'] and business['longitude']:
                distance = calculate_distance(
                    user_lat, user_lng,
                    float(business['latitude']), float(business['longitude'])
                )
                business['distance'] = f"{distance} mi"
                business['distance_value'] = distance
            else:
                business['distance_value'] = 999
        
        # Filter by max distance if provided
        if max_distance is not None:
            businesses = [b for b in businesses if b.get('distance_value', 999) <= max_distance]

        # Sort by distance
        businesses = sorted(businesses, key=lambda x: x.get('distance_value', 999))
    else:
        # No user location, sort by rating
        businesses = sorted(businesses, key=lambda x: x.get('rating', 0), reverse=True)
    
    cursor.close()
    conn.close()
    
    return jsonify(businesses), 200

@app.route('/get_reviews/<int:id>', methods=['GET'])
def get_reviews(id):
    print("Fetching reviews for business ID:", id)
    conn, cursor = get_db()
    cursor.execute('SELECT * FROM reviews WHERE business_id =%s ORDER BY created_at DESC', (id,))
    
    reviews = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(reviews), 200

@app.route('/get_review_count/<int:id>', methods=['GET'])
def get_review_count(id):
    conn, cursor = get_db()
    count = 0
    cursor.execute('SELECT * FROM reviews WHERE business_id = %s', (id,))
    count = len(cursor.fetchall())
       
    cursor.execute('UPDATE businesses SET review_count = %s WHERE id = %s', (count, id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"review_count": count}), 200

@app.route('/get_rating/<int:id>', methods=['GET'])
def get_rating(id):
    conn, cursor = get_db()
    cursor.execute('SELECT AVG(rating) as average_rating FROM reviews WHERE business_id = %s', (id,))
    rating = cursor.fetchone()
    cursor.execute('UPDATE businesses SET rating = %s WHERE id = %s', (rating['average_rating'], id))
    conn.commit()
    if rating['average_rating'] is None:
        rating['average_rating'] = 0.0
    else:
        rating['average_rating'] = float(rating['average_rating'])
    cursor.close()
    conn.close()
    return jsonify(rating), 200

# Create review
@app.route('/add_reviews', methods=['POST'])
def create_review():
    # Syntactic validation
    review, errors = validate(ReviewCreate, request.json)
    if errors:
        return jsonify({'errors': errors}), 400

    conn, cursor = get_db()

    # Semantic validation: business must exist
    cursor.execute('SELECT id FROM businesses WHERE id = %s', (review.business,))
    if not cursor.fetchone():
        return jsonify({'errors': ['business: does not exist']}), 400

    # Resolve authenticated user (fallback to user_id=1 to keep existing behavior)
    user_id = current_user_id(cursor) or 1

    cursor.execute(
        'INSERT INTO reviews (user_id, business_id, rating, comment) VALUES (%s, %s, %s, %s) RETURNING *',
        (user_id, review.business, review.rating, review.comment)
    )
    review = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(review), 201

# Update review
@app.route('/update_reviews/<int:id>', methods=['PUT'])
def update_review(id):
    # Syntactic validation
    data, errors = validate(ReviewUpdate, request.json)
    if errors:
        return jsonify({'errors': errors}), 400

    conn, cursor = get_db()

    # Semantic validation: review must exist, and caller must own it
    cursor.execute('SELECT user_id FROM reviews WHERE id = %s', (id,))
    existing = cursor.fetchone()
    if not existing:
        return jsonify({'error': 'Review not found'}), 404
    user_id = current_user_id(cursor)
    if user_id is None or existing['user_id'] != user_id:
        return jsonify({'error': 'Not authorized to modify this review'}), 403

    cursor.execute(
        'UPDATE reviews SET rating=%s, comment=%s WHERE id=%s RETURNING *',
        (data.rating, data.comment, id)
    )
    review = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify(review)

# Delete review
@app.route('/delete_reviews/<int:id>', methods=['DELETE'])
def delete_review(id):
    conn, cursor = get_db()

    # Semantic validation: review must exist, and caller must own it
    cursor.execute('SELECT user_id FROM reviews WHERE id = %s', (id,))
    existing = cursor.fetchone()
    if not existing:
        return jsonify({'error': 'Review not found'}), 404
    user_id = current_user_id(cursor)
    if user_id is None or existing['user_id'] != user_id:
        return jsonify({'error': 'Not authorized to delete this review'}), 403

    cursor.execute('DELETE FROM reviews WHERE id=%s', (id,))
    conn.commit()
    cursor.close()
    conn.close()
    return '', 204

@app.route('/businesses/category/<category>', methods=['GET'])
def filter_by_category(category):
    conn, cursor = get_db()
    cursor.execute('SELECT * FROM businesses WHERE category = %s ORDER BY rating DESC', (category,))
    businesses = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(businesses), 200

# Filter by minimum rating
@app.route('/businesses/rating/<float:min_rating>', methods=['GET'])
def filter_by_rating(min_rating):
    conn, cursor = get_db()
    cursor.execute('SELECT * FROM businesses WHERE rating >= %s ORDER BY rating DESC', (min_rating,))
    businesses = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(businesses), 200

# Filter by maximum distance
@app.route('/businesses/distance/<float:max_distance>', methods=['GET'])
def filter_by_distance(max_distance):
    conn, cursor = get_db()
    # Assumes distance is stored as "X miles" format
    cursor.execute('''
        SELECT * FROM businesses 
        WHERE CAST(SPLIT_PART(distance, ' ', 1) AS FLOAT) <= %s 
        ORDER BY CAST(SPLIT_PART(distance, ' ', 1) AS FLOAT) ASC
    ''', (max_distance,))
    businesses = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(businesses), 200

# Get all categories
@app.route('/categories', methods=['GET'])
def get_categories():
    conn, cursor = get_db()
    cursor.execute('SELECT DISTINCT category FROM businesses ORDER BY category')
    categories = [row['category'] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return jsonify(categories), 200

# ==================== FAVORITES ROUTES ====================

@app.route('/favorites/<int:user_id>', methods=['GET'])
def get_favorites(user_id):
    """Get all favorites for a user"""
    conn, cursor = get_db()
    if current_user_id(cursor) != user_id:
        return jsonify({'error': 'Not authorized to view these favorites'}), 403
    cursor.execute('''
        SELECT b.* FROM businesses b
        JOIN favorites f ON b.id = f.business_id
        WHERE f.user_id = %s
        ORDER BY f.created_at DESC
    ''', (user_id,))
    
    favorites = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(favorites), 200

@app.route('/favorites', methods=['POST'])
def add_favorite():
    """Add a business to favorites"""
    fav, errors = validate(FavoriteCreate, request.json)
    if errors:
        return jsonify({'errors': errors}), 400

    try:
        conn, cursor = get_db()

        # Authorization: caller may only modify their own favorites
        if current_user_id(cursor) != fav.user_id:
            return jsonify({'error': 'Not authorized to modify these favorites'}), 403

        # Semantic validation: business must exist
        cursor.execute('SELECT id FROM businesses WHERE id = %s', (fav.business_id,))
        if not cursor.fetchone():
            return jsonify({'errors': ['business_id: does not exist']}), 400

        cursor.execute(
            'INSERT INTO favorites (user_id, business_id) VALUES (%s, %s) RETURNING *',
            (fav.user_id, fav.business_id)
        )
        favorite = cursor.fetchone()
        
        
        
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Favorite added', 'favorite': favorite}), 200
    
    except Exception as e:
        # Handle duplicate favorite error
        if 'duplicate key' in str(e):
            return jsonify({'error': 'Already favorited'}), 400
        print("Error adding favorite:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/favorites/<int:user_id>/<int:business_id>', methods=['DELETE'])
def remove_favorite(user_id, business_id):
    """Remove a business from favorites"""
    conn, cursor = get_db()
    if current_user_id(cursor) != user_id:
        return jsonify({'error': 'Not authorized to modify these favorites'}), 403
    cursor.execute(
        'DELETE FROM favorites WHERE user_id = %s AND business_id = %s RETURNING *',
        (user_id, business_id)
    )
    deleted = cursor.fetchone()
    
    
    
    conn.commit()
    cursor.close()
    conn.close()
    
    if deleted:
        return jsonify({'message': 'Favorite removed'}), 200
    else:
        return jsonify({'error': 'Favorite not found'}), 404

@app.route('/favorites/check/<int:user_id>/<int:business_id>', methods=['GET'])
def check_favorite(user_id, business_id):
    """Check if a business is favorited by user"""
    conn, cursor = get_db()
    if current_user_id(cursor) != user_id:
        return jsonify({'error': 'Not authorized'}), 403
    cursor.execute(
        'SELECT EXISTS(SELECT 1 FROM favorites WHERE user_id = %s AND business_id = %s)',
        (user_id, business_id)
    )
    is_favorited = cursor.fetchone()['exists']
    cursor.close()
    conn.close()
    return jsonify({'is_favorited': is_favorited}), 200

@app.route('/deals/business/<int:business_id>', methods=['GET'])
def get_business_deals(business_id):
    """Get all active deals for a business"""
    conn, cursor = get_db()
    cursor.execute('''
        SELECT * FROM deals 
        WHERE business_id = %s AND is_active = TRUE 
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY created_at DESC
    ''', (business_id,))
    
    deals = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(deals), 200

@app.route('/deals/active', methods=['GET'])
def get_all_active_deals():
    """Get all active deals across all businesses"""
    conn, cursor = get_db()
    cursor.execute('''
        SELECT d.*, b.name as business_name, b.category 
        FROM deals d
        JOIN businesses b ON d.business_id = b.id
        WHERE d.is_active = TRUE 
        AND (d.end_date IS NULL OR d.end_date >= CURRENT_DATE)
        ORDER BY d.created_at DESC
    ''')
    
    deals = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(deals), 200

if __name__ == '__main__':
    app.run(debug=True, port=8000)