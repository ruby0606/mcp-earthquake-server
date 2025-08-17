"""
Simple API server to expose MCP earthquake data
Run this alongside your Flask app to get real-time data
"""
from flask import Flask, jsonify, request, send_file
import subprocess
import json
import os

app = Flask(__name__)

# Path to your MCP server
MCP_SERVER_PATH = os.path.join(os.path.dirname(__file__), "dist", "index.js")

def call_mcp_tool(tool_name, arguments=None):
    """Call MCP tool and return response"""
    if arguments is None:
        arguments = {}
    
    mcp_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    try:
        # Call MCP server
        process = subprocess.Popen(
            ["node", MCP_SERVER_PATH],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=os.path.dirname(MCP_SERVER_PATH)
        )
        
        stdout, stderr = process.communicate(
            input=json.dumps(mcp_request),
            timeout=30
        )
        
        if process.returncode != 0:
            return {"error": f"MCP error: {stderr}"}
        
        # Parse response
        lines = stdout.strip().split('\n')
        json_line = next((line for line in lines if line.strip().startswith('{')), None)
        
        if json_line:
            response = json.loads(json_line)
            return response.get("result", response)
        else:
            return {"error": "No valid response"}
            
    except Exception as e:
        return {"error": str(e)}

@app.route('/api/earthquakes/recent')
def get_recent_earthquakes():
    """Get recent earthquakes"""
    magnitude_min = float(request.args.get('magnitude_min', 2.5))
    limit = int(request.args.get('limit', 100))
    days = int(request.args.get('days', 7))
    location = request.args.get('location')
    
    args = {
        "magnitude_min": magnitude_min,
        "limit": limit,
        "days": days
    }
    if location:
        args["location"] = location
    
    result = call_mcp_tool("get_recent_earthquakes", args)
    return jsonify(result)

@app.route('/api/earthquakes/summary')
def get_earthquake_summary():
    """Get earthquake summary"""
    summary_type = request.args.get('type', 'daily')
    include_predictions = request.args.get('include_predictions', 'true').lower() == 'true'
    
    args = {
        "type": summary_type,
        "include_predictions": include_predictions
    }
    
    result = call_mcp_tool("get_earthquake_summary", args)
    return jsonify(result)

@app.route('/api/earthquakes/patterns')
def analyze_patterns():
    """Analyze earthquake patterns"""
    region = request.args.get('region', 'global')
    time_window = request.args.get('time_window', '7d')
    magnitude_threshold = float(request.args.get('magnitude_threshold', 4.0))
    
    args = {
        "region": region,
        "time_window": time_window,
        "magnitude_threshold": magnitude_threshold
    }
    
    result = call_mcp_tool("analyze_earthquake_patterns", args)
    return jsonify(result)

@app.route('/api/earthquakes/significant')
def get_significant_earthquakes():
    """Get significant earthquakes"""
    days_back = int(request.args.get('days_back', 30))
    include_aftershocks = request.args.get('include_aftershocks', 'true').lower() == 'true'
    
    args = {
        "days_back": days_back,
        "include_aftershocks": include_aftershocks
    }
    
    result = call_mcp_tool("get_significant_earthquakes", args)
    return jsonify(result)

@app.route('/static/earthquake-ai-integration.js')
def serve_integration_js():
    """Serve the integration JavaScript file"""
    js_path = os.path.join(os.path.dirname(__file__), "earthquake-ai-integration.js")
    return send_file(js_path, mimetype='application/javascript')

@app.route('/api/earthquakes/test')
def test_connection():
    """Test MCP connection"""
    try:
        # Test with a simple recent earthquakes call
        result = call_mcp_tool("get_recent_earthquakes", {"magnitude_min": 4.0, "limit": 5, "days": 1})
        
        if "error" in result:
            return jsonify({"status": "error", "message": result["error"]}), 500
        
        # Parse the earthquake data
        content = result.get("content", [])
        if content and content[0].get("type") == "text":
            try:
                earthquake_data = json.loads(content[0]["text"])
                count = earthquake_data.get("count", 0)
                return jsonify({
                    "status": "success",
                    "message": f"MCP server working! Found {count} recent earthquakes M4.0+",
                    "sample_data": earthquake_data
                })
            except:
                return jsonify({"status": "success", "message": "MCP server responding", "raw_data": result})
        
        return jsonify({"status": "success", "message": "MCP server responding", "data": result})
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("🌍 Starting Earthquake MCP API Server...")
    print("🔧 MCP Server Path:", MCP_SERVER_PATH)
    print("🚀 API will be available at: http://localhost:5001")
    print("\nEndpoints:")
    print("  GET /api/earthquakes/recent")
    print("  GET /api/earthquakes/summary")
    print("  GET /api/earthquakes/patterns")
    print("  GET /api/earthquakes/significant")
    print("  GET /api/earthquakes/test")
    
    app.run(debug=True, port=5001)
