import { SoundReportHeader, TakeRecord } from '../types/recorder';

export class SoundReportService {
  public static defaultHeader: SoundReportHeader = {
    projectTitle: 'DUNE: CHRONICLES',
    soundRecordist: 'Alexandre Fontaine',
    boomOperator: 'Thomas Vasseur',
    productionCompany: 'Les Films du Cartel',
    director: 'Denis V.',
    location: 'Wadi Rum, Stage B',
    soundRoll: 'R001',
    date: new Date().toISOString().split('T')[0],
    frameRate: '25',
    sampleRate: '48 kHz',
    bitDepth: '24-bit',
  };

  /**
   * Generates standard comma/tab-separated CSV format for Avid / DaVinci / Soundminer
   */
  public static generateCsv(header: SoundReportHeader, takes: TakeRecord[]): string {
    const lines: string[] = [];

    // Header metadata block
    lines.push(`PROJECT,"${header.projectTitle}"`);
    lines.push(`PRODUCTION,"${header.productionCompany}"`);
    lines.push(`DIRECTOR,"${header.director}"`);
    lines.push(`SOUND RECORDIST,"${header.soundRecordist}"`);
    lines.push(`BOOM OPERATOR,"${header.boomOperator}"`);
    lines.push(`DATE,${header.date}`);
    lines.push(`SOUND ROLL,${header.soundRoll}`);
    lines.push(`FRAME RATE,${header.frameRate} fps`);
    lines.push(`SAMPLE RATE,${header.sampleRate}`);
    lines.push(`BIT DEPTH,${header.bitDepth}`);
    lines.push('');

    // Table Columns
    const cols = [
      'SCENE',
      'TAKE',
      'CIRCLED',
      'FALSE_TAKE',
      'START_TC',
      'END_TC',
      'DURATION',
      'FILE_NAME',
      'TRACK_NAMES',
      'NOTES',
    ];
    lines.push(cols.join(','));

    // Take Rows
    takes.forEach((t) => {
      const durationFormatted = this.formatDuration(t.durationSeconds);
      const row = [
        `"${t.scene}"`,
        `"${t.take}${t.takeSuffix || ''}"`,
        t.isCircled ? 'YES' : 'NO',
        t.isFalseTake ? 'YES' : 'NO',
        `"${t.startTc}"`,
        `"${t.endTc}"`,
        `"${durationFormatted}"`,
        `"${t.filename}"`,
        `"${t.trackNames.join(' | ')}"`,
        `"${t.notes.replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  public static downloadCsv(header: SoundReportHeader, takes: TakeRecord[]) {
    const csvContent = this.generateCsv(header, takes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `SOUND_REPORT_${header.projectTitle.replace(/\s+/g, '_')}_ROLL_${header.soundRoll}_${header.date}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static printSoundReport(header: SoundReportHeader, takes: TakeRecord[]) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sound Report - ${header.projectTitle} - Roll ${header.soundRoll}</title>
  <style>
    body {
      font-family: Arial, -apple-system, sans-serif;
      font-size: 11px;
      color: #111;
      margin: 20px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    .header-table td {
      padding: 4px 8px;
      border: 1px solid #ccc;
    }
    .header-table .title {
      font-weight: bold;
      background: #f0f0f0;
      width: 15%;
    }
    .main-table {
      width: 100%;
      border-collapse: collapse;
    }
    .main-table th {
      background: #333;
      color: #fff;
      padding: 6px 4px;
      text-align: left;
      font-size: 10px;
      border: 1px solid #222;
    }
    .main-table td {
      padding: 5px 4px;
      border: 1px solid #ddd;
    }
    .circle-star {
      color: #d97706;
      font-weight: bold;
      text-align: center;
    }
    .false-take {
      color: #dc2626;
      text-decoration: line-through;
    }
    .font-mono {
      font-family: monospace;
    }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h2>LOCATION SOUND REPORT // ABO (AUDIO BROADCAST ORCHESTRATOR)</h2>
  
  <table class="header-table">
    <tr>
      <td class="title">PROJECT</td>
      <td><strong>${header.projectTitle}</strong></td>
      <td class="title">DATE</td>
      <td>${header.date}</td>
      <td class="title">ROLL</td>
      <td><strong>${header.soundRoll}</strong></td>
    </tr>
    <tr>
      <td class="title">PROD CO.</td>
      <td>${header.productionCompany}</td>
      <td class="title">DIRECTOR</td>
      <td>${header.director}</td>
      <td class="title">TC / FPS</td>
      <td>${header.frameRate} fps (${header.sampleRate})</td>
    </tr>
    <tr>
      <td class="title">SOUND REC.</td>
      <td><strong>${header.soundRecordist}</strong></td>
      <td class="title">BOOM OP.</td>
      <td>${header.boomOperator}</td>
      <td class="title">LOCATION</td>
      <td>${header.location}</td>
    </tr>
  </table>

  <table class="main-table">
    <thead>
      <tr>
        <th style="width: 30px;">CIRC</th>
        <th style="width: 50px;">SCENE</th>
        <th style="width: 40px;">TAKE</th>
        <th style="width: 85px;">TC START</th>
        <th style="width: 85px;">TC END</th>
        <th style="width: 50px;">DUR.</th>
        <th style="width: 110px;">FILE NAME</th>
        <th>TRACK ALLOCATIONS</th>
        <th>SOUND NOTES</th>
      </tr>
    </thead>
    <tbody>
      ${takes
        .map(
          (t) => `
        <tr class="${t.isFalseTake ? 'false-take' : ''}">
          <td class="circle-star">${t.isCircled ? '★' : ''}</td>
          <td><strong>${t.scene}</strong></td>
          <td><strong>${t.take}${t.takeSuffix || ''}</strong></td>
          <td class="font-mono">${t.startTc}</td>
          <td class="font-mono">${t.endTc}</td>
          <td class="font-mono">${this.formatDuration(t.durationSeconds)}</td>
          <td class="font-mono">${t.filename}</td>
          <td><small>${t.trackNames.join(', ')}</small></td>
          <td>${t.isFalseTake ? '<span style="color:red;font-weight:bold;">[FALSE TAKE] </span>' : ''}${t.notes}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <p style="margin-top: 20px; font-size: 9px; color: #666; text-align: right;">
    Generated with ABO - Audio Broadcast Orchestrator • iXML standard compliant
  </p>
  <script>window.print();</script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  public static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}
