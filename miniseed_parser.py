#!/usr/bin/env python3
"""
MiniSEED Waveform Parser for IRIS FDSN Services

This module handles binary miniSEED data parsing and converts it to JSON format
for the MCP earthquake server. Uses ObsPy for reliable seismological data processing.
"""

import sys
import json
import argparse
import requests
from datetime import datetime, timezone
from obspy import read
from obspy.core import UTCDateTime
import numpy as np
import io
import warnings

# Suppress ObsPy warnings for cleaner output
warnings.filterwarnings("ignore")

class MiniSeedParser:
    """Parser for miniSEED waveform data from IRIS FDSN services"""
    
    def __init__(self, base_url="https://service.iris.edu"):
        self.base_url = base_url
        self.dataselect_url = f"{base_url}/fdsnws/dataselect/1/query"
        
    def fetch_waveform_data(self, network, station, location, channel, 
                          start_time, end_time, quality="B"):
        """
        Fetch miniSEED waveform data from IRIS FDSN dataselect service
        
        Args:
            network: Network code (e.g., 'US')
            station: Station code (e.g., 'ANMO')
            location: Location code (e.g., '00' or '--')
            channel: Channel code (e.g., 'BHZ')
            start_time: ISO format start time
            end_time: ISO format end time
            quality: Data quality ('B'=Best, 'M'=Medium, 'Q'=Quality, 'R'=Raw)
            
        Returns:
            dict: Parsed waveform data with samples and metadata
        """
        try:
            # Convert to ObsPy UTCDateTime format
            start_utc = UTCDateTime(start_time)
            end_utc = UTCDateTime(end_time)
            
            # Build query parameters
            params = {
                'network': network,
                'station': station,
                'location': location if location != '--' else '',
                'channel': channel,
                'starttime': start_utc.isoformat(),
                'endtime': end_utc.isoformat(),
                'quality': quality,
                'format': 'miniseed'
            }
            
            # Make request to IRIS FDSN dataselect service
            print(f"🔍 Fetching waveform: {network}.{station}.{location}.{channel}", file=sys.stderr)
            print(f"   Time: {start_time} to {end_time}", file=sys.stderr)
            
            response = requests.get(
                self.dataselect_url,
                params=params,
                timeout=60,
                headers={'User-Agent': 'MCP-Earthquake-Server/1.0'}
            )
            
            if response.status_code == 404:
                return {
                    'success': False,
                    'error': 'no-data-available',
                    'message': f'No waveform data available for {network}.{station}.{location}.{channel}',
                    'samples': [],
                    'metadata': {}
                }
            elif response.status_code == 204:
                return {
                    'success': False,
                    'error': 'no-data-available',
                    'message': f'No content returned for {network}.{station}.{location}.{channel} - station may be offline or no data exists for time period',
                    'samples': [],
                    'metadata': {}
                }
            elif response.status_code != 200:
                return {
                    'success': False,
                    'error': f'http-{response.status_code}',
                    'message': f'FDSN service returned status {response.status_code}',
                    'samples': [],
                    'metadata': {}
                }
            
            if len(response.content) == 0:
                return {
                    'success': False,
                    'error': 'empty-response',
                    'message': 'Empty response from FDSN service',
                    'samples': [],
                    'metadata': {}
                }
            
            # Parse miniSEED data using ObsPy
            print(f"📦 Parsing miniSEED data ({len(response.content)} bytes)", file=sys.stderr)
            
            # Create a BytesIO object from the response content
            mseed_data = io.BytesIO(response.content)
            
            # Read the miniSEED data
            stream = read(mseed_data, format='MSEED')
            
            if len(stream) == 0:
                return {
                    'success': False,
                    'error': 'no-traces',
                    'message': 'No traces found in miniSEED data',
                    'samples': [],
                    'metadata': {}
                }
            
            # Get the first trace (there might be multiple)
            trace = stream[0]
            
            # Extract waveform samples
            samples = trace.data.tolist()  # Convert numpy array to Python list
            
            # Calculate statistics
            peak_amplitude = float(np.max(np.abs(trace.data))) if len(samples) > 0 else 0.0
            rms_amplitude = float(np.sqrt(np.mean(trace.data**2))) if len(samples) > 0 else 0.0
            
            # Extract metadata
            stats = trace.stats
            
            result = {
                'success': True,
                'network': stats.network,
                'station': stats.station,
                'location': stats.location if stats.location else '--',
                'channel': stats.channel,
                'starttime': stats.starttime.isoformat(),
                'endtime': stats.endtime.isoformat(),
                'sampling_rate': float(stats.sampling_rate),
                'npts': int(stats.npts),
                'duration': float(stats.endtime - stats.starttime),
                'samples': samples,
                'peak_amplitude': peak_amplitude,
                'rms_amplitude': rms_amplitude,
                'quality': quality,
                'format': 'real-miniseed',
                'metadata': {
                    'calib': float(stats.calib) if hasattr(stats, 'calib') else 1.0,
                    'delta': float(stats.delta),
                    'processing': getattr(stats, 'processing', []),
                    'instrument_response': 'available' if hasattr(stats, 'response') else 'not-available'
                }
            }
            
            print(f"✅ Successfully parsed {len(samples)} samples at {stats.sampling_rate} Hz", file=sys.stderr)
            return result
            
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'timeout',
                'message': 'Request to FDSN service timed out',
                'samples': [],
                'metadata': {}
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': 'network-error',
                'message': f'Network error: {str(e)}',
                'samples': [],
                'metadata': {}
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'parsing-error',
                'message': f'Error parsing miniSEED data: {str(e)}',
                'samples': [],
                'metadata': {}
            }

def main():
    """Command line interface for miniSEED parsing"""
    parser = argparse.ArgumentParser(description='Fetch and parse miniSEED waveform data from IRIS')
    parser.add_argument('--network', required=True, help='Network code (e.g., US)')
    parser.add_argument('--station', required=True, help='Station code (e.g., ANMO)')
    parser.add_argument('--location', default='--', help='Location code (default: --)')
    parser.add_argument('--channel', required=True, help='Channel code (e.g., BHZ)')
    parser.add_argument('--start', required=True, help='Start time (ISO format)')
    parser.add_argument('--end', required=True, help='End time (ISO format)')
    parser.add_argument('--quality', default='B', choices=['B', 'M', 'Q', 'R'],
                       help='Data quality (B=Best, M=Medium, Q=Quality, R=Raw)')
    
    args = parser.parse_args()
    
    parser_instance = MiniSeedParser()
    result = parser_instance.fetch_waveform_data(
        network=args.network,
        station=args.station,
        location=args.location,
        channel=args.channel,
        start_time=args.start,
        end_time=args.end,
        quality=args.quality
    )
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
