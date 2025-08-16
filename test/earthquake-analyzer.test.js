import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EarthquakeAnalyzer } from '../dist/analyzers/earthquake-analyzer.js';

// Distance calculation

test('calculateDistance uses haversine formula', () => {
  const analyzer = new EarthquakeAnalyzer();
  const dist = analyzer.calculateDistance(0, 0, 0, 1);
  // Distance between two points one degree apart on the equator ~111.19km
  assert.ok(Math.abs(dist - 111.19) < 0.5);
});

// Forecast risk level logic

test('forecastRiskLevel categorizes risk correctly', () => {
  const analyzer = new EarthquakeAnalyzer();
  const dummy = {};
  assert.equal(analyzer.forecastRiskLevel({ magnitude7: 0.2 }, dummy), 'critical');
  assert.equal(analyzer.forecastRiskLevel({ magnitude6: 0.2 }, dummy), 'high');
  assert.equal(analyzer.forecastRiskLevel({ magnitude5: 0.3 }, dummy), 'moderate');
  assert.equal(analyzer.forecastRiskLevel({ magnitude5: 0.1, magnitude4: 0.5 }, dummy), 'low');
});

// Recommendation generation

test('generateForecastRecommendations matches risk level', () => {
  const analyzer = new EarthquakeAnalyzer();
  assert.deepEqual(
    analyzer.generateForecastRecommendations({}, 'low'),
    [
      'Maintain standard earthquake preparedness',
      'Continue routine monitoring and data collection'
    ]
  );
  assert.deepEqual(
    analyzer.generateForecastRecommendations({}, 'high'),
    [
      'Increase monitoring and public awareness',
      'Review building codes and emergency procedures'
    ]
  );
  assert.deepEqual(
    analyzer.generateForecastRecommendations({}, 'critical'),
    [
      'Implement heightened earthquake preparedness measures',
      'Consider temporary restrictions in high-risk areas'
    ]
  );
});

// Magnitude probability calculation

test('calculateMagnitudeProbability returns Poisson probability', () => {
  const analyzer = new EarthquakeAnalyzer();
  const prob = analyzer.calculateMagnitudeProbability(5, 1, 0.1, 10);
  // Expected probability ~0.00316 within tolerance
  assert.ok(Math.abs(prob - 0.00316) < 1e-4);
});

