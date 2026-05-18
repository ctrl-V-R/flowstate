import psutil
import os
import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError
import asyncio
import httpx
import time
import secrets
import string
from datetime import datetime
from fastapi import FastAPI, APIRouter, Header, HTTPException, Depends, WebSocket, WebSocketDisconnect
from typing import Optional
import logging

from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

# Get CORS origins from environment
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"],
    allow_headers=["*"],
)


# --- [ 1. DYNAMODB CONFIGURATION ] ---
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_DEFAULT_REGION', 'ap-south-1'))
endpoints_table = dynamodb.Table(os.getenv('DYNAMODB_ENDPOINTS_TABLE', 'FlowState_Endpoints'))
auth_table = dynamodb.Table(os.getenv('DYNAMODB_AUTH_TABLE', 'FlowState_Auth'))

# --- [ 2. ACTIVE CACHE (In-Memory) ] ---
active_cache = {
    "endpoints": [],
    "last_updated": None
}

# --- [ 3. UTILS & AUTH ] ---
def get_new_ttl():
    # Get TTL from environment or default to 24 hours
    ttl_seconds = int(os.getenv("TOKEN_TTL", "86400"))
    return int(time.time()) + ttl_seconds

def generate_viewer_code():
    """Generates a 6-char alphanumeric code (e.g., XJ92L1)"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

async def verify_token(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    
    # 1. Check if it's an Admin Token (Direct Lookup)
    admin_check = auth_table.get_item(Key={'token': token})
    if 'Item' in admin_check:
        return admin_check['Item'] # Returns the admin dict

    # 2. Check if it's a Viewer Session ID (Attribute Scan)
    viewer_check = auth_table.scan(
        FilterExpression=Attr('session_id').eq(token)
    )
    if viewer_check['Items']:
        # Return a mock user dict for the viewer
        admin_data = viewer_check['Items'][0]
        return {
            "user_id": "guest_viewer",
            "role": "viewer",
            "owner_id": admin_data.get("user_id"),
            "session_id": token
        }

    # 3. If neither, trigger the 401 that causes the logout
    raise HTTPException(status_code=401, detail="Session Invalid")


# --- [ 4. MONITORING ENGINE ] ---
async def ping_endpoint(client: httpx.AsyncClient, endpoint: dict):
    """Pings URL and returns data matching the Endpoint Interface."""
    url = endpoint.get("url")
    settings = endpoint.get("settings", {})
    metadata = endpoint.get("metadata", {})
    
    if not url:
        print(f"[PING] ERROR: Endpoint {endpoint.get('name', 'unknown')} has no URL")
        metadata.update({"latency": 0, "statusCode": 0})
        return {
            **endpoint,
            "status": "offline",
            "lastSync": datetime.now().strftime("%H:%M:%S"),
            "metadata": metadata
        }
    
    if not endpoint.get("enabledState", True):
        return {**endpoint, "status": "paused"}

    start = time.perf_counter()
    try:
        timeout = float(settings.get("timeout", 5000)) / 1000  # Convert Decimal to float
        logger.debug(f"Pinging {endpoint.get('name', 'unknown')} at {url} (timeout: {timeout}s)")
        response = await client.get(url, timeout=timeout)
        latency = round((time.perf_counter() - start) * 1000, 2)
        
        # Update metadata according to final interface
        metadata.update({
            "latency": latency,
            "statusCode": response.status_code
        })
        
        status = "online" if response.status_code < 400 else "degraded"
        logger.info(f"{endpoint.get('name', 'unknown')}: {status} (latency: {latency}ms, code: {response.status_code})")

        return {
            **endpoint,
            "status": status,
            "lastSync": datetime.now().strftime("%H:%M:%S"),
            "metadata": metadata
        }
    except Exception as e:
        logger.error(f"Error pinging {endpoint.get('name', 'unknown')} at {url}: {type(e).__name__}: {str(e)}")
        metadata.update({"latency": 0, "statusCode": 500})
        return {
            **endpoint,
            "status": "offline",
            "lastSync": datetime.now().strftime("%H:%M:%S"),
            "metadata": metadata
        }

async def monitor_loop():
    """Syncs Bulk DB -> Pings -> Updates Active Cache."""
    logger.info("Background monitoring loop started")
    monitor_interval = int(os.getenv("MONITOR_INTERVAL", "10"))
    
    while True:
        try:
            res = endpoints_table.scan()
            bulk_endpoints = res.get('Items', [])
            logger.debug(f"Found {len(bulk_endpoints)} endpoints in DB")

            if bulk_endpoints:
                async with httpx.AsyncClient() as client:
                    tasks = [ping_endpoint(client, ep) for ep in bulk_endpoints]
                    results = await asyncio.gather(*tasks)
                    
                    global active_cache
                    active_cache = {
                        "endpoints": results,
                        "last_updated": datetime.now().strftime("%H:%M:%S")
                    }
                    logger.info(f"Updated cache with {len(results)} endpoints at {active_cache['last_updated']}")
            else:
                logger.debug("No endpoints to monitor")
        except Exception as e:
            logger.error(f"Background Sync Error: {e}")
        
        await asyncio.sleep(monitor_interval)

''' Backend Health (FSStats) '''
table = dynamodb.Table('FlowState_Endpoints')
def get_total_pings_from_db():
    try:
        response = table.scan(Select='COUNT')
        return response.get('Count', 0)
    except ClientError as e:
        print(f"Error fetching stats: {e.response['Error']['Message']}")
        return 0
    
async def aggregate_system_stats():
    while True:
        # Now this won't throw a NameError
        pings = get_total_pings_from_db()
        
        stats = {
            "active_sessions": len(manager.active_connections),
            "total_pings_24h": pings,
            "system_health": "optimal" if pings > 0 else "degraded"
        }
        
        await manager.broadcast(stats)
        await asyncio.sleep(30)

async def get_system_metrics():
    """
    Gathers real-time system stats to seed the frontend 
    immediately upon WebSocket connection.
    """
    # 1. Get real CPU and RAM usage
    cpu_usage = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # 2. Get your DynamoDB count (using the function we wrote earlier)
    # If the function is sync, we just call it. 
    # If it's async, use 'await'.
    total_pings = get_total_pings_from_db() 

    return {
        "active_sessions": len(manager.active_connections) if 'manager' in globals() else 0,
        "total_pings_24h": total_pings,
        "system_health": "optimal" if cpu_usage < 80 else "strained",
        "cpu_load": cpu_usage,
        "memory_usage": memory.percent,
        "timestamp": time.time()
    }
    
async def get_system_metrics():
    """
    Gathers real-time system stats to seed the frontend 
    immediately upon WebSocket connection.
    """
    # 1. Get real CPU and RAM usage
    cpu_usage = psutil.cpu_percent(interval=None)
    memory = psutil.virtual_memory()
    
    # 2. Get your DynamoDB count (using the function we wrote earlier)
    # If the function is sync, we just call it. 
    # If it's async, use 'await'.
    total_pings = get_total_pings_from_db() 

    return {
        "active_sessions": len(manager.active_connections) if 'manager' in globals() else 0,
        "total_pings_24h": total_pings,
        "system_health": "optimal" if cpu_usage < 80 else "strained",
        "cpu_load": cpu_usage,
        "memory_usage": memory.percent,
        "timestamp": time.time()
    }
    
@app.get("/api/v1/telemetry/{node_id}")
async def get_single_node_telemetry(node_id: str):
    # Here you could query a specific DB record or check a specific process
    return {
        "id": node_id,
        "cpu": psutil.Process().cpu_percent(), # Example: stats for this specific process
        "mem": psutil.virtual_memory().percent,
        "latency": 5
    }

async def connect(self, websocket: WebSocket):
    await websocket.accept()
    self.active_connections.append(websocket)
    
    # SEND DATA IMMEDIATELY ON CONNECTION
    initial_stats = await get_system_metrics() 
    await websocket.send_json(initial_stats)

class ConnectionManager:
    def __init__(self):
        # Stores active websocket connections
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        # This is the missing attribute!
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        # This removes the socket when a user closes the tab
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Sends data to every connected admin simultaneously
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Clean up stale connections if they fail
                self.active_connections.remove(connection)

manager = ConnectionManager()

@app.websocket("/ws/stats")
async def websocket_endpoint(websocket: WebSocket):
    # If you have custom middleware, it might be blocking this.
    # Try accepting the connection immediately.
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- [ 5. ROUTES ] ---

router = APIRouter(prefix="/api/v1")

@router.post("/auth/register")
async def register_session(data: dict):
    admin_token = data.get("token")        # The UUID
    session_id = data.get("session_id")   # The shareable code
    user_id = data.get("user_id", "admin_user")
    email = data.get("email")

    if not admin_token or not session_id:
        raise HTTPException(
            status_code=400, 
            detail="Protocol mismatch: Both Admin UUID and SessionID are required."
        )

    try:
        # We store the Admin under their UUID as the primary key (or username depending on your schema)
        # Here we use the token as the unique identifier for the auth record
        auth_item = {
            'token': admin_token,
            'session_id': session_id,
            'user_id': user_id,
            'email': email,
            'role': 'admin',
            'created_at': datetime.now().isoformat(),
            'ttl': get_new_ttl(),
            'status': 'active'
        }

        auth_table.put_item(Item=auth_item)

        return {
            "status": "protocol_initialized",
            "role": "admin",
            "session_id": session_id
        }

    except Exception as e:
        print(f"Registry Write Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to persist administrative credentials.")

@router.post("/auth/verify")
async def verify_credentials(data: dict):
    token_input = data.get("token")
    new_ttl = get_new_ttl()

    try:
        # 1. ATTEMPT ADMIN LOGIN (Update TTL ONLY if token exists)
        try:
            response = auth_table.update_item(
                Key={'token': token_input},
                # Only perform the update if the item already exists in the DB
                ConditionExpression="attribute_exists(#t_key)", 
                UpdateExpression="SET #t = :val",
                ExpressionAttributeNames={
                    '#t': 'ttl',
                    '#t_key': 'token' # Mapping the partition key to check existence
                },
                ExpressionAttributeValues={':val': new_ttl},
                ReturnValues="ALL_NEW"
            )
            user = response.get('Attributes')
            return {
                "role": "admin",
                "user_id": user.get("user_id"),
                "session_id": user.get("session_id")
            }
        except ClientError as e:
            # This triggers if the token doesn't exist (prevents empty creation)
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                pass 
            else:
                raise e

        # 2. ATTEMPT VIEWER LOGIN
        viewer_check = auth_table.scan(
            FilterExpression=Attr('session_id').eq(token_input)
        )

        if viewer_check['Items']:
            admin_item = viewer_check['Items'][0]
            admin_token = admin_item['token']

            # Refresh TTL for the existing Admin record
            auth_table.update_item(
                Key={'token': admin_token},
                # Use #tk instead of 'token' directly
                ConditionExpression="attribute_exists(#tk)", 
                UpdateExpression="SET #t = :val",
                ExpressionAttributeNames={
                    '#t': 'ttl',
                    '#tk': 'token' # Alias for the reserved keyword
                },
                ExpressionAttributeValues={':val': new_ttl}
            )

            return {
                "role": "viewer",
                "user_id": f"guest_{token_input}",
                "session_id": token_input,
                "owner_id": admin_item.get("user_id")
            }

        # 3. IF NO MATCHES FOUND
        raise HTTPException(status_code=401, detail="Invalid Protocol Key")

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Security Error")

@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(verify_token)):
    """Both Viewers and Admins can see this."""
    # Determine which user_id to filter by
    if current_user.get("role") == "viewer":
        filter_user_id = current_user.get("owner_id")
    else:
        filter_user_id = current_user.get("user_id")
    
    # Filter cached endpoints by user_id (allow endpoints without user_id for legacy support)
    filtered_endpoints = [
        ep for ep in active_cache.get("endpoints", [])
        if ep.get("user_id") == filter_user_id or ep.get("user_id") is None
    ]
    
    return {
        "cache": {
            "endpoints": filtered_endpoints,
            "last_updated": active_cache.get("last_updated")
        },
        "user_role": current_user["role"]
    }

@router.get("/connections")
async def get_all_connections(current_user: dict = Depends(verify_token)):
    # Determine which user_id to filter by
    if current_user.get("role") == "viewer":
        # Viewers see their owner's endpoints
        filter_user_id = current_user.get("owner_id")
    else:
        # Admins see their own endpoints
        filter_user_id = current_user.get("user_id")
    
    # Get all endpoints and filter (include legacy endpoints without user_id)
    res = endpoints_table.scan()
    all_items = res.get('Items', [])
    
    # Filter: show user's endpoints OR legacy endpoints (no user_id)
    filtered_items = [
        item for item in all_items
        if item.get('user_id') == filter_user_id or item.get('user_id') is None
    ]

    await manager.broadcast({
        "active_sessions": len(manager.active_connections), # Simple proxy for activity
        "total_pings_24h": get_total_pings_from_db(),       # Fetch latest count
        "system_health": "optimal"
    })

    return filtered_items

@router.put("/connections/{endpoint_id}")
async def update_connection(
    endpoint_id: str, 
    data: dict, 
    current_user: dict = Depends(verify_token)
):
    # 1. Permission Guard
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Clearance insufficient for registry modification.")

    # 2. Check if it exists
    existing = endpoints_table.get_item(Key={'id': endpoint_id})
    if 'Item' not in existing:
        raise HTTPException(status_code=404, detail="Node not found in registry.")
    
    # 3. Verify ownership (allow updating legacy endpoints without user_id)
    endpoint_user_id = existing['Item'].get('user_id')
    if endpoint_user_id is not None and endpoint_user_id != current_user.get('user_id'):
        raise HTTPException(status_code=403, detail="Cannot modify endpoints owned by other users.")

    # 3. Merge/Update Logic
    try:
        # We preserve the original ID and add/update the new fields
        updated_item = {
            **existing['Item'],  # Keep old fields like created_at
            'name': data.get('name'),
            'url': data.get('url'),
            'customKey': data.get('customKey'),
            'endpointSecret': data.get('endpointSecret'),
            'useLLM': data.get('useLLM'),
            'timeout': data.get('timeout'),
            'retries': data.get('retries'),
            'headers': data.get('headers', {}),
            'enabledState': data.get('enabledState'),
            'lastSync': datetime.now().strftime("%H:%M:%S"),
            'status': data.get('status'),
            'user_id': existing['Item'].get('user_id') or current_user.get('user_id')  # Claim ownership if legacy
        }

        endpoints_table.put_item(Item=updated_item)

        await manager.broadcast({
            "active_sessions": len(manager.active_connections), # Simple proxy for activity
            "total_pings_24h": get_total_pings_from_db(),       # Fetch latest count
            "system_health": "optimal"
        })

        return {"status": "updated", "id": endpoint_id}

    except Exception as e:
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to persist updates to DynamoDB.")

@router.post("/connections")
async def add_connection(data: dict, current_user: dict = Depends(verify_token)):
    """Only Admins can create endpoints."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin passkey required for this action.")

    # Strictly following your finalized Endpoint interface
    new_endpoint = {
        "id": str(int(time.time())),
        "name": data.get("name", "New Protocol"),
        "url": data.get("url", ""),
        "status": data.get("status", "offline"),
        "lastSync": data.get(datetime.now().strftime("%H:%M:%S"), "Never"),
        "customKey": data.get("customKey", ""),
        "endpointSecret": data.get("endpointSecret", ""),
        "useLLM": data.get("useLLM", False),
        "enabledState": True,
        "user_id": current_user.get("user_id"),  # Store owner for filtering
        "settings": {
            "timeout": data.get("timeout", 5000),
            "retries": data.get("retries", 3),
            "headers": data.get("headers", {})
        },
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "version": "1.0",
            "latency": 0
        }
    }
    
    endpoints_table.put_item(Item=new_endpoint)

    await manager.broadcast({
        "active_sessions": len(manager.active_connections), # Simple proxy for activity
        "total_pings_24h": get_total_pings_from_db(),       # Fetch latest count
        "system_health": "optimal"
    })

    return {"message": "Protocol Established", "id": new_endpoint["id"]}

@router.post("/connections/test-connection")
async def test_unsaved_connection(data: dict, current_user: dict = Depends(verify_token)):
    """
    Tests a connection before it is ever saved to the database.
    Expects: {"url": "...", "headers": "{...}"}
    """
    target_url = data.get("url")
    if not target_url:
        raise HTTPException(status_code=400, detail="Target URL required for diagnostic")

    async with httpx.AsyncClient() as client:
        try:
            # We perform a quick HEAD or GET request to see if it's alive
            resp = await client.get(target_url, timeout=5.0)
            status = "online" if resp.status_code < 400 else "offline"
            return {"status": status, "code": resp.status_code}
        except Exception:
            return {"status": "offline", "detail": "Host unreachable"}

@router.post("/connections/{endpoint_id}/ping")
async def ping_single_node(endpoint_id: str, current_user: dict = Depends(verify_token)):
    """
    Retrieves a registered endpoint from DynamoDB and performs a connectivity handshake.
    """
    # 1. AUTHENTICATION & ROLE CHECK
    # (Optional: Prevent Viewers from triggering manual pings if desired)
    # if current_user.get("role") == "viewer":
    #    raise HTTPException(status_code=403, detail="Clearance insufficient for manual diagnostics")

    # 2. DATABASE LOOKUP
    try:
        response = endpoints_table.get_item(Key={'id': endpoint_id})
    except Exception as e:
        print(f"DynamoDB Error: {e}")
        raise HTTPException(status_code=500, detail="Registry access failure")

    item = response.get('Item')
    if not item:
        raise HTTPException(status_code=404, detail=f"Node {endpoint_id} not found in registry")
    
    # 2.5 VERIFY OWNERSHIP (allow pinging legacy endpoints without user_id)
    # Determine which user_id to check against
    if current_user.get("role") == "viewer":
        check_user_id = current_user.get("owner_id")
    else:
        check_user_id = current_user.get("user_id")
    
    endpoint_user_id = item.get('user_id')
    if endpoint_user_id is not None and endpoint_user_id != check_user_id:
        raise HTTPException(status_code=403, detail="Cannot ping endpoints owned by other users.")

    # 3. EXTRACT METADATA
    target_url = item.get('url')
    custom_headers = item.get('headers', {})

    # 4. EXECUTE HANDSHAKE
    async with httpx.AsyncClient() as client:
        try:
            # We use a 5s timeout to keep the UI responsive
            resp = await client.get(
                target_url, 
                headers=custom_headers, 
                timeout=5.0,
                follow_redirects=True
            )
            
            # Logic: 2xx and 3xx are considered 'online'
            status = "online" if resp.status_code < 400 else "offline"

            await manager.broadcast({
                "active_sessions": len(manager.active_connections), # Simple proxy for activity
                "total_pings_24h": get_total_pings_from_db(),       # Fetch latest count
                "system_health": "optimal"
            })
            
            return {
                "status": status,
                "code": resp.status_code,
                "timestamp": datetime.now().isoformat()
            }
            
        except httpx.RequestError as exc:
            print(f"Network Error: {exc}")
            return {
                "status": "offline", 
                "detail": "Host unreachable or DNS failure",
                "code": 503
            }
        except Exception as e:
            print(f"Unexpected Error during ping: {e}")
            return {"status": "offline", "detail": "Internal diagnostic error"}

@router.post("/connections/ping-all")
async def trigger_manual_sync(current_user: dict = Depends(verify_token)):

    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin required for force-sync")

    # This manually runs the ping logic once outside the 60s loop
    async with httpx.AsyncClient() as client:
        # Filter by current user's endpoints only
        res = endpoints_table.scan(
            FilterExpression=Attr('user_id').eq(current_user.get("user_id"))
        )
        bulk_endpoints = res.get('Items', [])
        
        if bulk_endpoints:
            tasks = [ping_endpoint(client, ep) for ep in bulk_endpoints]
            results = await asyncio.gather(*tasks)
            
            # Update only the current user's endpoints in the cache
            global active_cache
            # Keep other users' endpoints and update only current user's
            other_endpoints = [
                ep for ep in active_cache.get("endpoints", [])
                if ep.get("user_id") != current_user.get("user_id")
            ]
            active_cache = {
                "endpoints": other_endpoints + results,
                "last_updated": datetime.now().strftime("%H:%M:%S")
            }
    
    await manager.broadcast({
        "active_sessions": len(manager.active_connections), # Simple proxy for activity
        "total_pings_24h": get_total_pings_from_db(),       # Fetch latest count
        "system_health": "optimal"
    })
            
    return {"message": "Sync complete", "timestamp": active_cache["last_updated"]}

@router.get("/user/profile")
async def get_user_profile(current_user: dict = Depends(verify_token)):
    """
    Returns identity details without the bulk dashboard data.
    verify_token already fetches the item from DynamoDB, so we just return it.
    """
    return {
        "userId": current_user.get("user_id"),
        "role": current_user.get("role"),
        "email": current_user.get("email", "N/A"),
        "initializedAt": current_user.get("created_at")
    }

@router.delete("/connections/{endpoint_id}")
async def delete_connection(endpoint_id: str, current_user: dict = Depends(verify_token)):
    """
    Purges a connection from the DynamoDB registry. 
    Strictly restricted to Admin/Editor roles.
    """
    
    # 1. SECURITY CHECK
    # Ensure only users with 'admin' or 'editor' roles can delete
    if current_user.get("role") not in ["admin", "editor"]:
        raise HTTPException(
            status_code=403, 
            detail="Clearance Level Insufficient: Purge protocol restricted to Admin."
        )

    # 2. VALIDATE EXISTENCE
    # We check if it exists before deleting so we can return a proper 404 if needed
    check_exists = endpoints_table.get_item(Key={'id': endpoint_id})
    if 'Item' not in check_exists:
        raise HTTPException(
            status_code=404, 
            detail=f"Node {endpoint_id} not found in registry."
        )
    
    # 3. VERIFY OWNERSHIP (allow deleting legacy endpoints without user_id)
    endpoint_user_id = check_exists['Item'].get('user_id')
    if endpoint_user_id is not None and endpoint_user_id != current_user.get('user_id'):
        raise HTTPException(
            status_code=403, 
            detail="Cannot delete endpoints owned by other users."
        )

    # 3. EXECUTE PURGE
    try:
        endpoints_table.delete_item(Key={'id': endpoint_id})
        
        # Return a confirmation of the deleted ID
        return {
            "status": "purged",
            "id": endpoint_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"CRITICAL: Deletion failure for {endpoint_id}: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Registry write failure during purge sequence."
        )

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(monitor_loop())
    asyncio.create_task(aggregate_system_stats())