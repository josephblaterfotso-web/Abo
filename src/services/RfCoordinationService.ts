import {
  RfScanBand,
  RfScanPoint,
  ToiIntermodProduct,
  TransmitterRF,
} from '../types/recorder';

export class RfCoordinationService {
  public static defaultBands: RfScanBand[] = [
    {
      id: 'uhf-wide',
      name: 'UHF Wideband (470 - 694 MHz)',
      startMhz: 470,
      endMhz: 694,
      stepKhz: 100,
    },
    {
      id: 'block-22-24',
      name: 'Block 22-24 (566 - 638 MHz)',
      startMhz: 566,
      endMhz: 638,
      stepKhz: 50,
    },
    {
      id: 'zaxcom-zts',
      name: 'Zaxcom / Lectro A1 (470 - 537 MHz)',
      startMhz: 470,
      endMhz: 537,
      stepKhz: 50,
    },
    {
      id: 'ism-900',
      name: 'Guard 941 - 960 MHz',
      startMhz: 941,
      endMhz: 960,
      stepKhz: 50,
    },
  ];

  /**
   * Calculates all Third-Order Intermodulation (TOI) products:
   * 2-tone: 2*f1 - f2 and 2*f2 - f1
   * 3-tone (triple beat): f1 + f2 - f3
   */
  public static calculateToiProducts(transmitters: TransmitterRF[]): ToiIntermodProduct[] {
    const products: ToiIntermodProduct[] = [];
    const n = transmitters.length;
    if (n < 2) return products;

    // Tolerance thresholds (MHz)
    const criticalThreshold = 0.15; // 150 kHz
    const warningThreshold = 0.35;  // 350 kHz

    // 1. Two-tone TOI products: 2*f1 - f2
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;

        const f1 = transmitters[i].frequencyMhz;
        const f2 = transmitters[j].frequencyMhz;
        const fToi = Math.round((2 * f1 - f2) * 1000) / 1000;

        // Check against each transmitter
        let collisionFound = false;
        for (let k = 0; k < n; k++) {
          const target = transmitters[k];
          const delta = Math.abs(fToi - target.frequencyMhz);

          if (delta <= warningThreshold) {
            const isCritical = delta <= criticalThreshold;
            products.push({
              id: `toi-2t-${i}-${j}-${k}`,
              type: 'TOI_2F1_F2',
              freqMhz: fToi,
              formula: `2×(${transmitters[i].actor} ${f1.toFixed(2)}) - (${transmitters[j].actor} ${f2.toFixed(2)})`,
              sourceTxNames: [transmitters[i].actor, transmitters[j].actor],
              affectedTxId: target.id,
              affectedTxName: `${target.actor} (${target.name})`,
              deltaKhz: Math.round(delta * 1000),
              severity: isCritical ? 'CRITICAL_COLLISION' : 'WARNING_NEARBY',
            });
            collisionFound = true;
          }
        }

        // If not colliding with any transmitter, still list notable intermods within active RF band
        if (!collisionFound && fToi >= 470 && fToi <= 694) {
          products.push({
            id: `toi-2t-${i}-${j}-safe`,
            type: 'TOI_2F1_F2',
            freqMhz: fToi,
            formula: `2×(${transmitters[i].actor} ${f1.toFixed(2)}) - (${transmitters[j].actor} ${f2.toFixed(2)})`,
            sourceTxNames: [transmitters[i].actor, transmitters[j].actor],
            severity: 'SAFE_DISTANCE',
          });
        }
      }
    }

    // 2. Three-tone TOI products (Triple beat): f1 + f2 - f3
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        for (let k = 0; k < n; k++) {
          if (k === i || k === j) continue;

          const f1 = transmitters[i].frequencyMhz;
          const f2 = transmitters[j].frequencyMhz;
          const f3 = transmitters[k].frequencyMhz;
          const fToi = Math.round((f1 + f2 - f3) * 1000) / 1000;

          // Check against other transmitters
          for (let m = 0; m < n; m++) {
            if (m === i || m === j || m === k) continue;
            const target = transmitters[m];
            const delta = Math.abs(fToi - target.frequencyMhz);

            if (delta <= warningThreshold) {
              products.push({
                id: `toi-3t-${i}-${j}-${k}-${m}`,
                type: 'TOI_3F',
                freqMhz: fToi,
                formula: `(${transmitters[i].actor}) + (${transmitters[j].actor}) - (${transmitters[k].actor})`,
                sourceTxNames: [transmitters[i].actor, transmitters[j].actor, transmitters[k].actor],
                affectedTxId: target.id,
                affectedTxName: `${target.actor} (${target.name})`,
                deltaKhz: Math.round(delta * 1000),
                severity: delta <= criticalThreshold ? 'CRITICAL_COLLISION' : 'WARNING_NEARBY',
              });
            }
          }
        }
      }
    }

    return products;
  }

  /**
   * Generates realistic RF scan spectrum data (analogous to Sound Devices SL-2 / Wisycom scan)
   */
  public static generateScanSpectrum(
    band: RfScanBand,
    transmitters: TransmitterRF[],
    noiseThresholdDbm: number = -85
  ): RfScanPoint[] {
    const points: RfScanPoint[] = [];
    const stepMhz = band.stepKhz / 1000;
    const count = Math.min(600, Math.round((band.endMhz - band.startMhz) / stepMhz));

    // Simulated DTV channels in the area (e.g. Ch 24 at 498-506 MHz, Ch 31 at 554-562 MHz, Ch 41 at 634-642 MHz)
    const dtvBands = [
      { start: 498, end: 506, level: -68 },
      { start: 554, end: 562, level: -62 },
      { start: 634, end: 642, level: -71 },
      { start: 682, end: 690, level: -64 },
    ];

    // Calculate active TOI products to tag intermod points
    const toiProducts = this.calculateToiProducts(transmitters);

    for (let i = 0; i <= count; i++) {
      const freq = Math.round((band.startMhz + i * stepMhz) * 1000) / 1000;
      let rssi = -102 + (Math.sin(freq * 12) * 2 + Math.random() * 4); // Noise floor ~ -100 dBm

      // Add DTV channel shoulders
      for (const dtv of dtvBands) {
        if (freq >= dtv.start && freq <= dtv.end) {
          rssi = dtv.level + (Math.random() * 3 - 1.5);
        }
      }

      // Add transmitter carrier signals
      for (const tx of transmitters) {
        const delta = Math.abs(freq - tx.frequencyMhz);
        if (delta < 0.25) {
          // Sharp carrier spike up to -45 dBm
          const carrierPeak = -42 - delta * 120;
          rssi = Math.max(rssi, carrierPeak);
        }
      }

      // Check if this frequency has a TOI collision
      const hasToiRisk = toiProducts.some(
        (p) => p.severity !== 'SAFE_DISTANCE' && Math.abs(p.freqMhz - freq) < 0.2
      );

      const isOccupied = rssi > noiseThresholdDbm;

      points.push({
        frequencyMhz: freq,
        rssiDbm: Math.round(rssi * 10) / 10,
        peakDbm: Math.round((rssi + 2) * 10) / 10,
        tvChannel: Math.floor((freq - 470) / 8) + 21,
        isOccupied,
        isIntermodRisk: hasToiRisk,
      });
    }

    return points;
  }

  /**
   * Smart Intermod-Free Frequency Coordinator Algorithm:
   * Finds clean replacement frequencies for transmitters avoiding:
   * 1. High RF noise peaks (> threshold)
   * 2. Active DTV television channels
   * 3. 2-tone TOI products (2*f1 - f2)
   * 4. 3-tone TOI products (f1 + f2 - f3)
   */
  public static calculateCleanFrequencies(
    transmitters: TransmitterRF[],
    scanPoints: RfScanPoint[],
    band: RfScanBand,
    thresholdDbm: number = -85
  ): { txId: string; currentFreq: number; suggestedFreq: number; reason: string }[] {
    const results: { txId: string; currentFreq: number; suggestedFreq: number; reason: string }[] = [];
    const minSpacing = 0.4; // 400 kHz minimum channel spacing
    const toiGuard = 0.25;  // 250 kHz guard band from any intermod

    // Find all spectrum points below threshold
    const cleanPool = scanPoints.filter((p) => p.rssiDbm < thresholdDbm);
    if (cleanPool.length === 0) return results;

    const assignedFrequencies: number[] = [];

    transmitters.forEach((tx) => {
      // Check current frequency status
      const currentPoint = scanPoints.find((p) => Math.abs(p.frequencyMhz - tx.frequencyMhz) < 0.05);
      const isDirty = currentPoint && currentPoint.rssiDbm >= thresholdDbm;
      
      // Calculate current TOIs
      const currentTois = this.calculateToiProducts(transmitters);
      const isHitByToi = currentTois.some(
        (p) => p.affectedTxId === tx.id && p.severity === 'CRITICAL_COLLISION'
      );

      // Search for candidate clean frequency
      let bestCandidate = tx.frequencyMhz;
      let reason = 'Frequency clean & intermod safe';

      if (isDirty || isHitByToi) {
        reason = isDirty
          ? `High RF background noise (${currentPoint?.rssiDbm} dBm)`
          : `Severe Third-Order Intermodulation (TOI) collision`;

        for (const candidate of cleanPool) {
          const f = candidate.frequencyMhz;
          if (f < band.startMhz + 1 || f > band.endMhz - 1) continue;

          // Check distance from already assigned frequencies
          const tooClose = assignedFrequencies.some((af) => Math.abs(af - f) < minSpacing);
          if (tooClose) continue;

          // Check if candidate would produce TOI with already assigned frequencies
          let causesIntermod = false;
          for (let i = 0; i < assignedFrequencies.length; i++) {
            for (let j = 0; j < assignedFrequencies.length; j++) {
              if (i === j) continue;
              const f1 = assignedFrequencies[i];
              const f2 = assignedFrequencies[j];
              const intermod2T_1 = 2 * f1 - f;
              const intermod2T_2 = 2 * f - f1;

              if (
                Math.abs(intermod2T_1 - f2) < toiGuard ||
                Math.abs(intermod2T_2 - f2) < toiGuard
              ) {
                causesIntermod = true;
                break;
              }
            }
            if (causesIntermod) break;
          }

          if (!causesIntermod) {
            bestCandidate = f;
            break;
          }
        }
      }

      assignedFrequencies.push(bestCandidate);
      results.push({
        txId: tx.id,
        currentFreq: tx.frequencyMhz,
        suggestedFreq: bestCandidate,
        reason,
      });
    });

    return results;
  }
}
